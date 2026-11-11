# 非交互式执行（推荐首选，2026-08-05 实战验证）

> 来源：小鹅信用会员统计 4 查询任务。skill 里文档化的 tmux 交互流程在本机反复失败
> （Enter 键名、paste-buffer 截断、C-c 杀掉 mysql 等），真正稳定跑通的是下面这条非交互链路。
> **优先用本方法，tmux 交互仅作兜底。**

## 一、环境准备

```bash
set -a; source ~/.config/djs.config; set +a   # 加载 JZ_DJS_SECRET / JZ_DJS_SSH / DJDB_* 连接串
DB_CONN=$(printenv DJDB_cloudorder); DB_CONN="${DB_CONN%;}"   # 去掉结尾分号，取目标库连接串
```

> 连接串格式示例：`mysql -h <host> -P <port> -u <user> -p<pwd> <dbname>`
> 新增连接串直接写进 `~/.config/djs.config`，形如 `DJDB_xxx="mysql ...;"`，然后 `printenv` 取用。

## 二、SQL 压缩成单行

```bash
SQL=$( { cat /tmp/sql/set_time.sql; cat /tmp/sql/query.sql; } | tr '\n' ' ' | sed 's/  */ /g' )
```

- **必须压成单行**：多行 SQL 会破坏 expect 的 send（`-c` 模式下回车即执行）。
- 检查 SQL 里是否有 shell 危险字符（双引号、反引号、`$` 展开），有则先处理。
- 复杂查询（多个 UNION / 相关子查询）拆成独立文件逐个执行，避免一次传入过长。

## 三、执行（非交互核心）

```bash
~/.dazi/skills/DjDB-skill/scripts/djs.sh <目标IP> -rdb -c "$DB_CONN --batch --raw -e \"$SQL\"" > /tmp/out/query.raw 2>&1
```

- `-c "..."` = 非交互模式：expect 登录（自动 MFA）→ 选节点 → 执行命令 → 退出，全程无人值守。
- 目标 IP 示例：cloudorder 从库 `10.37.18.183`；用 `-rdb`（只读副本角色）。
- **`--batch --raw`**：mysql 以 TAB 分隔纯文本输出，无表格框线，便于解析。
- 输出重定向到 `.raw` 文件再解析，不要用 pipe-pane / 屏幕抓取。
- 慢查询或大结果集：本模式会一直等到命令结束，不要中途放弃；q4 7818 行也能稳定返回。

## 四、解析 .raw 输出

1. 找到表头行（以列名 + `\t` 开头的那行）。
2. 从表头下一行开始取数据，直到遇到 `[rdb@` 或 `Opt>` 提示符行。
3. 用 `sed 's/\x1b\[[0-9;]*m//g'` 之类剥离 ANSI 颜色码。
4. 每行按 `\t` 切列 → 得 TSV → openpyxl 写 Excel。

## 五、已知坑清单（tmux 交互流 vs 本方法）

| 坑 | tmux 交互流 | `-c` 非交互 |
|---|---|---|
| tmux 3.7b 的 `Enter` 键名报错 | 要改用 `C-m` | 无关 |
| `send-keys -l` 吞分号（卡 `->` 续行符） | 要用 load-buffer + paste-buffer | 无关 |
| paste-buffer 截断长 SQL | 要拆小段执行 | 无关（-e 直接传参） |
| `C-c` 清输入会杀掉整个 mysql 客户端 | 要用 `\c` | 无关 |
| 跳板机非登录 shell 无 mysql（base64 也被禁） | 要在 djs.sh 登录环境内跑 | `-c` 即在登录环境内 |
| macOS 无 `timeout` 命令 | 不能包 timeout | 无关 |
| pipe-pane 抓输出不可靠 | 要看 raw 文件 / capture-pane | 重定向 .raw 稳定 |

## 六、完整成功样例（小鹅统计 q1）

```bash
set -a; source ~/.config/djs.config; set +a
DB_CONN=$(printenv DJDB_cloudorder); DB_CONN="${DB_CONN%;}"
SQL=$( { cat /tmp/xiaoe_sql/set_time.sql; cat /tmp/xiaoe_sql/q1.sql; } | tr '\n' ' ' | sed 's/  */ /g' )
~/.dazi/skills/DjDB-skill/scripts/djs.sh 10.37.18.183 -rdb -c "$DB_CONN --batch --raw -e \"$SQL\"" > /tmp/xiaoe_out/q1.raw 2>&1
```
