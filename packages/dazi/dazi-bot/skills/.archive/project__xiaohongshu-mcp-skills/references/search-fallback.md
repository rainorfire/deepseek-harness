# 搜索降级策略

`mcp__xiaohongshu__search_feeds` 超时或返回 null 后的降级方案。

## 流程

1. 首次 search_feeds 失败后，仅重试一次
2. 重试仍失败，改用 WebSearch 搜索 site:xiaohongshu.com + 关键词
3. 从 WebSearch 结果中获取笔记 URL，用 WebFetch 或 get_feed_detail 抓取内容
4. 禁止反复重试 search_feeds（防工具循环死锁）