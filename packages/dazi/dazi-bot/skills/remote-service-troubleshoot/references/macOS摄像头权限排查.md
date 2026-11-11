# macOS 摄像头权限排查

## 问题现象

ffmpeg/OpenCV 调用摄像头时卡住，无任何输出，超时后仍无响应。

## 根因

macOS TCC（Transparency, Consent, and Control）权限系统拦截。运行 shell 命令的宿主进程（如 WorkDazi.app）没有 `kTCCServiceCamera` 权限，macOS 静默挂起摄像头访问请求。

## 排查步骤

```bash
# 1. 查看哪些应用有摄像头权限
sqlite3 "$HOME/Library/Application Support/com.apple.TCC/TCC.db" \
  "SELECT client, auth_value, last_modified FROM access WHERE service='kTCCServiceCamera';"
# auth_value=2 表示已授权

# 2. 确认宿主进程
ps -o comm= -p $PPID  # 查看当前 shell 的父进程
```

## 解决方案

1. 打开 **系统设置 → 隐私与安全性 → 摄像头**
2. 找到宿主进程（如 WorkDazi），打开开关
3. 如果列表中没有，点击「+」添加对应的 .app
4. 授权后重新运行摄像头命令

## 备选方案

如果用户不想授权，可以尝试用系统自带应用（Photo Booth）拍照后读取照片文件：
```bash
# 打开 Photo Booth 让用户手动拍照
open -a "Photo Booth"
# 照片存储在 ~/Pictures/Photo Booth Library/Pictures/
```