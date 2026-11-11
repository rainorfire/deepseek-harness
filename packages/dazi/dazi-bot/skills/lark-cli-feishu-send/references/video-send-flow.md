# 发视频到飞书完整流程（2026-07-30 验证成功）

## 已验证步骤（bot 身份）
1. 抽帧做封面：`ffmpeg -y -i in.mp4 -vframes 1 -vf "scale=720:1280" cover.jpg`
2. 上传封面拿 image_key：`lark-cli im images create --data '{"image_type":"message"}' --file image=cover.jpg --as bot` → 返回 data.image_key（形如 img_v3_xxx）
3. 发视频消息：`lark-cli im +messages-send --user-id ou_xxx --video "file.mp4" --video-cover <image_key> --as bot`

## 关键坑
- **绝对路径被拒**：`--file`/`--video` 只接受 cwd 相对路径，绝对路径报 `cannot open file: ...`。先 `cd <工作目录>` 再用相对路径（含中文文件名没问题）。
- **user 身份缺权限**：`im:message.send_as_user` / `im:message` scope 缺失 → 一律用 `--as bot`。
- **视频消息必须带封面**：`--video` 不配 `--video-cover` 报错 code 230055（file upload type mismatch）。封面图 key 必须来自 `images create` 返回的 image_key。
- 视频消息发送成功返回 chat_id / message_id，message_id 可作回执。
- 佳哥 userOpenId：`ou_c45c290319bc02f528bf073e727ce02c`；p2p chat_id：`oc_9bfdb5ac0f3422dabcaa3027029c4e8b`。