# macOS say TTS 中文音色实测（2026-07）

给短视频生成旁白用 `say -v <voice> -o out.m4a --data-format=alac`，再 ffmpeg 转 wav/mp3。

| 音色 | 效果 |
|------|------|
| Meijia | 台湾腔温柔女声，**可用**（推荐） |
| Sinji | 香港女声，可用 |
| Tingting | 大陆女声，可用 |
| Sandy / Shelley | **坏**：只输出 0.8s 无声文件，不要用 |
| Eddy / Flo | 其他备选 |

坑：不要用 Sandy/Shelley；m4a 先转 wav/mp3 再喂给 ffmpeg 混音或上传 ICE。
