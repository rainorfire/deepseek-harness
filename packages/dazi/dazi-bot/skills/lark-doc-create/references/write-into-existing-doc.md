# 写入「已有」飞书 docx（新建之外的场景）

> 来源：2026-08-31 鹅宝分层记忆技术方案 v2 → 写入已有 docx `BuzAdwIKMopy1RxXWkScK0vNnob` 的探索会话。

## 场景区分（重要）

- **新建文档**：`lark-cli docs +create --doc-format xml`（主流程，见本 skill 正文）。
- **写入已有 docx / 编辑已有文档**：这是**另一个场景**，`docs +create` 不适用。本次用户给的是 `https://ywwlaii6ga7.feishu.cn/docx/BuzAdwIKMopy1RxXWkScK0vNnob`（已有文档），会话在探索中结束，**尚未跑通完整流程**。下次遇到先看下面的已知线索，别再从头找。

## 已确认事实（2026-08-31 实测）

1. `lark-cli whoami` 显示 `tokenStatus: needs_refresh` 是**正常状态**——user 身份会在下一次 user API 调用时自动刷新，直接继续调用即可，不必专门等刷新。
2. 内置 `lark-doc` skill 版本 v2.0.0，可通过 `lark-cli skills read lark-doc` 查看；它自带 references（含 style 等），**编辑/更新已有文档的操作姿势应该在那里**。
3. 本地技能安装位置：`/Users/chenyujia/.dazi/skills/`（lark-doc-create 在此），但内置 `lark-doc` skill 不在该目录，要走 `lark-cli skills read lark-doc`（或 `--print-path`）拿路径。
4. `lark-cli docs +fetch --doc <id> --format pretty` 可回读文档内容（读通道），写入通道待确认。

## 建议路径（下次先试）

1. `lark-cli skills read lark-doc --print-path` 找到内置 skill 目录 → 读 references 里 docx 编辑/块级更新部分。
2. 若内置 skill 无编辑命令，查 `lark-cli docs --help` 下 update/edit/block 类子命令，或走飞书开放平台 docx block API（通过 lark-cli 封装）。
3. 回读验证：写完用 `docs +fetch --doc <id>` 抽查首尾，确认内容已落。
4. 沙箱环境 lark-cli 三连坑（keychain-downgrade / 无 auth refresh / DNS 重试）见 DAZI.md「Agent Notes」lark-cli 条目，先降级再重试。

## 未决问题（留给下次会话验证）

- 写入已有 docx 的具体命令/姿势；
- HTML 大文档进飞书是否要先转 XML/块结构，还是直接贴正文。
