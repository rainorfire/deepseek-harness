# 技术方案 / 架构图类 HTML 交付（纯 CSS 流程图变种）

本文档覆盖 `html-illustrated-delivery` 的第二个变种：**以纯 HTML/CSS 绘制架构图/流程图的技术方案文档**（无真实图片时）。典型场景：用户拿一份设计讨论 md + 实施 plan，让生成「技术方案 HTML，要有总架构图、讲清两阶段流程、解释关键文档实体、体现实物自生长」。

## 触发识别

用户说「生成技术方案文档」「要总架构图」「讲清楚 phase1/phase2 过程」「HTML 格式」+ 给源文档（.md/.plan.md）时，本变种优先于「内嵌真实图片」变种。

## 章节骨架（10 章通用模板，2026-08-31 鹅宝分层记忆方案实证）

1. 整体架构：调用链 + Port/Adapter 边界 + 契约表 + 时序
2. 数据模型：树形结构 + namespace 落盘对照
3. 核心文件逐个讲清（作用/构成/谁维护/主模型是否读）——本类文档的灵魂章节
4. 读写顺序（读链/写链/与存量对接）
5. 阶段流程 A（触发→防抖→队列→抽取→判定写不写）
6. 阶段流程 B（脏标记→全局队列→短路→合并→校验→增量→写上层）
7. 召回链 / 检索顺序
8. 遗忘机制 / 淘汰与不做清单
9. 实施分期（Slice 表格 + 接缝预留 + 验收）
10. 边界红线（三条红线/保留不搬清单）

## 大文件 HTML 分块生成协议（关键，防 Write 一次性写崩）

> 54KB+ / 500 行+ 的 HTML 千万不要一次 Write 写完整文件。分块协议：

```bash
mkdir -p /tmp/xxx_doc
# 每块用 heredoc 写独立 part 文件（head 块 1 个，正文按章节 1 块/章，结尾块 1 个）
cat > /tmp/xxx_doc/part0_head.html <<'HTMLEOF'
<!DOCTYPE html> ... <style>...</style> ...</head><body>
HTMLEOF
cat > /tmp/xxx_doc/part1_arch.html <<'HTMLEOF'
<section class="card" id="arch">...</section>
HTMLEOF
# 拼接（顺序必须在文件名里编号）
for f in /tmp/xxx_doc/part0_head.html /tmp/xxx_doc/part1_arch.html ... ; do cat "$f"; echo ""; done > 交付文件.html
```

要点：
- part 文件名带编号，拼接顺序由 for 列表显式控制
- 流程图节点用 `div.box + div.arrow` 组合，CSS 统一深浅色节点（蓝色主链/橙色策略层/绿色写/红色禁）
- 每个 section 独立成块，便于中途校验

## 交付前核验三步（必须全做，别只做一步）

### 1) 标签闭合粗检（python，秒级）

```bash
python3 - <<'PY'
import re
s=open('交付文件.html',encoding='utf-8').read()
for t in ["section","div","table","pre","ul","ol","footer"]:
    o=len(re.findall(rf"<{t}[ >]",s)); c=len(re.findall(rf"</{t}>",s))
    print(t, o, c, "OK" if o==c else "MISMATCH")
PY
```

### 2) 无头 Chrome 截图验证（macOS + work-dazi 沙箱专用 flags）

**关键坑：** Chrome 是 GUI 应用，沙箱里跑会崩（exit 134）。必须带全套 flags + 独立 user-data-dir，且真正的 GUI 进程需要提权（申请权限后即可）。**exit=0 不代表截图已落盘——必须 ls 检查文件。**

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-sandbox --no-first-run --no-default-browser-check \
  --disable-crash-reporter --disable-dev-shm-usage --disable-software-rasterizer \
  --user-data-dir=/tmp/xxx_doc/chromeprofile2 \
  --screenshot=/tmp/xxx_doc/preview.png --window-size=1280,2400 --hide-scrollbars \
  "file:///tmp/xxx_doc/preview_src.html"
ls -la /tmp/xxx_doc/preview.png   # 必须落盘才算成功
exit=134 → flags 不全（补 --no-first-run --disable-crash-reporter --disable-dev-shm-usage --user-data-dir）或需提权
```

（审慎：headless 截图反复失败时不要无限重试，第 2 次失败后申请提权再跑，一次即成功——2026-08-31 实证。）

### 3) DOM 级验证（dump-dom + python 关键词检查）

```bash
Chrome --headless ... --dump-dom "file://..." 2>/dev/null | python3 -c "
import sys,re
d=sys.stdin.read()
print('DOM bytes:',len(d))
for kw in ['整体架构','五大核心文件','Phase 1','Phase 2','MemoryPort','三条红线']:
    print(kw, 'OK' if kw in d else 'MISSING')
"
```

## 交付物位置

放**工作区根目录**（非 /tmp），用户双击即开；文件名中文直观如「鹅宝分层记忆技术方案_MemoryPort.html」。

## 用户偏好（佳哥实证）

- 用户连说「继续执行，别打折扣」→ 技术方案 HTML 必须**零折扣吸收全部源材料**（2882 行设计讨论 + 210 行 plan 一个不落），不许只挑章节概要。
- 流程图全部纯 HTML/CSS 绘制（非图片），保证离线可开、可打印。
- 收尾交付汇报用「内容结构（N 章）+各章一句话」表格化总结，用户爱看类目化的交付说明。
