# djjzcall（dbdj_dbcs_call）— 到家电话呼叫/坐席外呼业务库

2026-08-12 实测接入。该库**不在 ~/.config/djs.config 里**，直接用连接串经跳板机执行：

```bash
set -a; source ~/.config/djs.config; set +a
DB_CONN="mysql -h djjzcall-s.db.djdns.cn -P3306 -udjjzcall -pvIPhPnQB8LNwJzq1 -Ddbdj_dbcs_call"
# 查表清单（注意 SHOW TABLES 不支持 LIMIT，见下）
SQL="SELECT TABLE_NAME, TABLE_ROWS, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA='dbdj_dbcs_call' ORDER BY TABLE_NAME;"
"$HOME/.dazi/skills/DjDB-skill/scripts/djs.sh" 10.37.18.183 -rdb -c "$DB_CONN --batch --raw -e \"$SQL\"" > /tmp/xxx.raw 2>&1
# 解析：python3 读 raw → 定位含表名的表头行（'表名' 且含 tab）→ 到 '^[rdb@' / '^Opt>' 截断
```

建议把该连接串补进 ~/.config/djs.config（当前只有 lianche / ebaolangfuse）。

## 库结构（40 张表）

- 呼叫主链路：`t_heli_call_event`（9070 万行主表，含 TokuDB 归档分区 `_20230215/_20231231/_20241231`）、`t_heli_call_log`（1267 万）、`t_heli_call_event_history`（4343 万归档）、`t_call_record`（6.9 万）、`t_call_group(_member)`
- 号码资源：`t_call_number_allocation_record`（160 万）、`t_call_number_pool`、`t_black_phone(_log)`、`t_view_mobile_log`（58.9 万）
- 运营/质检：`t_click_operate_log`（8008 万 + 3 个归档分区）、`t_transcription`（51.4 万）、`t_quality_inspection_detail`、`t_operate_record`、`t_batch_opr_record(_detail)`、`t_intelligent_agent_record`、`t_region`（50.6 万）、`t_call_account`、`t_call_site_status_change_record`（538 万）

## t_heli_call_event 关键字段语义（外呼/接通判定）

| 字段 | 含义 | 判定用法 |
|------|------|----------|
| `call_type` | 呼叫类型 | `dialout`=外呼通话、`dialtransfer`=外呼转接 → 外呼 = `IN ('dialout','dialtransfer')` |
| `state` | 呼叫状态 | `dealing`=已接听 → 接通口径一 |
| `begin` | 摘机接通时间 | 默认值 `1970-01-01 08:00:01`=未接通 → `begin > '1970-01-01 08:00:01'` = 真正连上（口径二，更严） |
| `ring` | 开始呼叫时间 | 时间筛选字段，有 `IDX_CALLRING` 索引 → 范围过滤/按月分组走 ring |
| `bus_system_flag` | 业务系统标识 | 如 `'CSCLUE'`（CSC 客户呼叫场景） |

## 近 6 个月某业务外呼接通量 SQL 模板

```sql
SELECT DATE_FORMAT(ring,'%Y-%m') AS ym,
  COUNT(*) AS all_cnt,
  SUM(call_type IN ('dialout','dialtransfer')) AS outbound_cnt,
  SUM(call_type IN ('dialout','dialtransfer') AND state='dealing') AS dealing_cnt,
  SUM(call_type IN ('dialout','dialtransfer') AND begin > '1970-01-01 08:00:01') AS begin_cnt
FROM t_heli_call_event
WHERE bus_system_flag='CSCLUE' AND ring >= '2026-02-12'  -- 近 6 个月按 ring 走索引
GROUP BY ym ORDER BY ym;
```

## 坑

- **MySQL `SHOW TABLES LIMIT n` 会报 ERROR 1064**（SHOW 语句不支持 LIMIT），拉表清单改用 `information_schema.TABLES`。
- 9070 万行大表 6 个月范围扫描 + GROUP BY 聚合约需 1-2 分钟：**后台跑（run_in_background: true），勿轮询**；输出文件停在"命令已提交"而结果未返回属正常，等完成通知再读。
- 解析 tab 分隔结果用 python3 表头定位法：找含表名字段且带 `\t` 的表头行，往下读到 `^\[rdb@` / `^Opt>` 截止，避免把跳板机提示行当数据。
