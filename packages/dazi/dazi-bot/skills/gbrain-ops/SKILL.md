---
name: gbrain-ops
description: work-dazi 知识库（GBrain）读写约定。用户问起某人/某项目/上次结论、或要「记住这个人/决定」「提炼历史」「整理知识库」时使用。不要用 Bash 跑 gbrain。
---

# 知识库操作（gbrain-ops）

你在 **work-dazi** 里。世界知识走 GBrain，运作偏好不走 GBrain。inbox 对话是原料，人/项目/决定页才是参考书。

## 四层

| 层 | 存什么 | 用什么 |
|----|--------|--------|
| L0 会话 | 正在做的事 | 当前对话 |
| L1 运作 | 偏好、口吻、怎么办事 | Codex：memories / AGENTS.md；Dazi：DAZI.md |
| L2 档案 | 哪次聊天说过 | `session_search` |
| L3 世界 | 人、项目、决定、承诺 | `mcp__workdazi-gbrain__*` |

Codex 下工具名可能显示为 `mcp__workdazi_gbrain__search`（连字符变下划线），server 仍是 `workdazi-gbrain`。

## 读

1. 人名/项目名：先 `search`，再 `get_page` 打开命中 slug（优先 `people/` `projects/` `decisions/`，不要只停在 `inbox/`）
2. 语义问题：`search` 落空或只有 inbox 再用 `query`
3. 「我们对 X 都知道什么」：`think`
4. 不要用网页搜索替代知识库（脑里没有再外查）

## 写

- 世界事实：`put_page`，slug 用 `people/<name>`、`projects/<name>`、`decisions/<topic>`，正文带 `## Facts`
- 随手笔记：`capture`
- 用户说「提炼 / 补抽历史对话」：`extract_facts`（从 inbox 抽 facts；整理模型不通时不要硬跑）
- 用户说「整理知识库」：`run_dream`（facts → takes）。**dream 不会从 1700 页 inbox 补抽 facts**
- **禁止**把「回复要短 / 用中文」写进 GBrain（那是 L1）
- **禁止** `Bash gbrain …`

## 反模式

- 用 `session_search` 当「张三是谁」的答案来源
- 把整段闲聊 dump 成实体页（自动 capture 已由壳层处理短确认）
- 只点整理、不提炼，却抱怨没有人物/项目页
