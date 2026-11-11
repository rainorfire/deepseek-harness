# 更新已有飞书文档（overwrite / 白板保留 / 术语清理）

## 场景
用户已有飞书文档需要整体改写/覆盖（方案评审稿换版），或从文档中移除特定字样（如 Codex/cwd）。

## 核心步骤

### 1. 准备 XML 内容
- `lark-cli docs +update --command overwrite --content @./relative.xml --doc-format xml` 覆盖全文
- **content 必须是 cwd 内的相对路径**：绝对路径报 invalid file path → 先把 XML 复制到工作目录，用 `@./xxx.xml`
- XML 用 Write 工具生成（沙箱无法交互式编辑）

### 2. XML 校验（写前必须）
- HTMLParser 栈检查：`<col>` 自闭合（正常），表格单元格内 `<p>` 必须闭合
- 常见坑：`("events", uid, role)` 等文本在 td 内时 `<p>` 未闭合 → 逐处修复

### 3. whiteboard 架构图
- `<whiteboard src="token">` → degrade 5004（必须用 token 或 type 属性）
- `<whiteboard type="svg" path="@./f.svg">` → degrade 5002（path 不在 schema）
- 正确姿势：`<whiteboard type="svg">...内联 SVG...</whiteboard>`（~34KB 内联可行）
- 导出 SVG：`lark-cli whiteboard +query --whiteboard-token <token> --output_as svg --output ./f.svg`（不是 +export）

### 4. overwrite 后白板会丢（partial_success）
- 覆盖后原白板消失 → 重新导出 SVG → `block_insert_after --block-id <锚点>` 插入 → `block_move_after --block-id <新块> --src-block-ids <旧块>` 移到目标位置

### 5. 术语清理（如删除 Codex/cwd）
- 整块替换用 `block_replace --block-id <id> --content <新内容>`
- 段落内小替换用 `str_replace --pattern <旧> --content <新>`
- 先 fetch/搜索定位含目标词的块 id

### 6. 验证闭环
- 每次操作后 `docs +fetch --doc <id> --format pretty` 回读验证
- 清理目标词后全文档检索确认计数为 0

## 命令速查
- 覆盖：`lark-cli docs +update --command overwrite --content @./xxx.xml --doc-format xml`
- 白板导出：`lark-cli whiteboard +query --whiteboard-token X --output_as svg --output ./f.svg`
- 块操作：block_insert_after / block_move_after / block_replace / str_replace
- 回读：`docs +fetch --doc <id> --format pretty`

## 沙箱环境注意
- lark-cli 报 keychain 错误 → `lark-cli config keychain-downgrade` 再继续
- DNS 错误重试一次即成功，别误判为配置错误