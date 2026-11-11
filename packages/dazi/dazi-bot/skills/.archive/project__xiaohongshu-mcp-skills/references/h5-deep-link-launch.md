# 小红书 H5 深度链接唤起方案

> web-based approach: 通过 H5 页面唤起小红书 APP 并跳转到发布页

## 核心结论

| 问题 | 结论 |
|------|------|
| H5 能否唤起小红书 APP？ | ✅ 能（iOS Universal Link，Android URL Scheme / Intent） |
| 能否直接跳转到发布页？ | ✅ 能（iOS Universal Link 有 `/post_new_note/*` 路径） |
| 能否自动粘贴内容？ | ❌ 不能（iOS/Android 沙箱隔离） |

## 平台方案

| 环境 | 唤起方式 |
|------|---------|
| iOS Safari | Universal Link: `https://www.xiaohongshu.com/post_new_note` |
| iOS 微信 | 引导在浏览器打开 |
| Android 浏览器 | Intent URL + URL Scheme 兜底 |
| Android 微信 | 引导在浏览器打开 |

## 关键细节

- iOS Universal Link 配置路径 `/post_new_note/*`，Bundle ID: `com.xingin.discover`
- Android URL Scheme: `xhsdiscover://`，包名 `com.xingin.xhs`
- Asset Links 不可用（返回 HTML）
- 需 HTTPS 环境才能用 Clipboard API

## 完整实现

参见项目 `xiaohongshu-launch.html`（平台检测 + 剪贴板 + 多平台唤起）和 `server.js`。