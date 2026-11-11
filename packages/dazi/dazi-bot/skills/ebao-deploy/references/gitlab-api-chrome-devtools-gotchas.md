# GitLab 触发 manual deploy + chrome-devtools MCP 坑位（2026-08-14 betag 部署实战沉淀）

项目：ai-bus/ebao-ai @ djgit.daojia-inc.com，浏览器持已登录 GitLab 会话。

## 触发 manual deploy job 两种方式

### 1. API play（首选）
`POST /api/v4/projects/ai-bus%2Febao-ai/jobs/{id}/play`，headers 必须带 `X-CSRF-Token`（取 `document.querySelector('meta[name="csrf-token"]').content`），`credentials: 'include'`。成功返回 200 + status=pending。

- 坑：**不带 CSRF → 401**（body 为 `{}`）。
- 坑：** pipeline 级路径 `/pipelines/{pid}/jobs/{id}/play` → 404**。play 端点只在项目级 `/jobs/{id}/play`。

### 2. UI 点击兜底（API 404/401 时）
`navigate_page` 到流水线页 → `take_snapshot` 找 deploy-betag 行的「手动操作」按钮 uid → `click`（参数是 **`uid`**，不是 `ref`）。

- 坑：**绝不能点阶段标题行的「Run all」**——会把 5 个测试环境（betaf/g/h/i/j）全量部署。
- 坑：job 直链 `/pipelines/{pid}/jobs/{id}` → **404**（GitLab 标准 job 页不是该 URL），回流水线页操作。

## 重放已成功的 deploy（同一提交再部署一遍）
- **不要 play**（play 对 success job 无效），用 **retry**：`POST /api/v4/projects/.../jobs/{id}/retry` → **201**，返回**新 job id**（如 10586 重放 10293），status=pending。镜像有缓存时 4.6 秒即 success。
- 重放前先 `git fetch origin` + `git log origin/<branch> -1` 确认分支**没有新提交**；有则必须走完整新流水线（push 会自动触发），不能重放。

## 判断「部署最新代码」= 分支有无新提交
- 记录上次部署的 commit，先 `git log origin/dev/XX -1 --format="%H %ci %s"` 对比：一致 → 重放；不一致 → 等新流水线构建全绿后再 play。

## chrome-devtools MCP 参数坑（evaluate_script / click）
- `evaluate_script` 必须传 **`function`** 参数（不是 `script`），且必须是**匿名箭头函数** `async () => {...}`；`async function run(){}` 声明式报错 `Unexpected identifier 'run'`。
- **每次 ExecuteExtraTool 调用必须包 `params`**：`ExecuteExtraTool({tool_name, params:{function, tool_name: "mcp__chrome-devtools__evaluate_script"}})`；漏 `params` → `InputValidationError: required parameter params is missing`。本会话因此多次重试。
- 页面会被重置回 about:blank（相对路径 fetch 报 `Failed to parse URL`）→ 每次先 `navigate_page` 回 GitLab 再 fetch `/api/v4/...`。
- 项目路径带斜杠必须 **%2F 编码**：`ai-bus/ebao-ai` → `ai-bus%2Febao-ai`。

## 部署前必查
- 环境空闲：`GET /api/v4/projects/{p}/environments`，betag 须 `state=available`。
- 流水线 9 个 build（frontend-assets/frontend/gateway/orchestrator/platform/agent/sandbox-runner/sandbox-base/scheduler）**全部 success 后** deploy 才从 created 解锁为 manual 可触发。

## 验证（三重证据链）
1. deploy job：`GET /jobs/{id}` → status=success + started/finished/duration（如 31.5s）。
2. 域名：`curl -k -s -o /dev/null -w "%{http_code}" -L https://jz-ebaoai-betag.djtest.cn/` → 200。
3. 分支一致性：`git log origin/<branch> -1 --format="%H %ci %s"` 与部署 commit 一致。

## 网络拓扑
- betag：`jz-ebaoai-betag.djtest.cn` → CNAME `op-web-bjjz-tlan-qt.djtest.cn` → **10.40.30.151**；betaf/g/h/i/j 5 个测试环境**共用该 Nginx 入口网关**，靠 Host 头分流（非各环境独立 IP）。
- 生产：`ebaoai.daojia.com` → 10.40.113.10（劳动者侧 /worker，后台管理另配）。

## 独立验证代理（verification）注意
- 纯外部运维类任务（部署/网络操作），verification 子代理沙箱 Bash/WebFetch/浏览器 MCP 常被权限层全部拦截，一条命令跑不成 → 恒返 **PARTIAL**。这是无证据可查，**不是部署失败**。主代理应自行用 curl + git log + GitLab API 返回值补齐证据链后给最终结论。
