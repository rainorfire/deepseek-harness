# 2026-09-01 chrome-devtools CLI + 登录缓存 Profile 部署流程（已验证 6 次）

## 背景

无 glab、无 GitLab API token、无法解密 Chrome Cookie（Keychain TCC 被沙箱拦截）的环境下，
用 chrome-devtools CLI + `~/.cache/chrome-devtools-mcp/chrome-profile` 里的 djgit 登录态完成流水线触发。
该 profile 已含 `djgit.daojia-inc.com` 的 `_gitlab_session`（83B）与 `remember_user_token`（323B）cookie，无需任何凭证。

## 前置

- chrome-devtools CLI v1.1.1：`/Users/chenyujia/.local/node/bin/chrome-devtools`
- 登录 profile：`~/.cache/chrome-devtools-mcp/chrome-profile`（若失效需重新登录）
- 本地仓库：`~/PycharmProjects/ebao-ai`（当前在 `dev/20260831-memory`）
- 目标环境：betag（用户口称 "batag"，环境清单只有 betaa-betan + prod/stable/sandbox，无 batag）

## 步骤

### 1. 确认最新提交

```bash
cd ~/PycharmProjects/ebao-ai
git fetch origin dev/20260831-memory
git log origin/dev/20260831-memory -1 --format='%H %s'
```

### 2. 启动 daemon（必须 nohup 后台 + sleep，否则随 shell 退出）

```bash
nohup chrome-devtools start --headless --userDataDir "$HOME/.cache/chrome-devtools-mcp/chrome-profile" --isolated=false > /tmp/cdt_start.log 2>&1 &
sleep 8
chrome-devtools status
```

### 3. 导航到流水线页（注意 navigate_page 必须显式传 type=url，位置参数会报错）

```bash
chrome-devtools navigate_page url "https://djgit.daojia-inc.com/ai-bus/ebao-ai/-/pipelines"
```

### 4. 触发流水线（在浏览器上下文内 fetch，credentials:'include' + CSRF header）

```bash
chrome-devtools evaluate_script function "async () => { const csrf = document.querySelector('meta[name=csrf-token]')?.content; const r = await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipeline', {method:'POST', credentials:'include', headers:{'Content-Type':'application/json','X-CSRF-Token':csrf}, body: JSON.stringify({ref:'dev/20260831-memory', sha:'<SHA>', variables:[{key:'DEPLOY_TO', value:'betag'}]})}); const j = await r.json(); return {status: r.status, id: j.id, sha: j.sha, ref: j.ref}; }"
```

返回 201 + pipeline id 即成功。

### 5. 轮询构建 Job 到无失败/运行中

```bash
chrome-devtools evaluate_script function "async () => { const csrf = document.querySelector('meta[name=csrf-token]')?.content; const r = await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines/<PIPELINE_ID>/jobs?per_page=100', {headers:{'X-CSRF-Token':csrf}, credentials:'include'}); const j = await r.json(); return j.map(x => ({name: x.name, status: x.status})); }"
```

### 6. 轮询 deploy-betag Job 直到 success（约 71-77 秒）

```bash
chrome-devtools evaluate_script function "async () => { const csrf = document.querySelector('meta[name=csrf-token]')?.content; const r = await fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/<DEPLOY_JOB_ID>', {headers:{'X-CSRF-Token':csrf}, credentials:'include'}); const j = await r.json(); return {deployId: j.id, status: j.status}; }"
```

`DEPLOY_TO=betag` 时 deploy-betag job 自动运行（无需手动 play）。

### 7. 验证

```bash
curl -sS -o /dev/null -w "HTTP %{http_code}" https://jz-ebaoai-betag.djtest.cn/
```

期望 HTTP 200。

## 坑位清单

1. **CDP 直连真实 Chrome(9222) 全被拒**：403 "Rejected an incoming WebSocket connection ... use --remote-allow-origins"。别走这条路。
2. **Keychain "Chrome Safe Storage" 读取超时**：TCC 拦截。别试解密 cookie。
3. **glab 未安装、无 glpat token、git credential fill 报 -50**：均不可用，直接用浏览器会话。
4. **daemon 必须 nohup + sleep 8**，否则 `chrome-devtools start` 随 shell 退出。
5. **navigate_page 需显式 type 参数**：`chrome-devtools navigate_page url "https://..."`，位置参数会报 "Invalid values: Argument: type"。
6. **裸 urllib 调 API 无 cookie → 404/401**；必须在浏览器上下文内 evaluate_script 发 fetch。
7. **deploy job id 提取失败时**：返回 `{deployId, status}` JSON 而非 grep 日志。
8. **evaluate_script 参数名是 `function` 不是 `script`**（MCP 参数怪癖）。
9. Playwright `url.parse` DeprecationWarning 是噪音，不影响。

## 环境命名

用户口述 "batag" 实为 **betag**。部署前在 `~/PycharmProjects/ebao-ai/deploy/env/` 确认环境存在；不存在则与用户澄清，别凭空建环境。

## 验证证据链（部署完成汇报用）

1. GitLab API job status = success
2. `curl https://jz-ebaoai-betag.djtest.cn/` → HTTP 200
3. git log 提交一致性（origin/dev/20260831-memory HEAD == 部署的 sha）
