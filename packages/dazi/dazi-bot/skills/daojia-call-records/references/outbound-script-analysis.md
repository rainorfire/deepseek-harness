---
name: 电招外呼话术整理（transcriptionText 分析）
description: 从通话记录转录文本中提取「电招」外呼话术的分析工作流，含阈值/输出格式变体
---

# 电招外呼话术整理（transcriptionText 分析）

适用场景：通话记录 CSV/Excel 已导出后，用户要求「分析 transcriptionText 字段」「把电招的外呼话术整理出来」。

## 数据背景
- 数据源：`call.daojia-inc.com/admin/heli/call-event/v2/with-text/list/ajax` 导出的 CSV/Excel（含 transcriptionText 列）。
- 转录文本范围：2026-08-05 之后的数据才含转写文本；通话时长 <5s 不转写。因此分析前先统计有多少行有转录文本（如 1800 条外呼中约 426 条有文本）。
- 对话角色：一方是公司电招员工，在引导家政劳动者将个人信息（姓名/身份证/技能证书/从业经验等）补充完整。

## 分析步骤
1. 读入 CSV（utf-8-sig）/Excel，过滤 transcriptionText 非空的行。
2. 提取全部转录文本，按时长/员工分组，通读找出高频重复的语句。
3. 归纳话术结构（典型外呼话术板块）：
   - 开场白：自报家门（公司电招/平台）+ 说明来电目的（认证/补全资料）。
   - 引导补全：逐项引导劳动者补充个人信息（身份信息、技能证书、从业经历、收款账户等）。
   - 认证通过后的确认/结束语。
4. 输出话术整理稿：按板块列出「标准话术模板 + 常见变体」，标注引导补全的关键动作。

## 查询参数变体（本会话验证）
- 阈值：`TALK_TIME_MIN` 可调（30 秒 / 60 秒），命中总数随之变化（30s: 刘涛 21723 条；60s: 刘涛 15350 条）。
- 输出格式：CSV（utf-8-sig）或 Excel（openpyxl，冻结表头 + 蓝色表头 + 转录列加宽）。
- 分页：rows 上限 100，按 id desc 取最新；每人取 MAX_RECORDS=300 条。
- 鉴权：`X-Cli-Agent-Token`（存于记忆文件 daojia_api_token.md）+ `X-Cli-Agent-Type: openClaw`。

## 参考脚本
复用工作目录 `_query_call_records.py`（test 模式验证凭证 / all 模式全量导出），改 TALK_TIME_MIN 与输出函数即可切换阈值与格式。
