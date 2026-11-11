---
name: weather-forecast
description: 查询中国任意城市未来15天天气预报（含逐日天气现象/气温/风力/湿度/降水），数据源为中国天气网 d1.weather.com.cn calendar API。用户说「XX天气怎么样」「查下XX一周天气」「XX 8月天气」时触发。交付建议用图文 HTML 报告。
---

# 天气预报查询（中国天气网 calendar API）

## 何时使用

✅ 用户要查国内城市天气预报：
- 「临沂下周天气怎么样」「日照 8月5-9日天气」
- 「XX 未来一周有没有雨」

## 关键前提

- **WebSearch 结果可能过时**：搜索引擎只能拿到聚合页链接，具体逐日预报要抓数据接口。
- **WebFetch 在本环境常失败**（报 `moonshot-v1-8k model` 错误，与页面无关），**不要依赖 WebFetch 抓天气**。
- **正路：curl 直连数据接口**，稳定可靠。

## 接口与参数

```bash
# 城市编码：https://www.weather.com.cn/weather/{cityid}.shtml 里的 {cityid}
# 例：临沂 101120901，日照 101121501，长沙 101250101
curl -s -m 20 -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" \
  -H "Referer: https://m.weather.com.cn/" \
  "https://d1.weather.com.cn/calendar_new/2026/{cityid}_202608.html"
```

- 返回形如 `var fc40 = [ {...}, ... ]`，是 JS 变量包裹的 JSON 数组（含历史均值+预报条目）。
- **必须带 UA 和 Referer**，否则可能被拒。

## 解析（Python）

```python
import json
def parse(f):
    txt = open(f).read()
    # 截取第一个 [ 到最后一个 ] 之间的合法 JSON
    return json.loads(txt[txt.index('['):txt.rindex(']')+1])

for d in parse('ly.json'):
    if d['date'].startswith('20260803'):
        print(d['date'], '周'+d.get('wk',''), '|', d.get('w1'), '|', d.get('wd1'), d.get('ws1'),
              '| 最高', d.get('max'), '最低', d.get('min'), '| 湿度', d.get('hgl'))
```

字段含义（常见坑）：
- `date` = YYYYMMDD；`wk` = 星期（周几）
- `w1` = 白天天气现象（多云/晴/小雨…）
- `wd1`/`ws1` = 风向/风力（如 东北风3-4级）；`wd2`/`ws2` = 夜间
- `max`/`min` = 最高/最低气温（`hmax`/`hmin` 是历史均值，别拿错）
- `hgl` = 湿度；`rain24` 或降水字段 = 24h降水量（mm）
- 无温度时检查是否取错字段：预报条目温度在 `max`/`min`，历史条目才在 `hmax`/`hmin`

## 常见坑

1. **正则匹配不上**：`var fc40 = [` 不是标准 JSON 开头，直接 `txt.index('[')` 截取，不要用正则 `fc40 = (...)`。
2. **温度为空**：取 `max`/`min` 而非 `hmax`/`hmin`。
3. **WebFetch 报 model 错误**：换 curl，不要重试 WebFetch。

## 交付

用户偏好图文 HTML 报告：制作含天气图标（emoji ☀️🌧️☔）、逐日明细表、行程提醒（带伞/防晒/降温）的 HTML 文件，通过飞书 bot 发送（`lark-cli im +messages-send --chat-id <id> --file ./xx.html --as bot`）。

## 参考

- 本技能技巧沉淀自 2026-08-02 会话「临沂日照下周天气预报」，会话内已验证临沂/日照双城解析成功。
