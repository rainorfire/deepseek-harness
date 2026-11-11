# 易宝开放平台（JS 渲染 SPA）文档抓取实战记录

来源：2026-08-21 抓取《数电票红字发票开具（快捷红冲）》，落地 `易宝数电票红字发票开具接口文档.md`。

## 为什么 WebFetch 不够

open.yeepay.com 是 JS 动态渲染 SPA。WebFetch 只能拿到 Aliyun RUM 监控脚本壳子 + "This website requires JavaScript" 提示，拿不到任何接口参数。

## 可靠流程（chrome-devtools MCP）

1. `navigate_page` {url} 打开文档页。
2. 若 evaluate_script 提取正文返回空串或只有几百字符，直接用 `take_snapshot` 读渲染后 DOM——易宝文档正文通常不在 `main/body` 直接文本节点里，`document.querySelector('main').innerText` 会返回空串。可先用 `document.querySelectorAll('div, section, article, main')` 遍历找 innerText 最长的元素复核页面是否加载完，但最终可靠手段是 take_snapshot。
3. 页面若中途变空白页（标签被关/href 变成 about:blank），用 `list_pages` 确认后再重新 `navigate_page`。

## 已知工具坑

- `list_pages` 不接受任何参数：传 `{"params":{}}` 会报 "Unknown argument for tool"；传空对象 `{}` 即可。
- `navigate_page` 返回 null 不一定失败——用 `list_pages` 复核当前 selected 页是否是指定 URL。
- 快照较长时 take_snapshot 返回可能被截断，可分段或用 evaluate_script 定位具体容器提取。

## 用户明确偏好：原样转录，不要篡改

用户要求「将文档中的内容**原样**生成一份 md 文档，不要篡改」。

- 忠实保留页面原文的怪癖：如示例报文中 `callBackUrl` 值为 `"https: //xxx.com/index.htm"`（含空格）也要原样保留，不要"顺手修正"。
- 页面展开后为空的区块（如请求头/响应头被折叠且无参数），只保留标题并注明「文档未展示具体参数」，绝不擅自编造字段。
- 不要自作主张改写标题/合并章节/重新组织结构——除非用户另行要求。
