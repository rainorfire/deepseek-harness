# lark-cli 发消息/文件/图片 实测配方（2026-08-02 沉淀）

## 命令形态：`+` 快捷命令，非子命令

- ❌ `lark-cli im messages send` → unknown subcommand "send"
- ✅ `lark-cli im +messages-send`
- 所有 flag 用 **kebab-case**（Go 风格）：`--msg-type`（❌ `--msg_type`）

## 常用发送（全部实测通过）

| 类型 | 命令 | 备注 |
|------|------|------|
| 文本（--text 简写） | `lark-cli im +messages-send --chat-id oc_xxx --text "内容" --as bot` | 最简 |
| 文本（--msg-type 全写） | `lark-cli im +messages-send --user-id ou_xxx --msg-type text --content '{"text":"..."}' --as bot` | user-id 直发佳哥 |
| 文件 | `lark-cli im +messages-send --chat-id oc_xxx --file ./相对路径.html --as bot` | **必须相对路径** |
| 图片 | `lark-cli im +messages-send --chat-id oc_xxx --image ./photo.jpg --as bot` | 直接发图，无需两步法 |

## 关键坑（每条都踩过）

1. **`--file` / `--image` 只接受当前目录相对路径**，绝对路径报错：`--file must be a relative path within the current directory`。先 `cp 文件 ./` 再发。
2. **`--as user` 缺 scope**（`im:message.send_as_user`），报 authorization 错。需要 `lark-cli auth login --scope "im:message.send_as_user im:message"` 让用户 OAuth 授权。**默认直接用 `--as bot`**。
3. **网络超时**：`open.feishu.cn` 偶发 `read: operation timed out`，重试一次即成功，不要反复换参数。
4. 佳哥 ID：`--user-id ou_c45c290319bc02f528bf073e727ce02c`；会话 chat-id：`oc_9bfdb5ac0f3422dabcaa3027029c4e8b`。
5. 当前版本 1.0.64，官方提示有 1.0.80+ 更新，命令如失效先 `lark-cli update`。

## 覆盖 DAZI.md 中「两步法」的说明

DAZI.md 记录的两步法（bot 上传拿 image_key → user 身份发）依赖 user 身份 OAuth 授权，未授权时不可用。**已授权环境直接 `--image ./photo.jpg --as bot` 一步到位**；两步法仅在有 user scope 时使用。