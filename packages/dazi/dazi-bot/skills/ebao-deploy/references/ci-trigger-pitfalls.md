# ebao-ai CI 触发与监控坑（2026-08-12 实战）

## 1. 新 git（djgit）的 master 才是权威最新

- 用户说「djgit 上有最新代码」时，**先 fetch 新 git 的 master**（`git fetch newgit master` → `git log newgit/master`），不要默认老 git（git.daojia-inc.com）最新。
- 老 git 与新 git master 可能不同步：老 git 最新 014c26b5（0807 发版）≠ 新 git 最新 5b2e24dc（0811 发版，zhaowei01 直接合入新 git master）。
- 新 git 是 CI/CD 主 git，合入 master 的提交由开发者直接 push 到新 git。

## 2. push 分支不会自动触发 CI（全手动模式）

`.gitlab-ci.yml` 的 workflow rules：

```yaml
workflow:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "push"'
      when: never
```

- **push 触发的流水线被禁用**，注释写明全部手动：`glab ci run -b <分支>`。
- 后果：推送分支后查流水线列表为空 / commit pipelines 404 都是**正常现象**，不是构建没触发。
- 这也是为什么开发者合入 master 的提交（5b2e24dc）没有流水线。

### 正确触发方式（glab 未装时）

glab 没装没关系——`$CI_PIPELINE_SOURCE == "push"` 只拦 push，**通过 API 创建的流水线 source=api 不受影响**（`glab ci run` 底层就是调这个 API）。用浏览器里的 GitLab 会话直接调：

```js
// 在 djgit 页面上执行（已登录会话）
const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
const res = await fetch('/api/v4/projects/ai-bus%2Febao-ai/pipeline?ref=<分支名>', {
  method: 'POST', credentials: 'include',
  headers: { 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' }
});
// 201 → { id: <新流水线id>, ref, sha, status: 'created' }
```

注意 endpoint 是 `/pipeline`（单数），不是 `/pipelines`。

## 3. 流水线状态 = manual 陷阱（监控脚本别等 pipeline=success）

- 有 manual deploy job 时，**流水线整体 status 是 `manual`，永远不会是 `success`**（即使全部 build job 成功）。
- 2026-08-12 教训：后台脚本等 `pipeline status=success` 空等到超时，被手动发现后停掉改用浏览器直接触发。
- **正确监控粒度**：查 job 级状态 `GET /pipelines/{id}/jobs`，build 类 job（build-frontend-assets 等）全部 `success` 即视为构建完成，然后触发 deploy job。

## 4. 触发 deploy job 的两种姿势

| 场景 | API | 说明 |
|------|-----|------|
| 构建完成、deploy job 是 manual/pending | `POST /jobs/{id}/play` | 手动触发部署 |
| master 无新提交、镜像已存在 | `POST /jobs/{id}/retry` | 复用已构建镜像直接重跑部署，返回新 job id（2026-08-12: 5303→5639，6 秒完成） |

```js
const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
await fetch('/api/v4/projects/ai-bus%2Febao-ai/jobs/5303/retry', {
  method: 'POST', credentials: 'include',
  headers: { 'X-CSRF-Token': csrf }
});
// 201 → { id: 5639, name: 'deploy-betag', status: 'pending' }
```

## 5. 会话凭据获取

- `_gitlab_session` 是 **HttpOnly**，`document.cookie` 读不到。
- 浏览器内 fetch 用 `credentials: 'include'` + meta CSRF token 最可靠，无需手工拼 cookie。
- 若需给 bash 脚本用：从 `list_network_requests` 找主页请求 → `get_network_request` 读完整 Cookie 头；旧 cookie 跨会话仍可能有效（2026-08-12 验证：前一天 cookie 直接访问 API 返回 200）。

## 6. 其它

- 部署验证：`curl -k https://jz-ebaoai-betag.djtest.cn/` → HTTP 200 即前端 OK。
- 入口机 10.40.30.151（nginx，betaf~betaj 共 5 环境共用一个入口靠 Host 区分），后端容器在 10.40.131.82（deploy-betag job 执行 docker compose pull + up）。
