# 小红书产品调研与对比实战指南

> 由 session `去小红书上查一下华为耳机哪一款好` 沉淀而来。补充 `xiaohongshu-mcp-skills` 中未覆盖的产品调研工作流和工具踩坑细节。

## 一、工具踩坑要点

### 1. `mcp__xiaohongshu__search_feeds`
- **只传必填字段 `keyword`**，不要传 `page` / `page_size` / `limit` / `num`。
- 否则会报：`invalid params: unexpected additional properties`。
- 接口可能超时，失败只重试一次。

### 2. `mcp__xiaohongshu__get_feed_detail`
- 必须字段：**`feed_id`** + **`xsec_token`**。
- 取值来源：从 `search_feeds` 返回的 JSON 中：
  - `feed_id` = 每条结果的 `id`
  - `xsec_token` = 每条结果的 `xsecToken`
- ❌ 不要传 `note_id` / `id`，会报 `unexpected additional properties`。
- 部分 feed 会返回 `feed not found in noteDetailMap`，说明笔记被删或不可见，换一条即可。

## 二、标准工作流

当用户说「去小红书查一下 XX 哪款好」「小红书 XX 推荐」「XX 对比」等类似需求时：

1. **加载技能**：`Skill({"skill": "xiaohongshu-mcp-skills"})`
2. **确认登录**：`mcp__xiaohongshu__check_login_status`
3. **多关键词搜索**：用 `search_feeds` 搜 `XX推荐`、`XX测评`、`XX怎么选`、`XX值得买`
4. **深入看正文**：用 `get_feed_detail` 查看高热度/争议性笔记的完整正文
5. **交叉验证**：用 `WebSearch` / `WebFetch` 查官方价格、参数、电商活动价
6. **输出文档**：整理成 Markdown 对比文档，放到工作目录

## 三、输出文档模板

```markdown
# XX 产品小红书调研对比

## 一、价格与版本
| 项目 | 产品 A | 产品 B |
|------|--------|--------|
| 官方价 | ... | ... |
| 活动价 | ... | ... |
| 版本/配色 | ... | ... |

## 二、核心参数对比
| 参数 | 产品 A | 产品 B |
|------|--------|--------|
| ... | ... | ... |

## 三、小红书真实用户反馈
- **优点**：...
- **槽点**：...
- 来源：笔记标题 + 作者

## 四、选购建议
| 你的需求 | 推荐 |
|----------|------|
| ... | ... |

## 五、数据来源
- 小红书：...
- 官网/电商：...
```

## 四、示例会话参考

- 华为耳机调研：`去小红书上查一下华为耳机哪一款好`
  - 先搜「华为耳机推荐」「华为FreeClip 2」「华为FreeBuds Pro 5」
  - 官网补充价格参数
  - 输出：`华为FreeClip2_vs_FreeBudsPro5对比.md`

## 五、注意

- 小红书 MCP 工具需在服务启动后**新开会话**才能加载。
- 服务启动命令见 `xiaohongshu-mcp-skills/SKILL.md` 或全局 DAZI.md Agent Notes。
