# 2026-08-27 betag 部署新坑实录（dev/20260825-sandboxLoginCookie → betag）

> 场景：分支部署 betag，`build-frontend-assets` 构建秒挂（~37s）。排查后确认是**分支代码残留 Git 合并冲突标记**，不是 CI 基建问题。以下是完整诊断链路与通用坑。

## 坑6：构建失败 → 先查「合并冲突标记」，不要盲目重建流水线

**现象**：`build-frontend-assets` 37 秒就 failed，其余 9 个 build job 全部 skipped。**此时重建流水线必然再失败**，先诊断根因再动手。

**诊断链路**：
1. 拉失败 job 日志尾部：`GET /api/v4/projects/{id}/jobs/{job_id}/trace`，tail 末尾 4KB。
2. 日志关键词：`Merge conflict marker encountered` / `Syntax Error` + `Import trace for requested module`，日志里会给出冲突文件路径。
3. 本地复核冲突标记（关键一步，别只用 CI 日志下结论）：
   ```bash
   git show <remote>/<branch>:<file_path> | grep -n -E '^(<<<<<<<|=======|>>>>>>>)'
   ```
   例：`git show newgit/dev/20260825-sandboxLoginCookie:ebao-ai-frontend/src/app/platform/_components/PlatformAppKnowledgeScreen.tsx`

**定位冲突来源**：标记行形如 `>>>>>>> dev/sms-tool` —— 说明该分支合并 `dev/sms-tool` 时冲突未解决就提交推送了。

**处置原则**：
- 冲突标记属于**分支代码问题**，不是部署流程问题——部署 agent 不要擅自动分支代码。
- 逐组看冲突两侧内容再给「保留哪侧」建议：功能差异（一侧有函数另一侧没有）→ 保功能全的一侧；纯埋点 ID 差异（如 `onClose_WVY13QES` vs `onClose_W2B29GZH`）→ 保本分支侧即可（本分支 = HEAD 侧）。
- 用户已自己 merge master 修复后重新提交 → 重新 fetch 确认新 commit，直接从「建流水线」继续，无需重查环境（但 CI 基建文件仍建议快速核一遍）。

## 坑7：chrome-devtools `evaluate_script` 的 function 参数格式（三连坑）

工具要求 `function` 参数必须是**函数表达式，工具自己调用它**：
- ❌ 裸表达式 `const token = ...; const resp = await ...` → `Error: Unexpected token 'const'`
- ❌ 立即调用 `(async () => { ... })()`（带括号自执行） → `Error: fn is not a function`
- ✅ 直接写 `async () => { ... }`（不要加调用括号）→ 正常执行

同理 `navigate_page` 必须带 `pageId`（先 `list_pages` 拿 pageId，通常是 1）；chrome 页面每次会话开始常被重置为 `about:blank`（坑4），用 list_pages → navigate(pageId:1) 回 GitLab。

## 坑8：判断「环境是否空闲」的可靠方法

- GitLab environments API 的 `last_deployment` 恒为 null（当前版本不返回部署详情），别依赖它。
- 改查：`pipelines?status=running`（有无人在占用 betag）+ environments 页面快照里的「等待中」部署记录。
- 环境页快照中「等待中」= stale **pending manual** 部署记录（如挂了一晚的 #10195，何杨的），**不阻塞新部署**——只要没有 active deployment 就算空闲。
- 别人 running 流水线要确认其 deploy job 的目标环境（比如 eval 模块只 deploy betad，就不碰 betag）。

## 坑9：work-dazi 环境 Sleep 总是被打断 / Bash sleep 被阻止 → 轮询策略

- `Sleep` 工具在这个环境「Sleep interrupted after 0s」立即返回；`Bash sleep 180 && ...` 会被执行控制拦截。
- 正确做法：**反复用 evaluate_script 轮询 job 状态**（`pipelines/{id}/jobs` 过滤 build 前缀），部署 job 轮询 `jobs/{id}` 看 status/finished_at。每次轮询间隔靠「查询本身 + 整理输出」的自然耗时即可。
- deploy job 触发后务必回查一次 `jobs/{id}` 确认真实状态（见坑5：play 返回 400 "Unplayable Job" 时 job 实际已 running→success）。

## 坑10：触发 deploy 用 evaluate_script 建流水线/play job 的规范姿势

建流水线（CSRF token 从 meta 取）：
```js
async () => {
  const token = document.querySelector('meta[name="csrf-token"]')?.content;
  const resp = await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
    credentials: 'include',
    body: JSON.stringify({ ref: '<branch>', variables: [{ key: 'DEPLOY_TO', value: 'betag' }] })
  });
  const data = await resp.json();
  return JSON.stringify({ status: resp.status, id: data.id, web_url: data.web_url });
}
```
返回 201 + id 即成功。

## 本次成功收尾模板（三条证据链）

| 验证项 | 结果示例 |
|--------|----------|
| 流水线 | #2622 ref=dev/20260825-sandboxLoginCookie DEPLOY_TO=betag |
| 构建 | 10 个 build job 全部 success |
| 部署 job | deploy-betag (job 22461) → success，finished_at 时间戳 |
| 域名 | curl -sI https://jz-ebaoai-betag.djtest.cn → HTTP/2 200（x-powered-by: Next.js） |
| commit 一致性 | 部署 commit = newgit 分支 tip（如 720295f11） |

收尾询问用户：是否合回老 git 发版分支（影响共享分支需确认）、bata 测试完群里通知同事释放环境。
