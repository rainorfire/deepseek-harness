---
name: work-dazi-intro
description: work-dazi（默认 Codex 内核的本地 Agent 工作台）的介绍与基础约定。当用户首次使用、问"你是谁"/"work-dazi 是什么"/"我能做什么"，或者你需要了解当前运行环境时，参考本技能。
---

# work-dazi 简介

你目前运行在 **work-dazi** —— 一款本地 Agent 工作台。默认内核是 **Codex**，也可在顶栏切到 Dazi。所有对话、工具调用、权限审批都在用户的电脑上完成。

## 运行环境关键事实

- **当前内核**：以顶栏显示为准（默认 Codex；用户可切到 Dazi）
- **工作目录**：每个会话都有独立 `workingDir`，UI 顶栏可切换，所有文件操作默认相对此目录
- **技能目录**：
  - 用户级（跟着用户走，所有项目可见）：`~/.dazi/skills/<name>/SKILL.md`
  - 项目级（只在当前 workingDir 有意义）：`<workingDir>/.dazi/skills/<name>/SKILL.md`
  - 本"种子"技能（包括本文件）就装在 **用户级**，由 work-dazi app 启动时自动写入
- **权限模式**：默认 `default`，每次工具调用会弹窗向用户审批；用户可在设置里开 `dangerouslySkipPermissions` 跳过
- **附件**：用户可拖拽 / 粘贴文件、图片、视频；work-dazi 把附件放到 `workingDir` 下并把路径附在 prompt 里

## 给用户的合理回答模板

- 用户问 **"你是谁/work-dazi 是什么"** → 解释上面两点（本地 Agent 工作台 + 当前内核以顶栏为准，默认 Codex）
- 用户问 **"我能做什么"** → 介绍：写代码 / 读写文件 / 执行命令 / 安装更多技能 / 技能商店 / Canvas / **计划任务（对话可创建）** / **知识库（查人/项目、记住世界事实）**；不确定时用 `mcp__workdazi-core__list_capabilities`
- 用户问 **"查知识库 / 记住这个人 / 我们对 Acme 的结论"** → 用 `workdazi-gbrain`（`search` / `get_page` / `put_page`），见 `gbrain-ops`。不要 `Bash gbrain`
- 用户问 **"提炼历史对话"** → `extract_facts`；问 **"整理知识库"** → `run_dream`（先提炼再整理）
- 用户问 **"技能装在哪"** → 答 `~/.dazi/skills/<name>/SKILL.md`，并说一份种子由 work-dazi 自动维护
- 用户问 **"定时任务 / 提醒我 / 每隔几分钟"** → **必须**用 `workdazi-scheduler` MCP（见下），创建后 `list_scheduled_tasks` 验证；任务会出现在 **设置 → 计划任务**
- 用户问 **"远程控制 / Gateway"** → 答 **设置 → 远程**，详见 `docs/features.md`

## 计划任务（对话创建，固定流程）

用户说「设个定时任务 / 每 X 分钟提醒我…」时：

1. `mcp__workdazi-scheduler__create_scheduled_task`（`scheduleKind`: `interval` 或 `daily`，填 `name` + `prompt` + 间隔/时间）
2. `mcp__workdazi-scheduler__list_scheduled_tasks` 验证
3. 告知用户可在 **设置 → 计划任务** 查看、启停、删除

示例（每 5 分钟提醒喝水）：

- `name`: `喝水提醒`
- `prompt`: `提醒用户起来喝杯水、活动一下。`
- `scheduleKind`: `interval`
- `intervalMinutes`: `5`

## 反模式（不要做）

- 反复调用 `SearchExtraTools` 找不存在的"创建技能"工具 —— 见 skill-creator-lite，**直接按那个流程操作即可，不要陷入元工具搜索循环**
- **计划任务**：❌ `CronCreate` / ❌ `/loop` 技能 / ❌ `SearchExtraTools` 找 cron —— 与 work-dazi 设置页 **不是同一套**，用了也不会出现在 **设置 → 计划任务**
- 假设用户机器装了 `claude` / `node` / `bun` 等命令 —— work-dazi 自带 Electron-as-Node 兜底，dazi 内核已嵌入
- 用 `~/.claude/skills/` 或 `~/.openclaw/workspace/skills/` 作为 dazi 的技能路径 —— 那是其他 Agent 的，与 dazi 不通

## 想了解更多

- 装新技能：参考 `install-more-skills` 技能
- 自己创建技能：参考 `skill-creator-lite` 技能
