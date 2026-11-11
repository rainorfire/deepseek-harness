# 飞书发送身份与 scope 授权（2026-07-24 实战）

## 核心教训：用户要求「搭子」身份，不是 Claude Code bot，也不是用户本人

- 当前 lark-cli 默认 profile 是 **Claude Code 的 bot app**（appId `cli_a9f04918dcf89ceb`，配置在 `~/Library/Application Support/lark-cli/`）。
- `--as bot` 发出的消息在飞书里显示为 **「Claude claw」**——用户明确拒绝过（「你搞错了 用的Claude claw发给我的 你要用你自己打给我」）。
- `--as user` 发出的消息显示为用户自己的名字 **「陈宇佳」**——用户也纠正过（「你应该以搭子的身份发给我」）。
- work-dazi 自己的 bot appId 是 `cli_a605fc1699fe9013`（见 `~/.dazi/feishu-app.lock`）。
- **结论**：用户对「发到飞书」的期望是消息以「搭子」身份出现。若 lark-cli 只能配 Claude Code app，发送前先向用户说明会显示成什么身份，或用 work-dazi 渠道（如果可用）。

## user 身份发图缺 scope 时的两步法（已验证可用）

前提：已具备 `im:message.send_as_user` scope（发送文本消息），但缺 `im:resource:upload` / `im:resource`（上传图片）。

1. **bot 身份上传图片拿到 image_key**：
   ```bash
   lark-cli im images create --data '{"image_type":"message"}' --file image=<本地路径> --as bot
   ```
   注意：`im images create` **只支持 bot 身份**；必须传 `--data '{"image_type":"message"}'` 且 `--file` 用 `image=<path>` 形式（错误用法：`--image` 不是该命令的 flag）。
2. **用 image_key 以 user 身份发送**：
   ```bash
   lark-cli im +messages-send --as user --user-id <openId> --image <image_key>
   ```

## scope 授权流程（device flow）

- 需要一次性补齐的 scope：`im:message.send_as_user im:resource:upload im:resource`。
- 不要在展示授权链接的同一轮里阻塞执行 `lark-cli auth login --device-code <code>`——会作废上一轮 device code。用 `--no-wait --json` 拿 `device_code` 和 `verification_url`，把链接/二维码发给用户，等用户确认后再补执行。
- `lark-cli` 路径：`/opt/homebrew/bin/lark-cli`。

## 相关命令速查

- `lark-cli whoami`：查看当前 profile、appId、onBehalfOf 用户。
- `lark-cli profile list`：列出所有 profile（本项目只有 `cli_a9f04918dcf89ceb`）。
- 用户 openId：`ou_988d6b368c38f39ea13d1513675fcdf0`（陈宇佳）。
