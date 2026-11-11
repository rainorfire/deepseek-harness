---
name: skill-creator-lite
description: 用户希望"创建一个技能 / 教 dazi 做某事 / 把这套流程沉淀下来"时使用。给出最小可用的 SKILL.md 模板与三步创建流程。
---

# 创建一个新技能（轻量版）

work-dazi / dazi 的技能本质就是一个文件夹 + 一份 `SKILL.md`。**三步即成**：

## Step 1：确定层级

| 你想 | 装到 |
|---|---|
| 自己以后任何项目都用 | `~/.dazi/skills/<slug>/SKILL.md`（scope: user） |
| 只在当前这个项目用（可 git 提交） | `<workingDir>/.dazi/skills/<slug>/SKILL.md`（scope: project） |

询问用户希望"用户级"还是"项目级"，默认建议**用户级**（除非该技能明显项目专属）。

## Step 2：写 SKILL.md

文件必须以 YAML frontmatter 开头，**`name` + `description` 必填**。description 决定 dazi 何时自动加载该技能，要尽量具体、写清楚触发条件。

```markdown
---
name: <slug>                           # 必须与目录名一致，kebab-case
description: <一句话或多句话>           # 必填。写"何时使用"，dazi 据此选择激活
---

# <技能标题>

## 何时使用
用户问 X / 出现 Y 错误 / 需要做 Z 流程 时触发。

## 怎么做
1. 一步一步的明确指令
2. 引用具体工具：用 Read 读 a.ts，用 Edit 改 b.ts，用 Bash 跑 npm test 等
3. 给出反例与 anti-pattern，避免 LLM 误用

## 验证标准
做完后应该满足：…
```

写描述时常见错误：

- ❌ "通用助手技能" —— 太宽，dazi 永远不知道何时该加载
- ✅ "用户上传 .csv 文件并希望分析时；或问及 pandas / sheet 操作时使用"

## Step 3：安装（必须用 MCP）

**禁止**用 `Write` / `Bash` 直接创建 `SKILL.md`（work-dazi 壳层会拦截错误路径）。

调用 MCP 工具 **`mcp__workdazi-skills__install_skill`**：

- `scope`: `"user"` 或 `"project"`
- `slug`: kebab-case 目录名
- `content`: 完整 SKILL.md 文本（含 frontmatter）

安装完成后调用 **`mcp__workdazi-skills__list_skills`** 自检，并告知用户：「已安装到 dazi skills 目录，**新会话**生效」。

## Anti-pattern（重要！）

- ❌ **不要**用 `Write` / `Edit` / `Bash mkdir` 写 SKILL.md —— 会被壳层拒绝或易写错路径
- ❌ **不要**反复调用 `SearchExtraTools` 找"创建技能的元工具"
- ❌ **不要**装到 `~/.claude/skills/`、`~/.cursor/skills/`、`~/.openclaw/workspace/skills/`

## Minimal SKILL.md 示例

```markdown
---
name: review-pr
description: 用户要求 review 当前 git diff / 检查 PR 时使用。覆盖代码风格、安全、性能三个维度的快速过滤。
---

# Review PR

1. `git diff --stat` 看哪些文件改了
2. 逐文件 `git diff <file>` 仔细看
3. 按下列 checklist 检查：
   - 风格：是否符合项目 lint 规则
   - 安全：是否有用户输入未校验、是否泄露密钥
   - 性能：是否引入 N+1 / 大 loop 同步 I/O
4. 输出 markdown report 给用户
```

—— 12 行就是一个完整可用的技能。
