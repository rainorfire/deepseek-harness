# 2026-08-27 betag 部署实战：chrome-devtools MCP 参数怪癖 + 等待构建的正确姿势

本次部署 dev/20260825-sandboxLoginCookie → betag（多次重复部署，含用户修复冲突后重推）沉淀的实操经验，全部在真实会话中踩坑验证。

## 1. chrome-devtools MCP 参数怪癖（最容易反复踩的坑）

- `navigate_page` / `take_snapshot` / `evaluate_script` 都**强制要求 `pageId`**，缺了报 `Required at pageId`。每次先 `list_pages` 拿当前页 ID（通常是 1）。
- `evaluate_script` 的参数名是 **`function`**（不是 `expression`），传 `expression` 会报 `Required at function`。
- `function` 值必须写 **`async () => { ... }`** 形式的箭头函数；
  - 裸 `const token = ...` 开头 → 报 `Unexpected token 'const'`
  - 写成 `(async () => { ... })()` 立即执行形式 → 报 `fn is not a function`
  - 正确：`"function": "async () => { const resp = await fetch(...); return JSON.stringify(...); }"`
- 返回值要 `JSON.stringify` 后 return，否则拿到 `[object Object]` 或结构难读。

## 2. 等待构建/部署的可靠方式（Sleep 会被打断）

Sleep 工具在这个环境里几乎总是 `Sleep interrupted after 0s`，所以**不要靠 Sleep + 反复轮询**。最稳的方式是**在浏览器里跑一段阻塞轮询脚本**，一次调用等到目标状态：

```js
const deadline = Date.now() + 5 * 60 * 1000; // 最多等 5 分钟
while (Date.now() < deadline) {
  const jobs = await (await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines/2718/jobs?per_page=50', { credentials: 'include' })).json();
  if (!Array.isArray(jobs)) { await new Promise(r => setTimeout(r, 10000)); continue; }
  const builds = jobs.filter(j => j.name && j.name.startsWith('build'));
  if (builds.every(b => b.status === 'success')) {
    return JSON.stringify({ done: true, allSuccess: true, builds: builds.map(b => ({ name: b.name, status: b.status })) });
  }
  await new Promise(r => setTimeout(r, 10000));
}
```

部署 job 同理：轮询 `jobs/{id}` 直到 `status === 'success'`。真实会话中这套脚本一次调用就等到了「10/10 build success」和「deploy-betag success」，比反复手动查快得多。

## 3. GitLab API 响应结构坑

- `/environments` 返回的 `last_deployment` 恒为 **null**（该版本 API 不返回部署详情），**不要用 last_deployment 判断环境占用**。改用：查 `?status=running` 的流水线 + 查每条 running 流水线的 jobs 里是否含目标 deploy job。
- `/pipelines/{id}/variables` 可能返回 `403 Forbidden` 对象而非数组；`/environments/{id}/deployments` 也可能返回错误对象。**fetch 结果先 `Array.isArray()` 判型**，不是数组就包一层错误信息返回，别直接 `.map()`（会抛 `xxx.map is not a function`）。
- 判断环境空闲的判定逻辑：别人的流水线部署到别的环境（如 deploy-betaa）不冲突，只有含 `deploy-betag` 的 running 流水线才算占用。

## 4. 构建日志判读

- `Compiled with warnings in 40s` + `bufferutil`/`utf-8-validate`/`supports-color` 缺失是**经典非阻塞警告**（WebSocket/Node 可选依赖），**不代表失败**。不要看到 stderr 文件列表就判失败，要看 job `status` 和末尾 `Job succeeded` / `Uploading artifacts for successful job`。
- 前端 job trace 用 `jobs/{id}/trace` 拉尾巴（`.slice(-4000)` 或取最后 60 行），能确认实际 checkout 的 commit 和当前阶段（npm ci / lint / 打包）。

## 5. 冲突残留检查的误报

`git grep -n -E '^(<<<<<<<|=======|>>>>>>>)' -- '*.tsx' '*.ts' '*.js' '*.py'` 会把 **Markdown 表格线（=======）当冲突标记**误报（本次 repo.py 里就是 Markdown 表格线）。可靠判据：只看 `<<<<<<<` 和 `>>>>>>>` 成对出现，`=======` 单独出现不算。或限定只在源文件扩展名里搜且人工核对上下文。

## 6. 其他

- 浏览器页面会被重置成 `about:blank`（内核重启），每次会话先 `list_pages` 再导航，别假设还停在 GitLab。
- 触发 deploy 时 play 返回 400 `Unplayable Job` 是老问题（新 CI 下 deploy job 在构建完成后可能自动进入 running，无需手动 play）——回查 job 实际状态，已 running/success 就不算失败。
- 三条证据链（GitLab job status + curl 域名 HTTP 状态 + git commit 一致性）是部署完成的标准验证，验证代理在沙箱全拒下常返回 PARTIAL，由主代理重跑证据闭环即可。
