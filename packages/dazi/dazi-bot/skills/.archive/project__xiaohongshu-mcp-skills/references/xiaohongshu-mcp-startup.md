# 小红书 MCP 服务启动流程（本机环境）

> 最后验证时间：2026-07-06
> 适用环境：macOS / work-dazi / 本机已下载的 xiaohongshu-mcp 二进制

## 关键路径

- **MCP 二进制**：`/Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64/xiaohongshu-mcp-darwin-arm64`
- **Skills 目录**：`~/.dazi/skills/xiaohongshu-mcp-skills/`
- **服务端口**：`18060`
- **MCP 配置入口**：`~/.dazi.json` 中的 `mcpServers.xiaohongshu`
- **Cookie 文件**：`/Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64/cookies.json`（登录凭证持久化，重启后自动复用）

## 启动服务（默认无头模式）

佳哥要求所有小红书操作使用**无头模式**（不弹出 Chrome 窗口），有两种方式：

### 方式一：使用启动脚本（推荐）

```bash
cd /Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64
bash start-headless.sh
```

脚本会自动设置 `HEADLESS=true` 和 `ROD_BROWSER_BIN` 环境变量，后台启动服务。

### 方式二：手动设置环境变量

```bash
cd /Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64
export HEADLESS=true
export ROD_BROWSER_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
nohup ./xiaohongshu-mcp-darwin-arm64 > xhs-mcp.log 2>&1 &
echo "PID: $!"
```

### 非无头模式（调试时备用）

```bash
cd /Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64
nohup ./xiaohongshu-mcp-darwin-arm64 > xhs-mcp.log 2>&1 &
echo "PID: $!"
```

## 验证是否启动成功

```bash
# 看进程
ps aux | grep xiaohongshu-mcp | grep -v grep

# 看端口
lsof -i :18060
```

成功时 `lsof` 会输出类似：

```
COMMAND     PID      USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
xiaohongs 46852 chenyujia    5u  IPv6 ... TCP *:18060 (LISTEN)
```

## 让 dazi 加载小红书工具

MCP 服务启动后，新开会话时 dazi 内核会自动连接 `localhost:18060`，注册 `mcp__xiaohongshu__*` 系列工具。

**注意**：重启 MCP 二进制后，当前会话不会自动刷新工具列表，需要**新开会话（Cmd+N）**。

可用工具清单（共13个）：
| 工具 | 功能 |
|------|------|
| `check_login_status` | 检查登录状态 |
| `get_login_qrcode` | 获取登录二维码 |
| `delete_cookies` | 删除登录信息 |
| `search_feeds` | 搜索笔记（**只传 `keyword`，不要传 `keywords`**） |
| `list_feeds` | 获取推荐流 |
| `get_feed_detail` | 查看笔记详情 |
| `like_feed` | 点赞/取消点赞 |
| `favorite_feed` | 收藏/取消收藏 |
| `post_comment_to_feed` | 评论笔记 |
| `reply_comment_in_feed` | 回复评论 |
| `publish_content` | 发布图文笔记 |
| `publish_with_video` | 发布视频笔记 |
| `user_profile` | 查看用户主页 |

## 登录验证

服务启动且新会话加载工具后，先执行 `check_login_status`：

- 若 **已登录**（Cookie 持久化在 `cookies.json`），可直接使用
- 若 **未登录**，调用 `get_login_qrcode` 扫码登录（App 扫码后需点「确认登录」）

## 常见坑点

1. **不要混用 npm 包 `xiaohongshu-mcp`**：本机 `npx -y xiaohongshu-mcp` 对应的包（help 里有 `--headless`、`--vision` 选项）与当前实际运行的二进制是不同项目。实际服务用的是本地下载的 `xiaohongshu-mcp-darwin-arm64`。
2. **服务未运行时不要期望工具出现**：必须先启动二进制并监听 18060，新会话才能加载工具。
3. **`search_feeds` 参数名是 `keyword`（单数）**：传 `keywords`（复数）会报错 `invalid additional properties`。
4. **SkillHub 里搜到的 `xiaohongshu-growth-engine`、`xiaohongshu-ai`** 是内容生成类 skill，不是 MCP 服务本身，不能替代本启动流程。
5. **登录 Cookie 可复用**：Cookie 保存在 `cookies.json` 文件中，MCP 服务重启后调用 `login` 会尝试复用已有 Cookie，不一定需要重新扫码。
6. **Chrome 路径**：本机 Chrome 在 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`，需通过 `ROD_BROWSER_BIN` 环境变量传递给 MCP 服务。

## 重启流程（服务崩溃或断开后）

```bash
# 1. 杀掉旧进程
ps aux | grep xiaohongshu-mcp | grep -v grep | awk '{print $2}' | xargs kill -9

# 2. 重新启动（无头模式）
cd /Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64
export HEADLESS=true
export ROD_BROWSER_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
nohup ./xiaohongshu-mcp-darwin-arm64 > xhs-mcp.log 2>&1 &

# 3. 验证端口
lsof -i :18060

# 4. 新开会话加载工具
```

## 备忘

- 日志文件：`/Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64/xhs-mcp.log`
- 如果二进制路径或端口发生变化，需要同步更新 `~/.dazi.json` 中的 `mcpServers.xiaohongshu` 配置。
- 启动脚本：`/Users/chenyujia/tools/AI/mcp/xiaohongshu-mcp-darwin-arm64/start-headless.sh`