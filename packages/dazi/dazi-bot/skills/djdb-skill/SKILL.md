---
name: djdb-skill
description: "连到家数据库查询技能的详细说明，见正文。"
---

# DjDB-skill — 到家数据库查询技能







也配在该文件中，但它是 **PostgreSQL** 库，非 MySQL，连接需使用 `psql` 而非 `mysql`。用户问 ebaolangfuse / 鹅宝 / Langfuse 时用此变量。配置文件格式：

```bash
# ~/.config/djs.config

# ── 跳板机认证 ──
JZ_DJS_SECRET="你的到家盾MFA密钥"
JZ_DJS_SSH="ssh -i ~/.ssh/密钥文件 用户名@jzdjs.djdns.cn"

# ── 数据库连接字符串（从库，只读）──
# 格式：DJDB_简称="mysql -h 从库域名 -P 3306 -u 用户名 -p密码 数据库名称;"
# 注意：-p 后密码紧跟无空格，末尾有分号 ;
DJDB_bdp="mysql -h djbdp-s.db.djdns.cn -P 3306 -u dj_bdp_rw -p密码 dbwww58com_dj_bdp;"
DJDB_realdata="mysql -h jzbirealdata-s.db.djdns.cn -P 3306 -u birealdata_ro -p密码 dbjz_bi_realdata;"
DJDB_cloudorder="mysql -h jzcloudorder-s.db.djdns.cn -P 3306 -u cloudorder_ro -p密码 dbjz_jzcloud_order;"
```

**`DJDB_cloudorder`（到家云订单库 `dbjz_jzcloud_order`）**：本机已配置好，连接串 `mysql -h jzcloudorder-s.db.djdns.cn -P 3306 -u cloudorder_ro -p<密码> dbjz_jzcloud_order`。涉及小鹅信用会员积分、云订单(t_order/t_order_amount/t_purchase)、小鹅积分账户/流水(t_xiaoe_points_account/t_xiaoe_points_record/t_xiaoe_member_info)等业务时用此库。只读，仅 SELECT。

**⚠️ 链车/到家库隔离**：`DJDB_lianche` 连的是链车 RDS（`rm-bp10mfa9gc0asj8luho.mysql.rds.aliyuncs.com` / `lianche_prod`），**链车与到家是两家独立企业，严禁用本 DjDB-skill 连链车库**。链车查询走链车自己的 RDS + pymysql 直连方式（见 lianche 相关 skill），不要混用。

## 流程

### ⚡ 推荐：非交互 `-c` 一次性执行（大数据量/复杂查询首选）

**适用场景**：一次性跑完一个（或一组）查询并落盘结果，特别是**多表关联、海量数据、复杂子查询**时。tmux 交互式（paste-buffer/send-keys）在超大/复杂查询下会因输出过多或 SSH 断连而卡死（实测复杂 UNION 查询 q4 曾 Broken pipe 断连无结果）。非交互 `-c` 模式更稳。

**命令模式**（核心）：

```bash
# 1. 加载配置，取目标库连接串（去掉末尾分号）
set -a; source ~/.config/djs.config; set +a
DB_CONN=$(printenv DJDB_cloudorder); DB_CONN="${DB_CONN%;}"

# 2. 多行 SQL 扁平化为单行（expect/mysql 无法可靠处理多行）
SQL=$( { cat /tmp/xiaoe_sql/set_time.sql; cat /tmp/xiaoe_sql/qN.sql; } | tr '\n' ' ' | sed 's/  */ /g' )

# 3. 经跳板机非交互执行，输出重定向到文件
"$HOME/.dazi/skills/DjDB-skill/scripts/djs.sh" 10.37.18.183 -rdb -c "$DB_CONN --batch --raw -e \"$SQL\"" > /tmp/xiaoe_out/qN.raw 2>&1
```

**要点**：
- `-c "$DB_CONN --batch --raw -e \"$SQL\""`：`--batch --raw` 输出干净的 tab 分隔纯文本（无边框/无表格线），`-e` 传 SQL
- SQL 里有会话变量（`SET @start_time=...`）时，把 SET 语句和主查询**拼进同一个 `-e`**（多条用 `;` 连接），变量才能在同会话生效
- 命令在跳板机上跑，MFA 认证 + 登录需 10-15s，Bash 工具会**自动后台执行**，结果写到输出文件后再读
- 输出文件含 ANSI 登录界面 + 命令回显，**不能直接当结果用**，必须按下方「输出解析」处理

### 输出解析（从 .raw 切出数据行）

`.raw` 文件 = Jumpserver ANSI 登录界面 + 命令回显 + 数据 + `[rdb@...]`/`Opt>` 提示符。**不能**用 `grep -v '^\[|^Opt>'` 之类过滤，也不能用 `^[0-9]` 正则（ANSI 界面里全是控制字符易误匹配）。

**正确做法——表头定位法**（python 脚本）：

```python
import re
raw = open('qN.raw', encoding='utf-8', errors='replace').read().splitlines()
# 1. 找表头行：以某列名开头且含 tab（列名取查询里第一个别名，如 q1='用户id'、q2='user_id'、q3/q4='劳动者ID'）
header_idx = next(i for i,s in enumerate(raw) if s.startswith('用户id') and '\t' in s)
# 2. 从表头下一行收集，直到遇到跳板机提示符
rows = []
for s in raw[header_idx+1:]:
    if re.search(r'^\[rdb@|^Opt>', s):
        break
    if s.strip():
        rows.append(s)
```

**坑**：
- `errors='replace'` 读文件，避免 ANSI/二进制字节报错
- 表头 key 用**第一个别名**（不要用数字/通用词），且必须 `and '\t' in s` 双重确认是数据行而非界面
- 若 header 没找到，先打印 raw 前几十行看实际结构（可能末尾少了 `;` 或查询报错）
- 数据行数核对：Excel 数据行 = tsv 行数 − 1（表头行）

### 步骤 1：配置检查

检查配置文件是否存在且包含必需项：

```bash
# 检查配置文件
[[ -f ~/.config/djs.config ]] && echo "配置文件存在" || echo "配置文件不存在"

# 加载配置并检查必需项
set -a; source ~/.config/djs.config; set +a
[[ -n "${JZ_DJS_SECRET:-}" ]] && echo "JZ_DJS_SECRET=已配置" || echo "JZ_DJS_SECRET=未配置"
[[ -n "${JZ_DJS_SSH:-}" ]] && echo "JZ_DJS_SSH=已配置" || echo "JZ_DJS_SSH=未配置"
```

如果配置文件不存在或必需项未配置，**停止执行**并提示用户创建 `~/.config/djs.config`：

```bash
# 创建配置文件模板
mkdir -p ~/.config
cat > ~/.config/djs.config <<'EOF'
JZ_DJS_SECRET="你的到家盾MFA密钥"
JZ_DJS_SSH="ssh -i ~/.ssh/密钥文件 用户名@jzdjs.djdns.cn"
DJDB_bdp="mysql -h 从库域名 -P 3306 -u 用户名 -p密码 数据库名称;"
EOF
```

创建后重新触发技能。

### 步骤 2：选择数据库

从配置文件中列出所有 `DJDB_*` 数据库简称：

```bash
set -a; source ~/.config/djs.config; set +a
grep '^DJDB_' ~/.config/djs.config | while IFS='=' read -r key _; do echo "${key#DJDB_}"; done
```

**选择规则**：

- 无 `DJDB_*` 配置 → **停止执行**，提示用户在配置文件中添加数据库配置
- 仅1个 → 直接使用该数据库，不提示选择
- **多个 → 列出简称供用户确认选择**（如 `bdp`、`realdata` 等），用 `AskUserQuestion` 让用户明确指定，避免误连生产库

获取选中数据库的连接字符串值（不展示密码）：

```bash
set -a; source ~/.config/djs.config; set +a
DB_SHORT="用户选择的简称"
DB_VALUE=$(printenv "DJDB_${DB_SHORT}")
```

### 步骤 3：连接数据库

在tmux会话中建立数据库连接。会话名固定为 `djs`。

**重要**：不能直接运行 `tmux-djs.sh`（它会 `tmux attach` 挂住终端），而是手动创建 detached 会话。

#### 3a：检查并创建会话

```bash
# ⚠️ 检查点：先检查是否已有活跃会话，避免意外中断正在执行的查询
tmux has-session -t djs 2>/dev/null && echo "存在活跃会话" || echo "无活跃会话"
# 如有活跃会话，告知用户"当前已有数据库连接，是否需要断开重连？"，确认后再继续

# 清理旧会话（仅在用户确认后执行）
tmux kill-session -t djs 2>/dev/null || true
sleep 0.3

# tmux嵌套保护
if [ -n "$TMUX" ]; then unset TMUX; fi

# 从配置文件加载变量（确保 tmux 会话内可用）
set -a; source ~/.config/djs.config; set +a

# 构建连接脚本（将配置值嵌入，确保tmux会话内可用）
SKILL_DIR="<技能scripts目录绝对路径>"
tmp=$(mktemp /tmp/djs-tmux-XXXXXX.sh)
{
    echo '#!/bin/bash'
    echo 'set -a; source ~/.config/djs.config; set +a'
    printf '%s/djs.sh ' "$SKILL_DIR"
    printf '%q ' '10.37.18.183' '-rdb' '-c' "$DB_VALUE"
    # 参数说明：10.37.18.183=跳板机IP, -rdb=角色(只读从库), -c=MySQL连接字符串
    echo
    echo 'exec bash'
} > "$tmp"
chmod +x "$tmp"

# 创建detached会话（不attach，由AI通过send-keys交互）
tmux new-session -s djs -d "bash $tmp"
(sleep 2; rm -f "$tmp") &

# 增大历史缓冲区，防止大结果集输出时顶部被截断
tmux set-option -t djs history-limit 50000
```

`SKILL_DIR` 替换为技能安装路径下的 `scripts` 目录：
- Claude Code: `~/.claude/skills/DjDB-skill/scripts`
- OpenClaw: `~/.openclaw/skills/DjDB-skill/scripts`
- 当前开发目录: `/home/fhn/workspace/daojia-dw-skills/DjDB-skill/scripts`

#### 3b：等待MySQL就绪

MFA认证+跳板机登录+mysql启动约需10-15秒，超时上限18秒：

```bash
for i in $(seq 1 6); do
    sleep 3
    pane=$(tmux capture-pane -t djs -p 2>/dev/null || echo "")
    # mysql提示符可能是标准 mysql> 或自定义格式如 user:port:dbname>
    if echo "$pane" | grep -qE '(mysql>|^[^ ]+:[0-9]+:[^ ]+>)'; then
        echo "MySQL已就绪"
        # 禁用mysql分页器，避免输出被less截断
        tmux send-keys -t djs 'nopager;'
        tmux send-keys -t djs Enter
        sleep 1
        break
    fi
    if [ "$i" = "6" ]; then
        echo "连接超时，当前pane内容："
        echo "$pane" | tail -20
    fi
done
```

**超时诊断**：如果6次等待后仍未就绪，检查pane内容判断原因：
- 出现 `Error: Login timeout` → 跳板机MFA认证失败，提示用户检查 `~/.config/djs.config` 中 `JZ_DJS_SECRET` 是否过期
- 出现 `Permission denied` → SSH密钥问题，提示检查 `~/.config/djs.config` 中 `JZ_DJS_SSH` 配置
- 出现 `Access denied for user` → MySQL密码错误，提示检查 `~/.config/djs.config` 中 `DJDB_*` 连接字符串
- 无任何输出 → 跳板机网络不通，提示用户检查VPN或网络

#### 3c：设置输出捕获

pipe-pane将tmux输出重定向到日志文件，用于实时获取执行结果。同时增大历史缓冲区防止截断：

```bash
> /tmp/tmux-output.log
tmux pipe-pane -t djs: -o 'cat >> /tmp/tmux-output.log'
tmux set-option -t djs history-limit 50000
```

连接就绪后告知用户：**"已连接到数据库 [简称]，可以发送要执行的SQL。"**

### 步骤 4：执行SQL

收到用户SQL后，通过pipe-pane日志和output.sh获取执行结果。

如果用户的SQL没有以`;`结尾，自动拼接上`;`。将SQL写入本地临时文件，通过tmux load-buffer + paste-buffer整块粘贴到远程pane中（比send-keys逐字符输入更可靠，避免引号/分号/反斜杠被扭曲），然后通过output.sh获取结果：

```bash
# 确保SQL末尾有分号
SQL="用户的SQL语句"
[[ "$SQL" =~ \;$ ]] || SQL="${SQL};"

# 清空输出日志
> /tmp/tmux-output.log

# 写入本地临时文件（tmux运行在本地，能读到本地文件）
printf '%s\n' "$SQL" > /tmp/query.sql

# 通过tmux buffer整块粘贴到远程pane（替代send-keys逐字符输入）
tmux load-buffer /tmp/query.sql
tmux paste-buffer -t djs
# 粘贴后自动触发执行（SQL末尾的分号+换行会自动提交）
sleep 0.5

# 清理临时文件
rm -f /tmp/query.sql

# 通过output.sh获取执行结果
SKILL_DIR/scripts/output.sh [等待时间]
```

**paste-buffer vs send-keys**：
- send-keys 逐字符模拟键盘输入，遇到引号/反斜杠/分号等特殊字符会被shell重解释或被tmux截断
- paste-buffer 将内容整块粘贴到pane，保留原始字符不变，对含特殊字符的SQL（子查询、字符串常量等）更可靠

等待时间参考：
- 简单查询（单表小量数据）：`output.sh 10`
- 中等查询（关联查询，中等数据量）：`output.sh 20`
- 复杂查询（多表关联，大数据量）：`output.sh 30`

output.sh 会自动等待mysql提示符出现后输出结果，超时则输出已有内容。

**截断处理**：如果 output.sh 返回截断不完整：
1. 用 `tmux capture-pane -t djs -p -S -5000` 从历史缓冲区读取完整结果
2. 如连接断开 → 执行断线恢复（重新执行步骤3）
3. 如连接正常 → 增大 output.sh 等待时间重试

**SQL构造建议**：用户只描述意图时，AI需自行构造SQL。优先添加 `LIMIT` 限制返回行数（避免输出截断），复杂查询可先 `EXPLAIN` 确认执行计划。

**SQL安全检查**：从库为只读，**仅允许查询操作**，写操作必须拒绝：

- **允许**：SELECT、SHOW、DESCRIBE、EXPLAIN、SHOW CREATE TABLE、SHOW INDEX、SHOW TABLE STATUS 等
- **拒绝**：INSERT、UPDATE、DELETE、DROP、ALTER、CREATE、TRUNCATE、REPLACE、LOAD DATA 等任何写操作——从库不具备写权限，执行必定失败且可能造成连接异常

当用户请求写操作时，**直接拒绝并说明原因**："从库是只读的，不支持写操作。如需修改数据请联系 DBA 在主库执行。" 不要用 AskUserQuestion 让用户确认，因为从库写操作不可能成功。

- SELECT 无 LIMIT → 警告用户可能返回海量数据，建议添加 LIMIT

**长时间查询预警**：当SQL涉及多表关联或可能扫描大量数据时，先告知用户预估等待时间，再发送执行。

### 步骤 5：会话管理

| 操作 | 命令 |
|------|------|
| 检查会话 | `tmux has-session -t djs 2>/dev/null && echo "存在" || echo "不存在"` |
| 连接健康检查 | `tmux capture-pane -t djs -p | grep -qE '(mysql>|^[^ ]+:[0-9]+:[^ ]+>)' && echo "连接正常" || echo "连接已断开，需重新连接"` |
| 断开连接 | `tmux kill-session -t djs` |
| 切换数据库 | 先 `kill-session`，重新执行步骤2-3 |
| 用户手动交互 | 在终端执行 `tmux attach -t djs` |

**断线恢复**：如果执行SQL时发现连接已断开（output.sh返回空或异常），告知用户"连接已断开"，然后重新执行步骤3建立连接。

## 注意事项

- 从库为只读，**只允许查询操作（SELECT/SHOW/DESCRIBE/EXPLAIN）**，任何写操作直接拒绝
- 不要在对话中展示连接字符串中的密码部分
- 长时间空闲可能导致mysql连接断开，需重新执行步骤3
- 如遇权限不足，联系DBA处理
- 一次只能连接一个数据库，切换需重新连接
- 配置文件路径固定为 `~/.config/djs.config`，可通过 `DJS_CONFIG` 环境变量覆盖