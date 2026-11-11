# 手动建流水线 + 验证（2026-08-19 起 push 自动触发已禁用）

## 关键认知：带 DEPLOY_TO 变量建流水线 = 发版模式，deploy job 自动触发

用 GitLab API 建流水线时，在 `variables` 里带 `{key: 'DEPLOY_TO', value: '<环境>'}`（如 betag），CI 会识别为发版模式：

- 对应环境的 deploy job（deploy-betag）**自动触发**，无需手动 play ✅（2026-08-19~20 在 betag 验证 4 次）
- 不带 DEPLOY_TO 时，14 个环境的 deploy job 全部以 `manual` 状态出现
- SERVICE 为空时所有环境的 deploy job 都会出现，只触发目标环境即可

## 已验证 API 片段（chrome-devtools evaluate_script，需传 async IIFE 作 function）

### 1. 建流水线（返回 201 + pipeline id）

```js
const token = document.querySelector('meta[name="csrf-token"]')?.content;
fetch('/api/v4/projects/ai-bus%2Febao-ai/pipeline', {
  method: 'POST',
  headers: {'Content-Type': 'application/json', 'X-CSRF-Token': token},
  credentials: 'include',
  body: JSON.stringify({ref: BRANCH, variables: [{key: 'DEPLOY_TO', value: 'betag'}]})
})
```

### 2. 查流水线 job 列表

```js
fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines/{id}/jobs?per_page=50')
```

### 3. 轮询单个 job 状态

```js
fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/{jobId}')
// → {status, started_at, finished_at, duration}
```

### 4. 看 job trace（确认构建/部署进度，防误判卡死）

```js
fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/{id}/trace')
// → 文本，tail 行出现 "Extracting ...MB"/"Pull complete" 表示镜像层拉取中
```

### 5. 手动 play（兜底；可能返回 400 Unplayable Job，以回查 job 状态为准）

```js
fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/{id}/play', {
  method: 'POST',
  headers: {'Content-Type': 'application/json', 'X-CSRF-Token': token},
  credentials: 'include'
})
```

## 轮询与耗时预期

- 本环境 Sleep 工具会被立即中断（0s），改用 `Bash sleep N`（run_in_background）+ TaskOutput(block=true) 或直接轮询 API
- 单模块部署约 70s；多模块改动（镜像层拉取）最长见过 425s，用 trace 确认进度而非当卡死
- 部署完成后流水线整体状态显示 `manual` 属正常（其他环境 deploy job 未触发）

## 部署验证三条证据链

1. GitLab API job 状态：deploy-betag job success（含 started_at→finished_at 时长）
2. curl 域名：https://jz-ebaoai-betag.djtest.cn 返回 200
3. git sha 一致性：部署 job 日志 `Checking out <sha>` 与分支 HEAD 一致
