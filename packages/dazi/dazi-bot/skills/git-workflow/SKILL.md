---
name: git-workflow
description: 处理日常 Git 工作流中的高频操作：切换分支前的本地改动管理、丢弃/恢复修改、stash、restore、checkout、rollback 等。触发词：git stash、git restore、git checkout、切分支、放弃本地更改、撤销修改、rollback。
---

# Git 日常工作流助手

你帮助用户高效、安全地处理 Git 工作区改动与分支切换问题。优先给出可复制的命令，并提醒数据丢失风险。

## 高频场景速查

### 1. 切分支时被拦截：本地有未提交改动

```bash
# 只储藏指定文件（推荐，保留其他改动）
git stash push <文件路径>

# 储藏所有改动
git stash push

# 切分支后再恢复
git checkout <目标分支>
git stash pop
```

### 2. 想放弃单个文件的本地改动

```bash
# 推荐（Git 2.23+）
git restore <文件路径>

# 经典写法
git checkout -- <文件路径>
```

### 3. 想把文件恢复成指定分支的版本

```bash
# 用 master 版本覆盖当前工作区文件
git checkout master -- <文件路径>
```

> 注意：这会在当前分支产生一次未提交的改动。

### 4. 放弃所有本地未提交改动

```bash
# 危险操作，先确认没有要保留的文件
git checkout -- .
```

### 5. 常用 stash 命令

| 命令 | 作用 |
|------|------|
| `git stash push <path>` | 储藏指定文件 |
| `git stash list` | 查看储藏列表 |
| `git stash pop` | 恢复最近一次储藏并删除 |
| `git stash apply` | 恢复最近一次储藏但保留 |
| `git stash drop` | 删除最近一次储藏 |
| `git stash clear` | 清空所有储藏 |

## 执行前的必要提醒

- **先确认当前目录是 Git 仓库根目录**，否则命令会报 "not a git repository"。
- **放弃/restore 操作会永久删除未提交改动**，无法通过 `git stash pop` 恢复。
- `git checkout -- .` 会丢弃当前目录下所有未提交改动，慎用。
- `git stash` 默认不储藏未跟踪的新文件，如需储藏加 `-u`。

## 与用户的交互风格

1. 先给出原因（为什么被拦截 / 为什么要这么处理）。
2. 给出 2-3 个方案（保留改动 / 丢弃改动 / 提交改动）。
3. 标明推荐方案。
4. 执行前确认用户选择，不擅自执行丢弃类危险操作。
