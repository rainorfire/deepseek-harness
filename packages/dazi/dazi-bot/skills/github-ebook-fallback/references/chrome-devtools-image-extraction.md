# chrome-devtools 提取网页图片 → 嵌入 HTML 报告（2026-08-02 实战）

> 场景：用户嫌调研报告没图，要求「有图吗」。用 chrome-devtools MCP 打开产品页提取真实产品图，下载后 base64 嵌入 HTML 再发飞书。

## evaluate_script 参数（最容易踩的坑）
- 参数名是 **`function`**，❌不是 `script`（传 `script` 报 `Invalid arguments: expected string, received undefined`）
- `function` 值是一个 **IIFE 箭头函数字符串**，必须用 `return` 返回值：
```js
() => { const imgs = document.querySelectorAll('img'); const r = []; imgs.forEach(i => { if(i.width > 50) r.push(i.src); }); return r.slice(0, 10); }
```
- 注意：`document.querySelectorAll` 在函数内写法，返回值是 JSON 数组

## 流程
1. `navigate_page {url}` 打开产品页（京东会跳登录，官网 404 常见 → 用台湾/香港代理站如 hawjou.com.tw、hk.sihooxchair.com）
2. `evaluate_script {function: "() => {...}"}` 提取 img.src 列表
3. `curl -s -o chair_images/xxx.png "<url>"` 下载图片（注意 .webp/.jpg 后缀）
4. python base64 读取 → 内嵌进 HTML `<img src="data:image/...;base64,...">`，得到自包含带图报告
5. lark-cli 发飞书

## 其他坑
- `take_screenshot` 输出可能 1.9MB 存到文件，别直接解析
- WebFetch 提取图片 URL 常报 `moonshot-v1-8k` 模型不可用 → 别依赖 WebFetch，直接用 chrome-devtools
- 京东 item 页会跳登录；保友官网 `www.ergonor.cn/product/jinhao-b2` 可用，图片在 `/uploads/image/` 下
