# betag 重部署与 Chrome DevTools 脚本坑（2026-08-14 实战）

## 一、同 commit「重新部署一遍」= retry，不是建新流水线

用户说「重新部署一遍 XX 分支」时：

1. **先 `git fetch origin` + `git log origin/<branch>` 对比分支最新提交**，确认与上次部署的 commit 是否一致。
2. **分支无新提交** → 直接对上次已 success 的 deploy job 调 retry API（不是 play！）：
   ```
   POST /api/v4/projects/ai-bus%2Febao-ai/jobs/{job_id}/retry
   Header: X-CSRF-Token（页面 meta[name=csrf-token]）
   → HTTP 201，返回新 job id（如 10293 → 10586），ref/commit 不变
   ```
3. **同 commit + 镜像缓存** → 部署极快（实测 4.6 秒完成，11:34:23→11:34:27）。
4. **分支有新提交** → 正常触发新流水线，等 9 个 build 全 success、deploy-betag 变 manual 后再 play。

## 二、deploy 触发前置检查

- 查环境是否空闲：`/api/v4/projects/ai-bus%2Febao-ai/environments?per_page=100`，看 betag 的 `state` 为 `available` 且无 running 部署。
- 只有 pipeline 状态 manual / deploy job 显示 manual 时 play 才有效；build 还在 created/running 时 play 会失败。

## 三、chrome-devtools evaluate_script 参数坑（踩了 3 次）

1. **参数名是 `function`，不是 `script`**（传 script 报 `Required at function`）。
2. **必须是匿名箭头函数** `() => ...` / `async () => {...}`，不能写 `async function run(){...}`（报 `Unexpected identifier 'run'`）。
3. **页面被重置/导航走后，相对路径 fetch 报 `Failed to parse URL from /api/...`** → 必须先 `navigate_page` 回 GitLab 页面，再执行基于相对路径的 fetch 脚本。fetch 前建议带上 `document.querySelector('meta[name="csrf-token"]').content` 取 CSRF。

示例（查流水线构建与 deploy 状态）：
```js
async () => { const p = await (await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines/960', { credentials: 'include' })).json(); const jobs = await (await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines/960/jobs?per_page=100', { credentials: 'include' })).json(); return JSON.stringify({pipeline_status: p.status, builds: jobs.filter(j => j.name && j.name.startsWith('build-')).map(j => ({name: j.name, status: j.status})), deploy: jobs.find(j => j.name === 'deploy-betag')}); }
```
