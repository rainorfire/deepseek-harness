---
name: java-api-doc-generation
description: 从 Java Spring Controller 包批量生成 HTTP 接口 Markdown 文档。覆盖单个 Controller、多个 Controller 包、以及含 @RequestMapping / @GetMapping / @PostMapping 等注解的方法。
---

# Java HTTP 接口文档生成

## 触发条件

用户给出以下任一信号时激活：
- "把 X 包下的接口整理成接口文档"
- "生成 HTTP 接口文档"
- "整理 Controller 的接口"
- 提供类似 `com.daojia.xxx.controller` 的 Java 包路径

## 用户偏好

- **输出格式**：单一 Markdown 汇总文档（除非用户明确要求每个 Controller 一个文件）
- **必填字段**：完整 URL、HTTP 方法、返回类型、请求参数（名 / 类型 / 位置：query/form/body）
- **范围**：用户指定的包路径下所有 Controller（注意跳过被注释掉的类）

## 执行步骤

1. **定位 Controller 文件**
   - 用 Bash `find <base>/src/main/java/<package-path> -name "*Controller.java"` 列文件
   - 同时用 Grep 确认类级 `@RequestMapping` 路径前缀

2. **提取接口元信息**
   - 少量 Controller（≤3）：直接 Read + 人工整理
   - 大量 Controller（>3）：写 Python 脚本扫描，解析：
     - `@RestController` + 类级 `@RequestMapping(value = "...")`
     - `@GetMapping / @PostMapping / @PutMapping / @DeleteMapping / @RequestMapping`
     - 方法签名：返回类型、方法名、参数列表
     - 参数注解：`@RequestParam` / `@RequestBody` / `@PathVariable` / `@ModelAttribute`
   - 脚本要点：处理括号嵌套、过滤 `HttpServletRequest` 等非业务参数、跳过 `private` 工具方法

3. **补充 DTO / VO**
   - 找到返回类型和 body 参数对应的类，Read 关键字段
   - 在文档里给出 data 结构说明或链接到源码位置

4. **生成 Markdown**
   - 文档标题、生成日期、扫描包路径
   - 目录 + Controller 列表
   - 每个接口一张表格 + 参数表格
   - 可选：curl 示例、源码文件路径

5. **保存与验证**
   - 文件放到 `<workingDir>`，命名如 `{模块名}-接口汇总文档.md`
   - Read 生成文件确认格式无错乱

## 边界情况

- 类被整体注释掉（如 `//package ...`）：跳过
- 方法无 HTTP 注解：不纳入
- 参数带默认值或 `required = false`：保留类型和参数名，位置仍为 query
- `@RequestMapping` 未指定 method：标记为 `GET/POST`

## 参考模板

```python
# scan_controllers.py 关键正则
CLASS_PATTERN = r'@RequestMapping\s*\(\s*value\s*=\s*"([^"]+)"\s*\)[\s\S]*?public\s+class\s+(\w+)'
METHOD_PATTERN = r'(@(?:GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\s*\([^)]*value\s*=\s*"([^"]+)"[\s\S]*?\))\s+public\s+(\S+)\s+(\w+)\s*\(([^)]*)\)'
```

## 最近一次应用

- 项目：到家 DJ `user-recruit-web`
- 包：`com.daojia.jzup.recruit.controller.airecruit` + `airecruit2`
- 结果：13 Controller / 60 接口，汇总为 `AI智聘接口汇总文档.md`