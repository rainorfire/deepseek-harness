# lark-cli 递归抓取飞书 wiki 子孙页面 → Markdown（2026-08-25 家政能力地图实战验证）

## 适用场景
用户给飞书 wiki 链接并要求「连同子孙页面一起扒下来 / 把接口文档内容全部保存为 md」时，走本配方。

## 0. 通道选择（重要）
- **首选 lark-cli**（`/opt/homebrew/bin/lark-cli`，v1.0.64）——飞书文档是 JS 渲染，WebFetch 读不到正文，lark-cli 直接拿服务端 markdown。
- **陷阱**：命令名是 `lark-cli` 不是 `lark`，且不在 PATH。每次先 `command -v lark-cli`，不要反复 `which lark` 白找。
- chrome-devtools MCP（`external-doc-reading` 的路线）只作降级：lark-cli 可用时优先它，因为能拿完整原文而非浏览器快照。

## 1. 解析根节点
```bash
lark-cli wiki +node-get --node-token "<完整飞书URL>"
```
- **参数名是 `--node-token` 不是 `--url`**（用 `--url` 报 unknown flag），且它直接接受完整 URL 无需提取 token。
- 返回 `data.node_token`（IEPc...）、`data.obj_token`（文档 token）、`data.has_child`（是否还有子节点）。

## 2. 递归列出子孙节点
```bash
lark-cli wiki +node-list --space-id <space_id> --parent-node-token <node_token> --page-all
```
- `data.nodes[]` 每项含 `node_token / obj_token / obj_type(docx) / has_child / parent_node_token`。
- `has_child=true` 需对子节点继续 `+node-list` 递归；全部 `has_child=false` 即可停止。
- 跨租户 wiki（如 ywwlaii6ga7）也走同一命令，认证是 user 身份。

## 3. 拉正文前必须读官方指南
```bash
lark-cli skills read lark-doc references/lark-doc-fetch.md
```
CLI 对 docs 命令强制要求先读内置技能，不要只靠 `--help` 猜参数。

## 4. 逐个拉取文档正文
```bash
lark-cli docs +fetch --doc <obj_token> --doc-format markdown --format json \
  | jq -r '.data.document.content' > 输出.md
```
- 输出的 content 是**飞书 XML 结构**（`<title>/<callout>/<cite>/<grid>/<b>` 等），不是纯 markdown，需要第 5 步转换。
- 大文档（>60KB）会被持久化到 tool-results 文件，脚本内用 subprocess 捕获再写文件更稳。

## 5. 飞书 XML → Markdown 转换（核心正则，缺一不可）
```python
import re
s = open(f, encoding="utf-8").read()
# 标题
s = re.sub(r'<title>(.*?)</title>', r'# \1', s)
# callout 提示框 → 引用块（保留 emoji）
s = re.sub(r'<callout[^>]*>\s*\n?', '> ', s).replace('</callout>', '')
# 引用其他 wiki 页的链接卡片 → 可点击链接
s = re.sub(r'<cite doc-id="([^"]+)"[^>]*title="([^"]*)"[^>]*></cite>', r'[\2](https://ywwlaii6ga7.feishu.cn/wiki/\1)', s)
# 用户 @提及 → @姓名
s = re.sub(r'<cite[^>]*user-name="([^"]*)"[^>]*></cite>', r'@\1', s)
# 残留空 cite
s = re.sub(r'<cite[^>]*></cite>', '', s)
# blockquote + p
s = s.replace('<blockquote>', '> ').replace('</blockquote>', '').replace('<p>', '').replace('</p>', '')
# 加粗
s = re.sub(r'<b>(.*?)</b>', r'**\1**', s, flags=re.S)
# 分栏容器：剥标签保留内容（<grid> 常在文档中部，遗漏会被验证代理抓出来）
s = s.replace('<grid>', '').replace('</grid>', '')
```

## 6. 铁律：代码示例里的 XML/HTML 必须原样保留
文档中接口示例里的 `<required>`、`<dependency>`、`<p>` 等是**源文档正文**（参数占位符/Maven 依赖），不是飞书标签——**不要**用第 5 步的正则去清，否则破坏原文。
验证残留时用「排除含 http 的行 + 只看非代码块」再判断。

## 7. 验证与交付
- grep 残留尖括号标签（排除代码/HTML 示例行），确认清零。
- 独立 verification 代理复核：文件存在性、完整性无截断、接口地址/请求参数/响应字段等关键要素齐全。
- 交付：输出目录 + 可复用抓取脚本 `fetch_all.py`（DOCS 数组列 obj_token，以后源文档更新一键重抓）。
- 归档类任务遵守用户「原样转录、不要篡改」偏好：源文档里是逐行代码形态的接口清单，md 里保持行内代码形态，不强行改表格。
