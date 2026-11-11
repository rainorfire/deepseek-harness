# Langfuse ClickHouse observations 表 — HTTP 接口调用统计（2026-08-14 实战沉淀）

## 一句话定位

鹅宝 Langfuse 可观测平台（ebaolangfuse）的观测数据（observations/traces）在 **ClickHouse**（10.40.106.191 的 infra-clickhouse），**不在 PG**。PG 库 `dbjz_aicx_langfuse` 只存应用元数据，**没有 observations/traces 表**。ClickHouse 库名是 `default`（不是 ebaolangfuse）。

用户问「统计某接口/接口调用/接口成功率」（如 passReview、processtask）时，数据源就在这里。

## 连接方式

- 本机 PG 直连超时（jzpgaicxlangfuse-s.db.djdns.cn → 10.40.99.230:5432），**必须走跳板机**。
- 跳板机：`ssh dj-jump` → 目标 `10.40.106.191` → `sudo docker exec -i infra-clickhouse clickhouse-client`
- 完整连接串：`sudo docker exec -i infra-clickhouse clickhouse-client --host 127.0.0.1 --port 9000 -d default`

## 表结构关键点（default.observations）

- `metadata` 是 **Map 类型**，必须用 `metadata['key']` 访问；不能用 `JSONExtractString(metadata,...)` 顶层取（报 `ILLEGAL_TYPE_OF_ARGUMENT`）。
- **HTTP 接口调用记录在 `metadata['http']`**：一个 JSON 字符串，含完整 `request`/`response` 结构。
- 常见字段 `name` / `input` / `output` / `tool_call_names` / `traces.name` 都**不**记 HTTP URL（实测 0 命中）。**不要**在这些字段上 LIKE 扫大字段（全表扫描极慢），直接查 `metadata['http']`。
- 接口成功标志：`JSONExtractUInt(metadata['http'], 'response', 'status') = 200`。

## 已验证案例：processtask/current/passReview

- 全路径：`https://jzinnerapprove.daojia-inc.com/processtask/current/passReview`（POST）
- 匹配：`metadata['http'] LIKE '%processtask/current/passReview%'`
- 2026-08 全量 379 条，全部 status=200（成功率 100%）。按日：08-14:68、08-13:146、08-12:113、08-11:4、08-10:44、08-07:4。

## 已验证 SQL 模板（把 `<接口路径>` 换成目标字符串）

### 总览

```sql
SELECT
  count() AS total_calls,
  countIf(JSONExtractUInt(metadata['http'],'response','status') = 200) AS success_cnt,
  countIf(JSONExtractUInt(metadata['http'],'response','status') <> 200) AS fail_cnt,
  round(countIf(JSONExtractUInt(metadata['http'],'response','status') = 200) / count(), 4) AS success_rate
FROM default.observations
WHERE metadata['http'] LIKE '%<接口路径>%';
```

### 按天分布

```sql
SELECT
  toDate(start_time) AS dt,
  count() AS total_calls,
  countIf(JSONExtractUInt(metadata['http'],'response','status') = 200) AS success_cnt,
  countIf(JSONExtractUInt(metadata['http'],'response','status') <> 200) AS fail_cnt
FROM default.observations
WHERE metadata['http'] LIKE '%<接口路径>%'
GROUP BY dt
ORDER BY dt DESC;
```

### 明细（联 traces 取调用人）

```sql
SELECT
  toDate(o.start_time) AS dt, o.trace_id, t.user_id,
  JSONExtractString(o.metadata['http'],'request','url') AS request_url,
  JSONExtractUInt(o.metadata['http'],'response','status') AS resp_status
FROM default.observations o
LEFT JOIN default.traces t ON o.trace_id = t.id
WHERE o.metadata['http'] LIKE '%<接口路径>%'
ORDER BY o.start_time DESC
LIMIT 100;
```

## 执行方式与坑（按优先级，重要）

1. **首选：单行 SQL + 非交互 `-q`**（最稳，绕开一切粘贴问题，本会话最终靠它跑通）：
   ```bash
   sudo docker exec -i infra-clickhouse clickhouse-client --multiquery -q "SELECT ...单行SQL..."
   ```
2. 交互式 `clickhouse-client` 里**粘贴多行 SQL 有时不触发执行**（停留无结果），粘贴后没反应就再按一次回车；仍不行就换方案 1。
3. **djs.sh 的 expect 长命令吞字（已知 bug）**：`djs.sh <IP> -c "长命令"` 中 `sudo docker exec` 等行首内容会丢。规避：
   - base64 传输：`B64=$(echo -n "$SQL" | base64); djs.sh 10.40.106.191 -c "echo $B64 | base64 -d > /tmp/q.sql && sudo docker exec -i infra-clickhouse clickhouse-client < /tmp/q.sql 2>&1"`
   - 自定义 expect 脚本时：发送命令前 `stty -echo` 关闭回显，且终止标记（如 `__DONE__`）字样不能出现在命令文本里，否则回显会提前命中标记导致查询未跑完就退出。
   - tmux 原子粘贴（load-buffer + paste-buffer）可行，但**沙箱环境 tmux server 起不来**（socket 目录权限 700）；真实终端可正常用 tmux-djs.sh 持久会话 + output.sh 收结果。
4. **PG vs ClickHouse 语法别混**：ClickHouse SQL 里 `default.observations`、`countIf`、`JSONExtractUInt` PG 全部不认。报 `syntax error at or near \"default\"` 且提示符是 `dbjz_aicx_langfuse=>`，说明 SQL 被贴进了 psql——换 ClickHouse 客户端执行。

## 相似任务参考

- 统计各 skill 近 N 天触发次数：见 `skill-usage-stats` 技能（同为 ebaolangfuse ClickHouse）。
- 鹅宝 AI 外呼库（PG）：见本目录 `ebao-call-export.md`。
