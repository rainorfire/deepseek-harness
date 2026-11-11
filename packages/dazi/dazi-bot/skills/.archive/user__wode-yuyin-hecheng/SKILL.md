---
name: wode-yuyin-hecheng
description: 使用 GPT-SoVITS API 将指定文案合成为陈宇佳的声音。当用户说"合成我的声音"、"合成我的语音"、"我的声音合成"、"生成我的配音"、"我的语音合成"、"帮我合成声音"、"合成声音"时触发。
---

# 我的语音合成 Skill

> 作者：Claude | 版本：1.1.0

## 触发条件

用户说以下任意触发词时激活：
- "合成我的声音"
- "合成我的语音"
- "我的声音合成"
- "生成我的配音"
- "我的语音合成"
- "帮我合成声音"
- "合成声音"

##

### 1. 判断是否已提供文案

**如果用户已提供文案**（如"合成我的声音：今天天气不错"），直接进入第2步执行合成。

**如果用户未提供文案**（如只说"合成我的声音"），则主动询问：

> "好的，请提供要合成的文案内容。"

### 2. 检查并启动API服务

检查端口9887是否有服务运行，如果没有则自动启动：

```bash
if ! lsof -i :9887 | grep -q LISTEN; then
    cd /Users/chenyujia/PycharmProjects/GPT-SoVITS && \
    source ~/miniconda/miniconda3/bin/activate GPT-SoVITS && \
    PYTHONNOUSERSITE=1 nohup python api_v2.py -a 127.0.0.1 -p 9887 -c GPT_SoVITS/configs/tts_infer.yaml > /tmp/gpt-sovits-api.log 2>&1 &
    sleep 8
fi
```

### 3. 执行 TTS 合成

直接调用API：

```bash
REF_AUDIO="/Users/chenyujia/PycharmProjects/GPT-SoVITS/output/slicer_opt_cyj/看云路 2.m4a_0000045440_0000301760.wav"
REF_TEXT="新中国为什么定夺北京?难道西安洛阳开封南京,真的是龙气泄漏,王气难聚吗?"

curl -X 'POST' 'http://localhost:9887/tts' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "{文案}",
    "text_lang": "zh",
    "ref_audio_path": "'"$REF_AUDIO"'",
    "prompt_text": "'"$REF_TEXT"'",
    "prompt_lang": "zh",
    "temperature": 0.8,
    "top_k": 15,
    "top_p": 1.0,
    "speed_factor": 1.1
  }' \
  -o "${PWD}/{输出文件名}"
```

### 4. 返回结果

合成完成后：
- 音频文件直接保存在当前工作目录（`$PWD`）
- 告知用户合成完成，提供音频文件路径

## 技术参数

| 参数 | 值 | 说明 |
|------|-----|------|
| temperature | 0.8 | 最佳温度参数（老板确认） |
| top_k | 15 | Top-K采样 |
| top_p | 1.0 | Top-P采样 |
| speed_factor | 1.1 | 默认语速 |
| 参考音频 | 看云路 2.m4a_0000045440_0000301760.wav | 陈宇佳声音 |
| 参考文本 | "新中国为什么定夺北京？..." | 参考音频内容 |
| 采样率 | 32000Hz | 输出音频采样率 |

## 模型路径

- GPT模型：`/Users/chenyujia/PycharmProjects/GPT-SoVITS/GPT_weights_v2/cyj_voice-e15.ckpt`
- SoVITS模型：`/Users/chenyujia/PycharmProjects/GPT-SoVITS/SoVITS_weights_v2/cyj_voice_e8_s248.pth`

## 示例对话

**用户**: 合成我的声音

**助手**: 好的，请提供要合成的文案内容。

**用户**: 床前明月光，疑是地上霜

**助手**: 收到，启动服务并合成中...
[自动启动API服务（如果未运行）]
[执行API调用]
合成完成！

## 注意事项

1. 首次使用会自动启动API服务（约需8秒）
2. 服务启动后会在后台运行
3. 合成时间取决于文案长度
4. 输出格式：WAV (32kHz)
