# Markdown → 飞书原生 Docx（沙箱全流程实测 2026-08-29）

应用场景：把本地 .md / 报告全文誊到飞书原生文档（富文本可编辑），保留标题层级、表格、高亮框、列表。

## 前置检查（lark-cli 沙箱三连坑）
1. `lark-cli whoami` 报 `keychain not initialized` → `lark-cli config keychain-downgrade`（把 master key 复制到本地文件绕过 OS Keychain）后重试
2. whoami 显示 `tokenStatus: needs_refresh` 是正常的：**没有 `auth refresh` 子命令**（报 unknown subcommand），user 身份会在下一次 user API 调用时自动刷新，直接继续调用即可
3. 首次 API 调用可能报 DNS `dial tcp: lookup open.feishu.cn: no such host` → 沙箱网络暂未放行，**原样重试一次即成功**，别误判为配置问题

## 操作步骤
1. 读取源 .md 全文（大文件分段读）
2. 将 Markdown 转 XML（HTML 子集）：`<title>` + `<callout>`（高亮框，用于摘要/金句，可带 emoji/background-color）+ `<h1-h3>` + `<table>/<thead>/<tbody>/<tr>/<th>/<td>` + `<ul>/<li>` + `<b>`
3. 写 XML 到临时文件（内容含大量反引号/标签，heredoc 必须用引号定界符 `<< 'EOF'` 防 shell 吞字符）
4. `lark-cli docs +create --title "标题" --content @文件.xml --doc-format xml`（⚠️ 禁用 `--doc-format markdown` 或 `lark-cli markdown +create`——那生成的是 .md 文件，URL 含 /file/，不是原生文档）
5. **回读验证**：`lark-cli docs +fetch --doc <document_id> --format pretty`，逐项核对标题层级/表格/callout 是否完整渲染
6. **清理临时 XML 文件**

## 注意点
- 保留原文层级：H1→H2→H3 一一对应，表格原样呈现
- callout 子块仅支持文本、标题、列表、待办、引用（不要把表格放进 callout）
- 文档标题用 `<title>` 标签（每篇唯一），create 时 `--title` 一起传
