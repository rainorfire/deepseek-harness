# eBao-AI 部署排查与能力探明细录

## 环境 IP 解析（2026-08-05 实测）

```bash
for d in jz-ebaoai-betaf jz-ebaoai-betag jz-ebaoai-betah jz-ebaoai-betai jz-ebaoai-betaj; do
  dig +short $d.djtest.cn
  # 全部解析为 op-web-bjjz-tlan-qt.djtest.cn. → 10.40.30.151
done
```

结论：5 个环境共用入口机 `10.40.30.151`（北京居家职站 tlan 测试环境 web 入口，Nginx 靠 Host 头路由）。

## 部署能力探明（2026-08-05 会话实测）

| 环节 | 实测结果 |
|------|----------|
| 老 git 连通 | `git ls-remote git@git.daojia-inc.com:ai-bus/ebao-ai.git HEAD` → e79dd8c…（SSH key 有权限） |
| 新 git 连通 | 报 **Host key verification failed**，需 `ssh-keyscan djgit.daojia-inc.com` 加指纹（动手前先让用户确认指纹） |
| 本机代码仓库 | `find ~/Documents -maxdepth 4 -type d -name ebao-ai` 无结果，需先 clone |

**macOS 无 `timeout` 命令**：测连通性不要用 `timeout 10 git ls-remote ...`，用后台进程兜底：
```bash
git ls-remote git@... HEAD 2>&1 | head -3 & PID=$!
(sleep 8; kill $PID 2>/dev/null) & wait $PID 2>/dev/null
```

## 部署失败排查路径

1. **构建失败** → djgit CI/CD → 对应 Pipeline job 的日志
2. **页面 404** → 入口 Nginx 路由问题，找 @杨宇辉
3. **环境冲突** → 先看 Deployments → Environments 确认占用，同模块冲突换环境
4. **push 新 git 报错** → 先确认 host key 已加、remote 名已建（`git remote add newgit git@djgit.daojia-inc.com:ai-bus/ebao-ai.git` 只需一次）

## 备选部署路径（Coolify）

另有一套 Coolify 部署：实例 `https://jszcoolify.djtest.cn`（上下文名 `djtest`），部署 ebao-ai 到 d 环境。CLI 连接用 `coolify context` 配置 token，`--force` 覆盖旧 token，只读验证用 `server list`。

## 生产环境（关联记忆）

- 主站：`https://ebaoai.daojia.com/`（IP 10.40.113.10）
- 劳动者侧：`https://ebaoai.daojia.com/worker`
- 后台管理：另配域名
