# 独立 docx（非 wiki 空间）读取：lark-cli docs +fetch

**场景**：用户给飞书 docx/wiki 链接要求读正文。

## 快速路径

```bash
# 1) 必须：先读 lark-cli 内置技能（CLI 强制要求，直接 --help 推断会踩坑）
lark-cli skills read lark-doc

# 2) 独立 docx（不在 wiki 空间）：直接 docs +fetch，--doc 接受完整 URL
lark-cli docs +fetch --doc "<feishu_url>" --doc-format markdown
```

## 关键坑：wiki +node-get 只认 wiki 空间文档

- 对**独立 docx**（如 `ywwlaii6ga7.feishu.cn/docx/...`，非 `wiki/...` 路径），
  `lark-cli wiki +node-get --node-token "<url>"` 返回错误：
  `code 131005 / "not found: document is not in wiki"`。
  不要绕路重试，直接切 `lark-cli docs +fetch --doc <url>`。
- 参数区别：`docs +fetch` 用 `--doc`（接受 URL 或 token）；`wiki +node-get` 用 `--node-token`（也接受 URL）。两者不是一回事。
- 文档确实在 wiki 空间时 `wiki +node-get` 可用（查 node_token → obj_token 再拉正文）；独立 docx 必须走 docs。

## 用户偏好（2026-08-18 佳哥明确指示）

- **lark-cli 可用时优先 lark-cli 读取**，不要默认用 chrome-devtools 浏览器抓取（虚拟滚动分段采集慢、父子块重复、正文易缺尾）。
- chrome-devtools 仅作 lark-cli 不可用时的兜底通道。
