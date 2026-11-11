---
name: workbuddy-expert-inspector
description: 当用户问 WorkBuddy 专家中心/召唤的专家在本地加载了什么文件、提示词、配置文件时使用。覆盖专家包本地路径、plugin.json、agents/*.md、技能绑定、头像等关键文件定位与解读。
---

# WorkBuddy 专家包本地 inspector

## 触发场景

- "workbuddy 召唤的专家在本地有没有加载什么 agent 相关的文件或提示词"
- "帮我看看某个 WorkBuddy 专家本地存了哪些文件"
- "专家提示词在哪"

## 本地路径

| 路径 | 说明 |
|------|------|
| `~/.workbuddy/plugins/known_marketplaces.json` | 市场索引（builtin + 云端市场） |
| `~/.workbuddy/plugins/marketplaces/experts/.codebuddy-plugin/marketplace.json` | experts 市场清单 |
| `~/.workbuddy/plugins/marketplaces/experts/plugins/<expert-slug>/` | 已下载专家包根目录 |

## 专家包内部结构

进入任意已下载专家目录后，通常包含：

| 文件/目录 | 用途 |
|----------|------|
| `.codebuddy-plugin/plugin.json` | 专家元数据：名称、版本、默认提示词、入口 agent、runtimeContract 等 |
| `agents/<expert-slug>.md` | **核心系统提示词（Agent Prompt）**，约几 KB 到几十 KB |
| `avatars/expert.png` | 专家头像 |
| `skills/` | 该专家绑定的 Skill 包 |
| `references/` | 参考资料、工作流、质量校验等 |
| `marketplace-entry.json` | 市场入口配置：leadAgent、finalListingNameZh/En 等 |
| `README.md` / `LICENSE` | 说明与许可 |

##  inspector 步骤

1. 列出 experts 市场清单：
   ```bash
   ls ~/.workbuddy/plugins/marketplaces/experts/plugins/
   ```
2. 查看某个专家的元数据：
   ```bash
   cat ~/.workbuddy/plugins/marketplaces/experts/plugins/<slug>/.codebuddy-plugin/plugin.json
   ```
3. 查看核心提示词（节选）：
   ```bash
   head -n 200 ~/.workbuddy/plugins/marketplaces/experts/plugins/<slug>/agents/<slug>.md
   ```
4. 查看市场入口配置：
   ```bash
   cat ~/.workbuddy/plugins/marketplaces/experts/plugins/<slug>/marketplace-entry.json
   ```

## 注意事项

- 专家市场列表里的专家**不一定都完整下载到本地**；只有被点击/使用过的专家才会把整个包下载下来。
- 浏览列表里的其他专家可能只走了云端元数据，本地只有 `known_marketplaces.json` 里的索引。
- 不要随意修改 `.codebuddy-plugin/plugin.json` 或 `agents/*.md`，以免影响专家行为；如需修改请按 WorkBuddy 官方指引走。
