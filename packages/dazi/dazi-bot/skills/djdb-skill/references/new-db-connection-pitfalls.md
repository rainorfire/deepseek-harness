# 新库直连与输出解析实战（2026-08-12 djjzcall 会话沉淀）

## 场景

用户直接给出一条完整连接串（目标库不在现有配置中），要求经跳板机连上新库：

```bash
mysql -h djjzcall-s.db.djdns.cn -P3306 -udjjzcall -p<密码> -Ddbdj_dbcs_call
```

结论：**用户给完整连接串时，无需先改配置文件，直接把该串包进 djs.sh 即可连上**。

```bash
DB_CONN="mysql -h <host> -P <port> -u <user> -p<pass> <dbname>"
"$HOME/.dazi/skills/DjDB-skill/scripts/djs.sh" <跳板机IP> -rdb -c "$DB_CONN --batch --raw -e \"<SQL>\"" > /tmp/<x>.raw 2>&1
```

## 坑1：`SHOW TABLES` 不支持 LIMIT

`SHOW TABLES LIMIT 30;` 直接报 `ERROR 1064 (42000)` 语法错误（MySQL 的 SHOW 语句不支持 LIMIT）。

正确姿势：改用 information_schema，还能顺便拿到行数与引擎：

```sql
SELECT TABLE_NAME AS 表名, TABLE_ROWS AS 行数, ENGINE AS 引擎
FROM information_schema.TABLES
WHERE TABLE_SCHEMA='<dbname>'
ORDER BY TABLE_NAME;
```

## 坑2：djs.sh 原始输出解析（表头定位法）

`-c` 非交互模式下 raw 输出会混入终端伪迹：命令回显、`\b` 退格符、`\0` 空字节。解析时：

1. 用 `tr -d '\000'` 清空字节；
2. 找**表头行**（如 `表名` 开头且含 `\t`）定位数据起点，跳过命令回显区；
3. 遇到 shell 提示符（`[rdb@` 或 `Opt>`）即停止，那是跳板机返回的交互提示。

参考解析脚本骨架：

```python
import re
raw = open(path, encoding='utf-8', errors='replace').read().splitlines()
header_idx = next(i for i,s in enumerate(raw) if s.startswith('表名') and '\t' in s)
for s in raw[header_idx+1:]:
    if re.search(r'^\[rdb@|^Opt>', s):
        break
    if s.strip():
        ... # split by '\t'
```

## 大表防护

dbdj_dbcs_call（到家电话呼叫业务库）40 张表，关键大表：

| 表 | 行数 | 说明 |
|---|---|---|
| t_heli_call_event | ~9070万 | 呼叫事件主表（另有 TokuDB 归档分区表） |
| t_click_operate_log | ~8008万 | 点击操作日志 + 3 个归档分区 |
| t_heli_call_log | ~1267万 | 呼叫日志 |
| t_call_site_status_change_record | ~538万 | 站点状态变更 |

查询上述表必须带 WHERE 条件，禁止无条件 SELECT 防全表扫。

## 数据源身份确认

连上后先跑 `SELECT 'CONN_OK'` + information_schema 表清单，确认库身份（业务类型）再回答用户，不要凭库名猜。
