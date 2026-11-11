# 小红书 search_feeds 调用经验

## 已验证
- `mcp__xiaohongshu__search_feeds` 目前**只接受一个必填参数 `keyword`**。
- 不要传 `page` / `page_size` / `limit` / `num` 等额外参数，会报 `invalid params: unexpected additional properties`。
- 该接口响应较慢，可能超时；超时后可重试一次。

## 建议流程
1. 用户提出小红书搜索类需求时，优先调用 `Skill({"skill": "xiaohongshu-mcp-skills"})` 加载完整指令。
2. 使用 `ExecuteExtraTool({"tool_name": "mcp__xiaohongshu__search_feeds", "params": {"keyword": "关键词"}})`。
3. 失败时仅重试一次，仍失败则向用户说明小红书服务端响应慢，建议稍后重试或换关键词。
