---
name: drawio-arch
description: 用 drawio CLI 生成架构图、流程图、时序图、决策树等。适用场景：需要绘制系统架构图（用户→前端→后端→第三方平台）、API/SDK 时序图、决策树、流程图等可视化图表，最终输出 PNG/SVG/PDF。
---

# Drawio 架构图 / 时序图 / 流程图

## 何时使用
- 需要画**系统架构图**：展示多层系统（用户端 / 前端 / 后端 / 第三方平台）及其调用关系
- 需要画**交互时序图**：展示多个参与方（5-7 个）之间的多步骤调用
- 需要画**决策树 / 流程图**：判断分支 + 终端结果 + 降级路径
- 需要画**网络拓扑 / 部署图 / 数据流图**
- 任何需要清晰可视化"谁→谁→谁→做什么"的场景

## 工作流程（5 步）

### 1. 选 drawio CLI 而非 GUI
- **CLI 优势**：可批量、可脚本化、可纳入 CI、可生成多格式（PNG/SVG/PDF/HTML）
- **工具确认**：`which drawio`（macOS 通过 `brew install --cask drawio` 安装，路径 `/opt/homebrew/bin/drawio`）

### 2. 用 Python 脚本生成 `.drawio` 文件
**不要**手动写 mxGraph XML——容易漏关键属性。推荐用 `xml.etree.ElementTree` 编程生成：

```python
import xml.etree.ElementTree as ET
import time

def add_style(d): return ";".join(f"{k}={v}" for k, v in d.items())

def cell(cid, value, style, edge=False):
    attrs = {"id": cid, "value": value, "style": style, "parent": "1"}
    if edge:
        attrs["edge"] = "1"
    else:
        attrs["vertex"] = "1"   # ⚠️ 关键！漏了这个盒子不渲染
    return ET.Element("mxCell", attrs)

def geo(c, x=0, y=0, w=0, h=0, relative=False):
    attrs = {"as": "geometry"}
    if relative: attrs["relative"] = "1"
    else: attrs.update({"x": str(x), "y": str(y), "width": str(w), "height": str(h)})
    ET.SubElement(c, "mxGeometry", attrs)
    return c

def edge_with_waypoints(cid, src_id, tgt_id, label, style, waypoints=None):
    e = cell(cid, label, style, edge=True)
    geo(e, relative=True)
    e.set("source", src_id); e.set("target", tgt_id)
    if waypoints:
        g = e.find("mxGeometry")
        arr = ET.SubElement(g, "Array", {"as": "points"})
        for x, y in waypoints:
            ET.SubElement(arr, "mxPoint", {"x": str(x), "y": str(y)})
    return e
```

### 3. 关键踩坑经验（必看）

| 坑 | 表现 | 修复 |
|---|------|------|
| **漏 `vertex="1"`** | 盒子全部不渲染，只剩箭头 | 图形元素必须设 `vertex="1"`，连接器必须设 `edge="1"` |
| **边用相对坐标后没设置 waypoints** | 所有箭头堆在最上面 / 最短路径 | 用 `mxPoint` waypoints 控制转折点 |
| **value 用 `<br>`、`<b>` 多行 HTML** | 部分导出器渲染失败 | 多行用 `\n`，加粗用首字母大写或额外提示色，不要用 HTML 标签 |
| **多页合并导出时 pageSize 不一致** | 各页比例失调 | 每页独立设置 `pageWidth` / `pageHeight` |
| **箭头端点重叠文字** | label 压在盒子上 | 让 waypoint 落在盒子外缘（x = 盒子 x + 0/width） |
| **life-line 太长** | 时序图留白过多 | lifeline 高度控制在 600-700px 内 |

### 4. 导出命令

```bash
# 单页导出
drawio --export --format png --output out.png --page-index 1 file.drawio

# 多页批量
for i in 1 2 3; do
  drawio --export --format png --output "p${i}.png" --page-index "$i" file.drawio
done

# 高分辨率（2x 缩放）
drawio --export --format png --scale 2 --output out.png file.drawio

# 矢量图
drawio --export --format svg --output out.svg file.drawio
```

支持的格式：`png / jpg / svg / pdf / xml / html`

### 5. 验证输出
```bash
# macOS 缩放到 ≤2000px 方便预览
sips -Z 1200 out.png --out preview.png
```
然后用 Read 工具读取预览图，肉眼检查：
- ✅ 所有盒子都渲染了（不是只有箭头）
- ✅ 箭头走向符合语义
- ✅ label 文字不重叠
- ✅ 颜色有区分度（绿=正常、橙=警告、红=降级、灰=辅助）

## 常用样式预设

```python
# 普通矩形（带圆角）
rect = add_style({
    "rounded": "1", "whiteSpace": "wrap",
    "fillColor": "#E3F2FD", "strokeColor": "#1565C0",
    "fontColor": "#000", "fontSize": "14",
    "align": "center", "verticalAlign": "middle"
})

# 决策菱形
diag = add_style({
    "rhombus": "1", "whiteSpace": "wrap",
    "fillColor": "#FFF8E1", "strokeColor": "#F57F17",
    "fontSize": "14", "align": "center", "verticalAlign": "middle"
})

# 成功态（绿）
ok = add_style({**rect_base, "fillColor": "#C8E6C9", "strokeColor": "#1B5E20"})
# 警告态（橙）
warn = add_style({**rect_base, "fillColor": "#FFE0B2", "strokeColor": "#E65100"})
# 错误态（红）
err = add_style({**rect_base, "fillColor": "#FFCDD2", "strokeColor": "#B71C1C"})

# 时序图 lifeline（灰色虚线竖条）
ll = add_style({
    "fillColor": "#E0E0E0", "strokeColor": "#BDBDBD",
    "dashed": "1", "pointerEvents": "0"
})

# 时序图参与方（深蓝白字头部）
participant = add_style({
    "rounded": "1", "whiteSpace": "wrap",
    "fillColor": "#283593", "strokeColor": "#1A237E",
    "fontColor": "#FFFFFF", "fontSize": "13",
    "align": "center", "verticalAlign": "middle"
})
```

## 画布尺寸参考

| 场景 | pageWidth × pageHeight |
|------|----------------------|
| 单层架构图 | 1400 × 800 |
| 时序图（5-6 参与方） | 1500 × 900 |
| 决策树（2-3 层） | 1300 × 950 |
| 多页文档（一页一图） | 每页独立设置 |

## 输出文件管理

最终保留这三类文件：
- `<name>.drawio` — 源文件（可双击在 drawio 桌面端继续编辑）
- `<name>-pN.png` — 位图（嵌入文档/PPT）
- `<name>-pN.svg` — 矢量图（前端/印刷）

不要保留中间过程文件（缩放预览等）。

## 模板文件

参考 `template.py`（skill 目录内）——一个完整可运行的 3 页 drawio 生成脚本（架构图 + 时序图 + 决策树），复制后修改即可。

## 验收标准

- [ ] drawio 桌面端能打开，编辑保存正常
- [ ] CLI 导出的 PNG 在 macOS Preview 能正常显示
- [ ] 缩放到 1200px 后文字依然清晰可读
- [ ] 没有元素跑到画布外
- [ ] 没有标签重叠 / 截断