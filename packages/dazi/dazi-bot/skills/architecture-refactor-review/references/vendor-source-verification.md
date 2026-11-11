# 关键方法论：被重构方案采纳的外部/供应商代码库，必须对源码验证再下硬伤结论

> 2026-08-08 实战教训：搭子平台 AG-UI 重构评审中，评审者仅凭「消费方代码库」推断出 2 项 🔴 硬伤，被用户提供供应商源码后**推翻**。

## 教训
评审一个**采纳了外部/供应商库**（如 agentscope、ag-UI、某 SDK）的重构方案时，对该库的「协议 / 工具 / 行为」判断**绝不能从消费方推断**，必须到供应商源码里实读验证。

## 本次被推翻的两个硬伤
| 评审初判 🔴 | 供应商源码实读后 | 关键证据 |
|---|---|---|
| 前端解析的 AG-UI 是「私有方言非标准」 | 实为标准 AG-UI 事件 | agentscope `src/agentscope/app/middleware/_protocol/_agui.py` import `ag_ui.core.events` 标准事件类；自带测试 `tests/agui_protocol_test.py:221,297,589` 断言 `type == "RUN_FINISHED"` / `"TEXT_MESSAGE_START"` / `name == "require_user_confirm"` 即标准判别值 |
| Team 工具是「仓库外黑盒、不可验证」 | 工具真实存在 | agentscope `src/agentscope/app/_tool/` 含 `_team_create.py`/`_agent_create.py`/`_team_say.py`/`_team_delete.py`/`_agent_invite.py` |
| Redis 会话无 TTL（🟠） | 有 key_ttl 滑动 TTL 机制，只是工厂未传参 | `_redis_storage.py:111-174` `key_ttl` + `_set_with_ttl`/`_refresh_key_ttl`；`factory.py` `_redis_kwargs()` 只传 host/port/db/password |

## 正确的验证步骤（写进评审流程）
1. **定位供应商源码**：`pip show <pkg>` 看 Location / Editable 路径；读 `.pth` 文件找 editable 指向的真实源码目录；千万别只看 site-packages 的 dist-info。
2. **核对版本一致**：`git rev-parse HEAD` 对比 venv 实际安装 commit（`pip freeze` 里 `-e git+ssh://...@<commit>`），确保审的是被安装的版本。
3. **读供应商自带测试**：库的 `tests/*` 里对协议判别值/行为的断言是最权威的「标准」证据，比推断可靠得多。
4. **区分「库里没有」vs「库没装进 venv」**：`import` 失败可能是新发现的部署缺口（依赖未装），不是「库不存在」。本次新发现 `ag_ui` 模块在 venv 缺失（site-packages 只有 langchain_protocol 同名物），这是真实部署风险，而非推翻协议的证据。
5. **区分「机制存在」vs「被启用」**：像 key_ttl 机制在库里有，但工厂没传参 = 仍是待修项，只是性质从「库没有」降级为「未配置」。

## 评审输出姿势
- 评审文档标版本（v1 初判 → v2 源码验证修正版），并在文首列「已推翻 / 已修正 / 已解决 / 新发现」对照表。
- 每个论断带 file:line 证据；被推翻的论断要明确撤回，不硬撑。
- 独立验证 agent 可能因沙箱权限（Read/Grep/Bash 被拒）给出 PARTIAL/UNVERIFIED —— 那是环境阻塞不是内容否决，明说两层即可，不必重跑。
