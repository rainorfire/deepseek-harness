# 小红书 MCP 服务启动流程（本机已部署时使用）

如果当前会话没有加载出 `mcp__xiaohongshu__*` 工具，说明 xiaohongshu-mcp 服务进程未运行。按以下步骤启动（以本机实际路径为准）：

1. **启动服务**（后台运行，记录 PID）：
   ```bash
   cd /Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64
   nohup ./xiaohongshu-mcp-darwin-arm64 > xhs-mcp.log 2>&1 & echo "PID: $!"
   ```
2. **验证端口**：服务默认监听 `18060`：
   ```bash
   lsof -i :18060
   ```
3. **刷新工具列表**：dazi 内核在会话启动时加载 MCP 工具，服务运行后需要**新开会话**才能看到小红书 MCP 工具。
4. **登录检查**：新会话中先执行 `check_login_status`，未登录则引导扫码。
