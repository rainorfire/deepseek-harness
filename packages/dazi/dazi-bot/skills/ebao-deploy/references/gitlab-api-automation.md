# GitLab API 浏览器自动化（chrome-devtools evaluate_script）

部署全流程（查流水线→查 job→play 触发→轮询完成→验证）都用 `mcp__chrome-devtools__evaluate_script` 在已登录的 GitLab 页面上 fetch 内部 API 完成。以下为**实测可复用脚本 + 踩坑清单**（2026-08-17 betag 部署两轮验证）。

## 必踩的 4 个坑（先看这个）

1. **参数名是 `function` 不是 `script`**：`evaluate_script` 的入参键是 `function`，用 `script` 会报 `Input validation error: Required at function`。
2. **必须是 async 箭头函数表达式**：值为 `async () => { ... }`，不能是裸 `const resp = await fetch(...)` 语句——会报 `Unexpected token 'const'`。
3. **相对路径 fetch 依赖页面上下文**：页面被重置/导航后相对路径会失败（`Failed to parse URL from /api/...`）。先 `navigate_page` 回 GitLab 对应页（如 pipelines 列表页），再 evaluate fetch。
4. **ref 含 `/` 时 `?ref=` 参数会炸**：`pipelines?ref=dev%2F20260813-aiWorkerRecruit` 在浏览器 fetch 里报 `Failed to parse URL`。**别用 ref 过滤，拉全量再客户端 filter**：`pipelines?per_page=50` → `pipes.filter(p => (p.ref || '') === 'dev/xxx')`。

## 查询脚本模板

### 1. 查分支最新流水线（不传 ref，客户端过滤）
```js
async () => {
  const resp = await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines?per_page=50', { credentials: 'include' });
  const pipes = await resp.json();
  return JSON.stringify(pipes.filter(p => (p.ref || '') === 'dev/20260813-aiWorkerRecruit').slice(0, 6).map(p => ({id: p.id, status: p.status, created: p.created_at, sha: p.sha.slice(0, 8)})));
}
```
注意：`status: 'manual'` 表示构建完成、deploy job 待手动触发；`success` 表示整条流水线已跑完。

### 2. 查流水线的 jobs（含 deploy-betaf~betaj）
```js
async () => {
  const resp = await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines/1018/jobs?per_page=100', { credentials: 'include' });
  const jobs = await resp.json();
  return JSON.stringify(jobs.filter(j => j.name.includes('deploy') || j.status === 'failed').map(j => ({id: j.id, name: j.name, status: j.status})));
}
```

### 3. 查单个 job 详情（判断是否已部署过 / 是否有历史记录）
```js
async () => {
  const resp = await fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/10894', { credentials: 'include' });
  const j = await resp.json();
  return JSON.stringify({id: j.id, name: j.name, status: j.status, ref: j.ref, started_at: j.started_at, finished_at: j.finished_at});
}
```
**摸底必查**：同名 deploy-betag job 可能早已 success（代码已在目标环境），触发前先确认避免重复部署。查环境是否被其他分支覆盖：`jobs?scope[]=success&scope[]=manual&per_page=100` 过滤 `j.name === 'deploy-betag'`。注意 `environments/{id}/deployments` 常因权限返回非数组（`deps.map is not a function`），别依赖它。

## 触发 deploy job（play）
```js
async () => {
  const csrf = document.querySelector('meta[name="csrf-token"]');
  const token = csrf ? csrf.content : null;
  const resp = await fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/10894/play', {
    method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': token }
  });
  const body = await resp.json();
  return JSON.stringify({status: resp.status, token_found: !!token, job: body.id, job_status: body.status});
}
```
返回 `job_status: 'pending'` 即触发成功，会生成**新 job id**（如 10894 → 11576），后续轮询新 id。

## 轮询 job 直到终态（一次调用拿结果，避免多次 Sleep）
```js
async () => {
  const start = Date.now(); let j = null;
  while (Date.now() - start < 240000) {
    const resp = await fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/11576', { credentials: 'include' });
    j = await resp.json();
    if (['success', 'failed', 'canceled', 'skipped'].includes(j.status)) break;
    await new Promise(r => setTimeout(r, 5000));
  }
  return JSON.stringify({id: j.id, status: j.status, started_at: j.started_at, finished_at: j.finished_at, duration: j.duration});
}
```
deploy 单次约 30~60s，240s 上限足够。

## 部署前摸底清单（触发前必须过一遍）
1. 本地仓库 + 远端分支 HEAD 一致？`git ls-remote origin <branch>` vs `git log -1`（本地有未提交改动要单独披露）。
2. 目标分支最新流水线 build job 全 success？deploy-betag job 是否已 success（已部署过则问用户是否重部署）？
3. 目标环境是否被其他分支覆盖？（查 deploy-betag 最近执行记录的 ref）
4. 分支有新提交 且 本地有未提交改动 → **AskUserQuestion 让用户选**「只部署已推送 vs 带上本地改动」，不要自作主张。

## 验证三步
1. job status = success（新 job id，如 #11603）。
2. `curl -sk -w "HTTP %{http_code}" https://jz-ebaoai-betag.djtest.cn/` → 200；`grep -oiE "<title>[^<]*</title>"` 检查标题。
3. git log 确认部署版本 = 本地/远端 HEAD（提交 hash 对上）。
三条齐了再报完成。
