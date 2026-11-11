---
name: external-doc-reading
description: 读取外部平台 API 文档（易宝开放平台 open.yeepay.com、GitLab、飞书、微信支付等 JS 动态渲染站点）。当用户给外部文档链接说「读一下这个文档/查接口文档/提取接口细节」时触发。核心优先级：① WebFetch 试静态；② 走 apiId→openapi.json 纯 curl 拿完整定义（零浏览器，见 references/openapi-json-fallback.md）；③ 都失败才用 chrome-devtools 渲染。
---

# 外部平台 API 文档读取

用户常给外部开放平台链接要求读文档（易宝开放平台、GitLab 页面、飞书文档、微信支付文档等）。**这些站点多为 JS 动态渲染（SPA），WebFetch 只能拿到监控脚本壳子。** 但先别急着开浏览器——多数 SPA 文档站会把规范挂在 `*.json` 接口上，纯 curl 就能拿到全量定义（见第 2 步）。

## 标准流程

### 1. 先试 WebFetch（快、但常失败）

- 对普通静态文档**可能直接成功**，先试一次无成本。
- 失败征兆：返回内容只有 Aliyun RUM/监听脚本、`This website requires JavaScript to function properly`、或空壳结构 → 判定为 JS 渲染页，转入第 2 步。

### 2. **优先**试 apiId → openapi.json（零浏览器，最快）

若目标站渲染时请求过 `*.json`（树 / 分类 / 接口规范），**先别开浏览器**，试这条：

```bash
curl -s "https://open.yeepay.com/apis/docs/products/fwssfk/apiCategories.json" -o /tmp/cat.json   # 拿 apiId
curl -s "https://open.yeepay.com/apis/docs/apis/{apiId}/openapi.json" -o /tmp/api.json           # 拿完整规范
```

实测易宝开放平台直接 200（不需要 Referer），返回的 OpenAPI 与浏览器抓到的**逐字段等价**，且含错误码原文与示例代码。
详见 `references/openapi-json-fallback.md`（含 apiId 对照表与 403 失败路径清单）。

### 3. 兜底：chrome-devtools MCP 读渲染后内容

```
search: mcp__chrome-devtools__list_pages / navigate_page / take_snapshot / select_page
```

- 已有浏览器实例（内核重启前 MCP 进程还在）：先 `list_pages` 选中现有页，**不要盲目 new_page**。
- 新打开：`navigate_page {url}` → 等渲染 → `take_snapshot`（返回可访问性树快照，含正文/锚点/参数表）。
- 快照太大时用 `evaluate_script` 提取正文片段（作用于**当前选中页**，不需要 page_id）。
- 遇到登录墙：`take_screenshot` 确认登录状态，必要时走 HumanGate 让用户登录。

### 4. 结构化输出（用户偏好查表）

所有接口文档都整理成表格交代，别平铺文字：

| 维度 | 输出要求 |
|------|----------|
| 基本信息 | 接口名/请求方式/路径/认证/更新时间 |
| 请求体 | 参数·类型·必填·说明（⚠️标二选一必填） |
| 响应体 | 字段·类型·必填 |
| 错误码 | 父码+子码表（0000成功 / 4xxx业务错 / 9999系统错）|处理建议 |
| 回调/通知 | 关键字段列表（含状态枚举值） |
| 坑点 | 使用说明里点名的注意事项单独列出 |

### 5. 收尾

- 顺手核对本地是否已有相关文档（Glob 工作目录），与代码实现视角衔接说明。
- 用户需要存档时，用 Write 落成独立 .md 到工作目录；不需要就不建文件。

## 坑与要点

- **异步接口 ≠ 一次返回即完成**：文档明确要求再查结果接口的，输出里必须保留这条（如易宝红冲：调完必须查【数电票开具结果查询】；`invoiceErrMsg=查询红票数电发票号码失败` 时需再查一次）。
- **浏览器会话易丢**：页面被重置/相对路径失效时，重新 `navigate_page` 回完整 URL。
- **能复用上次渲染的浏览器就不重开**，MCP 浏览器进程跨内核重启仍在。

## 已有文档索引

详见 `references/`。目前含：

- `openapi-json-fallback.md` — **apiId → openapi.json 零浏览器拿全量接口定义**（2026-09-24 验证，含数电发票 22 个 apiId 对照表）
- `js-rendered-doc-json-endpoints.md` — 从网络请求找菜单/接口树 JSON，一次拉全量清单（2026-08-26）
- `yeepay-js-rendered-doc-extraction.md` — chrome-devtools 渲染取正文的实战与工具坑（2026-08-21）
- `yeepay-invoice-docs.md` — 易宝发票文档清单 + 快捷红冲接口要点（2026-08-21 核对）
