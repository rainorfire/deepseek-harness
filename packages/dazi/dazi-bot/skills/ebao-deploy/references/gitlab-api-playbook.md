# GitLab（djgit）浏览器自动化 API Playbook

> 来源：2026-08-05 实战部署 dev/20260804-qualityEval 到 betag 全程试错跑通。
> 环境：Chrome DevTools MCP + 已登录 djgit.daojia-inc.com 的浏览器会话（fetch 带 credentials:'include'）。

## 前置：页面必须在 djgit 域内

- 相对路径 fetch 依赖当前页面在 `djgit.daojia-inc.com` 域内。内核重启后浏览器页面会重置成 `about:blank`，**必须先 navigate_page 回到 djgit 页面**再执行相对路径 API。
- 项目 URL 编码：`ai-bus/ebao-ai` → `ai-bus%2Febao-ai`。

## 常用端点（fetch + credentials:'include'）

### 查分支列表
```js
fetch('/api/v4/projects/ai-bus%2Febao-ai/repository/branches?per_page=100&search=20260804', { credentials: 'include' })
  .then(r => r.json()).then(d => JSON.stringify(d.map(b => b.name)))
```

### 查 pipeline 列表（按分支过滤）
```js
fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines?ref=dev%2F20260804-qualityEval&per_page=5', { credentials: 'include' })
  .then(r => r.json()).then(d => JSON.stringify(d.map(p => ({ id: p.id, status: p.status, ref: p.ref, sha: (p.sha||'').slice(0,8) }))))
```

### 查 pipeline 内全部 job 状态
```js
fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines/151/jobs?per_page=100', { credentials: 'include' })
  .then(r => r.json()).then(d => JSON.stringify(d.map(j => ({ name: j.name, status: j.status, stage: j.stage, id: j.id }))))
```

### 读 job 日志（trace）
```js
fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/926/trace', { credentials: 'include' })
  .then(r => r.text()).then(t => t.slice(-2500))
```

### 读任意分支某文件内容（判断文件是否存在）
```js
// 404 = 该分支上没有此文件
fetch('/api/v4/projects/ai-bus%2Febao-ai/repository/files/.gitlab-ci.yml/raw?ref=dev%2F20260804-qualityEval', { credentials: 'include' })
  .then(r => r.status === 404 ? 'NOT_FOUND' : r.text())
```

## 触发 deploy job（⚠️ 必须带 CSRF token）

GitLab 的 POST API 需要 `X-CSRF-Token` 头，否则返回 **401 Unauthorized**。token 从页面 meta 取：

```js
// 1) 先取 token
const csrf = document.querySelector('meta[name="csrf-token"]')?.content;

// 2) 再 POST play（触发手动 job，如 deploy-betag）
fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/948/play', {
  method: 'POST',
  credentials: 'include',
  headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content }
}).then(r => r.json()).then(j => JSON.stringify({ id: j.id, name: j.name, status: j.status }))
```

- 不带 token 直接 POST → 401；返回空对象 `{}` 但 job 状态没变也说明没触发成功。
- 触发成功返回 job 对象（status=pending），随后轮询 `/jobs/{id}` 可看到 running → success。

### 给 GitLab 账号加 SSH key（浏览器自动化）
```js
const csrf = document.querySelector('meta[name="csrf-token"]').content;
fetch('/api/v4/user/keys', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
  body: JSON.stringify({ title: 'chenyujia-macbook-ebao-ai', key: '<公钥内容>' })
}).then(r => r.json())
// 201 = 成功（返回含 id），用于解决新 git SSH Permission denied (publickey)
```

## pipeline 状态语义（判读）

| 状态 | 含义 |
|------|------|
| `created` | job 排队未开始 |
| `running` | 正在执行 |
| `manual` | **构建已完成，deploy 类 job 等待手动触发**（pipeline 整体显示 manual 时同理） |
| `success` | 成功 |
| `failed` | 失败 |
| `skipped` | 被跳过（上游失败导致） |

## 部署机器映射

- 5 个环境域名统一 CNAME → `op-web-bjjz-tlan-qt.djtest.cn` → 入口机 **10.40.30.151**（Nginx，靠 Host 头分流）。
- 各环境 deploy 目标机器见 `.gitlab-ci.yml` 的 `DEPLOY_HOST` 变量（如 betag → **10.40.131.82**）。
- 部署动作 = deploy job 在目标机执行 `docker compose pull + up -d`，拉 7 个镜像一般 1-3 分钟，job 状态 success 即部署完成。

## 常见构建失败排查

见 SKILL.md 主文「分支缺 CI 基建文件」一节：
- 分支缺 `.gitlab-ci.yml` → push 不触发 pipeline（GitLab 只为带 CI 文件的分支建 pipeline）。
- 分支缺 `Dockerfile-ci`（7 个）→ kaniko 构建全部 exit 1（`BUILD_DOCKERFILE: Dockerfile-ci` 找不到文件）。
- 修复：从最新发版分支 `dev/ebao_daily_release_XXXX` 同步缺失的 CI 基建文件（约 23 个：7×Dockerfile-ci + docker-compose-ci.yml + betaf~betaj 的 env/nginx/dsf 配置），commit 后仅推新 git，不动老 git 真源。
