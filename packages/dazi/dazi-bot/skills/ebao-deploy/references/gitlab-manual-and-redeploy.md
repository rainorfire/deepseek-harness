# GitLab 手动部署与重复部署的坑（2026-08-12 两次 betag 部署实测）

## 坑A：流水线状态是 `manual` 不是 `success` —— 监控脚本别等 pipeline.status=success

- **现象**：deploy-betaf~betaj 的 job 是 **manual** 类型（需手动 play/retry 触发）。因此整条流水线的最终状态是 `manual`，**永远不会变成 `success`**。
- **后果**：写了「等 pipeline.status=success 再触发 deploy」的后台脚本会一直空等到超时（本次实际发生，脚本看了 3 次 manual 后被迫手动停掉）。
- **正解**：不要等流水线整体状态。改为轮询 `/api/v4/projects/ai-bus%2Febao-ai/pipelines/{id}/jobs`，等所有 **build 阶段** job 全部 `success` 后，立即手动 play 目标 deploy job。判断标准：build job 全绿 + deploy job 处于 manual/created 待触发态。

## 坑B：master 无新提交时重新部署 = 直接 retry 已有 deploy job，别重建镜像

- **背景**：同一 master 提交部署两遍（用户说「再重新部署」）时，镜像已构建过，重建纯属浪费时间。
- **正解**：
  1. `git fetch origin master` 后用 `git log FETCH_HEAD -1` 对比，确认无新提交；
  2. 浏览器（chrome-devtools navigate_page）打开流水线页，用 evaluate_script 查已有 deploy-betag job id（如 5303）；
  3. `POST /api/v4/projects/ai-bus%2Febao-ai/jobs/{id}/retry`（带 X-CSRF-Token 头）→ 返回 201 + 新 job id（本次 5303→5639），状态 pending→success，全程约 6 秒；
  4. `curl -k https://jz-ebaoai-betag.djtest.cn/` 验证 HTTP 200。
- 若想改触发方式而非重试（如换分支部署），用 `POST .../jobs/{id}/play`。

关键 API（chrome-devtools evaluate_script 内 fetch，credentials:'include'）：
```js
// 查流水线 job：
fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines/463/jobs', {credentials:'include'}).then(r=>r.json())
// 查单个 job 状态：
fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/5303', {credentials:'include'}).then(r=>r.json())
// 触发/重试，需 X-CSRF-Token（从 meta[name=csrf-token] 取）：
fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/5303/play', {method:'POST', credentials:'include', headers:{'X-CSRF-Token':csrf}})
fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/5303/retry', {method:'POST', credentials:'include', headers:{'X-CSRF-Token':csrf}})
```

## 坑C：verification 子代理在后台拿不到工具权限，只能 PARTIAL

- **现象**：spawn 的 verification 子代理（后台）执行 Bash/WebFetch/curl 全部被权限系统拦截，只能返回 PARTIAL「无法独立验证」。
- **正解**：主线程已实测的证据（GitLab API 查 job 状态 + curl 域名 HTTP 200 + git log FETCH_HEAD）即为可信结论；如实告知用户验证子代理被权限拦截而非部署有问题，把主线程实测数据列成表交付。

## 环境信息

- 访问入口：`10.40.30.151`（jz-ebaoai-betag.djtest.cn CNAME 到这，betaf~betaj 五个环境共用一台 Nginx，靠 Host 头区分路由）
- 部署执行/后端容器机：`10.40.131.82`（deploy-betag job 在此跑 docker compose pull + up）
- 老 git：`git@git.daojia-inc.com:ai-bus/ebao-ai.git`；新 git（触发 CI）：`git@djgit.daojia-inc.com:ai-bus/ebao-ai.git`
- 本地主仓库：`~/ebao-ai`（配了 origin + newgit 两个 remote；PycharmProjects/ebao-ai 只有 origin）
- fetch master 后本地无 `origin/master` 跟踪引用，用 `git log FETCH_HEAD -1` 查看最新提交
