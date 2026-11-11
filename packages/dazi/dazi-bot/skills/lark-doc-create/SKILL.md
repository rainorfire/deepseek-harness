---
name: lark-doc-create
description: 用户说「把方案写到飞书文档」「创建飞书文档」「docx 文档」「插入架构图到飞书」时触发。
---





- 用户要求把方案/报告/报价写进飞书文档，且要求「可读性好」「富文本」「原生文档」
- 需要读取 WPS/金山在线文档（web.wps.cn）后整理需求
- 需要在飞书文档中插入架构图/流程图（drawio）

## （血泪教训）

❌ **不要用 `lark-cli markdown +create`** —— 它创建的是 .md 文件（URL 含 `/file/`），不是飞书原生文档。2026-08-03 用户明确纠正：「不要用md格式文档，将文档内容复制到飞书文档中就好，保持飞书文档良好的可读性」。

✅ **用 `lark-cli docs +create --doc-format xml`** —— 创建原生 Docx 富文本文档（URL 含 `/docx/`），支持标题/表格/高亮框(callout)/代码块/彩色文字。

## 标准流程

### 0. 前置检查

```bash
lark-cli whoami                      # 确认 identity 状态（user/bot，token 是否 needs_refresh）
lark-cli skills read lark-doc        # 必须先读内置 skill，不能只凭 --help 猜
lark-cli skills read lark-doc references/lark-doc-xml.md   # XML 格式参考（HTML 子集+扩展标签）
```

### 1. 构造文档 XML

用飞书 XML 格式（HTML 子集）写内容到本地 `.xml` 文件，支持：

- 标准标签：`p, h1-h9, table, thead, tbody, tr, th, td, ul, ol, li, pre, code, hr, a, span, b, em`
- 扩展标签：`<title>`（文档标题）、`<callout emoji="📌" background-color="light-yellow" border-color="yellow">`（高亮框）、`<checkbox>`、`<table><colgroup><col width="120"/></colgroup>`
- callout 内支持标题/列表/引用/待办，正文结构参考模板文件 `references/docx-xml-template.md`

### 2. 创建文档（原生 Docx）

```bash
cd "/Users/chenyujia/Documents/我的文件/dazi"   # --content 用相对路径
lark-cli docs +create --title "文档标题" --content @方案.xml --doc-format xml
```

成功返回 `document_id` 和 `/docx/` URL。

### 3. 权限授权（缺 scope 时）

报 `missing_scope`（如 `drive:file:upload` / `drive:drive.metadata:readonly`）时：

```bash
lark-cli auth login --scope "drive:file:upload drive:drive.metadata:readonly" --no-wait --json
```

拿到 verification_url 后，**调用 HumanGate 等用户完成授权**，不要在本轮直接轮询：

```
mcp__workdazi-human-gate__wait_for_user_action (scannable_url=verification_url, title="飞书授权", expires_in=600)
```

用户点「已完成」后再继续创建文档。

### 4. 插入 drawio 架构图

```bash
# 画图：参考 drawio-arch 技能
# 导出 PNG：
drawio -x -f png --no-sandbox -o 系统架构图.png 系统架构图.drawio

# 插入飞书文档（按文本定位插入位置）：
lark-cli docs +media-insert --doc <document_id> --file 系统架构图.png --type image --width 780 --align center --caption "系统架构图" --selection-with-ellipsis "2.1 整体架构"
```

`--selection-with-ellipsis "关键词"` 会把图插到文档中该文本后面（如章节标题），默认追加到末尾。

### 5. 验证

```bash
lark-cli docs +fetch --doc <document_id> --format pretty   # 确认标题/结构/图片已就位
```

## 读取外部 WPS / 网页文档（WebFetch 兜底）

WebFetch 的 moonshot 模型在本机不可用（报 `There's an issue with the selected model (moonshot-v1-8k)`）。改用 chrome-devtools MCP：

```
mcp__chrome-devtools__new_page(url=文档URL)
# evaluate_script 必须传 function 字段（不是 script 字段），否则报 invalid_type：
mcp__chrome-devtools__evaluate_script(function="function() { return document.body.innerText; }")
# 长文档用滚动分页的 async function 收集全文
```

## 已知坑

1. `markdown +create` 的 `--name` 必须以 `.md` 结尾；`--file` 必须是当前目录相对路径（`./文件名.md`），绝对路径报 `unsafe file path`
2. `docs +media-insert` 插入失败会自动回滚（4-step orchestration + auto-rollback），失败先看报错定位 block
3. 授权链接一次性有效，用户完成授权前不要重复发起 `auth login`
4. lark-cli 有版本更新提示（1.0.81），不影响功能时不必升级
