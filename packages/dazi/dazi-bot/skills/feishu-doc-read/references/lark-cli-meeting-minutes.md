# lark-cli 拉取会议纪要（智能纪要）实战经验

## 命令名与安装位置（重要坑）

- 命令名是 **`lark-cli`**，不是 `lark`。`which lark` 会误判「未安装」，实际装在 `/opt/homebrew/bin/lark-cli`（npm 全局包 `@larksuite/cli@1.0.64`）。
- 定位：`npm ls -g | grep -i lark` → `/opt/homebrew/bin/lark-cli`（`npm prefix -g` 下的 bin）。
- 执行文档/纪要命令前 **MUST** 先 `lark-cli skills read lark-doc`（或 lark-minutes / lark-shared），CLI 强制要求，跳过会报错。

## 拉取最近 N 条会议纪要（智能纪要）——正确路径

### 错误路径（实测踩坑，勿走）

1. `lark-cli minutes +search`：**按相关度排序，不是时间序**；且会**漏记录**（08-19 的妙记在搜索结果里就找不到）；`--start/--end` 时间过滤返回**空**。
2. `minutes +search` 还需要额外 scope `minutes:minutes.search:read`（走 `auth login --scope` 授权流，见下）。
3. `minutes minutes get --minute-token` 需要 `minutes:minutes.basic:read`，同样要授权。

### 正确路径：docs +search 翻全量页 + 按时间排序

```bash
# 1) 搜索「智能纪要」文档，拿到总页数（约 400+ 条），逐页翻
lark-cli docs +search --query "智能纪要" --page-size 20 --format json > p1.json
# page_token 是 JSON blob，翻页要原样转义传给 --page-token
lark-cli docs +search --query "智能纪要" --page-size 20 --format json --page-token "<上一页的 data.page_token>" > p2.json

# 2) python3 合并所有页：按 result_meta.create_time_iso 倒序排序，取最近 N 条
# 字段：result_meta.token / result_meta.create_time_iso / title_highlighted（去 <h></h> 标签）

# 3) 逐条拉正文
lark-cli docs +fetch --doc "<token>" --doc-format markdown
```

要点：
- 搜索结果**按相关度排序**，想按时间取最近 N 条必须翻完所有页再合并排序，不能只看第一页。
- 过滤条件用 `title.startswith('智能纪要')`（去高亮标签后）。
- 标题格式：`智能纪要：<会议主题> <日期>`，如「智能纪要：鹅宝AI方向及架构升级研讨会 2026年8月18日」。
- 同一场会可能有「副本」，注意去重（owner 可能不同）。

## 授权流（缺 scope 时）

```bash
# 发起授权，拿到 verification URL（需扫码，走 human-gate）
lark-cli auth login --scope "minutes:minutes.search:read" --no-wait --json
# → 返回 device_code + verification_url，用 mcp__workdazi-human-gate__wait_for_user_action 展示二维码

# 用户完成后，用 device_code 兑换
lark-cli auth login --device-code "<device_code>" --json
# 返回 granted: [...] 即成功
```

## 身份检查

```bash
lark-cli auth status --json --verify
# user 身份 verified=true 才可用（`LARKSUITE_CLI_NO_UPDATE_NOTIFIER=1` 可抑制更新提示）
```
