# 小红书 MCP 选型与排障：rednote-mcp vs 本机 xiaohongshu-mcp

## 背景

本机存在两套小红书 MCP 实现，体验和配置方式不同：

| 方案 | 包/二进制 | 登录方式 | 是否弹浏览器 | 推荐度 |
|------|----------|----------|--------------|--------|
| 本机二进制 | `/Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64/xiaohongshu-mcp-darwin-arm64` | `get_login_qrcode` 把二维码发到对话面板 | 否（HEADLESS=true） | ✅ 用户首选 |
| npm 包 | `rednote-mcp` | `init` 命令弹浏览器窗口 | 是 | ❌ 不建议 |

## 用户偏好（2026-07-09 确认）

用户明确说：

> 「以前都不需要打开浏览器，二维码直接发到聊天面板上」「我要用原来那个」

因此默认必须优先使用**本机二进制方案**，禁止在未经确认的情况下切到 `rednote-mcp`。

## 正确配置

### 1. 启动服务

```bash
cd /Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64
bash start-headless.sh
```

`start-headless.sh` 关键内容：

```bash
export HEADLESS=true
export ROD_BROWSER_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
nohup ./xiaohongshu-mcp-darwin-arm64 > xhs-mcp.log 2>&1 &
```

### 2. 验证端口

```bash
lsof -i :18060
```

### 3. MCP 配置（~/.dazi.json）

```json
{
  "mcpServers": {
    "xiaohongshu": {
      "type": "http",
      "url": "http://localhost:18060/mcp"
    }
  }
}
```

### 4. 新开会话加载工具

配置变更后需 `Cmd+N` 新开会话，工具名应为：

- `mcp__xiaohongshu__check_login_status`
- `mcp__xiaohongshu__get_login_qrcode`
- `mcp__xiaohongshu__search_feeds`
- ... 等 13 个工具

若出现 `mcp__xiaohongshu__login` 或登录弹浏览器，说明当前连的是 `rednote-mcp`，需按本参考切回本机二进制。

## 冲突处理

如果 `~/.dazi.json` 中同时存在 `rednote-mcp` 配置，必须：

1. 停止 `rednote-mcp` 进程：`ps aux | grep rednote-mcp` 然后 kill
2. 删除或替换 `mcpServers.xiaohongshu` 为 HTTP 配置
3. 用 `start-headless.sh` 启动本机二进制
4. 新开会话验证

## 日志位置

```
/Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64/xhs-mcp.log
```

启动成功应能看到：`Registered 13 MCP tools`。
