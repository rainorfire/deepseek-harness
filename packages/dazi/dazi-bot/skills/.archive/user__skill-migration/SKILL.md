---
name: skill-migration
description: 当用户要求把已有的 SKILL.md（例如从 ~/.openclaw/workspace/skills/ 或其他本地路径）迁移/安装到 dazi 用户级或项目级 skills 目录时使用。
---

# 本地 Skill 迁移/安装

## 触发条件

当用户说：
- "学习以上 skill，安装到项目级目录中"
- "把 `~/.openclaw/workspace/skills/xxx` 迁移到 dazi"
- "安装这个本地 skill"
- "把这些 skill 放到项目里"
- 或任何要求把**已存在的本地 SKILL.md 文件**复制到 dazi 用户级/项目级 skills 目录的表达

> 注意：如果是 SkillHub slug 安装，走 `install-more-skills` / `mcp__workdazi-skills__install_skillhub_skill`，**不要**用本 skill。

## 前置要求

1. 用户已经给出源 skill 的路径（含 `SKILL.md` 或目录）
2. 明确目标 scope：`user`（`~/.dazi/skills/`）还是 `project`（`<workingDir>/.dazi/skills/`）
3. 如果源路径不是标准 SKILL.md，需要先确认内容是否完整

## 迁移流程

1. **读取源文件**
   - 用 `Read` 工具读取用户给出的 `SKILL.md` 路径
   - 如果用户给的是目录路径，拼接 `/SKILL.md` 再读取

2. **确认目标 scope**
   - 项目级：`<workingDir>/.dazi/skills/<slug>/SKILL.md`
   - 用户级：`~/.dazi/skills/<slug>/SKILL.md`
   - 如果用户没说，默认项目级（因为可以跟随仓库 git 提交）

3. **创建目标目录**
   - 用 `Bash` 执行 `mkdir -p <target_dir>`
   - 目录名通常取 skill frontmatter 里的 `name` 或用户给定的 slug

4. **写入 SKILL.md**
   - 用 `Write` 工具把读取到的完整内容写入目标 `SKILL.md`
   - 必须保留 frontmatter（`---` 块）

5. **验证**
   - 调用 `mcp__workdazi-skills__list_skills` 确认 skill 已被识别
   - 如果 scope 是 project，验证 `project` 列表里出现该 skill

## 常见源路径

- `~/.openclaw/workspace/skills/<slug>/SKILL.md`
- `~/.cursor/skills/<slug>/SKILL.md`
- `~/.claude/skills/<slug>/SKILL.md`
- 任意本地目录下的 `SKILL.md`

## 注意事项

- 不要修改原始 SKILL.md 的内容，除非 frontmatter 缺失
- 如果同一个 slug 在项目级和用户级都已存在，优先覆盖用户明确指定的 scope，并提示用户
- 迁移后建议让用户验证触发词是否生效

## 示例

用户：
> `~/.openclaw/workspace/skills/lianche-coupon-config`，安装到项目级目录中。

Agent：
1. `Read` 读取 `~/.openclaw/workspace/skills/lianche-coupon-config/SKILL.md`
2. `Bash`：`mkdir -p "<workingDir>/.dazi/skills/lianche-coupon-config"`
3. `Write` 写入 `<workingDir>/.dazi/skills/lianche-coupon-config/SKILL.md`
4. `ExecuteExtraTool` 调用 `mcp__workdazi-skills__list_skills` 验证
