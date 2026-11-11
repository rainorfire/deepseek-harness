---
name: lark-cli-feishu-send
description: /图片/视频文件（bot 身份）：封面图上传、视频消息、、相对路径约束、
---

# 飞书 lark-cli 发送文件/视频

 硬约束（踩坑教训）
- **文件路径必须是 cwd 相对路径**——绝对路径（如 /tmp/x.jpg、/Users/...）一律被拒：`cannot open file: <abs>`。先 `cd <工作目录>`，用裸文件名
- **视频消息必须带封面**：先传封面图拿 image_key，再 `--video-cover <image_key>`
- **用 bot 身份发送**：`--as bot`。user 身份缺 `im:message.send_as_user` scope 会报 authorization 错
- 用户飞书 openId：`ou_c45c290319bc02f528bf073e727ce02c`（bot 私聊发送用）

## 发送视频（完整命令）
```bash
cd /Users/chenyujia/Documents/我的文件/dazi
# 1. 抽帧做封面（放到工作目录，绝对路径会被拒）
ffmpeg -y -ss 3 -i 视频.mp4 -vframes 1 -f image2 ./cover.jpg
# 2. 上传封面 → 返回 image_key
lark-cli im images create --data '{"image_type":"message"}' --file image=cover.jpg --as bot
# 3. 发送视频（--video 本地相对路径 + --video-cover 上一步的 image_key）
lark-cli im +messages-send \
  --user-id ou_c45c290319bc02f528bf073e727ce02c \
  --video 视频.mp4 --video-cover <image_key> --as bot
```

## 权限排查
- 缺 scope 报错含 `missing required scope(s): im:chat:read / im:message / im:message.send_as_user` 等 → 需 `lark-cli auth login --scope "..."` 补授权（阻塞式输出验证 URL，需走 human-gate 让用户浏览器完成）
- 上传类型与消息类型不匹配报 code 230055 → 检查 `--video` 与消息类型对应关系
- lark-cli 版本过旧会在响应里提示 `lark-cli update`（实测 1.0.64 vs 最新 1.0.80+），命令不通时可先升级再试