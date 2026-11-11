# 按自定义 slug 列表统计触发次数（近 N 天）

> 来源：2026-08-14，佳哥把 40 个鹅宝 skill 的 JSON 列表发来，要求统计近 7 天每个 skill 的触发次数。
> 与「每日全量调用量」不同，这里是**给定 slug 清单 → 一条 multiIf 查询出每个 slug 的次数**。

## 连接与执行链路（已验证）

```bash
# 1) 先用生成器脚本把 SQL 落到本地文件（务必先运行生成器！否则 base64 读不到文件报 "no such file or directory"）
# 2) base64 编码，经 djs.sh 发给跳板机，落地后交给 ClickHouse 执行
B64=$(base64 < /tmp/skillstats.sql | tr -d '\n')
set -a; source ~/.config/djs.config; set +a
~/.dazi/skills/DjDB-skill/scripts/djs.sh 10.40.106.191 \
  -c "echo ${B64} | base64 -d > /tmp/q.sql && sudo docker exec -i infra-clickhouse clickhouse-client < /tmp/q.sql 2>&1" \
  > /tmp/skillstats_out.raw 2>&1
```

- 全程含 expect 自动 MFA 登录，**约 1~2 分钟**，放后台任务跑，不要 sleep 轮询（用户零容忍傻等）。
- 输出文件含登录横幅（✓以 readonly 登录 / MFA 验证码 / jumpserver 菜单），SQL 结果在末尾。

## 两个必踩的坑（2026-08-14 实战验证）

1. **ClickHouse `multiIf` 语法**：`multiIf(条件1, 值1, 条件2, 值2, ..., 兜底值)` ——只能用「条件, 值」成对排列，**不能写 `WHEN...THEN`**（本次第一版 SQL 就因此报错，改对后一次通过）。
2. **`--default-database` 参数该 ClickHouse 客户端不识别**：传了会启动报错。改法：SQL 内用全限定名 `default.observations`，客户端参数里不传它。

## 统计 SQL 模板（N 个 slug 一体多分支）

> ⚠️ **必须尾加 `%`**（实战教训，2026-08-14）：
> input 里技能路径**后面还带其他字符**（如 `...SKILL.md"`、路径后接参数/引号/JSON 内容），
> 如果写 `'%<slug>/SKILL.md'`（无尾 %），只会匹配**恰好以 SKILL.md 结尾**的输入，大量记录会漏计。
> 实测验证：`oa-approve` 无尾 % 时统计为 **0**，改为尾加 %（`'%oa-approve/SKILL.md%'`）后为 **118** 个触发对话。
> 四个模式（SKILL.md / SKILD.md / .zip / references/）**都要尾加 %**。

```sql
SELECT
  multiIf(
    input LIKE '%<slug1>/SKILL.md%' OR input LIKE '%<slug1>/SKILD.md%' OR input LIKE '%<slug1>.zip%' OR input LIKE '%<slug1>/references/%', '<slug1>',
    input LIKE '%<slug2>/SKILL.md%' OR input LIKE '%<slug2>/SKILD.md%' OR input LIKE '%<slug2>.zip%' OR input LIKE '%<slug2>/references/%', '<slug2>',
    ..., 'OTHER'
  ) AS skill_slug,
  count(DISTINCT trace_id) AS trigger_cnt
FROM default.observations
WHERE type = 'TOOL' AND toDate(start_time) >= 'YYYY-MM-DD' AND toDate(start_time) <= 'YYYY-MM-DD'
GROUP BY skill_slug
ORDER BY trigger_cnt DESC
```

- 匹配口径：`SKILL.md`（含历史拼写变体 `SKILD.md`）、`.zip` 包名、`references/` 目录——与既有 skill-usage-stats 口径一致。**四个模式必须尾加 %**，否则路径后带字符的记录全部漏计。
- `count(DISTINCT trace_id)` 去重；`type='TOOL'`；`toDate(start_time)` 落在 [start, end] 区间。

## 交付

- 表格：排名 / slug / name / 触发次数（去重 trace）/ 占比。
- Excel：openpyxl 生成 `全量统计` + `触发Top榜` 两个 sheet，零触发行灰底标注，末尾附统计口径说明。