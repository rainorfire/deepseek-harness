# 小红书 MCP 使用备忘

## 登录

- 先调 `mcp__xiaohongshu__check_login_status`
- 未登录时调用 `mcp__xiaohongshu__get_login_qrcode`，用小红书 App 扫码
- 扫码后再次 `check_login_status` 确认

## 搜索笔记

工具：`mcp__xiaohongshu__search_feeds`

参数：
```json
{
  "keyword": "AI最新进展"
}
```

注意：只传 `keyword`，不要传 `page` / `page_size` 等额外字段，否则会报 `invalid params`。

## 获取笔记详情

工具：`mcp__xiaohongshu__get_feed_detail`

参数：
```json
{
  "feed_id": "6a50c53c0000000011007df3",
  "xsec_token": "ABxX3u645yedRqjW3-EeUo7XotiabHS3ePSowZbOed2cI="
}
```

注意：
- 必须同时传 `feed_id` 和 `xsec_token`
- 不能传 `note_id` / `id` / `noteId` / `xsecToken`（会报 `unexpected additional properties`）
- `xsec_token` 可从 `search_feeds` / `list_feeds` 的结果里拿到

## 常见错误

| 错误 | 原因 |
|------|------|
| `invalid params: unexpected additional properties` | 传了工具不认识的参数名 |
| `required: missing properties: ["xsec_token"]` | `get_feed_detail` 缺少 `xsec_token` |
| `The operation timed out` | 服务响应慢，可重试或检查 MCP 进程 |
| `未登录` | 登录态过期，需要重新扫码 |

## 建议流程

1. 检查登录态
2. 搜索/列表获取笔记 ID + xsec_token
3. 用正确的参数调详情接口
4. 如需深度内容但接口返回有限，可结合网页 SSR 的 `window.__INITIAL_STATE__` 做补充
