# lark-cli 发送参数速查（2026-08-02 实战踩坑记录）

> 来源：2026-08-01 多次发送文本/HTML/图片消息的会话。以下坑都真实踩过，按本文档可一次发通。

## 核心命令（优先用 +shortcut）
```bash
# 文本消息（bot 身份，最稳）
lark-cli im +messages-send --chat-id oc_xxx --text "内容" --as bot

# 文件（HTML报告/PDF等）：--file 只接受 cwd 相对路径！
cd "/Users/chenyujia/Documents/我的文件/dazi" && lark-cli im +messages-send --chat-id oc_xxx --file "报告.html" --as bot

# 图片：--image 同样只接受相对路径
cd <工作目录> && lark-cli im +messages-send --chat-id oc_xxx --image ./photo.jpg --as bot
```

## 关键坑（都真实发生过）
1. **flag 是 kebab-case**：`--msg-type` ❌不是 `--msg_type`（会报 unknown flag，提示 did you mean --msg-type）。
2. **`--file`/`--image` 拒绝绝对路径**：报错 `--file must be a relative path within the current directory`。必须 `cd` 到文件所在目录后用 `./文件名` 或直接文件名。
3. **`--as user` 缺权限**：报 `missing required scope(s): im:message.send_as_user, im:message`。默认用 `--as bot`（显示 Claude claw），不要用 user 身份。
4. **`lark-cli im upload` 子命令不存在**：报 unknown subcommand。上传图片要用 `im images create`（但该命令对绝对路径有 cannot open file 的 bug）——**直接绕过它，用 `+messages-send --image <相对路径>` 一步到位**。
5. **网络超时**：报 `API call failed ... read: operation timed out`。**原样重试一次**即可成功（本会话第二次就成功了）。
6. 发送后 `_notice` 提示 `lark-cli update`（1.0.64→1.0.8x）可忽略，不影响功能。

## 常见 chat-id
- 佳哥私聊/单聊：`oc_9bfdb5ac0f3422dabcaa3027029c4e8b`

## 两步发图法（旧）vs 一步发图（推荐）
- 旧：bot 传图拿 image_key → 再发（绕）。
- 新：直接 `+messages-send --image ./photo.jpg --as bot`，自动上传+发送（本会话已验证成功）。
