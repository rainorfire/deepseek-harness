# 案例：《Agentic Design Patterns》中文版（2026-08-02 实战）

## 需求
佳哥要《Agentic Design Patterns》中文版，整理成册发飞书。

## 仓库选择
- `xindoo/agentic-design-patterns`：公认质量最好的中文版（在线版 adp.xindoo.xyz）
- `ningg/Agentic-Design-Patterns-CN`：候选，但 clone 失败未用上

## 踩坑：git clone 直连失败
两个仓库 clone 都报：
- `Error in the HTTP2 framing layer`
- `curl 35 LibreSSL SSL_connect: SSL_ERROR_SYSCALL`
- `致命错误：在引用列表之后应该有一个 flush 包`

**兜底方案**（成功）：codeload zip
```bash
curl -sL --connect-timeout 20 -o xindoo.zip https://codeload.github.com/xindoo/agentic-design-patterns/zip/refs/heads/main
# 6.7MB，成功
unzip -q xindoo.zip -d xindoo
```

## 内容结构
- `SUMMARY.md`：目录（含章节顺序，用正则 `<chapters/([^>]+)\.md>` 提取，共 31 个）
- `chapters/`：31 个 md（Chapter 1_ Prompt Chaining.md 等，文件名含空格下划线）
- `images/`：60 张 png
- `progress.md`：翻译进度 32/32 全部完成

## 构建命令（pandoc，工具已装 /opt/homebrew/bin/pandoc）
按 SUMMARY.md 顺序把 31 个文件传给 pandoc，`--embed-resources` 内嵌全部图片：
```bash
pandoc 文件1.md ... 文件31.md -f markdown -t html5 --standalone --embed-resources --metadata title="Agentic Design Patterns 智能体设计模式（中文版）" -o out.html
```
产物 3.9MB 单文件。

## 验证
- `grep -o 'data:image' out.html | wc -l` → 60（与 images/ 数量一致）
- `grep -o '<h1[^>]*>[^<]*</h1>' out.html` → 抽查章节标题齐全
- 复制到工作目录 → lark-cli `--file` 相对路径 + `--as bot` 发飞书成功

## 注意
- 这本书是 Antonio Gulli 等人写的（Google 书籍），与 Anthropic《Building Effective Agents》**不是**同一本，别混
- 章节文件名含空格，pandoc 传参时注意引号
