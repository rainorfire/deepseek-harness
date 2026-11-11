---
name: ebao-deploy
description: 。「鹅宝 XX 分支部署到 betaf//betah/betai/betaj」「推 XX 分支触发构建」「触发 deploy」「鹅宝发布」「ebao-ai 构建部署」「ebao-ai 发版」时触发。覆盖：老 git 拉分支→推新 git→→触发 ~betaj→测试通过合回发版分支，，
---



## 背景与仓库关系
- 老 git `git@git.daojia-inc.com:ai-bus/ebao-ai.git`：**代码真源**，发版分支在这里，最终 merge 回来
- 新 git `git@djgit.daojia-inc.com:ai-bus/ebao-ai.git`：跑 CI/CD 构建部署（仓库迁移前临时方案）
- 部署 = 本地 git 命令（Bash 执行）+ 新 git Pipelines 手动触发（**2026-08-19 起 push 触发已被 CI 禁用，全部改为手动建流水线**，见下方「」更新）
- 触发前提：用户 Chrome 已登录 `djgit.daojia-inc.com`，且代码已在分支上

## 测试环境与入口机
| 环境 | 域名 |
|------|------|
| betaf | jz-ebaoai-betaf.djtest.cn |
| betag | jz-ebaoai-betag.djtest.cn |
| betah | jz-ebaoai-betah.djtest.cn |
| betai | jz-ebaoai-betai.djtest.cn |
| betaj | jz-ebaoai-betaj.djtest.cn |

- 5 个域名统一 CNAME 到 `op-web-bjjz-tlan-qt.djtest.cn`，实际 IP 都是 **10.40.30.151**（一台 Nginx 入口/网关机，靠 Host 头区分路由到各环境后端）
- 页面 404 找 @杨宇辉 查 Nginx 配置
- **生产环境**：`https://ebaoai.daojia.com/`，IP `10.40.113.10`（劳动者侧 `/worker`、后台管理另配）



> ⚠️ `.gitlab-ci.yml` 的 `workflow.rules` 已把 `$CI_PIPELINE_SOURCE == "push"` 设为 `when: never`，**push 不再自动构建**。注释要求用 `glab ci run` 手动建流水线：`glab ci run -b <分支> --variables DEPLOY_TO:<环境>`（全量构建+自动部署）、`glab ci run -b <分支> --variables SERVICE:<模块>`（部分构建）、`glab ci run -b <分支> --variables SERVICE:<模块>,DEPLOY_TO:<环境>`（部分构建+自动部署）。本机未装 glab 时，用下方第 2 步的 GitLab API 方式等价触发。

### 第 1 步：从老 git 发版分支拉分支
```bash
git clone git@git.daojia-inc.com:ai-bus/ebao-ai.git
cd ebao-ai
git checkout -b feature/<功能> origin/dev/ebao_daily_release_XXXX  # 当天发版分支，如 dev/ebao_daily_release_0805（每天变，动手前先确认当天分支）
```

### 第 2 步：推代码到新 git + 手动建流水线
```bash
git remote add newgit git@djgit.daojia-inc.com:ai-bus/ebao-ai.git  # 只需加一次
# 确认 SSH 权限：新 git 不认 key 时见「坑 2」
git push newgit feature/<功能>
```
**push 不会触发 CI**（已被禁用）。手动创建流水线，二选一：
- **方式 A（glab，推荐装一个）**：`glab ci run -b <分支> --variables DEPLOY_TO:<环境>`（全量构建，deploy job 手动触发）
- **方式 B（Chrome 浏览器 API，本机无 glab 时用）**：
  1. chrome-devtools `navigate_page` 到 `https://djgit.daojia-inc.com/ai-bus/ebao-ai/-/pipelines`
  2. `` POST 创建流水线：
     ```js
     const token = document.querySelector('meta[name="csrf-token"]')?.content;
     await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipeline', {
       method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
       credentials: 'include',
       body: JSON.stringify({ ref: '<分支名>', variables: [{ key: 'DEPLOY_TO', value: '<环境>' }] })
     });
     ```
     返回 201 即成功，响应里的 `id` 是新流水线号。构建 job 全部 success 后，deploy job 变 manual（待触发）。

### 第 3 步：触发部署（注意：SERVICE 为空时**所有环境**的 deploy job 都会出现，只触发目标环境的那个）
1. 用 `evaluate_script` 查流水线 jobs，找到目标 deploy job 的 id：
   ```js
   fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines/<流水线id>/jobs?per_page=50', { credentials: 'include' })
   ```
   （每个 job 有 `id`、`name`（如 deploy-betag）、`status`）
2. POST 触发目标 deploy job（如 deploy-betag）：
   ```js
   const token = document.querySelector('meta[name="csrf-token"]')?.content;
   await fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/<job_id>/play', {
     method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, credentials: 'include'
   });
   ```
3. 触发后**必须回查 job 状态**确认真的变 running（play 返回 400 "Unplayable Job" 不一定代表失败，见「坑 5」）
4. 部署完成访问对应域名，或查 job 状态 `manual → running → success`

### 第 4 步：测试通过合回老 git 发版分支
```bash
git checkout -b dev/ebao_daily_release_XXXX origin/dev/ebao_daily_release_XXXX
git merge feature/<功能>
git push origin dev/ebao_daily_release_XXXX
```

## 规则
1. **环境共享不独占**：先看 GitLab Deployments → Environments 确认没人正在用
2. **同模块冲突分开环境**：两人都改 gateway 时各用不同环境（A betaf、B betag）；不同模块可同环境
3. **只部署部分服务**：建流水线时设变量 `SERVICE=<服务名>`（部分构建，deploy job 不出现，需再带 `DEPLOY_TO:<环境>` 才触发部署）。服务名与构建 job 对应：`ebao-ai-frontend`、`ebao-ai-gateway`、`ebao-ai-orchestrator`、`ebao-ai-platform`、`ebao-agent`、`ebao-ai-sandbox-runner`、`ebao-sandbox-base`、`ebao-ai-scheduler`、`ebao-ai-eval`（2026-08-19 实测流水线含 10 个构建 job：frontend-assets + 上述 9 个镜像）
4. **用完群里说一声**，方便别人接着用

## 本机部署能力（2026-08-05 实测）
| 环节 | 状态 | 处理 |
|------|------|------|
| 老 git SSH | ✅ 通（HEAD e79dd8c，key 有权限） | 直接拉/合并 |
| 新 git SSH | ✅ 已通（host key 已加 + key 已绑） | 直接 push |
| 触发部署按钮 | ⚠️ 需 Chrome 登录 djgit | 用 chrome-devtools 浏览器自动化点 |
| 本地代码仓库 | ⚠️ 按需 clone | 动手前先确认本机有没有仓库 |

**注意：macOS 无 `timeout` 命令**，测 git 连通性用后台进程 + `sleep N; kill $PID` 兜底，别用 `timeout 10 git ...`。

（按序排查）

### 坑 1：新 git host key verification failed
`djgit.daojia-inc.com` 指纹没进 known_hosts。
解决：`ssh-keyscan djgit.daojia-inc.com >> ~/.ssh/known_hosts`（先给用户展示指纹确认再执行）

### 坑 2：Permission denied (publickey)
老 git 认 `id_rsa` 和 `dj_new_rsa`，但新 git 可能没绑这两把 key。
解决：把本机公钥加到 djgit 账号 Settings → SSH Keys（用 chrome-devtools 确认登录态后引导用户添加）。

### 坑 3：镜像构建全部失败（缺 Dockerfile-ci）
CI 引用 `Dockerfile-ci`，但功能分支可能只有 `Dockerfile`，导致 gateway/orchestrator/platform/agent/sandbox-runner/base/frontend 全部构建失败、deploy 全 skipped。
排查：
```bash
git ls-files | grep -c Dockerfile-ci      # 应为 7
git ls-files | grep docker-compose-ci     # 应有 deploy/docker-compose-ci.yml
git ls-files | grep 'deploy/env/beta'     # 应有各环境配置
git ls-files | grep 'deploy/nginx/ebao-beta'  # 应有 nginx 配置
```
修复：从发版分支同步 CI 基建文件（7 个 Dockerfile-ci、`deploy/docker-compose-ci.yml`、`deploy/env/<env>.env`、`deploy/nginx/ebao-<env>.conf`），提交后重推新 git。

### 坑 4：浏览器页面因内核重启被重置
chrome-devtools 当前页可能回到空白页。先 `navigate_page` 导航回 pipeline 页面再查状态/触发。

### 坑 5：触发 deploy 返回 401 或 400
GitLab POST API 需要 CSRF token（play 请求缺 token 会 401）。
解决：先 GET 任一 API 从响应头取 `X-CSRF-Token`，或从页面 `document.querySelector('meta[name="csrf-token"]').content` 取，POST 时带 header `X-CSRF-Token` + `credentials: 'include'`。
**400 "Unplayable Job" 不完全等于失败**（2026-08-19 实测）：play 返回 400 但回查 job 已变 running 并最终 success。触发后必须回查 job 状态确认真的变 running（play 返回空对象/400 都不代表成功或失败，以 job 状态为准）。

## 排查 FAQ
- 构建失败 → 看 Pipeline job 日志
- 页面 404 → 找 @杨宇辉 查 Nginx 配置
- 发版分支名 → `dev/ebao_daily_release_MMDD`，每天变，动手前先确认当天分支

## 验证标准
- 流水线构建 job 全部 `success`
- 触发后 deploy job 状态 `manual → running → success`
- 访问对应环境域名验证页面/健康检查通过
- 合回老 git 发版分支 push 成功
