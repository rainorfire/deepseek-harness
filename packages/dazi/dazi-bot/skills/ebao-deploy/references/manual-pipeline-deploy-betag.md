# 手动建流水线部署 betag（push 不自动触发 CI 的完整流程）

## ⚠️ 核心坑（2026-08-18 实测，同一会话踩了 4 次）

**push 到 newgit（djgit.daojia-inc.com）后不会自动创建 GitLab 流水线**——CI 只在手动/API 触发时跑。
用户推完代码直接说「部署 XX 分支」，**必须先比对 newgit 分支 tip**，否则会误以为 betag 已是最新代码（本会话前两次就因为查了本地旧分支，误报了「已部署最新」，实际压根没构建）。

**正确做法：永远先 `git ls-remote newgit refs/heads/{分支}` 拿分支真实 tip，再和本地 HEAD 比对，再按 sha 查流水线。**

## 标准流程（chrome-devtools + GitLab API）

前置：GitLab 页面已登录（djgit.daojia-inc.com），`navigate_page` 打开任意项目流水线页后，页面内 fetch API（带 `credentials: 'include'`）。项目 URL 编码：`ai-bus%2Febao-ai`。

### 0. 比对分支 tip
```bash
cd ~/ebao-ai && git fetch newgit && git ls-remote newgit refs/heads/{分支}
# 与本地 git log -1 HEAD 比对；tip 比本地新 → 有新代码待部署
```

### 1. 查该 sha 有无流水线（空数组 = 没构建过）
```js
const base = '/api/v4/projects/ai-bus%2Febao-ai';
const r = await fetch(base + '/pipelines?sha={完整sha}&per_page=5', { credentials: 'include' });
// 返回 [] → push 没触发 CI，必须手动建
```

### 2. 手动创建流水线（返回 201 即成功）
```js
const token = document.querySelector('meta[name="csrf-token"]').content;
const r = await fetch(base + '/pipeline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
  credentials: 'include',
  body: JSON.stringify({ ref: '{分支名}' })   // 用 ref，构建 sha 自动取分支 tip
});
// 201 + body.id 为新流水线 id，body.sha 应等于最新 tip
```

### 3. 等构建 job 全绿（约 3-5 分钟）
```js
const r = await fetch(base + '/pipelines/{id}/jobs?per_page=100', { credentials: 'include' });
// 过滤 stage==='build'||'build-assets' 的 job，等全部 success
// 节奏：build-frontend-assets 前置 → 其余 9 个镜像 build 并发
```

### 4. 触发 deploy-betag
```js
// 从 jobs 列表找 name==='deploy-betag' 的 job id，再 play
const r = await fetch(base + '/jobs/{jobId}/play', {
  method: 'POST', headers: { 'X-CSRF-Token': token }, credentials: 'include'
});
// 200 + status:'pending' 即触发成功
```

### 5. 等部署成功（健康时约 60s）
```js
const r = await fetch(base + '/jobs/{jobId}', { credentials: 'include' });
// status 从 pending→running→success；失败常见原因：容器健康检查 300s 超时
```

### 6. 验证证据链（三条齐全才算完成）
1. **部署日志含新 sha**：`GET /jobs/{id}/trace`，过滤 `Checking out|Pulling from`，应看到 `Checking out {sha} as detached HEAD` + `{sha}: Pulling from ai-bus/ebao-ai/ebao-sandbox-base`（镜像 tag 就是 sha）
2. **域名 200**：`curl -sk -o /dev/null -w '%{http_code}' https://jz-ebaoai-betag.djtest.cn/`
3. **sha 三端一致**：newgit tip = 流水线 sha = 部署日志 checkout sha

## chrome-devtools MCP 注意点

- `evaluate_script` 只认 `function` 参数（async 函数），传 `expression` 会报 `Invalid arguments... Required at function`；传入普通表达式报 `fn is not a function`。
- **浏览器会频繁重启**（内核重启/会话切换）：重启后相对路径 fetch 报 `Failed to parse URL from /api/v4/...`，先 `navigate_page` 回到 djgit 页面再跑 API。
- 需要周期性轮询时，把等待放进脚本内 `await new Promise(r=>setTimeout(r,N))` 比反复调 Sleep 更稳。

## 交付提醒

1. 部署完成提示用户：本地 `~/ebao-ai` 会滞后（`git fetch newgit` 同步）
2. 提醒在群里同步 betag 占用/释放
3. 测完功能可帮合回发版分支（如 `release/ebao_daily_release_0818`），merge + push 老 git
4. push 不自动触发 CI 若成常态，建议提工单恢复，或约定「推完代码发指令触发部署」
