---
name: daojia-call-records
description: 到家（Daojia）通话记录查询：通过用户ID(urmId)批量查询通话记录（含录音转写文本）。触发词：「查通话记录」「通话记录」「call records」「按urmId查通话」「接通超30秒」「通话转写文本」「call.daojia-inc.com」「X-Cli-Agent-Token」等表达查员工/坐席通话数据的意图时触发。
---

# 到家通话记录查询（通过用户ID获取通话记录含录音文本 v2.0）

按员工 urmId 批量查询最近 N 条接通通话记录（可过滤通话时长），输出 CSV。

## 触发场景
- 用户给一批 urmId/员工名，要求查「最近 300 条接通通话」「通话时长 > 30 秒」「含录音文本」
- 需要分析坐席/销售通话记录、筛关键词、看通话转写文本

## 标准流程（已跑通）

1. **读接口文档**（若用户给了飞书文档链接）：用 `feishu-doc-read` 技能（Chrome DevTools 通道 + `references/scroll_collect.js` 分段滚动采集），拿到接口地址、鉴权、参数。文档《通过用户ID获取通话记录(含录音文本)接口 v2.0》位于飞书 wiki。
2. **找鉴权 Token**：`X-Cli-Agent-Token` 存在记忆文件 `~/.dazi/projects/-Users-chenyujia-Documents------dazi/memory/daojia_api_token.md`，直接读取；鉴权需同时带 `X-Cli-Agent-Type: openClaw`。
3. **脚本**：工作目录已沉淀 `_query_call_records.py`（含员工列表、查询逻辑、CSV 输出），优先复用；若没有则按 references/api-v2.0.md 新建。
4. **先 test 后 all**：`X_CLI_AGENT_TOKEN='<token>' python3 _query_call_records.py test` 验证凭证（返回 total 即有效，如刘涛 total=21723），再 `... all` 全量（放后台执行，提交后告知 JobId，勿同步轮询）。
5. **校验交付**：CSV 为 utf-8-sig 编码，逐人校验条数=300、talkTime>30、state=接听(成功)、begin 非空，再汇总表格交付。

## 关键参数
- 接口：`GET https://call.daojia-inc.com/admin/heli/call-event/v2/with-text/list/ajax`
- 鉴权 Header：`X-Cli-Agent-Token` + `X-Cli-Agent-Type: openClaw`
- `userIds`：urmId 逗号拼接（一次只查一个人更稳，翻页不会乱）
- `talkTimeMin`：通话时长阈值（秒），返回 talkTime > 此值 的记录
- `page`/`rows`：rows 上限 100，取 300 条需翻 3 页
- 排序：固定 id desc（最新在前）
- 响应：total / page / rows（含 talkTime、ring、begin、end、callNo、calledNo、transcriptionText 等）

## 注意事项
- **录音文本数据范围**：2026-08-05 之后的通话才含 transcriptionText，历史数据不转文本；通话 <5s 不转。筛选 >30s 的近期通话基本都带文本。
- 密码/Token 含特殊字符时严禁 `python3 -c "..."` 内联跑（shell 展开吞字符），必须写成 .py 文件或用环境变量传。
- 每请求返回 rows 上限 100，勿一次性要 rows=300（接口会拒或截断）。
- 详细接口字段与响应结构见 `references/api-v2.0.md`。