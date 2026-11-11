---
name: skill-usage-stats
description: 从 ebaolangfuse ClickHouse 查询技能使用统计（每日各 Skill 调用量、明细数据），、「查skill数��」、「ebaolangfuse ClickHouse」
---






- **数据平台**: ebaolangfuse（鹅宝 Langfuse LLM 可观测平台）
- ****: ClickHouse（10.40.106.191），通过 Docker 运行
- **表结构**: ClickHouse `default.observations` + `default.traces`
- **连接方式**: 通过 dj-jump 跳板机 -> ClickHouse 服务器

> ⚠️ ****:
> - 数据库名是 `default`，不是 `ebaolangfuse`
> - `clickhouse-client` 不在服务器 PATH，需用 `sudo docker exec -i infra-clickhouse clickhouse-client`
> - `observations.metadata` 是 `Map(LowCardinality(String), String)` 类型，不是 JSON，用 `metadata['key']` 访问，不能用 `JSONExtractString()`
> - `user_id` 不在 observations 表，在 `traces` 表，需 `LEFT JOIN default.traces t ON o.trace_id = t.id`
> - input LIKE 路径有 SKILL.md 和 SKILD.md 两种拼写（后者是 typo），两种都要匹配
> - `metadata['lc_agent_name']` 可能返回中文如"劳动者顾问"，不是技能 slug

## 连接 ClickHouse（两种方式）

### 方式 A：djs.sh + base64 SQL（最可靠）

通过 `dj-jump` 的 djs.sh 脚本发送 SQL。由于多行 SQL 转义复杂，推荐将 SQL **base64 编码**后发送：

```bash
# 1. 构建 SQL（注意：数据库是 default，不是 ebaolangfuse）
SQL="SELECT o.trace_id, t.user_id, o.metadata['lc_agent_name'] AS skill_name, o.start_time AS trigger_time FROM default.observations o LEFT JOIN default.traces t ON o.trace_id = t.id WHERE toDate(o.start_time) >= '2026-07-20' AND toDate(o.start_time) <= '2026-07-22' AND o.type = 'TOOL' AND o.name = 'read_file' AND (o.input LIKE '%chushaih5-ayi%' OR o.input LIKE '%tijian-ayi%') ORDER BY skill_name, o.start_time ASC FORMAT TSVWithNames"

# 2. Base64 编码（避免 shell 引号嵌套问题）
B64=$(echo -n "$SQL" | base64)

# 3. 通过 djs.sh 发送（注意 -c 参数内的引号）
djs.sh 10.40.106.191 -c "echo ${B64} | base64 -d > /tmp/q.sql && sudo docker exec -i infra-clickhouse clickhouse-client < /tmp/q.sql 2>&1"
```

**原理**: 先写 SQL 文件到远程服务器，再执行。base64 编码的字符串不含特殊字符，避免了引号嵌套问题。

> 注: `djs.sh -c` 已修复，命令执行完后自动 `exit` 退出 SSH，不会卡死。

### 方式 B：tmux 持久会话（适合多次查询）

```bash
# 1. 检查或创建 tmux 会话（带大 history-limit）
source ~/.config/djs.config
tmux has-session -t djs 2>/dev/null || tmux new-session -d -s djs -l 500000

# 2. SSH 到 ClickHouse 服务器（通过 djs.sh 处理 MFA）
#    ⚠️ 直接 tmux send-keys "ssh 10.40.106.191" 无法处理 MFA！
#    需要使用 djs.sh 或 tmux-djs.sh 来建立连接
tmux-djs.sh 10.40.106.191

# 3. 启动 clickhouse-client（注意是用 Docker exec，非直接调用）
tmux send-keys -t djs "sudo docker exec -it infra-clickhouse clickhouse-client --host 127.0.0.1 --port 9000 -d default" Enter
sleep 1

# 4. 确认连接
pane=$(tmux capture-pane -t djs -p)
if echo "$pane" | grep -q "default"; then
    echo "ClickHouse 已连接到 default 库"
fi

# 5. 设置输出捕获到文件
> /tmp/tmux-output.log
tmux pipe-pane -t djs: -o 'cat >> /tmp/tmux-output.log'
tmux set-option -t djs history-limit 50000
```

## 查询语句

### 1. 按 Skill 去重统计调用量（每天每次）

统计指定日期每个 Skill 的去重 trace 数（即独立会话数）：

```sql
SELECT
    multiIf(
        input LIKE '%chushaih5-ayi%', 'chushaih5-ayi',
        input LIKE '%tijian-ayi%', 'tijian-ayi',
        input LIKE '%learning-assistant%', 'learning-assistant',
        input LIKE '%exam-assistant%', 'exam-assistant',
        'unknown'
    ) AS skill_name,
    toDate(start_time) AS dt,
    uniqExact(trace_id) AS visit_count
FROM default.observations
WHERE toDate(start_time) >= '2026-07-20'
  AND toDate(start_time) <= '2026-07-22'
  AND type = 'TOOL'
  AND name = 'read_file'
  AND (input LIKE '%chushaih5-ayi%' OR input LIKE '%tijian-ayi%' OR input LIKE '%learning-assistant%' OR input LIKE '%exam-assistant%')
GROUP BY skill_name, dt
ORDER BY dt, visit_count DESC
FORMAT TSVWithNames;
```

### 2. 查询指定 Skill 的明细数据（推荐：JOIN traces 取 user_id）

按日期+Skill 查询每条触发记录（含 trace_id、user_id、触发时间）：

```sql
SELECT
    o.trace_id,
    t.user_id,  -- ⚠️ user_id 在 traces 表，不在 observations!
    o.metadata['lc_agent_name'] AS skill_name,
    o.start_time AS trigger_time
FROM default.observations o
LEFT JOIN default.traces t ON o.trace_id = t.id
WHERE toDate(o.start_time) >= '2026-07-20'
  AND toDate(o.start_time) <= '2026-07-22'
  AND o.type = 'TOOL'
  AND o.name = 'read_file'
  AND o.input LIKE '%chushaih5-ayi%'
ORDER BY o.start_time ASC
FORMAT TSVWithNames;
```

> ⚠️ **重要踩坑**:
> - `metadata['lc_agent_name']` 在某些记录中可能是空的，或者返回中文（如"劳动者顾问"），不是 skill slug
> - 如需精确匹配，建议直接用 `input LIKE` 条件反推 skill 名称（如上方的 `multiIf` 方式）
> - `metadata['user_id']` **不靠谱**（常为空），必须 JOIN traces 表

### 3. 综合查询（所有 Skill + 多天，base64 方式）

批量查询每个 Skill 每天的去重调用数：

```bash
# ── 配置参数 ──
SKILLS=("chushaih5-ayi" "tijian-ayi" "learning-assistant" "exam-assistant")
DATES=("2026-07-20" "2026-07-21" "2026-07-22")

for skill in "${SKILLS[@]}"; do
    for date in "${DATES[@]}"; do
        # 构建 SQL（注意要用 SKILL.md 和 SKILD.md 两种路径匹配）
        # ⚠️ 必须尾加 %：input 路径后还带其他字符（引号/参数/后续内容），无尾 % 会漏计（实测 oa-approve 漏成 0，加尾 % 后 118）
        SQL="SELECT o.trace_id, t.user_id, o.start_time AS trigger_time FROM default.observations o LEFT JOIN default.traces t ON o.trace_id = t.id WHERE toDate(o.start_time) = '$date' AND o.type = 'TOOL' AND o.name = 'read_file' AND (o.input LIKE '%$skill/SKILL.md%' OR o.input LIKE '%$skill/SKILD.md%') ORDER BY o.start_time ASC FORMAT TSVWithNames"

        B64=$(echo -n "$SQL" | base64)
        outfile="/tmp/skill_${date}_${skill}.tsv"

        # 通过 djs.sh 发送（结果重定向到文件）
        djs.sh 10.40.106.191 -c "echo ${B64} | base64 -d > /tmp/q.sql && sudo docker exec -i infra-clickhouse clickhouse-client < /tmp/q.sql > /tmp/r.tsv 2>&1 && cat /tmp/r.tsv" 2>&1 | grep -v '^\[' | grep -v '^Opt>' | tail -n +2 > "$outfile"

        echo "已查询: $skill @ $date -> $outfile"
    done
done
```

> ⚠️ **复杂查询建议**: 对于多次查询，建议用方式 B（tmux 持久会话）配合 SQL 文件发送，效率更高。



## 数据富化（passportId → cpId → 姓名 → 线索信息）

ClickHouse 查到的原始数据只有 `trace_id`、`user_id`、`trigger_time` 三列，需要通过到家内部 API 补全。

### 数据流程（4 步）

```
user_id(passportId) ──①──→ cpId ──②──→ 姓名(clueId) ──③──→ 线索顾问信息
```

| 步骤 | 用途 | 接口 | 入参 | 域名 | 关键点 |
|------|------|------|------|------|--------|
| ① | passportId→cpId | `GET /worker/weChat/getBaseInfo` | **`uid`** (不是 passportId!) | csworker.daojia-inc.com | 参数名是 **uid**，非 passportId。所有用户都能查到 cpId，包括非劳动者 |
| ② | cpId→姓名 | 同 getBaseInfo 返回的 `realName` | - | - | 无姓名的用脱敏手机号代替 |
| ③ | cpId→线索ID | `GET /im/api/worker` | `cpId` | zs.daojia-inc.com | 仅 isWorker=True 的用户有线索记录 |
| ④ | cpId→归属人 | `GET /worker/detail/getClueSource` | `cpId` + `categoryId=212` | csworker.daojia-inc.com | 返回 clueBelongUserName |

### ⚠️ 接口参数关键踩坑

**`getBaseInfo` 的参数名是 `uid`，不是 `passportId`！**

```bash
# ✅ 正确（返回 cpId + 姓名）
curl "https://csworker.daojia-inc.com/worker/weChat/getBaseInfo?uid=2079125863817291754"

# ❌ 错误（返回 "UID未关联商家" 或 data: {}）
# /worker/weChat/getBaseInfo?passportId=xxx  ← 参数名错误
# /worker/weChat/getInfo?passportId=xxx      ← 只返回微信绑定信息，非劳动者返回 data: {}
```

### 鉴权配置

所有 API 均需请求头：
- `X-Cli-Agent-Token: cli-f549575bc90002cbe111469bf9e36462da3a9145`
- `X-Cli-Agent-Type: 3`

本地 macOS 可直接 HTTPS 访问（无需跳板机）。

### 完整富化脚本

通过 `enrich_skill_users.py` 脚本批量处理：

```bash
python3 ~/.dazi/skills/skill-usage-stats/scripts/enrich_skill_users.py
```

执行流程：
1. 读取去重 `user_id` 列表（从富化版 TSV 或 ClickHouse 明细）
2. 第①步：调 `getBaseInfo?uid={uid}` 获取 cpId、realName、phone、isWorker
3. 第②步：realName 为空时用脱敏 phone 代替
4. 第③步：调 `im/api/worker?cpId={cpId}` 获取线索ID（仅 isWorker=True）
5. 第④步：调 `getClueSource?cpId={cpId}&categoryId=212` 获取归属人
6. 填充到每一行明细数据
7. 生成分 sheet 的 Excel（按 skill_name+日期 拆分）

### 姓名缺失兜底规则

1. 查 `getBaseInfo` 返回的 `realName` 字段
2. 若无 realName 但有 `phone` → 用脱敏手机号（如 "183****1778"）
3. 若都无 → 留空

### 📊 生成分 Sheet Excel

明细数据要求：
- 表头（header）：`skill_name | dt | trace_id | user_id | cp_id | 姓名 | 线索ID | 线索归属人`
- 按 `skill_name + 日期` 分 sheet（如 `chushaih5-ayi_2026-07-20`）
- Excel sheet 名最大 31 字符
- 列宽自适应

使用 openpyxl 生成（已预装）。

### 踩坑记录

- **⚠️ getBaseInfo 参数为 uid 非 passportId**：第一次查全返回空，是因为用了 `passportId` 参数名，纠正为 `uid` 后全部查到 cpId
- **AI 技能用户大部分有 cpId**：即使 isWorker=False 也能查到 cpId，只是无姓名和线索信息
- **约 23/51 用户无 realName**：用脱敏手机号代替（非劳动者用户）
- **线索信息仅限 isWorker=True**：51 个用户中 28 个是劳动者，其中 26 个有线索记录
- **metadata 字段大部分为空**：`observations.metadata['lc_agent_name']` 返回固定值"劳动者顾问"
- **user_id 在 traces 表不在 observations**：必须 `LEFT JOIN default.traces`

## 生成 xlsx 报表

查询完成后，用 Python 将 TSV 转换为 xlsx（每个 Skill 一个 Sheet，加汇总 Sheet）：

```python
import os, openpyxl
from collections import defaultdict

# 所有 TSV 文件按 (date, skill) 索引
tsv_files = {
    ('2026-07-20', 'chushaih5-ayi'): '/tmp/skill_2026-07-20_chushaih5-ayi.tsv',
    ('2026-07-20', 'tijian-ayi'): '/tmp/skill_2026-07-20_tijian-ayi.tsv',
    # ...
}

# 统计汇总
stats = defaultdict(lambda: defaultdict(int))

for (date, skill), fpath in tsv_files.items():
    if not os.path.exists(fpath):
        continue
    with open(fpath) as f:
        lines = f.readlines()
    header = lines[0].strip().split('\t') if lines else []
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue
        cols = line.split('\t')
        if len(cols) >= 4:
            stats[skill][date] += 1

# 创建 xlsx
wb = openpyxl.Workbook()
# 汇总 Sheet
ws_summary = wb.active
ws_summary.title = '统计概览'
ws_summary.append(['Skill'] + dates + ['合计'])
for skill in all_skills:
    row = [skill]
    total = 0
    for d in dates:
        count = stats[skill].get(d, 0)
        row.append(count)
        total += count
    row.append(total)
    ws_summary.append(row)

# 明细 Sheet
for skill in all_skills:
    ws = wb.create_sheet(skill)
    ws.append(['trace_id', 'user_id', 'skill_name', 'trigger_time'])
    for date in dates:
        for row in data_rows.get((date, skill), []):
            ws.append(row)

wb.save('/tmp/skill_detail.xlsx')
```

## 参考数据（2026-07-20 ~ 2026-07-22）

### 统计概览（原始 observations 行数）

| Skill | 7月20日 | 7月21日 | 7月22日 |
|-------|:-------:|:-------:|:-------:|
| chushaih5-ayi | 4 | 64 | — |
| learning-assistant | 22 | 4 | — |
| exam-assistant | 19 | 4 | — |
| tijian-ayi | 25 | 34 | — |

> 注意: 这是 observation 级别的行数（每个工具调用一次），非 trace 去重数。如需去重 trace 数，用 `uniqExact(trace_id)`。

### 已记录的 Skill 列表

| Skill slug | 用途 | 对应metadata['lc_agent_name'] |
|------------|------|:-------:|
| `chushaih5-ayi` | 出海H5-A站 | 可能为空或中文 |
| `tijian-ayi` | 体检A站 | 可能为空或中文 |
| `learning-assistant` | AI学习助手 | 可能为空或中文 |
| `exam-assistant` | AI考试助手 | 可能为空或中文 |

## ⚠️ 踩坑汇总（必读）

### 数据库连接
 `ebaolangfuse.observations`，实际是 **`default.observations`**
2. **clickhouse-client 路径**: 服务器上无 `clickhouse-client`，必须用 **`sudo docker exec -i infra-clickhouse clickhouse-client`**
3. **djs.sh -c 输出截获**: `-c` 执行命令后进入 `interact` 模式，stdout 能捕获但可能不全。推荐 `base64` 编码 SQL 避免引号嵌套

### Metadata 类型
4. **metadata 是 Map 不是 JSON**: 用 `metadata['key']`，不是 `JSONExtractString(metadata, 'key')`。后者报错 `ILLEGAL_TYPE_OF_ARGUMENT`
5. **user_id 在 traces 表**: `metadata['user_id']` 经常为空，必须 `LEFT JOIN default.traces t ON o.trace_id = t.id` 才能取到 user_id
6. **lc_agent_name 不靠谱**: `metadata['lc_agent_name']` 可能返回中文（"劳动者顾问"）而非 skill slug，建议用 `input LIKE` + `multiIf` 反推

### SQL 查询
7. **input LIKE 路径**: 某些记录是 `SKILD.md`（typo），需同时匹配 `SKILL.md` 和 `SKILD.md`
8. **多行 SQL 发送**: 不要直接用 `djs.sh -c` 发送多行 SQL（引号转义会崩溃），用 **base64 编码** 或 **写文件方式**
9. **FORMAT**: 必须加 `FORMAT TSVWithNames`，否则 ClickHouse 默认输出格式不可解析

### 数据富化
10. **姓名缺失兜底**: 查不到姓名的劳动者用脱敏手机号替代（如"183****1778"）
11. **cpId 不在系统**: 约 3 个 cpId 在到家系统无线索记录，clueId 和顾问信息均无法查到
12. **API 鉴权**: 到家 API 需 `X-Cli-Agent-Token` + `X-Cli-Agent-Type` 请求头
