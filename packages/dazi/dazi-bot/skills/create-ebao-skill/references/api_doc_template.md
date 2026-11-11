# 接口文档模板

每个 `apis/*.md` 按以下结构编写，字段来源为接口平台标准数据结构。

```markdown
# [接口标题]

> [接口描述，来自 `desc` 或 `markdown`]

## 基本信息

| 项目 | 值 |
|------|-----|
| 方法 | `GET` / `POST`（来自 `method`） |
| Path | `/xxx/xxx`（来自 `path`） |
| Base URL | 取 `service.envs` 中 `name = online` 的 `address`；若无可用 online 地址则**只保留 Path**，不写 Base URL |
| 所属服务 | `service.name`（`service.desc`） |

## 请求参数

### Query 参数（来自 `req_query`）

| 参数名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| [name] | [required] | [desc] | [example] |

### Path 参数（来自 `req_params`，无则省略本节）

| 参数名 | 说明 | 示例 |
|--------|------|------|
| [name] | [desc] | [example] |

### Headers（来自 `req_headers`，无则省略本节）

| Header | 说明 | 示例 |
|--------|------|------|
| [name] | [desc] | [example] |

### Body（来自 `req_body_form` 或 `req_body_other`，无则省略本节；若 `req_body_type` 为 json，给出 JSON Schema 或示例）

## 响应

来自 `res_body`，按 `res_body_type` 格式展示。

**成功示例**（解析 `res_body` 中的 JSON，提取关键字段说明）：

```json
{
  "status": 0,
  "message": "ok",
  "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| [field] | [type] | [desc] |

## 错误处理

| errcode / status | 含义 | 处理方式 |
|-------------------|------|----------|
| [code] | [message] | [技能应如何处理] |

## 调用时机

[说明在什么 Step、什么条件下调用此接口]
```
