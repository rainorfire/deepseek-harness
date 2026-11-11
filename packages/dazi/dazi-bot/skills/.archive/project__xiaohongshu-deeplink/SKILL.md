---
name: xiaohongshu-deeplink
description: |
  小红书 URL Scheme 深度链接技术方案。通过 H5 中间页 + 剪贴板 + URL Scheme 唤起小红书 APP，支持跳转发布页、用户主页、笔记详情等。
  适用于非技术用户（如家政阿姨）一键式唤起场景。
  当用户提到「H5唤起小红书」「URL Scheme」「跳转小红书」「外部唤起」「扫码跳转小红书」「剪贴板+小红书」时触发。
---

# 小红书 Deeplink 技术方案

## 核心发现：三端 SDK 对 title/content 支持完全不同

| 能力维度 | JS SDK (Web) | Android SDK | iOS SDK |
|----------|-------------|-------------|--------|
| **title 自动填入** | ❌ 禁用（传入被忽略） | ✅ 可选参数 | ✅ 可选参数 |
| **content 自动填入** | ❌ 禁用（传入被忽略） | ✅ 可选参数 | ✅ 可选参数 |
| **图片/视频传入** | ✅ 正常 | ✅ 正常 | ✅ 正常 |
| **通信机制** | 浏览器 URL Scheme（沙箱受限） | Intent IPC（跨进程） | URL Scheme + Universal Links |

**原因**：原生 SDK 走 App-to-App 的 IPC 通道，数据以结构化方式传递到小红书 App 内部；JS SDK 受浏览器沙箱限制，无法自动填入。

## 方案选择

### 方案 A：H5 + JS SDK（仅 Web，无原生 App）
- **可做**：传图片/视频唤起发布页
- **不可做**：自动填入标题和正文
- **兜底**：`navigator.clipboard.writeText()` 写入剪贴板，用户手动粘贴
- **适用**：家政阿姨 H5 页面场景

### 方案 B：壳 App + 原生 SDK
- 标题+正文可通过原生 SDK 自动填入
- 需要上架应用市场或企业签名分发
- **Android**: `XhsNote.title` / `.content` → 可选
- **iOS**: `XHSShareInfoTextContentItem.title` / `.content` → 可选

### 方案 C：iOS 快捷指令（Shortcuts）
- 适合小批量 iPhone 用户
- 通过 Accessibility Service 模拟粘贴
- 维护成本高，小红书改版可能失效

## 关键链接
- JS SDK：`https://fe-static.xhscdn.com/biz-static/goten/xhs-1.0.1.js`
- 开放平台：https://agora.xiaohongshu.com
- Android 文档：https://agora.xiaohongshu.com/doc/android
- iOS 文档：https://agora.xiaohongshu.com/doc/ios

## 注意事项
- appSecret 锁服务端 HMAC-SHA1 签名，不在客户端暴露
- 微信内嵌浏览器需引导用户在 Safari/Chrome 打开
- JS SDK 唤起失败后应有剪贴板兜底