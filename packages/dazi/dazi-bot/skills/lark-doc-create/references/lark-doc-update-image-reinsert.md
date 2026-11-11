# 更新已有飞书文档（docs +update）的完整流程

> 来源：2026-08-05 文旅小院一期方案 V1.1 文档更新实测（doc UoVxdOgFQoiTPTxieioc5wUcnlc，overwrite 后 revision 4→13）

## 何时用
- 已创建的飞书 Docx 需要整体覆盖更新内容（范围收窄、报价数字修正、乱码修复后重发），而非局部编辑

## 关键坑：overwrite 会清空内嵌图片
`docs +update --command overwrite` 用 XML 全量覆盖文档内容时，文档里之前插入的图片块会被删除。**覆盖更新后必须重新 `docs +media-insert` 插入架构图/图片**，否则交付的文档缺图。

## 标准流程
1. 先读内置 skill：`lark-cli skills read lark-doc references/lark-doc-update.md`（update 前 MUST READ）
2. 修改本地 XML 源文件（含乱码修复/数字修正）
3. 覆盖更新：
   ```bash
   lark-cli docs +update --doc <docId> --command overwrite --content @方案.xml --doc-format xml
   ```
   成功返回 `result: success` + 新的 `revision_id`
4. **重新插入图片**（overwrite 后图已丢）：
   ```bash
   lark-cli docs +media-insert --doc <docId> --file 架构图.png --type image --width 780 --align center --caption "..." --selection-with-ellipsis "3.1 整体架构"
   ```
   `--selection-with-ellipsis` 用标题文字定位插入点，成功输出 `locate-doc matched: inserting after at index N` + block id
5. 验证落盘：`lark-cli docs +fetch --doc <docId> --format pretty`，再用脚本核对关键数字与图片 block id 是否在结果中

## 报价类文档验证清单（自洽性）
- **明细合计 = 档位小计 = 总区间，三者必须自洽**。本次验证代理抓出「豪华版明细合计 40.1 万 vs 表头 34.7 万 vs 区间 32-38 万」矛盾，正是明细行加出来的数不等于表头
- 云资源首年费用单列（另计），不并入开发报价区间
- 修正口径后重新校验：人月合计 × 单价 = 费用，费用落在档位区间内
- 最终三档口径示例：基础版 12.3 万/5.7 人月、标准版 26.2 万/9.8 人月、豪华版 34.5 万/12.4 人月，区间 12-15/24-28/32-38 万

## UTF-8 乱码字节级修复（XML 内容文件）
损坏的多字节 UTF-8 字符表现为 U+FFFD（�），**字符串层 replace 匹配不上时改用字节级修复**：

```python
with open('方案.xml','rb') as f: data=f.read()
bad = b'\xef\xbf\xbd' * 3   # 3 个 U+FFFD（'信' 字损坏的 3 字节）
data = data.replace(bad, '信'.encode('utf-8'))
with open('方案.xml','wb') as f: f.write(data)
```

- 定位乱码：`data.decode('utf-8','replace')` 中 `count('\ufffd')` 找数量，用 `prefix.encode('utf-8','replace')` 的长度算字节偏移后查看原始字节
- 本次案例：`'微' + 3×U+FFFD + '支付'` → 应替换为 `'微信支付'`（1 处）。用 `replace('微'+'\ufffd'*2+'支付', ...)` 会因 U+FFFD 数量不符而失败——**必须按实际损坏字节数逐个替换**
- 修完验证：`txt.count('\ufffd') == 0` 且 `'微信支付' in txt`
