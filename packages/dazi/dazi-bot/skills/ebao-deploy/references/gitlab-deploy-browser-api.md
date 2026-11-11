# 浏览器(chrome-devtools)触发 GitLab 部署 —— API 细节与踩坑

适用：djgit（djgit.daojia-inc.com）项目 ai-bus/ebao-ai 的流水线查询与 deploy-betaf~betaj manual job 触发。

## ⚠️ evaluate_script 参数坑（最高优先）

- 参数名是 **`function`**，不是 `script`。传 `script` → 报错 `Required at function`。
- 值必须是**匿名箭头函数**：`async () => {...}`。
- **禁止**函数声明形式：`async function run(){...}` → 报错 `Unexpected identifier 'run'`。
- 返回 JSON 用 `JSON.stringify(...)` 包裹（对象会被序列化成字符串回来）。
- 全部请求带 `{ credentials: 'include' }`（复用已登录会话，无 cookie 会 401）。

```js
// 正确姿势
async () => { const j = await (await fetch(url, { credentials: 'include' })).json(); return JSON.stringify(j); }
```

## 查询分支流水线 + deploy job 状态

```js
async () => {
  const pipes = await (await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines?ref=<分支名>&per_page=5', { credentials: 'include' })).json();
  const out = [];
  for (const p of pipes.slice(0,3)) {
    const jobs = await (await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines/'+p.id+'/jobs?per_page=100', { credentials: 'include' })).json();
    const deploys = jobs.filter(j => j.name && j.name.includes('deploy')).map(j => ({ id: j.id, name: j.name, status: j.status }));
    out.push({ id: p.id, ref: p.ref, status: p.status, deploys });
  }
  return JSON.stringify(out);
}
```

- 关注点：流水线 status（manual/success）、deploy-betX job 的 status（manual = 等触发）。

## 触发前必查：目标环境是否空闲

```js
async () => {
  const envs = await (await fetch('/api/v4/projects/ai-bus%2Febao-ai/environments?per_page=100', { credentials: 'include' })).json();
  const betas = envs.filter(e => e.name && e.name.toLowerCase().includes('beta')).map(e => ({ name: e.name, state: e.state, last_status: e.last_deployment ? e.last_deployment.status : null, last_ref: e.last_deployment ? (e.last_deployment.ref || '') : null }));
  return JSON.stringify({ betas });
}
```

- `state=available` = 空闲可部署；有 running/failed 部署挂起时先确认再来。
- **部署前必查**环境占用，避免覆盖别人正在验证的部署。

## 触发 manual deploy job（play）

```js
async () => {
  const csrf = document.querySelector('meta[name="csrf-token"]').content;
  const r = await fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/<jobId>/play', { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrf } });
  const text = await r.text();
  return JSON.stringify({ status: r.status, body: text });
}
```

- 必须带 `meta[name="csrf-token"]` 的 X-CSRF-Token 请求头，否则 403/422。
- 成功标志：HTTP 200 + 响应体里 job `status: "pending"`（挂起等 runner）。

## 触发后回查确认 running

```js
async () => {
  const j = await (await fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/<jobId>', { credentials: 'include' })).json();
  return JSON.stringify({ name: j.name, status: j.status, started_at: j.started_at, finished_at: j.finished_at, duration: j.duration });
}
```

- 状态链：manual → pending（触发成功）→ running（runner 接管）→ success/failed。
- 触发成功**必须回查一次**确认进入 running 再向用户报「已触发」。
