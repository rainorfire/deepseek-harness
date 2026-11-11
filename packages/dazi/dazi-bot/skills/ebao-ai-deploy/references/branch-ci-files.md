# 分支缺 CI 基建文件 → 构建失败（实战排障 2026-08-05）

## 现象

部署 `dev/20260804-qualityEval` 分支（从老 git 早期 commit 拉出）时：

1. **push 后没有自动创建 pipeline** —— 分支上**没有 `.gitlab-ci.yml`**。GitLab 只为带 CI 文件的分支建 pipeline（项目 CI 配置路径为默认：每分支自己的 `.gitlab-ci.yml`，非集中配置）。
2. 补上 CI 文件后 pipeline #150 触发，但 **7 个镜像构建 job 全部失败（kaniko exit 1）** —— 分支缺 `Dockerfile-ci` 文件，而 CI 配置 `BUILD_DOCKERFILE: Dockerfile-ci` 引用的正是它们。

## 根因

`dev/20260804-qualityEval` 是从早期 commit 拉的分支，**没继承发版分支的 CI/CD 基建文件**。正常「从当天发版分支拉分支」会继承，但早期分支没有。缺的文件（共 23 个）：

- 7 个服务目录下的 `Dockerfile-ci`：`ebao-agent/`、`ebao-ai-frontend/`、`ebao-ai-gateway/`、`ebao-ai-orchestrator/`、`ebao-ai-platform/`、`ebao-ai-sandbox-runner/`、`ebao-ai-sandbox-runner/sandbox-image/`
- `deploy/docker-compose-ci.yml`
- `deploy/env/betaf.env` ~ `betaj.env`（5 个）
- `deploy/nginx/ebao-betaf.conf` ~ `ebao-betaj.conf`（5 个）
- `deploy/platform/dsf/betaf/dsf.config` ~ `betaj`（5 个）

## 修复流程（只补基建，不动业务代码，只推新 git 不动老 git 真源）

```bash
cd ~/ebao-ai
# 1. 拉发版分支到本地
git fetch newgit dev/ebao_daily_release_XXXX:refs/remotes/newgit/releaseXXXX

# 2. 精确找出当前分支缺哪些 CI/部署相关文件（comm 对比两个分支文件列表）
comm -13 <(git ls-tree -r --name-only origin/dev/20260804-qualityEval | sort) \
         <(git ls-tree -r --name-only newgit/dev/ebao_daily_release_XXXX | sort) | \
  grep -iE "dockerfile-ci|docker-compose-ci|deploy/env/beta|deploy/nginx/ebao-beta|deploy/platform/dsf/beta"

# 3. 从发版分支 checkout 缺失文件（显式列出，一次搞定）
git checkout newgit/dev/ebao_daily_release_XXXX -- \
  ebao-agent/Dockerfile-ci ebao-ai-frontend/Dockerfile-ci ebao-ai-gateway/Dockerfile-ci \
  ebao-ai-orchestrator/Dockerfile-ci ebao-ai-platform/Dockerfile-ci \
  ebao-ai-sandbox-runner/Dockerfile-ci ebao-ai-sandbox-runner/sandbox-image/Dockerfile-ci \
  deploy/docker-compose-ci.yml \
  deploy/env/betaf.env deploy/env/betag.env deploy/env/betah.env deploy/env/betai.env deploy/env/betaj.env \
  deploy/nginx/ebao-betaf.conf deploy/nginx/ebao-betag.conf deploy/nginx/ebao-betah.conf \
  deploy/nginx/ebao-betai.conf deploy/nginx/ebao-betaj.conf \
  deploy/platform/dsf/betaf/dsf.config deploy/platform/dsf/betag/dsf.config \
  deploy/platform/dsf/betah/dsf.config deploy/platform/dsf/betai/dsf.config deploy/platform/dsf/betaj/dsf.config

# 4. commit 并只推新 git（触发新 pipeline）
git commit -m "chore(ci): 同步发版分支 CI 基建文件（Dockerfile-ci、compose-ci、betaf-j 配置）"
git push newgit dev/20260804-qualityEval
```

> 注意：若分支连 `.gitlab-ci.yml` 都没有，先补它：`git show newgit/dev/ebao_daily_release_XXXX:.gitlab-ci.yml > .gitlab-ci.yml`，commit 后 push 即触发构建。

## 关键命令/API（浏览器登录态下）

- 查新 git 分支列表：`GET /api/v4/projects/ai-bus%2Febao-ai/repository/branches?per_page=100`（带 `credentials:'include'`）
- 查分支是否有 CI 文件：`GET /api/v4/projects/ai-bus%2Febao-ai/repository/files/.gitlab-ci.yml/raw?ref=<branch>`，404 即没有
- 查 pipeline：`GET /api/v4/projects/ai-bus%2Febao-ai/pipelines?ref=<branch>&per_page=3`
- 查 pipeline jobs：`GET /api/v4/projects/ai-bus%2Febao-ai/pipelines/<id>/jobs?per_page=50`
- 拉 job 日志：`GET /api/v4/projects/ai-bus%2Febao-ai/jobs/<job_id>/trace`

## 部署 job 触发规则（看 CI 配置确认）

- `deploy-betaf~betaj` 为 `when: manual`（构建成功后需手动触发 ▶️），另有 tag 规则 `if: '$CI_COMMIT_TAG =~ /^deploy-betaf/'`
- 每个 deploy job 有独立 `DEPLOY_HOST`（如 betaf → `10.40.131.82`）
- 5 个测试域名统一 CNAME 到 `op-web-bjjz-tlan-qt.djtest.cn` → 入口 IP `10.40.30.151`（Nginx 靠 Host 头区分环境）

## 浏览器自动化（chrome-devtools）操作 GitLab 的坑

- `evaluate_script` 的入参名是 **`function`**（传 async IIFE 字符串），不是 `expression` —— 用 `expression` 会报 `Invalid arguments ... path: ["function"] Required`
- fetch 要用相对路径 + `credentials:'include'`，否则无会话 cookie
- 内核重启后浏览器页面会重置为 `about:blank`，需重新 `navigate_page`
