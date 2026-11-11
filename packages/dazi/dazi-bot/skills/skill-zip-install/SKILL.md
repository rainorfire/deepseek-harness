---
name: skill-zip-install
version: "1.0.0"
description: >
  安装用户上传/给出的本地技能包 zip（含 SKILL.md + scripts/ + references/ 的业务技能）。
  当用户说「学习并安装这个skill」「装一下传的这个技能包」「把zip里的技能安装到本机」时触发。
  覆盖：zip 内容预检（可能与预期不符）、mcp__workdazi-skills__install_skill 渐进式参数、
  scripts/references 手动补齐、临时目录验证、注册确认全流程。
---

# 本地 zip 技能包安装

## 概述

用户常以 zip 形式交付业务技能（如链车 lianche-*、鹅宝 create-ebao-skill 等）。
本地 zip 包与 SkillHub 商店技能不同：**`install_skill` MCP 只落 SKILL.md**，
scripts/ 与 references/ 必须手动补齐，且验证闭环不可省。

## 何时使用

- 用户上传技能 zip 说「学习并安装这个skill」「装一下」「安装这个技能包」
- 用户给出本地 skill 目录并要求注册到 `~/.dazi/skills/`
- 新技能装了但报错、缺脚本、缺引用文档

## 核心原则

1. **先验内容再动手**：任何 zip 先 `unzip -l` 看结构。zip 内的技能可能与用户口头预期不一致——
   2026-08-21 用户说安装 saleclue-match-worker，zip 里实际是 create-ebao-skill。先向用户说明实际包名。
2. **SkillHub CLI 只用于商店技能**：本地 zip 包不装 CLI，直接走 `install_skill` MCP。
3. **install_skill 参数渐进式暴露**：按 content → name(slug) → scope 顺序补齐，漏一个报一次错。
4. **补齐依赖文件**：MCP 只写 SKILL.md，需手动 `cp` 把原始 zip 里的 scripts/ 与 references/ 拷进安装目录。
5. **验证闭环**：联网类脚本在 /tmp 临时目录试跑（不污染安装目录），最后 list_skills 确认注册。

## 流程

1. **预检 zip**：`unzip -l <zip>` 看文件清单，确认实际技能名/结构，与用户预期不符时先说明。
2. **解压临时目录**：`unzip -o <zip> -d <workingDir>/.work-dazi-attachments/<name>-extracted/`
3. **读核心文件**：SKILL.md（主逻辑）、references.json（引用清单，如有）、scripts/*（同步/校验脚本），理解机制后再装。
4. **MCP 安装主文档**：
   - 首次调用 `mcp__workdazi-skills__install_skill` 传 `content=SKILL.md 全文（含 frontmatter）`
   - 报「缺少 slug 或 name」→ 补 `name=kebab-case 技能目录名`（如 create-ebao-skill，不是用户叫法）
   - 报「MISSING_SCOPE」→ 补 `scope=user`（通用技能）或 `project`（项目专属）；scope 由权限弹窗注入，不要自己臆造
5. **补齐依赖**：`mkdir -p <installDir>/scripts <installDir>/references && cp <src>/scripts/ <src>/references/ <installDir>/` （含 references.json 若原始包有）
6. **验证**：
   - 联网/同步类脚本：`cd /tmp && rm -rf <name>-test && mkdir -p <name>-test && echo '{}' | python3 <installDir>/scripts/sync_*.py` 看 `ok:true`
   - `mcp__workdazi-skills__list_skills` 确认 slug 已在 user/project scope 注册
   - 结尾提醒「新会话生效」

## 要点/坑

- `install_skill` 的 content 必须含完整 frontmatter，缺 content 报「缺少 content：请传完整 SKILL.md 文本」。
- 传 name 时 kebab-case 目录名与 SKILL.md 内 name 字段必须一致。
- 安装目录初建只有 SKILL.md；references/ 目录不存在是正常的，补完再验证。
- 验证脚本时不要直接跑安装目录内脚本（可能写坏正式目录），一律在 /tmp 下试跑。
