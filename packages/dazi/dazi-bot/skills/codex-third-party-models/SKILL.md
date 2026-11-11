---
name: codex-third-party-models
description: Codex CLI 接入第三方/国产大模型（DeepSeek、GLM智谱、Kimi月之暗面、Qwen阿里百炼、MiniMax、小米MiMo、阶跃星辰）的兼容矩阵与配置方法。当用户问「哪些国产模型支持 Codex」「Codex 怎么接 DeepSeek/GLM/Kimi」「怎么配 codex config.toml 用第三方模型」时触发。
---

# Codex 接入第三方模型（国产模型兼容矩阵）

## 核心结论

新版 Codex CLI **原生支持第三方 OpenAI 兼容 endpoint**，无需中间件/代理。配置在 `~/.codex/config.toml` 中：加 `wire_api = "chat"` + 换 `base_url` + 换模型名即可。

配置示例（以某厂商为例）：

```toml
model_provider = "my_vendor"

[model_providers.my_vendor]
wire_api = "chat"
base_url = "https://api.vendor.com/v1"
env_key = "VENDOR_API_KEY"
```

## 厂商兼容矩阵（2026-08 确认）

| 厂商 | 可用模型 | 接入方式 | 备注 |
|---|---|---|---|
| DeepSeek 深度求索 | deepseek-chat / V3.2、V4 系列 | 原生直连（DeepSeek API Key） | 最成熟 |
| GLM 智谱（Z.ai） | GLM-4.6、5.x / 5-Turbo | 原生直连 + Coding Plan Key | 官方主推 Codex 场景 |
| Kimi 月之暗面 | K2、K2.7 Coding、K3 | 原生直连（OAuth 或 API Key） | K3 分国际/中国两套 Key |
| Qwen 阿里百炼 | qwen3.8-max、3.7 系列 | 原生直连（百炼 plan Key） | 走 qwen-plan 命名空间 |
| MiniMax | M3 | 原生直连 / Token Plan | |
| 小米 MiMo | mimo-v2.5 / pro | 官方端点直连 | 走 /chat/completions |
| 阶跃星辰 StepStar | 未具名 | 兼容格式通用 | 社区提及 |

完整动态矩阵参考 codex-router.com/zh/models/（Kimi/GLM 有 OAuth、Ollama Cloud、ClinePass 等多条转售路线）。

## 关键坑

1. **「能用」≠「全功能」**：走 Chat Completions（`wire_api="chat"`）会丢掉 `reasoning_effort` 控制、会话状态恢复、trace 复用等依赖 **Responses API** 的能力；模型名硬编码判断也可能导致 UI 提示和 token 统计不准。
2. **Claude 系不支持**：Codex 短期不原生支持 Anthropic 协议，接 Claude 需 CPA / CC-Switch 做协议翻译中转。
3. 模型 ID 前缀区分路线：Kimi 用 `kimi-oauth/`、`kimi-api/`、`kimi-api-cn/`；Qwen plan 用独立命名空间。

## 工作流

1. 用户问「哪些支持」→ 直接给矩阵表（上表）。
2. 用户要「帮我配 XX」→ 问清厂商后写 config.toml：vendor 名、模型 ID、API Key 获取方式（OAuth 或 env Key）。
3. 模型/接入方式变化快，回答前用 WebSearch 确认最新版本（关键字：`Codex <厂商名> <年份>`、`wire_api config.toml`）。
