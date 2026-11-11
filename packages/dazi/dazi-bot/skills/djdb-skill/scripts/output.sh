#!/bin/bash

# 通过pipe-pane日志文件实时获取tmux会话中的SQL执行结果
# 用法: output.sh [最大等待秒数]
# 等待mysql提示符出现（表示查询完成），然后输出日志内容
#
# 前置条件: tmux pipe-pane 已设置输出重定向到 /tmp/tmux-output.log
#   且发送SQL前已执行 > /tmp/tmux-output.log 清空日志

MAX_WAIT=${1:-30}
LOG_FILE=/tmp/tmux-output.log

for i in $(seq 1 "$MAX_WAIT"); do
    sleep 1
    if [ -f "$LOG_FILE" ] && [ -s "$LOG_FILE" ]; then
        content=$(cat "$LOG_FILE")
        # 检查mysql提示符是否出现（表示查询已完成）
        # 标准提示符 mysql> 或自定义格式 user:port:dbname>
        if echo "$content" | grep -qE '(mysql>|^[^ ]+:[0-9]+:[^ ]+>)'; then
            echo "$content"
            exit 0
        fi
    fi
done

# 超时 - 输出已有内容
[ -f "$LOG_FILE" ] && cat "$LOG_FILE"
echo "查询可能超时，建议检查SQL复杂度或添加LIMIT"
exit 1