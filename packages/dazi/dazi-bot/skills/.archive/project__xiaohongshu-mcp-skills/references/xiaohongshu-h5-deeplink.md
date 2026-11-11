# 小红书 H5 唤起 APP 深度链接技术调研

> 生成时间：2026-07-06
> 调研背景：用户希望家政阿姨通过点击 H5 链接 → 自动生成小红书文案 → 唤起小红书APP → 跳到发布页 → 自动粘贴内容 → 只需点发布

## 三个核心问题答案

### 1. H5 能否唤起小红书APP？

**能，但有重大限制：**

| 平台 | 机制 | 状态 |
|------|------|------|
| iOS | URL Scheme (`xhs://`) | 大概率支持，但非公开文档 |
| iOS | Universal Link (`xiaohongshu.com/.well-known/apple-app-site-association`) | ❌ **未找到** — 未配置或域名保护 |
| Android | App Links (`assetlinks.json`) | ❌ **未找到** — 未配置 |
| Android | Intent URL (`intent://...#Intent;package=com.xingin.xhs`) | 理论可行 |

**⚠️ 微信环境拦截：** 微信内置浏览器（X5 内核）会拦截绝大多数第三方 APP 的 URL Scheme 跳转。用户必须先点「在浏览器打开」才能生效。

**已知 Scheme：** 此前有调研发现 `xhsdiscover://` 也可能被支持（用于打开笔记页 `xhsdiscover://note/{note_id}` 和用户主页 `xhsdiscover://user/{user_id}`）。

### 2. 能否直接跳到发布页面？

**不确定，大概率不行。**

- 小红书未公开发布页面对应的 URL Scheme path
- 可能的路径（未经实测）：`xhs://publish`、`xhs://note/create`、`xhs://publish/image`
- 若路径公开可调用，营销号会大规模使用，小红书大概率未暴露
- **实测是最可靠的方式：** 在手机浏览器地址栏输入 `xhs://publish` 等候选路径测试是否跳转

### 3. 能否自动粘贴内容到小红书输入框？

**几乎不可能。**

- **跨应用隔离：** H5 无法直接操作 APP 内的文本输入框（iOS WKWebView / Android WebView 都是沙盒隔离的）
- **剪贴板局限：** `navigator.clipboard.writeText()` 只能写入系统剪贴板，**无法自动粘贴**到其他 APP
- **iOS 14+ 粘贴提示：** APP 读取剪贴板时会弹出横幅提示「来自 XXX 的粘贴」，用户需手动点击「粘贴」
- **Android 10+：** 前台 APP 可以读取剪贴板，但小红书是否实现「检测剪贴板→弹出粘贴建议」功能需要验证

## 可行方案推荐

| 方案 | 体验 | 复杂度 | 说明 |
|------|------|--------|------|
| **A: H5 + 剪贴板 + 手动粘贴** | ⭐⭐ | ⭐ | H5 生成文案 → 自动复制 → 唤起小红书 → 用户手动粘贴发布。最稳定可靠 |
| **B: iOS 快捷指令** | ⭐⭐⭐ | ⭐⭐⭐ | 配置一次性快捷指令，后续可自动执行：复制文案 → 打开小红书 → 到发布页。体验最好但需阿姨配合首次配置 |
| **C: Android Tasker** | ⭐⭐⭐ | ⭐⭐⭐ | 类似 iOS 快捷指令的自动化方案 |
| **D: Web 创作者平台** | ⭐⭐ | ⭐⭐ | 跳转到 `creator.xiaohongshu.com/publish/publish`（需登录 Web 版），在浏览器中粘贴发布 |

## 调研方法总结

小红书**没有公开的深度链接 / URL Scheme 开发者文档**。搜索引擎对此类技术细节几乎完全失效。可靠的调研方式：

1. **检查 iOS Universal Links：** 请求 `https://xiaohongshu.com/.well-known/apple-app-site-association`（返回空 = 未配置）
2. **检查 Android App Links：** 请求 `https://xiaohongshu.com/.well-known/assetlinks.json`（返回空 = 未配置）
3. **App Store 信息：** Bundle ID = `com.xingin.xhs`，URL Schemes 注册情况需通过 IPA 反编译获知
4. **实测：** 在手机 Safari/Chrome 地址栏输入候选 Scheme URL 测试跳转效果
5. **微信环境：** WeChat X5 内核会拦截 URL Scheme，需引导用户「在浏览器打开」
