---
name: feishu-doc-read
description: 读取飞书 wiki/云文档（含内部接口文档）正文。当用户给飞书链接说「读取/读一下/查接口/提取文档内容」时触发。
---

# 飞书文档读取

用户常给飞书 wiki 链接（内部接口规范/API 文档），要求「读取文档、查接口」。飞书是 JS 渲染+虚拟滚动，普通 WebFetch 读不到正文，必须走以下两条已验证通道之一。

## 通道一：lark-cli（原生、最干净）

1. 确认 lark-cli 已装、认证有效（Token 过期会报错，需重新扫码授权）。
2. `wiki +node-get --url <wiki_url>` 按 URL 查节点，拿到 node token。

4. 注意：跨租户文档（如 `ywwlaii6ga7.feishu.cn`）需先授权 `wiki:node:retrieve` 等权限，配合 human-gate 扫码。

## 通道二：Chrome DevTools（已登录浏览器会话时首选）

Chrome DevTools MCP 作用于**当前选中页**，`evaluate_script`/`take_screenshot` **不传** `page_id`（传了会报 Unknown argument）。用 `new_page` 打开 URL，落到登录页就靠浏览器已有登录态自动进入文档。

### 关键坑：飞书虚拟滚动懒加载

- 文档正文在一个**内部滚动容器**（class 通常含 `bear-web-x-container`）里虚拟滚动，**不是** `document.body` 滚动。
- `document.body.innerText` 只返回目录/标题骨架（可能仅 ~1KB），正文段落（`[data-record-id]` 块）**只有滚动到视口才渲染进 DOM**。
- 直接读 `body.innerText`/`textContent` 会漏掉「排序规则、响应结构、调用示例」等后半章节 → 误判文档不完整。

### 正确做法：分段滚动 + 去重采集

1. 定位容器：`document.querySelector('.bear-web-x-container')`（找不到就遍历找 `scrollHeight > clientHeight` 的 div）。
2. 用 async 脚本**分段滚动容器**（step ≈ 半屏，每次 `await sleep(~120ms)` 触发渲染），把 `[data-record-id]` 块的 `innerText` 按 id 去重累加进 `window.__all`。
3. 滚动到底后，把 `window.__all` 全量导出整理。
4. 用关键词（排序规则/响应结构/注意事项/字段名/示例/错误码）反查确认后半章节已覆盖，避免漏采。

完整可复用脚本见 `references/scroll_collect.js`。

## 交付

整理成结构化 Markdown/表格（接口地址、鉴权、请求参数、响应字段、示例、注意事项）回复用户；若用户要「能查询」，再确认是否有 `X-Cli-Agent-Token`（从配置中心/环境变量取，勿明文贴出）并写标准查询脚本。
