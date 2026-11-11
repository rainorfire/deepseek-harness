#!/bin/bash
SESSION="djs"
DJS_CONFIG="${DJS_CONFIG:-$HOME/.config/djs.config}"

if [ $# -eq 0 ]; then
    echo "用法：$0 <djs.sh 的任意参数>"
    echo "示例：$0 10.10.10.100"
    echo "      $0 10.10.10.100 -work"
    echo "      $0 10.10.10.100 -rdb -c 'top'"
    exit 1
fi

if [ ! -f "$DJS_CONFIG" ]; then
    echo "配置文件不存在: $DJS_CONFIG"
    echo "请创建 ~/.config/djs.config，参考 SKILL.md 中的格式"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 强制杀掉旧会话（防止重复）
tmux kill-session -t $SESSION 2>/dev/null
sleep 0.2

# 如果在tmux内部，先清理环境防止嵌套
if [ -n "$TMUX" ]; then
    unset TMUX
fi

# 用临时脚本避免 bash -c 多层 shell 重解释导致参数丢失/乱序
tmp=$(mktemp /tmp/djs-tmux-XXXXXX.sh)
{
    echo '#!/bin/bash'
    echo "set -a; source $DJS_CONFIG; set +a"
    printf '%s/djs.sh ' "$SCRIPT_DIR"
    printf '%q ' "$@"
    echo
    echo 'exec bash'
} > "$tmp"
chmod +x "$tmp"

tmux new-session -s $SESSION -d "bash $tmp"

# tmux 读取脚本后即可清理临时文件
(sleep 1; rm -f "$tmp") &

# 进入会话
tmux attach -t $SESSION