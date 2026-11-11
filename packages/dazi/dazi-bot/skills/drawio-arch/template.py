#!/usr/bin/env python3
"""
Generate drawio architecture diagrams - v3 (plain text labels, no HTML magic)
"""
import time
import xml.etree.ElementTree as ET

def add_style(d): return ";".join(f"{k}={v}" for k, v in d.items())

def cell(cid, value, style, edge=False):
    attrs = {"id": cid, "value": value, "style": style, "parent": "1"}
    if edge:
        attrs["edge"] = "1"
    else:
        attrs["vertex"] = "1"
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


# ============================================================
# Page 1: 系统架构图
# ============================================================
def page1():
    cells = []; cid = 100
    def n(): nonlocal cid; cid += 1; return str(cid)

    rect_style = lambda fc, sc, fs=14: add_style({
        "rounded": "1", "whiteSpace": "wrap",
        "fillColor": fc, "strokeColor": sc,
        "fontColor": "#000", "fontSize": str(fs),
        "align": "center", "verticalAlign": "middle"
    })

    # Nodes [(key, label, x, y, w, h, fc, sc)]
    nodes = [
        ("wxu",   "微信用户",        400,  80, 160, 60,  "#E8F5E9", "#2E7D32"),
        ("liu",   "浏览器用户",      620,  80, 160, 60,  "#FFF3E0", "#E65100"),
        ("appu",  "APP 内用户",      840,  80, 160, 60,  "#E3F2FD", "#1565C0"),
        ("h5",    "H5 中间页\nweb-demo.html", 400, 220, 280, 90, "#E8EAF6", "#283593"),
        ("h5flow","处理流程\n加载SDK→请求签名→xhs.share", 740, 220, 280, 90, "#FFFFFF", "#283593", 12),
        ("be",    "后端签名服务\nserver-sign-demo.js", 400, 400, 280, 90, "#FFF8E1", "#F57F17"),
        ("beflow","appSecret → HMAC-SHA1\nnonce + ts + signature", 740, 400, 280, 90, "#FFFFFF", "#F57F17", 12),
        ("sdk",   "小红书 JS SDK\nxhs.share()", 400, 580, 200, 90, "#FFF0F0", "#FF2442"),
        ("app",   "小红书 APP\n发布页预填充", 660, 580, 200, 90, "#FFEBEE", "#B71C1C"),
        ("svr",   "小红书服务端\n签名校验 + 发布 API", 920, 580, 220, 90, "#F3E5F5", "#6A1B9A"),
        ("fb",    "降级方案（Android 微信内）\n剪贴板预填 + URL Scheme", 1080, 220, 300, 90, "#FCE4EC", "#C62828"),
    ]

    node_ids = {}
    for n_ in nodes:
        key, label = n_[0], n_[1]
        x, y, w, h = n_[2], n_[3], n_[4], n_[5]
        fc, sc = n_[6], n_[7]
        fs = n_[8] if len(n_) > 8 else 14
        nid = n()
        node_ids[key] = nid
        s = rect_style(fc, sc, fs)
        c = cell(nid, label, s)
        geo(c, x, y, w, h)
        cells.append(c)

    def E(src, tgt, label, color, dashed=False, wps=None):
        sty = add_style({
            "edgeStyle": "orthogonalEdgeStyle", "rounded": "1",
            "strokeColor": color, "fontColor": color, "fontSize": "12",
            "fontStyle": "1", "align": "center", "verticalAlign": "middle",
            "labelBackgroundColor": "#FFFFFF"
        })
        if dashed: sty += ";dashed=1"
        wp_list = [(x, y) for x, y in wps] if wps else None
        e = edge_with_waypoints(n(), node_ids[src], node_ids[tgt], label, sty, wp_list)
        cells.append(e)

    # Users → H5
    E("wxu",  "h5", "访问 H5",  "#2E7D32", wps=[(480, 140), (480, 220)])
    E("liu",  "h5", "访问 H5",  "#E65100", wps=[(700, 140), (700, 220)])
    E("appu", "h5", "深链唤起", "#1565C0", wps=[(920, 140), (920, 220)])

    # H5 ↔ Backend
    E("h5",  "be",  "POST /api/verify-config\n(appSecret 服务端签名)", "#F57F17",
       wps=[(540, 310), (540, 400)])
    E("be",  "h5",  "返回 verifyConfig\n{appKey, nonce, ts, sig}",   "#43A047",
       dashed=True, wps=[(640, 380), (640, 310)])

    # H5 → SDK → APP → Server
    E("h5", "sdk", "xhs.share(shareInfo, verifyConfig)", "#FF2442",
       wps=[(500, 310), (500, 580)])
    E("sdk", "app", "唤起 APP", "#FF2442", wps=[(550, 580), (550, 580)])
    E("app", "svr", "发布 API", "#6A1B9A", wps=[(770, 580), (770, 580)])

    # Fallback edge
    E("h5", "fb", "降级", "#C62828", dashed=True,
       wps=[(680, 265), (1080, 265)])

    # Section labels on left
    sections = [("① 用户触发层", 80, 90),
                ("② H5 中间页",  80, 230),
                ("③ 后端服务",    80, 410),
                ("④ 小红书平台",  80, 600)]
    for label, sx, sy in sections:
        c = cell(n(), label, add_style({
            "fontSize": "14", "fontStyle": "1", "align": "left",
            "fillColor": "#FAFAFA", "strokeColor": "#CCCCCC", "rounded": "1"
        }))
        geo(c, sx, sy, 200, 50)
        cells.append(c)

    return cells


# ============================================================
# Page 2: 交互时序图
# ============================================================
def page2():
    cells = []; cid = 200
    def n(): nonlocal cid; cid += 1; return str(cid)

    # 5 Participants widely spaced
    parts = [
        ("user",    "① 用户",        200),
        ("h5",      "② H5 页面",     450),
        ("be",      "③ 后端签名服务", 750),
        ("sdk",     "④ 小红书 JS SDK", 1050),
        ("xhsapp",  "⑤ 小红书 APP",  1300),
    ]
    part_ids = {}; part_x = {}
    for key, label, x in parts:
        nid = n(); part_ids[key] = nid; part_x[key] = x
        c = cell(nid, label, add_style({
            "rounded": "1", "whiteSpace": "wrap",
            "fillColor": "#283593", "strokeColor": "#1A237E",
            "fontColor": "#FFFFFF", "fontSize": "13",
            "align": "center", "verticalAlign": "middle"
        }))
        geo(c, x - 90, 80, 180, 50)
        cells.append(c)
        # Lifeline
        ll = cell(n(), "", add_style({
            "fillColor": "#E0E0E0", "strokeColor": "#BDBDBD",
            "dashed": "1", "pointerEvents": "0"
        }))
        geo(ll, x - 1, 130, 2, 700)
        cells.append(ll)

    # Messages with explicit y positions via waypoints
    msgs = [
        ("user",    "h5",     "1. 用户访问 H5 页面",                       "#1565C0",  220),
        ("h5",      "sdk",    "2. 加载 xhs.share JS SDK",                  "#283593",  290),
        ("sdk",     "h5",     "3. SDK 初始化完成（提供 xhs.share）",        "#43A047",  360),
        ("h5",      "be",     "4. POST /api/verify-config 请求签名",       "#F57F17",  440),
        ("be",      "h5",     "5. 返回 verifyConfig {appKey, nonce, ts, sig}", "#43A047", 520),
        ("h5",      "sdk",    "6. 调用 xhs.share(shareInfo, verifyConfig)","#FF2442",  600),
        ("sdk",     "xhsapp", "7. 唤起小红书 APP\n自动填充标题/正文/图片", "#B71C1C",  680),
        ("xhsapp",  "xhsapp", "8. 用户确认发布",                          "#6A1B9A",  760),
    ]

    for src, tgt, label, color, y in msgs:
        sty = add_style({
            "edgeStyle": "orthogonalEdgeStyle", "rounded": "1",
            "strokeColor": color, "fontColor": color, "fontSize": "12",
            "fontStyle": "1", "align": "center", "verticalAlign": "middle",
            "labelBackgroundColor": "#FFFFFF", "labelBorderColor": color
        })
        if src == tgt:  # self-loop, curve right
            sx = part_x[src]
            wp = [(sx + 30, y), (sx + 30, y - 25)]
        else:
            sx, tx = part_x[src], part_x[tgt]
            wp = [(sx, y), (tx, y)]
        e = edge_with_waypoints(n(), part_ids[src], part_ids[tgt], label, sty, wp)
        cells.append(e)

    return cells


# ============================================================
# Page 3: 兼容决策树
# ============================================================
def page3():
    cells = []; cid = 300
    def n(): nonlocal cid; cid += 1; return str(cid)

    diag_style = lambda fc, sc: add_style({
        "rhombus": "1", "whiteSpace": "wrap",
        "fillColor": fc, "strokeColor": sc,
        "fontColor": "#000", "fontSize": "14",
        "align": "center", "verticalAlign": "middle"
    })
    rect_style = lambda fc, sc, fs=13: add_style({
        "rounded": "1", "whiteSpace": "wrap",
        "fillColor": fc, "strokeColor": sc,
        "fontColor": "#000", "fontSize": str(fs),
        "align": "center", "verticalAlign": "middle"
    })

    nodes = [
        ("root",   "用户触发发布",                                500,  80, 200, 50, rect_style("#E3F2FD", "#1565C0", 14)),
        ("osdec",  "判断操作系统",                                500, 180, 200, 70, diag_style("#FFF8E1", "#F57F17")),
        ("iosbox", "iOS 设备",                                    200, 320, 180, 50, rect_style("#E8F5E9", "#2E7D32", 14)),
        ("andbox", "Android 设备",                                880, 320, 180, 50, rect_style("#E8F5E9", "#2E7D32", 14)),
        ("iosbr",  "判断浏览器",                                  200, 420, 180, 70, diag_style("#FFF8E1", "#F57F17")),
        ("andbr",  "判断浏览器",                                  880, 420, 180, 70, diag_style("#FFF8E1", "#F57F17")),
        ("iossf",  "Safari / 默认浏览器\n✅ 直接 xhs.share()\n唤起成功率最高",  80, 540, 240, 100, rect_style("#C8E6C9", "#1B5E20", 13)),
        ("ioswx",  "iOS 微信内\n⚠️ xhs.share 仍可触发\n需用户二次确认跳转",    360, 540, 240, 100, rect_style("#FFE0B2", "#E65100", 13)),
        ("andok",  "Chrome / 系统浏览器\n✅ 直接 xhs.share()\n唤起成功率较高",  740, 540, 240, 100, rect_style("#C8E6C9", "#1B5E20", 13)),
        ("andwx",  "Android 微信内\n❌ xhs.share 无法唤起\n→ 引导跳转系统浏览器\n→ 剪贴板 + URL Scheme", 1020, 540, 240, 130, rect_style("#FFCDD2", "#B71C1C", 13)),
        ("fb",     "降级方案详情\n① 复制内容到剪贴板\n② try { window.location.href = 'xhsdiscover://...' } catch (e) {}\n③ 引导用户手动打开小红书", 400, 760, 480, 130, rect_style("#FCE4EC", "#C62828", 12)),
    ]

    node_ids = {}
    for key, label, x, y, w, h, style in nodes:
        nid = n(); node_ids[key] = nid
        c = cell(nid, label, style)
        geo(c, x, y, w, h)
        cells.append(c)

    def E(src, tgt, label, color, dashed=False, wps=None):
        sty = add_style({
            "edgeStyle": "orthogonalEdgeStyle", "rounded": "1",
            "strokeColor": color, "fontColor": color, "fontSize": "12",
            "fontStyle": "1", "align": "center", "verticalAlign": "middle",
            "labelBackgroundColor": "#FFFFFF"
        })
        if dashed: sty += ";dashed=1"
        wp = [(x, y) for x, y in wps] if wps else None
        e = edge_with_waypoints(n(), node_ids[src], node_ids[tgt], label, sty, wp)
        cells.append(e)

    # Edges
    E("root",   "osdec",  "",      "#1565C0", wps=[(600, 130), (600, 180)])
    E("osdec",  "iosbox", "iOS",      "#1565C0", wps=[(600, 260), (290, 260), (290, 320)])
    E("osdec",  "andbox", "Android",  "#1565C0", wps=[(700, 250), (970, 250), (970, 320)])
    E("iosbox", "iosbr",  "",      "#1565C0", wps=[(290, 370), (290, 420)])
    E("andbox", "andbr",  "",      "#1565C0", wps=[(970, 370), (970, 420)])
    E("iosbr",  "iossf",  "Safari",   "#1B5E20", wps=[(200, 490), (200, 540)])
    E("iosbr",  "ioswx",  "微信",       "#E65100", wps=[(380, 490), (380, 540), (480, 540)])
    E("andbr",  "andok",  "非微信",    "#1B5E20", wps=[(860, 490), (860, 540)])
    E("andbr",  "andwx",  "微信",       "#B71C1C", wps=[(970, 490), (970, 540), (1140, 540)])
    E("andwx",  "fb",     "走降级",      "#C62828", dashed=True,
       wps=[(1140, 670), (1140, 720), (880, 720), (880, 760)])

    return cells


# ============================================================
def build_xml():
    mx = ET.Element("mxfile", {
        "host": "drawio",
        "modified": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "agent": "dazi", "version": "24.7.5", "type": "device"
    })
    pages = [
        ("page1", "系统架构图", 1500, 750, page1),
        ("page2", "交互时序图", 1500, 900, page2),
        ("page3", "兼容决策树", 1350, 950, page3),
    ]
    for pid, name, w, h, fn in pages:
        d = ET.SubElement(mx, "diagram", {"id": pid, "name": name})
        m = ET.SubElement(d, "mxGraphModel", {
            "dx": "0", "dy": "0", "grid": "1", "gridSize": "10",
            "guides": "1", "tooltips": "1", "connect": "1", "arrows": "1",
            "fold": "1", "page": "1", "pageScale": "1",
            "pageWidth": str(w), "pageHeight": str(h),
            "background": "#ffffff", "math": "0", "shadow": "0"
        })
        r = ET.SubElement(m, "root")
        r.append(ET.Element("mxCell", {"id": "0"}))
        r.append(ET.Element("mxCell", {"id": "1", "parent": "0"}))
        for c in fn(): r.append(c)
    return mx

def main():
    out_xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(build_xml(), encoding="unicode")
    p = "/Users/chenyujia/Documents/我的文件/dazi/xiaohongshu-arch-v3.drawio"
    with open(p, "w", encoding="utf-8") as f: f.write(out_xml)
    print(f"✅ Generated: {p}  ({len(out_xml)} bytes)")

if __name__ == "__main__":
    main()
