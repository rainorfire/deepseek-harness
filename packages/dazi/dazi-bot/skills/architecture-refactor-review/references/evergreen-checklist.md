# 通用架构评审自检清单

从 2026-08-08 ai-agent-platform AG-UI 重构评审中提炼。逐项过，命中即记为风险。

## 承诺 vs 实现一致性
- [ ] 方案 todos / 承诺（P0-Px）逐条列出成核对基准了吗？
- [ ] 每条承诺都找到 file:line 证据了吗？判断标注 ✅真实 / ⚠️部分 / ❌缺实现？
- [ ] git log 最新提交是否有「移除 X 实现」这种与方案声称方向相反的提交？若能核实改动内容。

## 文档与实现矛盾（最危险）
- [ ] 注释写 fail-closed，代码实际 fail-open？（空角色=公开 vs 公开）
- [ ] 架构文档说「已退役」/「无旁路」，代码里是否还有存活端点（如自研转换路由）？
- [ ] 文档声称的职责（鉴权/配额/审计），代码是否真的实现（配额常是零）？

## 协议与契约
- [ ] 声称「标准协议」（AG-UI / SSE）的，前端解析的是标准信封还是私有 UPPER_SNAKE_CASE 方言？
- [ ] 协议两端是否仅自洽不标准？多端接入时是否每端都要重写解析？

## 黑盒与可复现
- [ ] 核心能力（Team 委派等）是否靠 `pip install -e` 外部源码、仓库内零实现？→ 建议 vendor/submodule/锁 commit。
- [ ] CI / 部署机能否复现本地成功？

## 退役干净度
- [ ] 源码是否零残留？
- [ ] `__pycache__` 是否残留旧测试/旧模块字节码（test_dispatch / test_hitl / test_chat_sse 等）？
- [ ] 是否有未调用的死端点、死参数、兼容回落（如 ORCHESTRATOR_URL 回落）？
- [ ] 定义了但从未被 lifecycle 调用的函数（如 refresh_all_leader_prompts）？

## 安全
- [ ] header 注入的 user_id 是否有验签？端口是否仅内网可达？
- [ ] 是否需要共享密钥/网络白名单？

## 可观测性与运维
- [ ] 只有 basicConfig 无 tracing/otel？需要记录 run_id/session_id/耗时。
- [ ] audit 日志是否只做了 gateway 层，engine 侧缺失？
- [ ] Redis session 是否有 TTL/驱逐？无 TTL 会无限增长。

## 测试
- [ ] 方案声称的测试项（session replay / HITL resume / 模板热更新 / Team 委派 / 权限跨轮 / 多Tab）是否全部有测试？
- [ ] 实际跑 pytest 了吗（macOS 无 timeout 命令，直接跑）？报「N passed in Xs」带证据。

## 代码质量顺手项
- [ ] 跨模块用函数属性注入依赖（如 `extra_agent_tools._storage`）→ 改显式依赖注入。
- [ ] 手写路由是否重复实现了框架已有路由（→ 双实现漂移风险）。

## 报告模板
- 总评一句话（真实落地 + N 块硬伤）
- 已兑现表：方案承诺 | 证据(file:line) | 判断
- 硬伤 🔴 逐条：问题→位置→改良建议
- 中优表：问题 | 位置 | 建议
- 小问题清单
- 收尾：问用户要不要落成任务清单 / 针对性改法
