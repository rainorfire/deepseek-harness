## lark-cli 图片发送流程

### 问题场景
user 身份缺少 `im:resource:upload` 和 `im:resource` 两个 scope，无法直接上传图片。
但 bot 身份可以上传图片（`tenant_access_token`）。

### 解决方案：两步法

**Step 1 — bot 身份上传图片，拿到 image_key**

```bash
lark-cli im images create --data '{"image_type":"message"}' --file image=<本地图片路径> --as bot
```

返回结果中的 `image_key` 是后续发送的关键：

```json
{
  "ok": true,
  "data": {
    "image_key": "img_v3_0213t_xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxg"
  }
}
```

**Step 2 — user 身份发送图片（用 image_key）**

```bash
lark-cli im +messages-send --as user --user-id <open_id> --image <image_key>
```

### 相对路径约束
`--file image=<path>` 中的 path 必须是 CWD 相对路径，不支持绝对路径和 `..`。

### scope 排查
| 操作 | 需要 scope | 适用身份 |
|------|-----------|---------|
| 上传图片 | `im:resource:upload`, `im:resource` | bot only |
| 发送消息 | `im:message.send_as_user` | user |

### 注意事项
- `--as bot` 发送的消息显示为 bot 应用名称（如 "Claude claw"）
- `--as user` 发送的消息显示为用户本人名称
- 当前 lark-cli 配置的是 Claude Code 的 bot app，无法通过配置切换为 "搭子" 身份