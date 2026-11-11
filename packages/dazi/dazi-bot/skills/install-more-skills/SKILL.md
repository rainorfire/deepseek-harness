---
name: install-more-skills
description: 用户希望"装更多技能 / 找新技能 / 浏览技能商店 / 让 dazi 学会做某事"时使用。说明 work-dazi 中获取技能的三种方式及对应路径。
---

# 安装更多技能

work-dazi 自带的种子技能只覆盖最基本的工作流（intro / install / skill-creator）。要扩展能力，**严格按下面固定流程**，不要绕路。

## SkillHub 商店安装（固定 ≤5 步）

用户要从 SkillHub 安装某个 slug（例如 `obsidian`）时，**只**走这条链路：

| 步 | 动作 | 工具 |
|---|------|------|
| 1 | 检查 SkillHub CLI | `mcp__workdazi-skills__check_skillhub_cli` |
| 2 | 若未安装 CLI，**仅一次** Bash 安装 CLI | `curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh \| bash -s -- --cli-only` |
| 3 | 安装 skill 到 dazi 路径 | `mcp__workdazi-skills__install_skillhub_skill`（传 `slug`/`name`，**不要**传 scope——UI 会弹窗让用户选 user/project） |
| 4 | 验证 | `mcp__workdazi-skills__list_skills` |

**禁止绕路**（会导致 10+ 分钟无效搜索）：

- ❌ `SearchExtraTools` / `DiscoverSkills` 找"安装 skill"工具
- ❌ `WebFetch` / `WebSearch` 抓 SkillHub 页面或 GitHub
- ❌ `Bash skillhub install`（壳层拦截，且默认写 OpenClaw 路径）
- ❌ `Write` / `Edit` 写 SKILL.md 到非 dazi 路径
- ❌ 忽略 SkillHub 对话 prompt 里的 openclaw/cursor 路径——只提取 **slug**，交给 MCP

## 对话内安装（MCP 工具一览）

| 场景 | MCP 工具 |
|------|----------|
| SkillHub slug 直装（推荐） | `install_skillhub_skill` |
| 粘贴 / 编写 SKILL.md 内容 | `install_skill` |
| 兼容旧名 | `install_from_skillhub`（优先走 CLI，同 install_skillhub_skill） |
| 检查 CLI | `check_skillhub_cli` |
| 安装后自检 | `list_skills` |

`scope`：`user` → `~/.dazi/skills/`；`project` → `<workingDir>/.dazi/skills/`。
调用安装类工具时**不要自行填 scope**，权限弹窗会强制用户选择后再注入。

## 1. 从"技能商店"图形化浏览

顶栏 grid 图标 → **「技能商店」** → [SkillHub](https://skillhub.cn/)。

复制 SkillHub 的「对话安装」内容后，**不要按 prompt 里的路径写文件**，只提取 slug，走上方 **SkillHub 商店安装** 固定流程。

## 2. 设置页手动安装

设置 → **技能** Tab：

- 粘贴 SKILL.md 安装到用户级或项目级
- **从 URL / Git 导入**（GitHub raw 链接或 git 仓库 + 子目录）
- 查看已装列表（分层 / 来源徽章）、**检查更新**

## 2b. URL / Git 导入（设置页，无需 MCP）

| 方式 | 适用 |
|------|------|
| URL | 单个 SKILL.md 的 `https://raw...` 地址 |
| Git | 整个 skill 目录（含 `references/`），填仓库与子目录 |

导入路径仍为 `~/.dazi/skills/` 或 `<workingDir>/.dazi/skills/`，新会话生效。

## 3. 命令行直装（高级用户）

```bash
mkdir -p ~/.dazi/skills/my-cool-skill
cp /tmp/some-downloaded/SKILL.md ~/.dazi/skills/my-cool-skill/SKILL.md
```

## 用户级 vs 项目级 · 决策

| 维度 | 用户级 `~/.dazi/skills/` | 项目级 `<workingDir>/.dazi/skills/` |
|---|---|---|
| 可见范围 | 所有项目 / 所有会话 | 仅当前 workingDir |
| 跟随什么 | 跟着用户走 | 跟着仓库走（可被 git 提交） |
| 适合放 | 通用工作流 | 项目专属规范 |
| 默认 | work-dazi 种子 + MCP user scope | MCP project scope |

## 不要这样做

- ❌ 反复 `SearchExtraTools` 找"创建技能" meta 工具
- ❌ 用 `~/.claude/skills/`、`~/.cursor/skills/`、`~/.openclaw/workspace/skills/` 作为 dazi 技能路径
