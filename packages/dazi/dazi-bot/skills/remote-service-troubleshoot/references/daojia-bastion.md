# 到家（Daojia）跳板机登录实战

## 标准流程

1. iTerm 中执行 `ssh dj-jump`
2. 输入跳板机密码
3. 输入 6 位动态码
4. 在菜单按 `P` 显示 IP 列表
5. 翻页：
   - 下一页：`n` 或 `Enter`
   - 上一页：`p` 或 `P`
   - 返回：`b` 或 `B`
6. 输入目标 ID（**不是屏幕行号，务必问用户当前页显示的实际 ID**）
7. 选择登录角色，例如 `readonly`

## 已确认映射

| IP | ID | 常用角色 |
|----|----|---------|
| 10.40.131.31 | 30 | readonly |

## 注意事项

- 不要假设 IP 列表的编号等于屏幕行号。
- 敏感信息（密码、动态码）必须由用户在 iTerm 窗口手动输入，不要通过 AppleScript 或命令行自动填充。
- 登录后如需执行命令，可用 AppleScript 写到当前 iTerm session，或优先让用户本地 iTerm CLI 操作。

## 登录后常用命令

```bash
# 查看 Docker 运行服务
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
```
