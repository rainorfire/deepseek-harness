# create ebao skill

新建或更新鹅宝技能。新建基于模板；有接口先查文档；有脚本放 `scripts/` 并遵守规范。

## 原则

1. **模板优先**：新建从已同步的 [ebao_skill_template.md](ebao_skill_template.md) 复制并替换全部 `[...]`，禁止另起结构。
2. **参考文件先同步**：每次执行本技能（含新建 / 更新 / 继续迭代）时，必须先拉取最新参考文件到本地，再读本地文件；禁止跳过同步、禁止直接沿用旧本地副本。
3. **接口有出处**：走「接口文档」；禁止臆造 Path / 参数。
4. **脚本合规**：只放 `scripts/`，遵守已同步的 [python_rules.md](python_rules.md)。
5. **最小改动**：更新时只改相关部分。
6. **禁止 Token**：不允许生成任何与 `X-Cli-Agent-Token` 有关的内容。

## 流程

1. **同步参考文件**（每次必做，不可跳过）
   - 执行 `scripts/sync_references.py`（`skill_python_run` 或本地 `python scripts/sync_references.py`，stdin 可空 `{}`）
   - 脚本先读 `https://static.daojia.com/jz/assets/admin-publisher/baas/6a794aa7103bac5b6d641ab8/create-ebao-skill/references.json`，再按清单拉取并覆盖写入本技能 `references/`
   - 以 stdout JSON 的 `ok: true` 为准；失败则停止后续步骤，告知用户并重试；成功前不得使用本地旧版
2. **明确目标**
   - 新建：确认名称（小写 / 数字 / 连字符）、描述（做什么 + 何时用）、目录、是否要接口 / 脚本；已提供的不追问。
   - 更新：先读目标 `SKILL.md` 与已有 `apis/`。
3. **落盘文件**：按上述原则生成或修改 SKILL.md、接口文档、脚本。
4. **校验**：逐项确认「校验清单」。

## 接口文档

1. 从已同步的 [bu_api_map.md](bu_api_map.md) 提取：名称与用途、方法与 Path、关键参数与响应、鉴权与错误码、示例。**若能力地图中查不到对应接口，禁止编造任何接口信息，直接回复用户"无接口相关信息"并告知用户索要文档。**
2. **择 baseUrl**：取 AMP `service.envs` 中 `name = online` 且 `address` 非空的地址；若无可用 online 地址，文档**只保留 path**（不写 Base URL / Host）。禁止测试 / 预发地址。
3. 写入 `apis/<接口名>.md`；清单表加一行；正文写清何时调用与失败处理。

## Python 脚本

1. 读已同步的 [python_rules.md](python_rules.md)，按检查清单确认后落盘 `scripts/<name>.py`。
2. 正文写清何时 `skill_python_run`、stdin 与成功 / 失败分支。

## 校验清单

- [ ] frontmatter 含 `name` / `description`，结构与模板一致
- [ ] 有接口：清单与 `apis/` 一一对应；baseUrl 符合「接口文档」规则（取自 AMP online，无 online 则只保留 path）
- [ ] 有脚本：均在 `scripts/`
- [ ] 全文不含任何 `X-Cli-Agent-Token` 相关内容

## 输出结构

```text
create-ebao-skill/
├── SKILL.md
├── scripts/
│   └── sync_references.py   # 同步参考文档
├── references/
│   ├── common.md
│   ├── bu_api_map.md
│   ├── ebao_skill_template.md
│   └── python_rules.md
```

目标技能产出：

```text
<skill-name>/
├── SKILL.md
├── scripts/          # 仅有脚本时
│   └── <name>.py
└── apis/             # 仅有接口时
    └── <api>.md
```
