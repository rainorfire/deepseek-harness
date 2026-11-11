---
name: html-illustrated-delivery
description: 生成图文并茂的 HTML 交付物（攻略/方案/调研报告/榜单）：内嵌真实图片并本地化（处理防盗链 Referer）、用 chrome-devtools 浏览器渲染验证图片加载（lazy loading 需滚动触发）、独立 verification 代理核验后交付。用户说「出个图文方案/HTML攻略/带图报告」时触发。
---

# html-illustrated-delivery

生成**图文并茂的 HTML 交付物**（旅游攻略、自驾方案、产品调研报告、榜单等）的类级流程。用户偏好 HTML 图文交付（见 DAZI.md「HTML默认内嵌真实图，勿等用户追问」），本技能沉淀制作、图片本地化、渲染验证、交付核验四步。

## 何时使用

- 用户要求「HTML 方案 / 图文攻略 / 带图报告 / 图文并茂」交付调研或计划类结果
- 交付物需要内嵌真实景点/产品/实拍图

## 工作流

### 1. 调研并收集素材
- WebSearch 找攻略/榜单，WebFetch 抓取详情（门票、开放时间、路线里程、价格）
- 从攻略页、官网、OTA（携程等）收集图片 URL，优先官网高清大图（4000px 级）

### 2. 生成 HTML（内嵌真实图片）
- 自包含样式（:root 变量、卡片布局），图片用 `<img loading="lazy" onerror="this.style.display='none'">`
- 包含行程/方案总览表、逐日明细、预算表、实用贴士

### 3. 图片本地化（关键：防盗链）
**先下载到 `方案图片/`（或类似）目录，HTML 内改用相对路径引用**，保证离线打开稳定。

防盗链坑（本次实测）：
- **携程 dimg04.c-ctrip.com**：curl 直下会被拦成 60x60 小图或 403 → 换官网图源
- **官网 OSS（omo-oss-image.thefastimg.com 等）**：带 Referer 签名校验，curl 不加 `-H "Referer: <官网域名>"` 返回 403 文本（29 字节 `http 403`）
  - 解法：curl 加 `-H "Referer: http://www.langyagucheng.com/"` 重新下载
  - 或浏览器内 `fetch(url, {referrer: '<官网>', credentials:'omit'})` 可绕过（页面上下文里 OSS 校验的是 Referer）
- **下载后必须 `file` 验证**：`file xxx.jpg` 确认是真实 JPEG/PNG，403 会伪装成 ASCII 文本
- 选图用 alt 文本语义判断：查官网页 img 的 alt（如 alt="琅琊古城"）确认内容对应
- 未采用的候选图收进 `_候选图/` 子目录保持整洁

### 4. 浏览器渲染验证（chrome-devtools MCP）
1. `new_page` 打开 `file://<绝对路径>`
2. `evaluate_script` 检查图片：`Array.from(document.querySelectorAll('img')).map(i => ({alt:i.alt, ok:i.complete && i.naturalWidth>0, w:i.naturalWidth}))`
3. **lazy loading 陷阱**：`loading="lazy"` 的图片在首屏外不加载，检查会误报失败 → 先 `i.scrollIntoView()` 再等 1.5s 重新检查
4. `take_screenshot` 截图肉眼复核版面
5. 截图解码注意：结果 JSON 里 image 块索引不固定（可能在 result[1]），遍历 `data['result']` 找 `type=='image'` 块再 base64 解码

### 5. 独立核验 + 交付
- spawn `verification` 子代理核验交付物（HTML 结构、图片引用与本地文件一一对应、图片真实有效）
- 收到 PASS 后再抽查 2-3 个证据点（`ls -la`、`file`、`grep -o 'src=...'`）确认报告可信
- 向用户交付：文件路径 + 一句话要点回顾 + 关键提醒

## 参考

- 详细案例见 `references/`（日照莒县临沂自驾方案 2026-08-07）