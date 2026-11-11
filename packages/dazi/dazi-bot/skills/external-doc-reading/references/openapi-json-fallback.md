# 易宝开放平台：apiId → openapi.json，零浏览器拿全量接口定义

来源：2026-09-24 抓取《【开具结果】数电票开具结果查询》时的实战发现。
比 `js-rendered-doc-json-endpoints.md`（只到「接口清单」层）更进一步：**单接口的完整参数定义也能纯 curl 拿到，不需要 chrome-devtools。**

## 两行 curl 拿全文

```bash
# 1) 拉接口目录，拿到每个接口的 apiId
curl -s "https://open.yeepay.com/apis/docs/products/fwssfk/apiCategories.json" -o /tmp/cat.json

# 2) 用 apiId 直接换官方 OpenAPI 3.1.0 规范（不需要 Referer / Cookie / 浏览器）
curl -s "https://open.yeepay.com/apis/docs/apis/{apiId}/openapi.json" -o /tmp/api.json
```

第 2 步实测直接 200。返回体就是完整 OpenAPI：

- `info.title`（接口中文名）、`info.x-yop-meta.lastModified`（更新时间）、`info.x-yop-meta.apiId`
- `paths` / `components.schemas`（请求体、响应体全字段 + 枚举 + 示例）
- `info.x-yop-meta.errorCodes`（业务子错误码 + 解决方案原文）
- `info.x-yop-meta.sampleCodes`（Java 等示例代码）

**等价性已验证**：它与浏览器渲染时抓到的 `.../products/fwssfk/{docId}/openapi.json` 相比，`paths` 与 `components.schemas` **完全相等**，仅无关字段顺序有差异。

## 目录结构（apiCategories.json）

顶层是数组，每元素一个产品分类：

```json
{ "code": "shudianfapiao", "name": "数电发票", "items": [
    { "pageId": 9555,
      "apiId": "d5eb7f37da0c4a769418386b1fbae218",
      "method": "POST",
      "path": "/rest/v1.0/invoice/digit/query-invoice",
      "title": "【开具结果】数电票开具结果查询",
      "uri": "post__rest__v1.0__invoice__digit__query-invoice",
      "location": "fwssfk/shudianfapiao/post__rest__v1.0__invoice__digit__query-invoice" }
]}
```

### 容易误判的一点

**`apiId` ≠ 页面 URL 里那串 docId。**

- 文档页 URL 形如 `.../docs/products/fwssfk/api/post__rest__v1.0__invoice__digit__query-invoice`，**不带任何 ID**；
- 渲染时网络里出现的 `.../apis/docs/products/fwssfk/8ff3fdef.../openapi.json`，那串 32 位是**另一个**标识；
- 它和 `apiCategories.json` 里的 `apiId` **不是同一个值**，别拿 docId 去拼 apiId 路径。

## 路径验证矩阵（别再试失败项）

| 路径 | 结果 |
|---|---|
| `/apis/docs/apis/{apiId}/openapi.json` | ✅ 200（**正解，首选**） |
| `/apis/docs/products/fwssfk/{docId}/openapi.json` | ✅ 200（渲染时抓到的，等价，但需先知道 docId） |
| `/apis/docs/products/fwssfk/apiCategories.json` | ✅ 200（接口目录，445 个接口 / 36 个分类） |
| `/apis/docs/products/fwssfk/pages/{pageId}/openapi.json` | ❌ 403 |
| `/apis/docs/pages/{pageId}/openapi.json` | ❌ 403 |
| `/apis/docs/products/fwssfk/api/{apiId}/openapi.json` | ❌ 403 |
| `/apis/docs/api/{apiId}/openapi.json` | ❌ 403 |

403 响应体约 263 字节的固定拒绝页，**不必重试**。

## 通用判据

凡是发现文档站渲染时请求过 `*.json`（树 / 分类 / 规范），**先把该 URL 模板里的 id 换成目录里的 `apiId` 再 curl 一次**：
能 200 就彻底甩掉浏览器（首选路径）；不能 200 再退回 chrome-devtools 渲染。

## 数电发票（shudianfapiao）apiId 对照表

2026-09-24 从 `apiCategories.json` 提取，共 22 个：

| apiId | 路径 | 接口名 |
|---|---|---|
| `11c5560bcf4549678131216da8bf2bdb` | POST `/rest/v1.0/invoice/digit/enterprise-register` | 【企业信息维护】企业信息注册 |
| `68c699c758e847f1b0200ce978ee5541` | POST `/rest/v1.0/invoice/digit/enterprise-update` | 【企业信息维护】企业信息修改 |
| `705495102c8045c19efc6ddf9c4b707e` | POST `/rest/v1.0/invoice/digit/enterprise-query` | 【企业信息维护】企业信息查询 |
| `333d6f49f9b742ac893d16972c9b9fba` | POST `/rest/v1.0/invoice/digit/active-sms-code-check` | 【服务开通&新增开票员】短信验证码发送 |
| `8ab1ff766e9341d3a85719b5f50cc8df` | POST `/rest/v1.0/invoice/digit/open-server` | 【发票服务开通】数电票发票服务开通激活 |
| `5897a2dd62424052853c6992efd16fc0` | POST `/rest/v1.0/invoice/digit/digital-account-query` | 【开票员修改】开票员信息查询接口 |
| `73dfeb8db42e446cba5b818fb1745476` | POST `/rest/v1.0/invoice/digit/account-add-edit` | 【开票员修改】开票员信息新增或修改接口 |
| `3dac7127003b48e09b62ab5a4685b7d3` | POST `/rest/v1.0/invoice/digit/user/login` | 【开票员登录】开票员登录 |
| `ce3db11705094dbf93e2a85cd41e8be2` | POST `/rest/v1.0/invoice/digit/login-result/query` | 【开票员登录】开票员登录状态查询 |
| `de6ecce14a7f4cdd91e1978e778136bd` | POST `/rest/v1.0/invoice/digit/certify-qrcode/get` | 【开票员人脸核验】获取人脸核验二维码 |
| `18296d48e8354503aa500f806c51e593` | POST `/rest/v1.0/invoice/digit/qrcode-certify-result/get` | 【开票员人脸核验】获取人脸核验结果 |
| `4b25dc53ea114947afcd99dbbc6eacab` | POST `/rest/v1.0/invoice/digit/issue-invoice` | 【发票开具】数电票蓝字发票开具 |
| `a73096f0c0af46fca001037609e400d2` | POST `/rest/v1.0/invoice/digit/fast-red` | 【发票开具】数电票红字发票开具 |
| `d2feea849531421b9f0e20bbe1614bf1` | POST `/rest/v1.0/invoice/digit/retry-invoice` | 【发票开具】数电票蓝字发票重试开具 |
| `d5eb7f37da0c4a769418386b1fbae218` | POST `/rest/v1.0/invoice/digit/query-invoice` | 【开具结果】数电票开具结果查询 |
| `b7d653f100e64a91ac229f41efc6655d` | POST `/rest/v1.0/invoice/digit/delete-invoice` | 【发票开具】删除发票 |
| `8d7f532bd31f4933bdfa3d716e8cebe5` | POST `/rest/v1.0/invoice/digit/order/qrcode/gen` | 【发票开具】开票二维码 |
| `5508b38a55384b0e8d7aae8a5342c447` | POST `/rest/v1.0/invoice/digit/cancel-order-qr-code` | 【发票开具】开票二维码作废 |
| `5c7a30956b394310ae5dd6d5d59c9c55` | POST `/rest/v1.0/invoice/digit/order/qrcode/status/query` | 【发票开具】开票二维码状态查询 |
| `da814f6af6f7452fa0394513cc2d77e3` | POST `/rest/v1.0/invoice/digit/invoicepdf-resendemail` | 【发票发送】发票文件重新发送 |
| `1e07688d45a743bd97e808aa925a151a` | POST `/rest/v1.0/invoice/digit/auto-title/query` | 智能抬头 |
| `a48fa44d7bd6493194e643181d5e88a8` | POST `/rest/v1.0/invoice/digit/auto-goods-code/query` | 智能赋码 |

开票服务（kaipiaofuwu，5 个，非数电）：

| apiId | 路径 | 接口名 |
|---|---|---|
| `d8a20dc4b5e142929681a18c387f6994` | POST `/rest/v1.0/invoice/apply` | 申请开票 |
| `4947457e0fa349958ae8f5745066d241` | GET `/rest/v1.0/invoice/record/query` | 查询开票记录 |
| `6d2e3c357ee34124b294eac1c0197221` | GET `/rest/v1.0/invoice/fee/query` | 查询费用 |
| `ff7acd5f23ff491f95d402c5f18f7df4` | POST `/rest/v1.0/invoice/info/modify` | 维护发票信息 |
| `dd712f996e444f3893d69af11707e736` | GET `/rest/v1.0/invoice/info/query` | 查询发票信息 |

其余分类（账户服务 83、聚合支付 26、交易 55 等，共 36 类 445 个接口）可按需现拉现查，不必预存。
