# DjDB-skill 使用文档

到家数据库查询技能 — 通过跳板机连接 MySQL 从库并执行 SQL 查询。

## 概述

DjDB-skill 是一个面向到家业务开发人员的数据库查询技能，通过跳板机（jzdjs.djdns.cn）自动完成 MFA 认证和 SSH 登录，连接到 MySQL 从库执行 SQL 查询。所有查询在从库上执行，不影响主库数据。

**核心特性**：

- 自动完成跳板机 SSH + MFA（TOTP）认证
- 基于 tmux 持久会话，连接断开后可恢复
- 通过 pipe-pane 实时捕获 SQL 执行结果
- 内置 SQL 安全检查，防止误操作
- 支持多个数据库快捷切换

## 支持平台

| 平台 | 技能路径 |
|------|---------|
| Claude Code | `~/.claude/skills/DjDB-skill/scripts` |
| OpenClaw | `~/.openclaw/skills/DjDB-skill/scripts` |
| Codex | — |
| OpenCode | — |

## 前置条件

### 1. 系统依赖

确保以下工具已安装：

```bash
# 检查依赖（技能内置检测命令）
djs.sh -check
```

需要安装的工具：

| 依赖 | 用途 | 安装方式 |
|------|------|---------|
| `oathtool` | 生成 TOTP MFA 验证码 | `apt install oathtool` / `brew install oath-toolkit` |
| `expect` | 自动化 SSH 交互式登录 | `apt install expect` / `brew install expect` |
| `ssh` | SSH 连接 | 系统自带 |
| `tmux` | 持久会话管理 | `apt install tmux` / `brew install tmux` |

### 2. 环境变量配置

在 `~/.bashrc` 或 `~/.zshrc` 中添加以下环境变量：

```bash
# 到家盾 MFA 密钥（用于自动生成 TOTP 验证码）
export JZ_DJS_SECRET="你的到家盾MFA密钥"

# SSH 连接命令（包含密钥文件和跳板机地址）
export JZ_DJS_SSH="ssh -i ~/.ssh/密钥文件 用户名@jzdjs.djdns.cn"
```

配置后执行：

```bash
source ~/.bashrc  # 或 source ~/.zshrc
```

### 3. 数据库连接配置

配置至少一个数据库连接字符串，格式为 MySQL 客户端命令：

```bash
# 注意：-p 后密码紧跟无空格，末尾有分号 ;
export DJDB_bdp="mysql -h 从库域名 -P 3306 -u 用户名 -p密码 数据库名称;"
export DJDB_bi="mysql -h 从库域名2 -P 3306 -u 用户名2 -p密码2 数据库名称2;"
export DJDB_core="mysql -h 从库域名3 -P 3306 -u 用户名3 -p密码3 数据库名称3;"
```

> 简称（如 `bdp`、`bi`、`core`）为自定义标识，用于选择数据库时快速引用。

## 触发方式

当对话中出现以下关键词时自动触发技能：

- 连接数据库 / 查库 / 连库
- 执行 SQL / MySQL 查询
- DJDB / 到家数据库 / 数据库查询
- 查数据 / 连 MySQL / 到家库

即使没有明确说"连数据库"，只要表达了查询到家业务数据的意图，也会触发。

## 使用流程

### 步骤 1：环境检查

技能启动后首先验证环境变量：

```bash
# 自动执行
[[ -n "${JZ_DJS_SECRET:-}" ]] && echo "JZ_DJS_SECRET=已配置" || echo "JZ_DJS_SECRET=未配置"
[[ -n "${JZ_DJS_SSH:-}" ]] && echo "JZ_DJS_SSH=已配置" || echo "JZ_DJS_SSH=未配置"
```

如果任一变量缺失，技能会停止并提示配置方法。

### 步骤 2：选择数据库

自动扫描 `DJDB_*` 环境变量：

- 无配置 → 停止，提示添加数据库连接
- 仅 1 个 → 自动选择，无需用户干预
- 多个 → 列出简称供用户选择（如 `bdp`、`bi`、`core`）

### 步骤 3：连接数据库

自动创建 tmux 会话（名称固定为 `djs`），完成以下流程：

1. 清理旧会话（如存在）
2. 生成临时连接脚本，嵌入环境变量
3. 创建 detached tmux 会话
4. 通过 `djs.sh` + `djs.tcl` 自动完成 SSH + MFA 认证
5. 等待 MySQL 提示符出现（约 10-15 秒）
6. 禁用 MySQL 分页器（避免输出被 less 截断）
7. 设置 pipe-pane 输出捕获到 `/tmp/tmux-output.log`

连接就绪后会提示：**"已连接到数据库 [简称]，可以发送要执行的 SQL。"**

### 步骤 4：执行 SQL

发送 SQL 并获取结果：

```bash
# 技能自动处理：
# 1. SQL 末尾无 ; 则自动补上
# 2. 清空输出日志
# 3. 通过 tmux send-keys 发送 SQL
# 4. 通过 output.sh 实时捕获结果
```

**等待时间参考**：

| 查询类型 | 等待时间 | 示例 |
|----------|---------|------|
| 简单查询 | 10 秒 | 单表小量数据 `SELECT ... LIMIT 10` |
| 中等查询 | 20 秒 | 关联查询，中等数据量 |
| 复杂查询 | 30 秒 | 多表关联，大数据量 |

**SQL 安全检查**：以下 SQL 会先警告用户确认后再执行：

| 风险类型 | 检测规则 |
|----------|---------|
| 破坏性操作 | DELETE / DROP / TRUNCATE / ALTER |
| 全表更新 | UPDATE 无 WHERE 子句 |
| 海量数据 | SELECT 无 LIMIT |

### 步骤 5：会话管理

| 操作 | 命令 |
|------|------|
| 检查会话是否存在 | `tmux has-session -t djs 2>/dev/null && echo "存在" || echo "不存在"` |
| 断开数据库连接 | `tmux kill-session -t djs` |
| 切换数据库 | 先断开，重新执行步骤 2-3 |
| 用户手动交互 | 在终端执行 `tmux attach -t djs` |

## 脚本说明

### djs.sh — 跳板机登录工具

```bash
# 基本用法
djs.sh <IP>              # readonly 登录（默认）
djs.sh <IP> -work        # work 登录
djs.sh <IP> -rdb         # rdb 登录（数据库查询默认使用此模式）
djs.sh <IP> -rdb -c "命令"  # 登录后执行指定命令

# 其他
djs.sh                   # 交互式登录
djs.sh -check            # 检测依赖是否已安装
djs.sh -h                # 显示帮助
```

登录模式说明：

| 模式 | ID | 说明 |
|------|-----|------|
| readonly | 0 | 只读权限（默认） |
| work | 1 | 工作权限 |
| rdb | 2 | 数据库查询权限 |

### djs.tcl — Expect 自动化脚本

自动完成以下交互流程：

1. 生成 TOTP 验证码（基于 `JZ_DJS_SECRET`）
2. 建立 SSH 连接（基于 `JZ_DJS_SSH`）
3. 处理 `[MFA auth]:` 提示，发送验证码（最多重试 3 次）
4. 处理跳板机菜单 `Opt>`，发送目标 IP
5. 处理 `ID>` 提示，发送登录模式 ID
6. 检测 Shell 就绪，可选执行命令

### output.sh — 结果捕获脚本

```bash
output.sh [最大等待秒数]   # 默认 30 秒
```

工作原理：

1. 读取 `/tmp/tmux-output.log`（由 tmux pipe-pane 生成）
2. 每秒轮询，检测 MySQL 提示符（`mysql>` 或自定义格式）
3. 提示符出现 → 输出完整内容并退出
4. 超时 → 输出已有内容 + 超时警告，退出码 1

### tmux-djs.sh — 人工使用包装

> 此脚本供用户手动操作使用，AI 工作流**不应直接调用**（会执行 `tmux attach` 导致挂住）。

功能：创建 tmux 会话并 attach，方便用户直接操作跳板机终端。

## 注意事项

- **所有查询在 MySQL 从库执行**，不影响主库数据
- 建议 SQL 添加 `LIMIT` 限制返回行数，避免输出截断
- 技能不会在对话中展示连接字符串中的密码部分
- 长时间空闲可能导致 MySQL 连接断开，需重新执行连接步骤
- 如遇权限不足，联系 DBA 处理
- 一次只能连接一个数据库，切换需先断开再重连
- MFA 验证码有效期短（通常 30 秒），自动登录重试最多 3 次

## 常见问题

### Q: 连接超时怎么办？

检查以下几点：
1. 环境变量是否正确配置（`JZ_DJS_SECRET`、`JZ_DJS_SSH`）
2. MFA 密钥是否有效（可用 `oathtool --totp -b "$JZ_DJS_SECRET"` 手动验证）
3. SSH 密钥文件路径是否正确
4. 跳板机是否可达（`ssh -i ~/.ssh/密钥文件 用户名@jzdjs.djdns.cn` 手动测试）
5. 目标数据库 IP 是否正确

### Q: 查询结果被截断？

- 为 SQL 添加 `LIMIT` 子句
- 检查是否有超长字段（可用 `SUBSTRING()` 截取）
- 增加等待时间参数（`output.sh 30` 或更长）

### Q: 连接意外断开？

- 长时间空闲会触发 MySQL 连接超时
- 执行 `tmux kill-session -t djs` 清理后重新连接
- 如果 `tmux has-session -t djs` 显示存在但无法交互，也需清理重连

### Q: 如何查看当前 tmux 会话状态？

```bash
tmux has-session -t djs 2>/dev/null && echo "会话存在" || echo "会话不存在"
tmux capture-pane -t djs -p   # 查看当前 pane 内容
```

## 技术架构

```
用户输入 SQL
    │
    ▼
┌─────────────────────────────────┐
│  AI 技能 (SKILL.md)             │
│  - 环境检查                      │
│  - 选择数据库                    │
│  - SQL 安全检查                  │
│  - tmux send-keys 发送 SQL      │
│  - output.sh 获取结果            │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  tmux 会话 (djs)                │
│  - 持久化 SSH + MySQL 连接      │
│  - pipe-pane → /tmp/tmux-output.log │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  djs.sh + djs.tcl               │
│  - TOTP 生成 (oathtool)         │
│  - SSH 连接 (expect 自动化)      │
│  - 跳板机 MFA 认证               │
│  - MySQL 客户端启动              │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  MySQL 从库                      │
│  - 只读查询                      │
│  - 不影响主库                    │
└─────────────────────────────────┘
```

## 版本信息

| 字段 | 值 |
|------|-----|
| 版本 | 0.0.1 |
| 作者 | fhn |
| 分类 | automation, devops, infrastructure |
| 仓库 | `git@git.daojia-inc.com:jz-strategy/daojia-dw-skill.git` |
| 参考文档 | [飞书文档](https://ywwlaii6ga7.feishu.cn/wiki/RFs8weEjRi26khkEe2TcE88unSd) |