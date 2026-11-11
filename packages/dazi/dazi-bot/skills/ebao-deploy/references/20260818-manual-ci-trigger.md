# 2026-08-18 实战沉淀：branch push 后不自动触发 CI，需手动建流水线

## 核心结论
**ebao-ai 分支 push 到 newgit（djgit.daojia-inc.com）后不再自动触发 CI 流水线。**

本会话连续 3 次踩坑（`5552947`→`f431d960`→`744e40ef`），每次都查不到对应 sha 的流水线记录。技能描述里的「推新 git 触发镜像构建」已过时——**push 后不会自动建 pipeline**。

## 标准手动部署链路（chrome-devtools + GitLab API）

1. **取分支真实最新 tip**（本地可能落后！）：
   - `git ls-remote newgit | grep refs/heads/<branch>` 拿远端真实 sha
   - `git fetch newgit` + `git diff <本地sha> <远端sha> --stat` 看差异
2. **按 sha 查是否有流水线**：
   - `fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines?sha=<full_sha>')` → 空数组 `[]` = 没构建过，需手动建
3. **手动建流水线**（POST /pipeline，body `{ref: '<branch>'}`）：
   - 需带 CSRF token：`document.querySelector('meta[name="csrf-token"]').content`
   - 返回 201 + pipeline_id + sha 确认构建的就是最新代码
4. **等构建全部 success**（约 10 个 build job：frontend-assets 先行，其余并行）：
   - 轮询 `fetch('/api/v4/projects/ai-bus%2Febao-ai/pipelines/<id>/jobs')`
   - 浏览器里用 `await new Promise(r => setTimeout(r, 60000))` 脚本内等待代替外部 sleep（本环境 Sleep 常被中断）
5. **触发 deploy-betag**（job id 在 jobs 列表里按 `name === 'deploy-betag'` 找）：
   - `POST /api/v4/projects/ai-bus%2Febao-ai/jobs/<id>/play`，同样带 CSRF token
6. **验证部署成功**（三条证据链）：
   - job 状态 success：`fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/<id>')`
   - trace 日志含 `Checking out <sha> as detached HEAD` + `Pulling from ai-bus/ebao-ai/...` 镜像 tag 与 sha 一致
   - `curl -sk https://jz-ebaoai-betag.djtest.cn/` → HTTP 200 + `<title>鹅宝 · 你的全能家政助手</title>`

## 关键坑

### 1. 「已部署」误判陷阱（本会话实际发生）
第一次核看以为「betag 已是最新代码」——因为只比对了本地与流水列表，没查 `f431d960` 是否真有流水线。
**教训：必须先 ls-remote 拿远端 tip → 按 sha 查流水线 → 无则手动建。绝不能凭「流水线列表里最上面一条 / 本地同步」判断已部署。**

### 2. 部署时长两种形态
- **首次/镜像变更**：约 9-10 分钟（容器健康检查 300s 超时，日志尾部显示容器其实已起来，job 报错是健康检查超时）
- **镜像已缓存**：约 60 秒（如 59.6s、65.2s）
  部署 60s 左右即 success 属正常（镜像已有），不要误判为失败；用 trace 里 `Checking out <sha>` 确认版本

### 3. evaluate_script 参数名是 `function`（async 函数形式），不是 expression
```
{ function: "async () => { const r = await fetch(...); ...; return ... }" }
```
传 `expression` 会报 `Invalid arguments ... Required at function`。

### 4. 页面重置后必须重新 navigate
内核重启/页面关闭后相对 URL fetch 会报 `Failed to parse URL`，需先 `navigate_page` 回 GitLab 域再 fetch。

### 5. 双仓库注意主仓库
`~/ebao-ai`（配 newgit+origin）是活跃仓库；`~/Documents/我的文件/dazi/ebao-ai` 只有老 git origin。别在错误的仓库上操作。

## 其他环境（betaf~betan）
同一流水线的其他 deploy-* job 保持 manual 待触发；只有被触发的那个环境会部署。核看环境占用用 `GET /environments`（name 含 betag 且 state=available）。
