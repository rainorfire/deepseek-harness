---
name: intl-news-briefing
description: 用户要求"列举/汇总全球热门时政/国际新闻 N 条"时触发。覆盖地缘冲突、经贸、AI政治、气候、选举等板块的多源并行搜索+结构化表格简报工作流。
---

# 国际时政简报（intl-news-briefing）

## 触发条件

- 「列举/汇总/盘点全球最热时政/国际新闻 N 条」
- 「最近国际热点有哪些」
- 「本周/本月世界大事」

## 核心工作流

### 1. 并行多源搜索（一次出齐）

**不要**串行搜索——一次发出 4-6 个并行 `WebSearch`，覆盖：

| 维度 | 中文 query | 英文 query |
|------|-----------|-----------|
| 地缘冲突 | 2026年7月 美伊/中东/俄乌 最新 | US Iran Russia Ukraine July 2026 |
| AI/科技政治 | OpenAI GPT-5 政府批准 | OpenAI government approval |
| 经贸/关税 | 关税战 美国 12.5% 60国 | US tariff 12.5% 60 countries |
| 气候/灾害 | 厄尔尼诺 欧洲热浪 | El Nino European heatwave |
| 政治/选举 | 勒庞 法国2027 英国工党 | Le Pen 2027 UK Labour |

英文 query 抓 BBC/Reuters/FT 视角，中文 query 抓新华/澎湃/BBC中文视角，**两者互补**——同一事件会有不同的"暗线"。

### 2. WebFetch 谨慎使用

- 主流新闻聚合站（globalissues.org、multipluralworld.com）**常超时/无响应**
- 优先用 WebSearch 的 `livecrawl: "preferred"` + `search_type: "deep"`，**跳过 WebFetch**
- 只在 WebSearch 结果不够具体时，对单个 URL 用 WebFetch

### 3. 输出格式（用户偏好结构化/表格化）

```
# 全球十大热门时政新闻（{年月}）

按热度排序，涵盖{板块1}、{板块2}、{板块3}、{板块4}四大板块：

| 序号 | 主题 | 核心动态 |
|------|------|---------|
| 1 | **{标题}** | {2-3句} |

## 几个值得关注的"暗线"
- {3-4条横切观察，每条 1-2 句}

需要我针对其中任何一条深挖(背景、各方表态、影响)吗?

**Sources:**
- [{标题}]({url})
```

### 4. 结尾必做

- 必须给**完整 Sources 列表**（markdown 超链接）
- 必须**主动提供深挖入口**（用户偏好高效率，喜欢"菜单式"继续对话）
- 不需要 emoji 装饰内容（除非用户要求）

## 已知坑（本次会话踩到）

1. **WebSearch 429 限流**：并发超过 3-4 个可能触发。处理：用 `search_type: "fast"` 降级，或串行第二批。
2. **WebFetch 60s 超时**：聚合站经常返回 "No response from model"。**不要重试，直接换源**。
3. **实时新闻有时效性**：在回复开头**隐式标注时间锚点**（如"2026年7月"），避免用户误以为是常驻新闻。
4. **新闻本身不需要落盘**：但**工作流**值得沉淀——这正是本技能的目的。

## 反模式

- ❌ 用一次 WebSearch 出全部 10 条（信息密度低，语言视角单一）
- ❌ 输出长段落而不是表格（用户偏好表格化）
- ❌ 漏掉 Sources 段（用户做决策时会自己验证来源）
- ❌ 不主动提供深挖入口（用户体验断裂）
- ❌ 给 PDF/HTML 输出（新闻简报用 Markdown 表格即可，除非用户明确要）

## 关联 skill

- `douyin-script-compliance`：地缘政治类抖音文案合规审核
- `xiaohongshu-mcp-skills`：小红书调研输出 HTML（用户偏好的另一种输出格式）

## 配套 memory

- 用户