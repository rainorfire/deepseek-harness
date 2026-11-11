# 音轨踩坑总结（2026-07-30 实战）

本会话核心教训：用户连续 4 次反馈「没有旁白/没有 BGM」，根因是 ICE 的音频处理与本地混音的多个陷阱叠加。

## 根因链
1. ICE Timeline 只配 BGM 轨、漏配旁白轨 → 无旁白
2. BGM 音量 12%（volume=0.12）太低 → 听不见
3. `Mute: true` 对 VideoTrackClips **无效**——ICE 输出仍带原片音频
4. `amix duration=first` 会把混音**截断到最短输入**（旁白 23.8s → 整体 23.8s，BGM 被截断）

## 正确的音轨做法（v6 验证成功）
1. **本地先剥原片音频**：每个视频片段 `ffmpeg -y -i in.mp4 -an -c:v libx264 silent_x.mp4`，静音版上传 OSS + RegisterMediaInfo
2. **本地混好唯一音轨**：旁白 + BGM 混成一条 30s 全长音频（BGM 撑满 30s），再上传 + 注册
   ```bash
   ffmpeg -y -i bgm.mp3 -i narration.wav \
     -filter_complex "[0:a]volume=0.25,atrim=0:30[bgm];[1:a]adelay=0|0[narr];[bgm][narr]amix=inputs=2:weights=1 2[out]" \
     -map "[out]" -ac 1 -ar 44100 mixed_30s.wav
   ```
3. Timeline 音频轨只放这一条 AudioTrackClips（In=0 Out=30）

## 状态查询坑
- `GetMediaProducingJob` 返回体是**嵌套对象**：`response.body.media_producing_job.status`（小写字段），不是 `response.body.status`
- 刚注册的素材会报 `The specified media is not ready:"<MediaId>"`，需稍等 ICE 处理完成再提交/查询

## 音量经验
- BGM 0.12 听不见 → 0.25~0.30 才清晰可听
- 成品音轨平均 -29dB 说明混音失败；成功版 RMS -14dBFS

## macOS TTS 音色（say 命令）
- `say -v Meijia -o x.m4a --data-format=alac "文案"`（台湾腔温柔，适合家庭/情感题材）
- Tingting 大陆音、Meijia 台湾腔、Sinji 香港腔均可用；**Sandy/Shelley 系统异常（静音 0.8s）不可用**
- 分段生成旁白（每段一句）+ 0.3s 静音拼接，方便字幕精确对齐
- m4a→wav 用 ffmpeg 转换
