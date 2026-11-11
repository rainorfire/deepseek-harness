# JS 渲染文档站：从网络请求找 JSON 数据接口，一次拉全量清单

来源：2026-08-26 易宝开放平台 27 个发票接口地址抓取实战。open.yeepay.com 是 AntD SPA，WebFetch 只拿空壳，chrome-devtools 逐页点慢且侧边菜单不是 `<a>` 链接。

## 核心套路（比逐页点击快一个数量级）

1. 用 `navigate_page` 打开任意一个目标文档页后，调 `list_network_requests` 找文档站的**菜单/接口树 JSON 数据接口**，常见命名：
   - `tree.json`（产品接口树）
   - `apiCategories.json`（接口分类，含每个接口的 path / title / method / uri）
   - `pages.json`（页面列表）
2. 直接用 `curl` 拉下来（记得带 `Referer` 头避免 403），本地过滤出目标品类：
   ```bash
   curl -s "https://open.yeepay.com/apis/docs/products/fwssfk/apiCategories.json" -H "Referer: https://open.yeepay.com/" -o /tmp/yeepay_api_categories.json
   python3 -c "import json; data=json.load(open('/tmp/yeepay_api_categories.json')); [print(cat['code'], cat['name'], len(cat.get('items',[]))) for cat in data]"
   ```
3. 文档 URL 规律：`https://open.yeepay.com/docs/products/{产品}/{uri}`，`uri` 由 method + path 转换（`/` → `__`，如 `post__rest__v1.0__invoice__digit__issue-invoice`）。
4. **交付前抽样验证**：`curl -s -o /dev/null -w "%{http_code}"` 抽查 2-3 个 URL 全部 200 再给清单，并向用户说明数据源是文档站的接口分类数据接口、非手工拼写。

## chrome-devtools MCP 参数坑（易踩）

- `navigate_page` **必须带 pageId**；浏览器重启后 page ID 会变 → 先 `list_pages` 拿最新 ID 再导航。
- `evaluate_script` 参数名是 **`function`**，且要传 `() => {...}` 箭头函数形式（传裸字符串报 `fn is not a function`）。
- `take_screenshot` 参数是 **`format`**（jpeg/png），不是 `type`。
- AntD 菜单是 `li`+click 渲染，不是 `<a>` 链接 → `querySelectorAll('a[href]')` 返回空数组是正常现象，别在截图/点菜单上耗时间，直接走上面的 JSON 数据接口。

## 什么时候用这套

- 要「接口地址清单 / 全量接口列表」而非单个接口详细参数时（清单需求优先，单接口参数再逐页抓）。
- 文档站是 SPA/JS 渲染、WebFetch 拿空壳时。
- 有按分类组织的开放平台文档站（易宝 open.yeepay.com、各类 open platform）时。
