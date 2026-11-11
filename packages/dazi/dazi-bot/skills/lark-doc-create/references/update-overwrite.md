# 更新已建飞书文档（+update）

## 命令

```bash
lark-cli docs +update --doc <document_id> --command overwrite --content @方案.xml --doc-format xml
```

覆盖整篇内容后返回新的 `revision_id`。

## ⚠️ 关键坑：overwrite 会丢图片

`--command overwrite` 用 XML 覆盖整篇文档时，文档内**已有图片不会保留**（media block 不随内容回写）。覆盖后必须**重新插入**架构图等所有图片，否则交付文档缺图。

## 正确流程（改内容时）

1. 先 `lark-cli whoami` 确认身份（tokenStatus=needs_refresh 一般仍可操作，勿因此卡住）
2. 更新前先读内置 skill：`lark-cli skills read lark-doc references/lark-doc-update.md`（update 命令强制要求，勿从 --help 推断）
3. `docs +update --command overwrite` 覆盖内容
4. 重新 `docs +media-insert` 插入图片：

```bash
lark-cli docs +media-insert --doc <id> --file 架构图.png --type image --width 780 --align center --caption "..." --selection-with-ellipsis "3.1 整体架构"
```

`--selection-with-ellipsis` 按标题文字定位插入点（匹配 "3.1 整体架构" 即插到该标题后）。

5. `lark-cli docs +fetch --doc <id> --format pretty` 拉取全文验证：标题、章节、报价数字、图片 block 均存在。

## 报价/数字自检（覆盖落盘前必做）

- 明细合计（Σ 角色人月×单价）必须 = 档位表头写的人月/金额，且落在该档报价区间内
- 若「云资源首年费用」不计入报价区间，汇总表必须明确写「另计」，避免「人力+云资源超区间」矛盾
- 用脚本重算核对后再覆盖，避免「明细 vs 表头 vs 区间」三处矛盾（2026-08-05 曾因豪华版明细 40.1 万 vs 表头 34.7 万矛盾、超 32-38 万区间，被验证代理抓出）
