# 使用非默认文件名 SSH 密钥连接 Git 仓库

## 问题现象

Git 已经生成密钥并添加到 GitLab，但 `git clone`/`git pull` 时仍然提示：

```
git@git.example.com's password:
Permission denied, please try again.
```

`ssh -vT git@git.example.com` 日志里只看到系统尝试默认密钥：

```
Trying private key: /root/.ssh/id_rsa
Trying private key: /root/.ssh/id_dsa
Trying private key: /root/.ssh/id_ecdsa
Trying private key: /root/.ssh/id_ed25519
```

完全没有使用自定义名称的密钥（如 `id_rsa_daojia`）。

## 根因

SSH 客户端默认只会自动使用 `id_rsa`、`id_dsa`、`id_ecdsa`、`id_ed25519` 这几个文件名。

如果生成的密钥使用了自定义文件名（例如 `id_rsa_daojia`），必须通过 `~/.ssh/config` 显式指定 `IdentityFile`。

## 解决步骤

1. 确认私钥文件存在且权限正确：

   ```bash
   ls -la ~/.ssh/id_rsa_daojia ~/.ssh/id_rsa_daojia.pub
   chmod 600 ~/.ssh/id_rsa_daojia
   chmod 644 ~/.ssh/id_rsa_daojia.pub
   ```

2. 创建或编辑 `~/.ssh/config`：

   ```text
   Host git.daojia-inc.com
       HostName git.daojia-inc.com
       User git
       IdentityFile ~/.ssh/id_rsa_daojia
       IdentitiesOnly yes
   ```

   `IdentitiesOnly yes` 表示只使用指定的密钥，避免把默认密钥也递交给服务器导致认证失败。

3. 设置 config 文件权限：

   ```bash
   chmod 600 ~/.ssh/config
   ```

4. 验证 SSH 认证：

   ```bash
   ssh -vT git@git.daojia-inc.com
   ```

   正常应看到类似：

   ```
   Offering public key: /root/.ssh/id_rsa_daojia
   Welcome to GitLab, 陈宇佳!
   ```

5. 然后即可正常执行 git 操作：

   ```bash
   git clone git@git.daojia-inc.com:jz-tech-zhipin/common-tools.git
   cd common-tools
   git pull
   ```

## 常见坑

- 不要把 `Host ...` 配置直接敲在命令行执行，它必须写在 `~/.ssh/config` 文件里。
- GitLab 上添加的必须是 **公钥**（`.pub` 文件内容），不是私钥。
- 复制公钥时确保没有截断或混入换行：`cat ~/.ssh/id_rsa_daojia.pub`。
- Windows Git Bash / WSL 中，`~/.ssh/config` 里的路径统一用 POSIX 格式：`/c/Users/xxx/.ssh/id_rsa_daojia` 或 `~/.ssh/id_rsa_daojia`。

## 多密钥管理模板

如果同一台机器要访问多个不同 Git 服务器：

```text
Host git.daojia-inc.com
    HostName git.daojia-inc.com
    User git
    IdentityFile ~/.ssh/id_rsa_daojia
    IdentitiesOnly yes

Host git.other-company.com
    HostName git.other-company.com
    User git
    IdentityFile ~/.ssh/id_rsa_other
    IdentitiesOnly yes
```
