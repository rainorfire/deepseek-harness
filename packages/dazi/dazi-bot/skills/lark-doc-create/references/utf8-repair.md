# XML 源文件 UTF-8 乱码修复（字节级）

## 症状

中文 XML 源文件出现损坏字符：以 `utf-8` 严格解码失败或出现 U+FFFD（\ufffd）；`str.replace('微\ufffd...支付', '微信支付')` 匹配不上。

## 排查步骤

```python
with open('f.xml','rb') as f:
    data = f.read()
# 1) 用 replace 模式解码定位损坏位置
txt = data.decode('utf-8','replace')
for i,ch in enumerate(txt):
    if ch == '\ufffd':
        print('损坏附近:', repr(txt[i-15:i+15])); break
# 2) 算字节偏移，看真实字节
prefix = txt[:i].encode('utf-8','replace')
byte_off = len(prefix)
print('损坏区字节:', data[byte_off-6:byte_off+20])
# 3) 注意：data.find(b'\xef\xbf\xbd') 可能返回 -1，
#    但字节 dump 里确实存在 \xef\xbf\xbd 序列——以步骤 2 的偏移为准定位
```

## 修复（字节级 replace，最可靠）

```python
bad = b'\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd'   # 3×U+FFFD 是 '信' 损坏后的残骸
good = '信'.encode('utf-8')                     # U+4FE1 = e4 bf a1
data = data.replace(bad, good)
with open('f.xml','wb') as f:
    f.write(data)
```

- 用**原始字节**匹配，不要用带上下文的 str.replace（如 '微...支付'）——损坏字符上下文可能与预期不一致导致匹配失败（2026-08-05 实测 str 替换失败、字节替换成功）
- 只替换确定的损坏字节序列，保留周围完好文字
- 写回后验证：`open(...,encoding='utf-8').read().count('\ufffd') == 0`

## 预防

用 Write/Edit 工具生成 XML 后立即校验无乱码；从别处复制片段先核对字节。
