# 自包含 HTML 的无头 Chrome 校验（沙箱内可靠做法）

> 来源：2026-08-31 鹅宝分层记忆技术方案 v1/v2 交付会话。适用：自包含 HTML（无外部 JS/图片依赖）的技术方案/报告交付前的渲染核验。

## 核心结论

沙箱环境里 **`--screenshot` 经常拿不到文件**（exit 134 崩溃、或 exit 0 但无输出），**`--dump-dom` 稳定可靠**。做 DOM 级校验（标题 + 关键词 + 节点数）用 dump-dom，不要执着于截图。

## 可靠命令模板

```bash
# 1) 先复制一份独立副本（避免 Chrome 直接读工作区大文件）
cp "<final>.html" /tmp/check/check.html

# 2) dump-dom 渲染核验（每跑一次用一个全新 user-data-dir，避免脏 profile 卡死）
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-sandbox --no-first-run --disable-crash-reporter \
  --disable-dev-shm-usage --user-data-dir=/tmp/check/cp_$(date +%s) \
  --virtual-time-budget=3000 --dump-dom "file:///tmp/check/check.html" 2>/dev/null \
  > /tmp/check/dom_dump.html

# 3) 关键词/节点核验
python3 - <<'PY'
import re
d=open('/tmp/check/dom_dump.html',encoding='utf-8').read()
print('DOM bytes:',len(d))
for kw in ['章节1关键词','章节2关键词','关键术语']:
    print(f'  {kw}:', 'OK' if kw in d else 'MISSING')
PY
```

## 坑清单

- **exit 134**：Chrome 在沙箱里崩 → 加上 `--no-first-run --disable-crash-reporter --disable-dev-shm-usage` 全套 flag 再试；仍不行要申请提权。
- **exit 130（KeyboardInterrupt）**：Chrome 卡死 → 多半是 user-data-dir 复用冲突，换全新目录；跑完用 `pkill -f chromeprofile` / `pkill -f cp_` 清掉残留进程。
- **截图不落盘**：exit 0 但 ls 无 png → 别重试同一条命令，改 dump-dom 路线。
- 校验点至少含：DOM bytes、`<title>`、每个章节的标题/关键术语、flow/节点数（如果 HTML 里有数据节点可 grep 统计）。

## 大 HTML 交付的分块写法

单文件 HTML 超过 ~500 行建议分块写再拼：

```bash
mkdir -p /tmp/x/ && # 每块用 heredoc 写 part0_head.html / part1_xxx.html ...
cd /tmp/x && for f in part0_head.html part1_arch.html part2_data.html ...; do cat "$f"; echo ""; done > "<工作区>/最终交付.html"
```

拼完先做**标签闭合粗检**（open/close 数量一致），再 dump-dom 核验：

```python
import re
s=open('<最终交付.html>',encoding='utf-8').read()
for t in ['section','div','table','pre','ul','ol','footer','span']:
    o=len(re.findall(rf'<{t}[ >]',s)); c=len(re.findall(rf'</{t}>',s))
    print(t, o, c, 'OK' if o==c else 'MISMATCH')
```

## 版本更新时的做法

用户说「源文档更新了，重新生成」时：先 `stat` 两个源文件对比 mtime/size、`rg` 抓章节标题 diff，**确定真正变的是哪份**（本会话设计 md 没变、plan md 210→331 行变了），只对权威更新源做全文 diff，再决定 v2 全量重写而非小补丁。
