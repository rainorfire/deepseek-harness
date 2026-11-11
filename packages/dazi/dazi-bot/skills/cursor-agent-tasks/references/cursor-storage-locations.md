# Cursor 任务/聊天存储位置速查（2026-07-24 实战验证）

查询「Cursor 最近任务执行状态」时按优先级用以下三处：

## 1. 计划文件（最快、最准）—— `~/.cursor/plans/*.plan.md`

- 文件名：`<任务名>_<hash>.plan.md`，按 mtime 排序即可看最近任务。
- **YAML frontmatter 是关键**：`name`（任务名）、`overview`（目标）、`todos`（数组，每项有 `id`/`content`/`status`，status 取值 `completed` | `pending`）。
- 状态统计 = 数 todos 里 completed 的数量。`isProject: false` 表示非项目级。
- 示例：`work-dazi_expert_bundle_skills_7da15f9e.plan.md`、`align_expert_teams_workbuddy_7561f62c.plan.md`。
- 一条命令看所有计划标题：`for p in ~/.cursor/plans/*.plan.md; do echo "$(head -1 "$p") - $(basename "$p")"; done`

## 2. 全局 SQLite —— `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`

表：`ItemTable` / `composerHeaders` / `cursorDiskKV`。

- `SELECT value FROM ItemTable WHERE key='composer.composerHeaders'` → JSON blob，`allComposers[]` 含每个会话的 `name`、`lastUpdatedAt`、`filesChangedCount`、`totalLinesAdded` 等——**看最近 Composer 会话最直接**。
- `SELECT value FROM ItemTable WHERE key='composer.planRegistry'` → 计划文件注册表（含 .plan.md 路径）。
- `cursorDiskKV` 里 `composerData:<composerId>` = 单个 composer 的完整数据 JSON（含 conversationMap）。
- `composerHeaders` 表字段：composerId/workspaceId/createdAt/lastUpdatedAt/isArchived/isSubagent/recency/checkpointAt/value。

## 3. AI 追踪库 —— `~/.cursor/ai-tracking/ai-code-tracking.db`

表：`ai_code_hashes` / `conversation_summaries` / `tracked_file_content` / `scored_commits` / `tracking_state`。

- `ai_code_hashes`：`timestamp`/`model`/`source`(composer|human)/`conversationId`/`fileName`——按 timestamp 倒序看最近 AI 代码活动。注意 `model` 只有 `default`/`claude-opus-4-8`/`gpt-5.5` 等。
- `conversation_summaries`：目前为 0 行（空表），别指望它。

## 4. 按项目隔离的存储 —— `~/Library/Application Support/Cursor/User/workspaceStorage/<hash>/`

- `workspace.json` 里的 `folder` 字段标识该项目（如 `file:///Users/chenyujia/IdeaProjects/LEARNING/work-dazi`）。
- 每个项目有自己的 `state.vscdb`（同全局三表结构）。

## 5. 项目目录 —— `~/.cursor/projects/Users-chenyujia-<路径>/`

- `agent-transcripts/<composerId>/` 下是会话转录 `.jsonl`；`agent-tools/`、`canvases/`、`assets/` 等。

## 经验

- **最快路径**：先列 `~/.cursor/plans/` 按 mtime 取最近 5 个，读 frontmatter 统计 todo 状态即可回答「最近任务执行完没有」。
- SQLite 直接 `sqlite3 <db> "SQL"` 即可，注意全局库 8.7GB 但查询快。
- 判断任务「未完成」：todos 里存在 `status: pending`。
