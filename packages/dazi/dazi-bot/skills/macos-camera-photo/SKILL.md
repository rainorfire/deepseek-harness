---
name: macos-camera-photo
description: macOS 本机摄像头拍照并发送到飞书。用户说「拍张照片」「拍照发我」「摄像头拍照」时触发。包含 TCC 权限排查、授权引导、ffmpeg 抓拍（-update 1）、lark-cli bot 发图完整流程。
---

# macOS 摄像头拍照（含权限排查与飞书发送）

## 何时使用

- 用户要求「拍张照片发给我」「拍照」「摄像头」等

## 完整流程

### 1. 先确认权限（避免 ffmpeg 卡死）

WorkDazi 默认**没有** macOS 摄像头权限，直接 ffmpeg 抓拍会无限挂起。**先查 TCC 授权记录**：

```bash
sqlite3 "$HOME/Library/Application Support/com.apple.TCC/TCC.db" "SELECT client, auth_value FROM access WHERE service='kTCCServiceCamera';"
```

- 若宿主进程（WorkDazi）不在列表或 auth_value≠2 → 未授权，直接进入第 2 步引导用户
- 若只有 com.electron.lark（飞书）→ 明确告知用户需给 WorkDazi 授权

### 2. 引导用户授权（必须人工）

告知用户：**系统设置 → 隐私与安全性 → 摄像头 → 打开 WorkDazi 开关**（没有则点 + 添加 /Applications/WorkDazi.app）。**不要反复尝试不同命令**，权限问题无法用命令绕过。

### 3. 抓拍（已授权后）

```bash
ffmpeg -f avfoundation -framerate 30 -video_size 1280x720 -i "0" -vframes 1 -update 1 -y photo.jpg
```

**关键：必须加 `-update 1`**，否则报 `does not contain an image sequence pattern`、只拍不写文件。可用设备列表：`ffmpeg -f avfoundation -list_devices true -i "" 2>&1`（FaceTime 高清相机通常是 0）。

### 4. 发送到飞书

```bash
cp photo.jpg ./photo.jpg
lark-cli im +messages-send --chat-id oc_9bfdb5ac0f3422dabcaa3027029c4e8b --image ./photo.jpg --as bot
```

- `--image` 只接受当前目录相对路径
- 网络偶发超时，重试一次即可；`--as user` 缺 scope，默认 `--as bot`
- 详见 lark-cli-feishu-send 技能的 references/messages-send-recipes.md

## 已知坑

1. ffmpeg 卡住 90% 是 TCC 权限，不是软件问题——先查权限再动手
2. AppleScript 控制 Photo Booth 抓拍同样被权限拦截，不可靠
3. `-update 1` 缺失时输出显示 frame=1 但无文件，容易误判成功
