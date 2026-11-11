# 鹅宝 Langfuse HTTP 接口调用统计（2026-08-14 实战沉淀）

## 场景

用户要求统计某 HTTP 接口（如 `processtask/current/passReview`）的调用次数 / 成功次数。此类数据**不在 MySQL/PG 业务库**，而在 **ebaolangfuse（鹅宝 Langfuse）ClickHouse** 的 `default.observations` 表。

## 关键事实：接口调用记录在 metadata['http']（1.43M 行全表探查结论）

| 字段 | 结论 |
|---|---|
| `name` / `traces.name` | **不存** HTTP 接口路径（0 命中） |
| `input` / `output` | 存长 JSON（完整 request/response），**LIKE 全表扫描极慢**（752MB/级跑不完），不要从这查 |
| `tool_call_names` | 不存 HTTP 端点（0 命中） |
| **`metadata`（Map 类型）** | 有 `http` 键：约 55,440 条（占 1.43M 观测的 ~3.9%），值即 HTTP 调用记录 JSON：`{"request": {"method": "POST", "url": "https://...", "headers": {...}, ...}, "response": {"status": 200, "headers": {...}}}` |

- 路径匹配：`metadata['http'] LIKE '%processtask/current/passReview%'`（例：命中 379 条，level 全部 DEFAULT 无 ERROR）
- **成功标志**：`JSONExtractUInt(metadata['http'], 'response', 'status') = 200`

## ⚠️ 两个 ClickHouse 陷阱

1. `metadata` 是 **Map 类型**，必须用 `metadata['http']` 访问；不能用 `JSONExtractString(metadata, ...)`（报 ILLEGAL_TYPE_OF_ARGUMENT）。
2. 库名是 **`default`**（不是 ebaolangfuse）；表：`default.observations` / `default.traces`。

## 统计 SQL 模板（把 URL 通配符换成目标接口路径即可）

```sql
-- 总汇总：成功次数与成功率
SELECT
    count() AS total_calls,
    countIf(JSONExtractUInt(metadata['http'], 'response', 'status') = 200) AS success_cnt,
    countIf(JSONExtractUInt(metadata['http'], 'response', 'status') = 200) / count() AS success_rate
FROM default.observations
WHERE metadata['http'] LIKE '%processtask/current/passReview%';

-- 按日统计（推荐）
SELECT
    toDate(start_time) AS dt,
    count() AS total_calls,
    countIf(JSONExtractUInt(metadata['http'], 'response', 'status') = 200) AS success_cnt,
    countIf(JSONExtractUInt(metadata['http'], 'response', 'status') != 200) AS fail_cnt
FROM default.observations
WHERE metadata['http'] LIKE '%processtask/current/passReview%'
GROUP BY dt ORDER BY dt DESC;

-- 明细：联 traces 表取调用人
SELECT o.trace_id, t.user_id, toDateTime(o.start_time) AS call_time,
       JSONExtractString(o.metadata['http'], 'request', 'url') AS url,
       JSONExtractUInt(o.metadata['http'], 'response', 'status') AS http_status
FROM default.observations o
LEFT JOIN default.traces t ON o.trace_id = t.id
WHERE o.metadata['http'] LIKE '%processtask/current/passReview%'
  AND toDate(o.start_time) >= '2026-08-01'
ORDER BY o.start_time DESC LIMIT 100;
```

## 连接与执行（必须走跳板机）

- **PG 直连超时**：ebaolangfuse PG（`jzpgaicxlangfuse-s.db.djdns.cn` 解析为内网 10.40.99.230）本机直连 5432 **超时**，必须走跳板机。
- 路径：`ssh dj-jump`（MFA：JZ_DJS_SECRET TOTP）→ 10.40.106.191（work@ 鹅宝 Server_04）→ `sudo docker exec -i infra-clickhouse clickhouse-client --host 127.0.0.1 --port 9000 -d default`（库 `default`）。
- 执行 SQL 可靠路径（base64 防吞字）：
  ```bash
  B64=$(echo -n "$SQL" | base64)
  $HOME/.dazi/skills/DjDB-skill/scripts/djs.sh 10.40.106.191 -c "echo ${B64} | base64 -d > /tmp/q.sql && sudo docker exec -i infra-clickhouse clickhouse-client < /tmp/q.sql 2>&1"
  ```

## 本次踩穿的执行层坑（避免重蹈）

1. **`djs.sh -c` 走 expect，长命令会吞首部字符**（`sudo docker exec...` 开头丢失）→ 用 base64 单行命令，或走 tmux 原子粘贴。
2. **expect 等 `__DONE__` 标记会被命令自身回显提前匹配** → 发送前 `stty -echo` 关回显，或只等待真实输出。
3. **work-dazi 沙箱里 tmux 最可靠**：`tmux load-buffer file && tmux paste-buffer -t djs && tmux send-keys -t djs Enter`。启动脚本不要用 `mktemp /tmp/djs-tmux-XXXXXX.sh`（报 "File exists"），用**固定路径** `/tmp/djs-tmux-cmd.sh`；必要时 `chmod 700` 自定义 TMUX_TMPDIR。
4. 交互式面板跑大 LIKE 查询会卡进度表（Progress 0%~N%），用 Ctrl-C 取消，改查小字段（metadata['http'] 比 input 快得多）。
5. 先 `SELECT 1` 探活链路，再发长 SQL。
