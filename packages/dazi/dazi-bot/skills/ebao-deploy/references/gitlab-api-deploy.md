# GitLab REST API 驱动部署（chrome-devtools 会话内 fetch）

> 2026-08-14 betag 部署 `dev/20260813-aiWorkerRecruit` 实战沉淀。无需手点 GitLab UI，全部用浏览器会话内 fetch GitLab API 完成，同一技巧通用于所有环境（betaf~betaj）。

## 前置：chrome-devtools 与 evaluate_script 的坑

- `evaluate_script` 参数名是 **`function`**（不是 `script`）。
- 只接受**匿名箭头函数**形式：`async () => {...}`。
- **不要**用 `async function run() {...}` 声明式，会报 `Unexpected identifier 'run'`。
- 请求要带 `credentials: 'include'`（复用已登录 GitLab 会话，否则 401）。

```js
// 正确写法示例
async () => { const j = await (await fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/10125', { credentials: 'include' })).json(); return JSON.stringify({name: j.name, status: j.status}); }
```

## 关键 API（项目路径 ai-bus%2Febao-ai）

| 目的 | 端点 | 说明 |
|---|---|---|
| 分支流水线 | `GET /api/v4/projects/ai-bus%2Febao-ai/pipelines?ref={branch}&per_page=5` | 拿最新 pipeline id/sha/status |
| 流水线 jobs | `GET /api/v4/projects/ai-bus%2Febao-ai/pipelines/{id}/jobs?per_page=100` | build-* 与 deploy-* 一起拿 |
| job 状态 | `GET /api/v4/projects/ai-bus%2Febao-ai/jobs/{id}` | 单 job 状态/时间 |
| 环境可用性 | `GET /api/v4/projects/ai-bus%2Febao-ai/environments?per_page=100` | 找 `state == "available"` 的空闲环境 |
| 触发 deploy | `POST .../jobs/{id}/play` | manual job → pending；需 CSRF header |
| 重放部署 | `POST .../jobs/{id}/retry` | 同 commit 重新部署，返回 201 + 新 job id |

CSRF token：`document.querySelector('meta[name="csrf-token"]').content`，POST 时放 `X-CSRF-Token` header。

```js
async () => {
  const csrf = document.querySelector('meta[name="csrf-token"]').content;
  const r = await fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/10125/play', { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrf } });
  const j = await r.json();
  return JSON.stringify({ http: r.status, id: j.id, status: j.status, ref: j.ref });
}
```

## Job 状态机（部署前必懂）

- build job 未全绿前，deploy-* job 是 **`created`**（不可触发）。
- 9 个 build 全部 success 后，deploy job 变为 **`manual`**（play 生效）。
- play 后：`manual → pending → running → success`。
- 触发失败常见原因：build 还没全 success 就去 play。

## 页面重置坑（重要）

- 页面若被重置/重新导航后，相对路径 fetch 会报 `Failed to parse URL from /api/...`——必须先 `navigate_page` 回 GitLab 域（如 `https://djgit.daojia-inc.com/ai-bus/ebao-ai/-/pipelines?page=1`），窗口对象才持有正确 base URL。
- 每次 fetch 前确认浏览器当前页仍在 GitLab 域；不在就先导航。

## 重放/重部署同 commit（最常见需求）

- 用户说「重新部署一遍」且分支无新 push 时，直接 `POST /jobs/{id}/retry`（原成功 job），得到新 job id 再查新 job 状态。
- 同 commit 重放有镜像缓存，秒级完成（实测 4.6s vs 首次 32s）。

## 最终验证（三重证据）

1. GitLab 单 job 状态 = success（带 started/finished/duration）。
2. chrome-devtools `navigate_page` 到目标域名，应跳转登录页（`/login?next=%2F`）。
3. curl 复核：`curl -k -s -o /dev/null -w "HTTP_CODE=%{http_code}" -L --max-time 20 https://jz-ebaoai-betag.djtest.cn/` 应返回 200。

## 流程口诀

1. git fetch 确认分支最新 commit（对照上次部署的 sha）。
2. 查分支最新 pipeline → jobs（看 build 与 deploy 状态）。
3. 若为新 commit：等 9 个 build 全 success → deploy 变 manual。
4. play 触发 → 轮询 job 到 success。若同 commit：直接 retry。
5. 三重验证（job success + 浏览器跳登录页 + curl 200）后交付。
