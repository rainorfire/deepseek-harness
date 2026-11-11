# 鹅宝 Skill Python 执行规范

经 `skill_python_run` 沙盒执行的脚本须遵守本规范。以「核心约束」为准；下方仅提供骨架与声明示例。

## 核心约束

| 检查项 | 要求 |
|--------|------|
| 依赖 | 仅标准库，零 pip / 第三方包 |
| 结构 | 单文件自包含，禁止 import 本地兄弟模块 |
| I/O | stdin JSON → 结尾唯一一次 stdout JSON：`{"ok": bool, "data"?: ..., "error"?: "..."}` |
| 容错 | JSON 解析与业务异常均输出 `ok: false`，并以 exit `1` 退出 |
| network | 纯本地 `none`；需联网 `allow` |

常用标准库：`json`、`sys`、`os`、`re`、`urllib`、`hashlib`、`hmac`、`base64`、`datetime`、`pathlib`、`tempfile`、`csv`、`math`、`decimal`、`collections`、`itertools`、`functools`、`typing`。

替代：HTTP → `urllib.request`；哈希 / HMAC → `hashlib` / `hmac`；数值 → `math` / `decimal`。

## 脚本骨架

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import sys


def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as e:
        print(json.dumps({"ok": False, "error": f"invalid json: {e}"}, ensure_ascii=False))
        sys.exit(1)

    try:
        # ... 业务逻辑 ...
        result = {"ok": True, "data": {}}
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False))
        sys.exit(1)

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
```

## 检查清单

按「核心约束」表逐项核对即可。
