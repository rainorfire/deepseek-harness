# 小红书 MCP 激活排查笔记

## 常见场景

1. **用户说「已经装好了，直接开启」**
   - 先检查当前可用工具列表里是否真有 `mcp__xiaohongshu__*` 或 `check_login_status` 等工具。
   - 如果没有，说明 MCP server 尚未被 dazi 内核加载，需要配置 `~/.dazi.json` 的 `mcpServers`。

2. **SkillHub CLI 已安装但 `install_skillhub_skill` 报「CLI 未安装」**
   - 可能是 PATH 未刷新或 shell 环境不一致。
   - 不要反复尝试相同安装命令；改用 Bash 验证 `which skillhub && skillhub --version` 后再继续。

3. **用户拒绝 Bash 安装/验证命令**
   - 用户对 npx/curl/安装类命令较敏感，容易拒绝。
   - 应先简明说明命令作用与范围，确认后再执行；若被拒，则暂停并询问用户希望如何继续。

## 配置入口

- dazi 内核只读 `~/.dazi.json` 顶层 `mcpServers` 或项目 `.mcp.json`。
- 修改后建议新开会话，让内核重新加载 MCP。

## 实践原则

- 不要假设 SkillHub 安装成功就一定能被 work-dazi 识别；始终检查工具列表。
- 遇到「授权」时仍要先说明动作再执行，尤其是文件访问与外部命令。
