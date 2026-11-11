---
name: aliyun-ice-video-editing
description: 阿里云智能媒体服务(ICE)视频混剪：OSS素材上传、注册MediaId、Timeline构造、SubmitMediaProducingJob提交与状态查询、成品下载。用户说「用阿里云接口剪视频/混剪/ICE/智能媒体服务」时触发。
---

# 阿里云 ICE 视频混剪

用户要求**用阿里云 ICE 接口混剪视频**（而非本地 FFmpeg）时使用本技能。用户会追问「你调的是阿里云接口吗」——**必须真实走通 API 并保留 JobId 作证据**，不要用本地 FFmpeg 冒充。

## 前置条件（缺一会报错）
1. **OSS Bucket 已建**（实测：rainorfire，华南1 → `oss-cn-shenzhen`）
2. **AccessKey 权限**：需 `AliyunOSSFullAccess` + `AliyunICEFullAccess`；缺权限报 AccessDenied
3. **ICE 已开通订阅**（按量付费/资源包）；未开通报 `Forbidden.SubscriptionRequired`，需用户在 ICE 控制台开通（走 human-gate 让用户扫码）

## 完整流程
1. **上传素材到 OSS**：oss2 `put_object`（视频/音频/BGM）
2. **注册素材**：每个素材调 `RegisterMediaInfo` 拿到 **UUID MediaId**。⚠️ **不能直接用 OSS URL 当 MediaId**，否则报 `InvalidMaterial.NotFound` / `ProduceTimelineFormatError: Video MediaId is not valid`
3. **等素材就绪**：注册后需等 **Status=Normal**（几秒~几十秒）；未就绪引用报 `The specified media is not ready:"<uuid>"`
4. **构造 Timeline**（结构见 references/ice-timeline-example.json）：
   - 视频轨必须是嵌套结构 `[0].VideoTrackClips[]`（平铺 `Videos` 会报「Both video tracks and audio tracks are empty」）
   - 音频轨同理由 `AudioTracks[0].AudioTrackClips[]` 包裹
   - 字幕在 `Texts[]`，**文案绝不能含 **（含则报 TimelineFormatError）
   - 转场：clip 内 `Effects:[{"Type":"Transition","SubType":"fade","Duration":0.5}]`
5. **提交**：`SubmitMediaProducingJob(timeline=..., output_media_target="oss-object", output_media_config=...)`
   - `OutputMediaConfig.MediaURL` **必须是 HTTPS**（`https://{bucket}.{region}.aliyuncs.com/...`），`oss://` 一律不认（报 InvalidOSSUrlFormat）
   - **不要在 OutputMediaConfig 里放 /Video 配置块**（报 `InvalidParameter ... "OutputMediaConfig.Codec" is not valid`）
6. **查状态**：`` 返回体是嵌套对象：**`response.body.media_producing_job`**（小写字段 `status`/`progress`/`Message`/`MediaURL`），不是 `response.body.status`。`Message` 字段是排错主线索
7. **下载成品**：Status=Success 后从 OSS `get_object_to_file`

## 音频轨道（用户踩坑最狠，反复 6 版才通）
- **`: true` 不可靠**：即便加了，原片音频仍可能混入成品。可靠做法：本地 FFmpeg `-an` 剥离音频，上传**纯画面视频**，让 ICE 只能用你给的音轨
- **旁白+BGM 先本地混成单一音频**：用 /adelay 合成（如 `[0:a]volume=0.25,atrim=0:30[bgm];[1:a]adelay=0|0[narr];[bgm][narr]amix=inputs=2:weights=1 2[out]`），上传注册为**一个** MediaId，作 AudioTrackClips 一条 clip。BGM 铺满 30s 用 `atrim=0:30`，注意 `amix duration=first` 会截断到短轨——用 weights 或 duration=longest 保证 30s
- macOS TTS：`say -v Tingting`（大陆）/ `Meijia`（台湾温柔腔）/ `Sinji`（香港）；Sandy/Shelley 几乎无声（时长 0.01s 量级）
- BGM：SoundHelix 免费可商用，Song-16 轻快吉他风；BGM 音量至少 25%（12% 用户听不到）

## 协作模式（用户反复强调，违反会被骂）
- **提交作业后不要同步轮询傻等**——报 JobId + 预计完成时间，用后台任务/定时任务自检，让用户先去忙
- 失败先读 Message 定位根因一次改对，禁止反复试参数（用户原话：「你调研清楚再动手吧」）
- 涉及用户扫码/开通的步骤走 human-gate `wait_for_user_action`，拿到 completed 后再继续

Timeline 实测可用结构见 references/ice-timeline-example.json