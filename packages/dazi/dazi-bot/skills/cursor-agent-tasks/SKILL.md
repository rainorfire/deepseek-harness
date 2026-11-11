---
name: cursor-agent-tasks
description: 查询 Cursor 编辑器的 Agent 任务状态，包括计划文件解析、Composer 执行进度、SQLite 数据库分析。
---

# Cursor Agent 任务状态查询

## 触发词
「看下cursor的任务」「cursor最近的任务」「cursor plan」「cursor状态」「cursor那有完成吗」

## 数据源概览

| 数据源 | 路径 | 用途 |
|--------|------|------|
| **Plan 文件** | `~/.cursor/plans/*.plan.md` | 结构化任务清单（YAML frontmatter + todos + 状态） |
| **Composer Headers** | 全局/workspace SQLite `state.vscdb` → `ItemTable` key=`composer.composerHeaders` | 所有 Composer 会话列表、状态、文件变更统计 |
| **Agent Transcripts** | `~/.cursor/projects/<project-hash>/agent-transcripts/<composerId>/` | Agent 执行日志 JSONL |
| **AI 代码追踪** | `~/.cursor/ai-tracking/ai-code-tracking.db` → `ai_code_hashes` | 代码变更历史 |

## 查询步骤

### 1. 读取计划文件（最快）
```bash
ls -lt ~/.cursor/plans/*.plan.md | head -10
```
每个 plan 文件有 YAML frontmatter 定义 todos，例如：
```yaml
todos:
  - id: some-task
    content: 任务描述
    status: completed  # 或 pending
```
逐个读取 frontmatter 汇总完成/未完成状态。

### 2. 全局 Composer Headers（查所有项目）
```bash
sqlite3 "$HOME/Library/Application Support/Cursor/User/globalStorage/state.vscdb" \
  "SELECT substr(value, 1, 3000) FROM ItemTable WHERE key = 'composer.composerHeaders';"
```
返回 JSON `allComposers` 数组，每个元素包含：
- `composerId`, `name`, `lastUpdatedAt`
- `filesChangedCount`, `totalLinesAdded`, `totalLinesRemoved`
- `contextUsagePercent`, `forceMode` (agent/edit/plan)

### 3. 工作区专用 DB（按项目）
每个 workspace 的 DB 在：
`~/Library/Application Support/Cursor/User/workspaceStorage/<hash>/state.vscdb`
通过 `workspace.json` 里的 `folder` 识别项目。
查询：
```bash
sqlite3 "<workspace-db>" \
  "SELECT * FROM composerHeaders ORDER BY lastUpdatedAt DESC LIMIT 10;"
```

### 4. AI 代码追踪（查最近编辑）
```bash
sqlite3 ~/.cursor/ai-tracking/ai-code-tracking.db \
  "SELECT timestamp, model, source, conversationId FROM ai_code_hashes ORDER BY timestamp DESC LIMIT 20;"
```

### 5. 项目目录直接检查
Cursor 项目数据在：`~/.cursor/projects/<project-hash>/`
包含：`agent-transcripts/`（对话日志）、`agent-tools/`（工具调用记录）、`assets/`（截图）

## 输出格式
优先表格输出，含：
- 任务名、更新时间、进度（已完成/总）、状态
- 未完成任务的剩余 todo 清单
- 如有计划文件，列出文件名和关联的项目

## 注意
- Plan 文件的 frontmatter 是 YAML，需 python 或 grok 解析
- Composer `name` 字段可能是中文，直接显示给用户
- Workspace DB 的 `composerHeaders` 表有时为空（数据在全局 ItemTable 里）