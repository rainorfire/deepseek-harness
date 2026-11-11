# 小红书 MCP 服务启动与排障参考

## 本机关键信息

- **二进制路径**：`/Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64/xiaohongshu-mcp-darwin-arm64`
- **默认端口**：`18060`
- **启动方式**：
  ```bash
  cd /Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64
  nohup ./xiaohongshu-mcp-darwin-arm64 > xhs-mcp.log 2>&1 &
  ```
- **验证**：`lsof -i :18060`

## 用户说"已经安装好了 mcp"时的处理原则

1. 不要直接走 SkillHub 安装或 npm 重装。
2. 先检查常见本地路径，尤其是 `/Users/chenyujia/tools/AI/mcp/` 下的子目录。
3. 检查端口是否已在监听。
4. 若服务未运行，用本地二进制启动。
5. 启动后**必须新开会话**，dazi 内核才会加载出 `mcp__xiaohongshu__*` 工具。

## ~/.dazi.json 配置示例

```json
{
  "mcpServers": {
    "xiaohongshu": {
      "command": "/Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64/xiaohongshu-mcp-darwin-arm64",
      "args": []
    }
  }
}
```

## 参考会话

- sessionId: `HO1gQsn4O8oq5t4M_5eDi`
- 主题：走通小红书 skill、启动 xiaohongshu-mcp 服务
