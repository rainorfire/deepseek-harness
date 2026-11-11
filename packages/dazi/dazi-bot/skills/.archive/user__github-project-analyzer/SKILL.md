---
name: github-project-analyzer
description: 当用户要求「通读/评估/分析一个 GitHub 项目」并整理核心信息（如何安装、如何使用、核心技术原理、应用价值等）时加载本 Skill。适用于任意公开仓库，包括 Skill 评估项目、开源工具、框架/SDK 等。
metadata:
  author: dazi
  version: '0.1.0'
---

# GitHub 项目通读与分析

## 触发条件

满足任一条件即应加载：

- 用户发来 GitHub 仓库链接，要求「通读」「评估」「整理」「分析」
- 用户要求了解某开源项目的安装、使用、原理、价值
- 用户要求对某个 Skill / MCP / 框架做项目级评估
- 用户说「看下这个项目」「研究一下这个 repo」「给我讲讲这个项目」

## 工作流程

### 1. 准备：克隆仓库到临时目录

用 Bash 执行浅克隆，避免拉取完整 git 历史：

```bash
git clone --depth 1 <repo-url> /tmp/<repo-name>
```

如果仓库已存在，可跳过或删除后重新克隆。注意不要把仓库克隆到用户工作目录，避免污染项目。

### 2. 快速了解仓库结构

用 Bash 列出顶层文件：

```bash
ls -la /tmp/<repo-name>
```

重点关注：

- `README.md`：项目定位、快速开始
- `package.json` / `pyproject.toml` / `Cargo.toml`：依赖、脚本、入口
- `CHANGELOG.md` / `HISTORY.md`：版本演进
- `LICENSE`：协议
- `docs/`、`references/`、`architecture/`：架构/参考文档
- `SKILL.md`（如果是 Skill 项目）：技能说明
- `src/` / `core/` / `cli/`：核心源码目录

### 3. 精读关键文件

按优先级阅读：

1. **README.md** — 项目是什么、解决什么问题、怎么开始
2. **SKILL.md / docs/intro** — 如果项目是 Skill/MCP，读取使用说明
3. **package.json / 等元文件** — 安装方式、脚本、引擎要求
4. **CHANGELOG.md** — 最近更新与版本节奏
5. **references/ARCHITECTURE.md / pipeline.md / troubleshooting.md** — 技术原理
6. **核心源码入口**（如 `cli/index.js`、`core/index.js`）— 必要时局部阅读

如果文件过大，用 Read 的 offset/limit 参数分段读取，或用 Grep 搜索关键函数/类。

### 4. 整理核心信息

按用户要求整理，但默认覆盖以下 4 个维度：

| 维度 | 内容要点 |
|---|---|
| **如何安装** | 前置条件、安装命令、依赖版本、权限/登录要求、配置方式 |
| **如何使用** | 典型命令/调用方式、工作流、核心子命令、输入输出示例 |
| **核心技术原理** | 核心抽象、架构组件、数据流、关键算法/协议、与其他系统的集成方式 |
| **评估应用价值** | 适合谁、解决什么痛点、核心价值、门槛/局限、是否值得推荐 |

### 5. 输出与沉淀

- 用中文输出，结构清晰（标题、表格、列表）
- 如果分析内容较长，询问用户是否需要保存为 Markdown 文件到工作目录
- 引用来源时给出仓库内的具体文件路径或 GitHub 原始链接

## 注意事项

- 遇到压缩/混淆代码不要强行解读，直接说明「源码不可读，技术细节需参考官方文档」
- 不要对未知仓库做安全背书；若发现明显风险（如请求管理员权限、网络嗅探、反调试等），应明确提示
- 如果项目依赖微信开发者工具、浏览器插件、私有服务等封闭生态，需在「局限」中说明
- 若用户只问其中某一维度（如「怎么安装」），可聚焦回答，但仍建议简要提及其他维度便于理解

## 示例

用户：「https://github.com/wechat-miniprogram/ai-mode-skills 看下这个 skill 评估项目」

执行：
1. `git clone --depth 1 https://github.com/wechat-miniprogram/ai-mode-skills.git /tmp/ai-mode-skills`
2. 读 `README.md`、3 个 `SKILL.md`、`package.json`、`references/pipeline.md`、`references/configuration.md`、`CHANGELOG.md`
3. 整理：安装（3 个子工具分别怎么装）、使用（generate/validate/eval 三段式）、技术原理（原子接口 + 原子组件 + MCP 式规范 + 13 节点评测管线）、应用价值与局限
4. 输出结构化工总结
