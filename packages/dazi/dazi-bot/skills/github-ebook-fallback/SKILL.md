---
name: github-ebook-fallback
description: 下载 GitHub 仓库/书籍（clone 失败时用 codeload zip 兜底）并用 pandoc 合并 Markdown 章节为带目录导航、内嵌图片的单文件 HTML 电子书。用户说「找 XX 书中文版」「下载 GitHub 仓库」「做成本地电子书」「整理成 HTML 发我」时触发。
---

# GitHub 仓库兜底下载 + 单文件 HTML 电子书

## 何时使用

✅ **应该使用**:
- 用户要找一本书/文档的中文版或资料，来源是 GitHub 仓库
- `git clone` 直连失败（网络问题：HTTP2 framing error / curl 35 SSL_ERROR_SYSCALL）
- 需要把多章节 Markdown 合并成一份带目录、内嵌图片的单文件 HTML 交付
- 交付途径是飞书发文件

❌ **不应该使用**:
- 只是单个文件，直接 WebFetch 或 curl 即可
- 用户只要文字回答，不需要成册交付

## 核心流程（2026-08-02 实战验证成功）

### 1. clone 失败 → codeload zip 兜底

```bash
cd /tmp && mkdir -p adp-cn && cd adp-cn
curl -sL --connect-timeout 20 -o repo.zip https://codeload.github.com/<owner>/<repo>/zip/refs/heads/main
unzip -q repo.zip -d extracted
```

注意：clone 失败信息常见于国内网络：
- `Error in the HTTP2 framing layer`
- `curl 35 LibreSSL SSL_connect: SSL_ERROR_SYSCALL`
- `致命错误：在引用列表之后应该有一个 flush 包`

### 2. 确认翻译/内容完整性

- 读 README.md / SUMMARY.md / progress.md 确认翻译进度（进度如 32/32 才算完整）
- 看章节目录结构与图片目录（`images/`、60 张图等）
- 用 `find ... -type f | sed 's/.*\.//' | sort | uniq -c` 统计文件类型分布

### 3. 用 SUMMARY.md 提取章节顺序

不要手写章节顺序！用脚本从 SUMMARY.md 的正则 `<chapters/([^>]+)\.md>` 提取（含章节名中有空格、冒号的情况）。

### 4. pandoc 合并为单文件 HTML（内嵌图片）

```bash
pandoc file1.md file2.md ... -f markdown -t html5 --standalone --embed-resources --metadata title="书名" -o out.html
```

要点：
- `--embed-resources` 把所有图片 base64 内嵌，得到真正自包含的单文件
- 验证：`grep -o 'data:image' out.html | wc -l` 应与图片数一致
- 验证：`grep -o '<h1[^>]*>[^<]*</h1>' out.html` 抽查章节标题
- 图片引用需修正为相对 images/ 的正确路径（pandoc 运行目录决定）

### 5. 交付

复制到工作目录 → 用 lark-cli 发飞书（`--file` 相对路径 + `--as bot`，见 lark-cli-feishu-send 技能）：

```bash
cp "/tmp/.../书名.html" "/Users/chenyujia/Documents/我的文件/dazi/书名.html"
cd "/Users/chenyujia/Documents/我的文件/dazi" && lark-cli im +messages-send --chat-id <chat> --file "书名.html" --as bot
```

## 已实测参考案例

《Agentic Design Patterns》中文版：
- 源仓库：github.com/xindoo/agentic-design-patterns（公认质量最好的中文版，另有 adp.xindoo.xyz 在线版）
- clone 失败 → codeload zip（6.7MB）→ 31 章节按 SUMMARY.md 排序 → pandoc 合并 3.9MB 单文件，60 张图全部内嵌，验证通过后发飞书
- 注意区分：这本书是 Antonio Gulli 等人写的 Google 书籍，与 Anthropic 的《Building Effective Agents》不是同一本

参考案例细节见 references/agentic-design-patterns-case.md
