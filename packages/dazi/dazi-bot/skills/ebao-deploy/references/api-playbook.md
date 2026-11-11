# eBao 部署 GitLab API 速查（浏览器登录态 / chrome-devtools evaluate_script）

2026-08-05 实战验证。所有请求带 `credentials:'include'` 走浏览器会话；**POST 必须带 CSRF token**。

## CSRF token（坑：POST 401）
```js
const token = document.querySelector('meta[name="csrf-token"]').content;
// POST 头加: 'X-CSRF-Token': token
```

## 常用端点（ns = ai-bus/ebao-ai，URL 编码 ai-bus%2Febao-ai）
- 查分支：`GET /api/v4/projects/{ns}/repository/branches?search=关键字`
- 查流水线：`GET /api/v4/projects/{ns}/pipelines?ref={分支}`
- 查流水线 jobs：`GET /api/v4/projects/{ns}/pipelines/{id}/jobs`
- 拉 job 日志：`GET /api/v4/projects/{ns}/jobs/{id}/trace`（或相对路径 /ai-bus/ebao-ai/-/jobs/{id}/trace）
- 创建流水线（带变量）：`POST /api/v4/projects/{ns}/pipeline`，body `{ref, variables:[{key:'SERVICE',value:'...'}]}` → 201
- 触发 manual job：`POST /api/v4/projects/{ns}/jobs/{id}/play`（带 CSRF）→ 200，job 状态 manual→pending
- 加 SSH key：`POST /api/v4/user/keys`，body `{title, key}` → 201

## 只部署单个服务（如「部署 frontend 到 betag」）
**≠ 触发现有流水线的 deploy（那是全量）。** 正确流程：
1. `POST /pipeline` 带 `SERVICE=<服务名>` 创建**新流水线**（只含该服务的 build job + 5 个 deploy）
2. 等流水线状态 manual（构建完）
3. 从 jobs 里找到对应环境 deploy job（如 deploy-betag）拿 job id
4. `POST /jobs/{id}/play` 带 CSRF token 触发

SERVICE 可选值：`ebao-ai-frontend` / `ebao-ai-gateway` / `ebao-ai-orchestrator` / `ebao-ai-platform` / `ebao-agent` / `ebao-ai-sandbox-runner`

## 新 git（djgit）SSH 认证
- 老 git 认 `id_rsa`/`dj_new_rsa`；**新 git 是独立账号**，本机 key 默认不认（Permission denied publickey）
- 解决：浏览器登录 djgit 后 `POST /api/v4/user/keys` 加本机公钥（如 id_rsa.pub），加完即可 `git push` 触发构建

## 构建失败快速排查（按顺序）
1. 分支缺 `.gitlab-ci.yml` → push 后**不自动建流水线** → 从发版分支同步该文件再推
2. 分支缺 `Dockerfile-ci`（CI 变量 `BUILD_DOCKERFILE: Dockerfile-ci`）→ kaniko 全部 exit1 → 从发版分支同步 7 个服务的 Dockerfile-ci + `deploy/docker-compose-ci.yml` + `deploy/env/beta?.env` + `deploy/nginx/ebao-beta?.conf` + `deploy/platform/dsf/beta?/dsf.config`
3. 全量部署的 deploy 目标机在各 job 的 `DEPLOY_HOST` 变量（实测 betag=10.40.131.82；入口机统一 10.40.30.151）

## 环境与机器
| 环境 | 域名 | 入口 IP |
|------|------|---------|
| betaf~betaj | jz-ebaoai-beta{f,g,h,i,j}.djtest.cn | 10.40.30.151（Nginx，按 Host 分流） |
| 生产 | ebaoai.daojia.com | 10.40.113.10 |
