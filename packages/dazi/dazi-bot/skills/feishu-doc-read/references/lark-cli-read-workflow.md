# lark-cli 读取飞书文档 — 正确通道（踩坑验证版）

> 来源：2026-08-18 会话《鹅宝AI方向文档》，此前历史会话（07-22/08-12 等 7+ 次）反复在 wiki/node-get 上踩坑。
> 用户偏好：**用户明确说「用lark-cli来读」时，优先 lark-cli 通道**，不要先走 Chrome DevTools。

## 判断规则：URL 决定命令

| URL 形态 | 走哪个命令 | 说明 |
|---|---|---|
| `.../wiki/<token>` | `wiki +node-get --node-token <URL>` 拿节点 → 再 docs +fetch | 先解析 wiki 节点 |
| `.../docx/<token>`（独立文档，不在 wiki 空间） | **直接 `docs +fetch --doc <URL>`** | 不要碰 wiki 命令！ |

## 已踩的坑（别再踩）

1. **`wiki +node-get --url` ❌** — 不存在 `--url` 参数，报 `unknown flag`。正确参数是 `--node-token`（可接完整 URL）。
2. **独立 docx 用 `wiki +node-get` ❌** — 报错 `code 131005 / not found: document is not in wiki`。
   **这不是权限问题，是文档根本不在 wiki 空间**。看到这个错，直接切 `docs +fetch --doc`。
3. **跳过内置技能直接跑 docs 命令 ❌** — CLI 会提示必须先读：
   ```bash
   lark-cli skills read lark-doc        # 必须读！含 fetch 参数、认证说明
   lark-cli skills read lark-doc references/lark-doc-fetch.md   # 详细 fetch 指南
   lark-cli skills read lark-shared     # 认证/权限说明
   ```
4. 跨租户文档（如 ywwlaii6ga7.feishu.cn）：直接传完整 URL 给 `--doc` 即可，无需额外处理。

## 正确命令（独立 docx）

```bash
lark-cli docs +fetch --doc "https://xxx.feishu.cn/docx/TOKEN?open_in_browser=true" --doc-format markdown
```

- `--doc` 接受完整 URL 或纯 token
- `--doc-format markdown` 直接拿可读正文；`--detail with-ids` 用于后续 block 级更新
- 文档不在 wiki 空间时 `docs +fetch` 是唯一正解，一次成功

## 快速排查顺序（遇到报错时）

1. `lark-cli wiki +node-get --help` / `lark-cli docs --help` 看参数（`--node-token` vs `--doc`）
2. `--node-token` 报 131005 → 文档不在 wiki → 用 `docs +fetch --doc`
3. `docs` 命令报需要先读技能 → `lark-cli skills read lark-doc` 后再执行
4. 认证问题（token 过期）→ `lark-cli skills read lark-shared` 看认证流程，用户扫码授权
