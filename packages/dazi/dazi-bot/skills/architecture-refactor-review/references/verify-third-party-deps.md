# 复审必读：先读第三方依赖源码，再定「硬伤」

## 教训来源
2026-08-08 搭子平台 AG-UI 架构重构评审。方案依赖 `agentscope` 2.0.5 作为运行时。评审第一版（v1）在**只读业务方代码**的情况下，把 3 项断言定为 🔴 硬伤并发给 agent 改良：

| v1 断言 | 读 agentscope 源码后 | 结果 |
|---|---|---|
| 前端消费的「AG-UI」是私有方言，非标准 AG-UI v1 | `_agui.py` 走官方 `ag_ui.core.events`（`AGUIRunStartedEvent`/`AGUITextMessageStartEvent`…），自带测试断言 `type=="RUN_FINISHED"`/`"TEXT_MESSAGE_START"` 即标准判别值 | ❌ 论断被推翻 |
| Team 工具是仓库外黑盒，无法本地验证 | `agentscope/src/agentscope/app/_tool/` 有 `_team_create.py`/`_agent_create.py`/`_team_say.py`/`_team_delete.py`/`_agent_invite.py` | ❌ 论断被推翻 |
| Redis 无 TTL/驱逐 | `_redis_storage.py:111-174` 有 `key_ttl` + `_set_with_ttl`/`_refresh_key_ttl`（滑动 TTL），只是 `factory._redis_kwargs()` 没传参 | ⚠️ 修正为「机制存在但未配置」 |

## 可复用的方法论
1. **在把断言定为 🔴 硬伤之前，先读方案所依赖的第三方框架/库源码**。业务方自己的代码（app 层）只是使用方，框架能力是否缺失必须看框架源码。
2. **定位依赖的真实安装来源**：`pip show X` 看 `Editable project location` / `Location`；`.venv/lib/python3.11/site-packages/__editable__.*.pth` 指向真实源码路径。editable 安装 → 源码就在本机，直接读。
3. **用框架自带测试佐证协议行为**：`grep -rn 'TEXT_MESSAGE_START|require_user_confirm' framework/tests/` 能确认事件判别值是否标准，比读实现更快。
4. **断言「不可复现/黑盒」前先查 requirements 与 PyPI**：`pip index versions <pkg>` 确认版本真实存在；`__version__` + `__file__` 比对本地 editable 源码与 requirements 锁定 commit 是否同源。
5. **把「已排掉的疑虑」单独成节**记录：模板替换时序、角色注入覆盖、HITL 上浮等经源码确认无问题的点，防止下一轮评审重复排查。

## 版本迭代纪律
- 用户每提交一轮新代码 → 出新版评审文档（v1→v2→v3），文档头写清「复核基线 HEAD」与「✓推翻 / ⚠修正 / ✅已解决 / ❌未动」的对照表。
- 每版正文前必须有「上轮改良清单核对表」（完成/部分/未动），让 agent 一眼看到哪些已落地。
- 跑测试拿基线：`cd <svc> && .venv/bin/python -m pytest -q`（用 venv 的 python，macOS 无 `timeout`）。
- 发现新风险单独成节（如 v3 的 `hot_refresh._KNOWN_USERS` 单机内存集合在多副本下失效）。

## 副作用提醒
- 评审「可信到可发给另一个 agent 执行」时，独立 verification 子代理常因沙箱权限（只放行工作目录）无法读 `~/PycharmProjects` 之外路径而返回 PARTIAL/UNVERIFIED。**这是环境性阻塞，不是内容否决**——把本会话实读的证据表贴给用户，说明「主会话实测过、证据可查」，并给出「放行权限重拉验证」或「信任本会话证据」二选一。
