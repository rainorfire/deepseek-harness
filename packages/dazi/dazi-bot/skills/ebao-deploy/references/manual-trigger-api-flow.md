# ebao-ai 手动触发部署流程（2026-08-19 起）

## 背景：CI 已改为全手动触发

- 2026-08-19 起 `.gitlab-ci.yml` 的 `workflow.rules` 将 `$CI_PIPELINE_SOURCE == "push"` 设为 `when: never` → **push 不再自动触发构建**
- CI 配置注释写明触发方式（glab CLI）：
  - `glab ci run -b <分支>` → 全量构建，deploy job 手动触发
  - `glab ci run -b <分支> --variables SERVICE:<模块>` → 部分构建，deploy job 不出现
  - `glab ci run -b <分支> --variables SERVICE:<模块>,DEPLOY_TO:<环境>` → 部分构建 + 自动部署
  - `glab ci run -b <分支> --variables DEPLOY_TO:<环境>` → 全量构建 + 自动部署（发版）
- **本机未装 glab**（`which glab` → not found）→ 用已登录的 Chrome 会话走 GitLab API 等价实现

## 关键事实

- 老 git `git@git.daojia-inc.com:ai-bus/ebao-ai.git`：代码真源，发版分支在这、最终 merge 回来
- 新 git `git@djgit.daojia-inc.com:ai-bus/ebao-ai.git`：跑 CI/CD
- betag：`DEPLOY_HOST=10.40.131.82`，URL `https://jz-ebaoai-betag.djtest.cn`
- deploy 模板 job 规则：`$DEPLOY_TO == "<env>"` 时自动跑；`$SERVICE` 为空时所有环境 deploy job 以 manual 出现

## API 手动触发流程（Chrome 会话，免 glab）

### 1. 确认分支已推新 git

```bash
cd /Users/chenyujia/ebao-ai && git fetch newgit --prune
git ls-remote newgit dev/xxx   # 拿 HEAD sha
```

### 2. 查流水线（push 后无流水线是预期的，勿误判）

```js
// GET /api/v4/projects/ai-bus%2Febao-ai/pipelines?ref=<encodeURIComponent(分支)>&per_page=5
// 返回空数组 = 正常（push 禁用后不会自动建流水线），不代表分支没推上去
```

### 3. 确认环境空闲

```js
// GET /api/v4/projects/ai-bus%2Febao-ai/environments?per_page=30
// 看目标环境 state == "available"
```

### 4. 创建流水线（带 DEPLOY_TO 变量）

```js
const token = document.querySelector('meta[name="csrf-token"]')?.content;
const r = await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipeline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
  credentials: 'include',
  body: JSON.stringify({ ref: 'dev/xxx', variables: [{ key: 'DEPLOY_TO', value: 'betag' }] })
});
// 成功 HTTP 201，返回 pipeline.id / sha / ref
```

### 5. 等构建（10 个 build job）

- `GET /api/v4/projects/ai-bus%2Febao-ai/pipelines/<id>/jobs?per_page=50`，过滤 `stage !== 'deploy'`
- `build-frontend-assets`（npm build）最耗时，其余 kaniko 镜像 job 排队等它
- 等待用后台 Bash `sleep`（run_in_background: true）+ TaskOutput 阻塞；**勿用 Sleep 工具**（会被用户/系统中断），`sleep N && echo` 会被沙箱拦（blocking command 规则）

### 6. 触发 deploy job

```js
const token = document.querySelector('meta[name="csrf-token"]')?.content;
await fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/<job_id>/play', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
  credentials: 'include'
});
```

### 7. 验证（三条证据链）

1. deploy job 状态：`GET /api/v4/projects/ai-bus%2Febao-ai/jobs/<job_id>` → `status: success`（实测 73s）
2. 域名访问：`curl -sI https://jz-ebaoai-betag.djtest.cn/` → HTTP 200 + `x-powered-by: Next.js`
3. 提交一致性：流水线 sha == 分支 HEAD

## 已知坑

- **play 返回 400 "Unplayable Job" ≠ 失败**：GitLab 对已排队 job 的 play 偶尔报 400，但 job 实际已变 running 并成功 → **以最终 job 状态为准**，不要被 400 误导去重试/换 job
- **流水线整体 status 显示 `manual` 不奇怪**：SERVICE 为空时所有环境 deploy job 都出现（created 态），只触发目标那个即可，其余保持未触发不影响结果
- **按 ref 查流水线为空是预期**（见第 2 步），别怀疑分支没推上去，先查 `.gitlab-ci.yml` 的 workflow.rules 再下结论
- 部署类任务完成后主代理给「GitLab API job status + curl 域名 + git log sha 一致性」三条证据链即可，勿依赖验证子代理（沙箱权限常被拒）
