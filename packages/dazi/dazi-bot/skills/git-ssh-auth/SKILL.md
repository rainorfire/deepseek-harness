---
name: git-ssh-auth
description: SSH 方式访问 Git 仓库时的认证与排错指南，覆盖自定义密钥、~/.ssh/config、权限被拒绝、多密钥管理等问题。
---

# SSH Git 认证排错

适用场景：通过 `git@host:repo.git` 克隆/拉取/推送时报 `Permission denied (publickey)` 或反复要求输入密码。

## 快速检查清单

1. 确认密钥文件存在且权限正确。
   ```bash
   ls -la ~/.ssh/id_*
   chmod 600 ~/.ssh/id_rsa
   chmod 644 ~/.ssh/id_rsa.pub
   ```
2. 确认 GitLab/GitHub 上已经添加了**公钥**（`.pub` 文件内容）。
3. 测试连通性：
   ```bash
   ssh -T git@git.daojia-inc.com
   ```
4. 如果使用了**非默认文件名**（如 `id_rsa_daojia`），必须配置 `~/.ssh/config`。

## 多密钥 / 自定义密钥名配置

在 `~/.ssh/config` 中显式指定 `IdentityFile`：

```
Host git.daojia-inc.com
    HostName git.daojia-inc.com
    User git
    IdentityFile ~/.ssh/id_rsa_daojia
    IdentitiesOnly yes
```

要点：
- `IdentitiesOnly yes` 防止 SSH 把默认 `id_rsa` 也提交给服务器，避免选错密钥。
- `~/.ssh/config` 权限应为 `600`。
- 配置后通过 `ssh -vT git@git.daojia-inc.com` 查看是否 `Offering public key: ...id_rsa_daojia`。

## 常见误区

- 远端服务器上执行 `git pull` 必须在仓库目录下，不能在 `~/.ssh` 或 `~` 下执行。
- 不要把私钥内容贴到 GitLab；公钥以 `ssh-rsa` / `ssh-ed25519` 开头。
- Windows Git Bash / WSL 里路径用 Linux 形式，如 `/c/Users/.../.ssh/id_rsa_daojia`。

## 应急加载

若不想写 config，可临时用 ssh-agent：

```bash
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_rsa_daojia
ssh -T git@git.daojia-inc.com
```
