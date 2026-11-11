# 小红书 MCP 无头模式配置

> 用户要求所有小红书操作使用无头模式（不弹出浏览器窗口）
> 最后验证时间：2026-07-06

## 环境变量

启动 xiaohongshu-mcp 服务时必须设置：

```bash
export HEADLESS=true
export ROD_BROWSER_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

## 启动脚本

已创建 `/Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64/start-headless.sh`：

```bash
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
export HEADLESS=true
export ROD_BROWSER_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
nohup "$DIR/xiaohongshu-mcp-darwin-arm64" > "$DIR/xhs-mcp.log" 2>&1 &
echo "xiaohongshu-mcp started (HEADLESS mode), PID: $!"
```

## 重启后的注意事项

- 重启 MCP 服务后，当前 dazi 会话的 MCP 连接会断开
- 必须 **新开会话（Cmd+N）**才能重新加载 `mcp__xiaohongshu__*` 工具
- 新会话中 MCP 会自动通过 SSE 连接，无需手动操作

## MCP 工具名映射（当前版本）

| MCP 工具 | 参数 | 说明 |
|----------|------|------|
| `mcp__xiaohongshu__login` | 无参 | 登录（无头模式自动处理） |
| `mcp__xiaohongshu__search_notes` | `keywords`（必填，复数） | 搜索笔记，不要传额外参数 |
| `mcp__xiaohongshu__get_note_content` | `url`（必填） | 获取笔记详情和评论 |
| `mcp__xiaohongshu__get_note_comments` | `url`（必填） | 查看评论 |

## 二进制与日志

- 二进制：`/Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64/xiaohongshu-mcp-darwin-arm64`
- 日志：`/Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64/xhs-mcp.log`
- 端口：`18060`（HTTP MCP，SSE 传输）