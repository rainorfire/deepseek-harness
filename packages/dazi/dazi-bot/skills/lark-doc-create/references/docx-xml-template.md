# 飞书 Docx XML 内容模板

基于 2026-08-03 文旅小院技术报价方案（lark-cli docs +create --doc-format xml）验证过的结构。

## 骨架

```xml
<title>文档标题（每篇唯一）</title>

<h1>一、一级章节</h1>

<p>正文段落。</p>

<h2>1.1 二级章节</h2>

<h3>三级标题</h3>
```

## 表格（带列宽 + 表头底色）

```xml
<table>
  <colgroup><col span="1" width="120"/><col span="1" width="200"/><col span="1" width="100"/></colgroup>
  <thead>
    <tr>
      <th background-color="light-gray">列1</th>
      <th background-color="light-gray">列2</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>值1</td><td>值2</td></tr>
  </tbody>
</table>
```

## 高亮框（callout，块级强调）

```xml
<callout emoji="🧾" background-color="light-yellow" border-color="yellow">
  <p><b>标题</b>：正文内容。</p>
</callout>
```

可用 emoji：🧾 🎯 💰 📊 📌 ⚠️ 🔴 🟠 🟡（红/橙/黄对应高中低风险）。
可用背景：light-yellow、light-blue、light-green、light-purple、light-red、light-orange。

## 代码块（架构图等 ASCII 图）

```xml
<pre lang="text" caption="系统架构图"><code>C 端小程序 ←→ B 端院主后台
        │
  API 网关 / WAF
</code></pre>
```

## 列表与引用

```xml
<ul><li>条目一</li><li>条目二</li></ul>
<ol><li>步骤一</li><li>步骤二</li></ol>
<blockquote>引用内容</blockquote>
```

## 注意

- `<title>` 每篇唯一，只能出现一次
- callout 内只支持文本/标题/列表/待办/引用，不能套表格
- 表格用 `<colgroup>` 控制列宽，`<th background-color="light-gray">` 控制表头底色
- 彩色文字用 `<span text-color="red">🔴 高风险</span>` 这类 span 包裹
- 写完用 `lark-cli docs +fetch --doc <id> --format pretty` 验证渲染效果
