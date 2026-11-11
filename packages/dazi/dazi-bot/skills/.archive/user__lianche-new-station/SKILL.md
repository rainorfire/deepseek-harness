---
name: lianche-new-station
description: 链车新油站入网全流程自动化——员工查询、角色分配、公众号配置
---

# 链车新油站入网流程

新油站入网标准流程，包含 **员工查询 → 角色分配 → 公众号配置** 三个环节。

## 数据库连接

测试环境（仅供查询验证）：
```
host: 39.98.67.216
port: 3306
user: root
password: Lianche@123456@_
database: lianche
```

线上环境（正式操作）：
```
host: rm-bp10mfa9gc0asj8luho.mysql.rds.aliyuncs.com
port: 3306
user: liancheprod
password: w3sR7JsEwm$@YsIc
database: lianche_prod
```

Python 连接方式（本机无 mysql CLI，用 pymysql）：
```python
import pymysql
conn = pymysql.connect(
    host="...",
    port=3306,
    user="...",
    password="...",
    database="...",
)
cursor = conn.cursor(pymysql.cursors.DictCursor)
```

---

## 流程步骤

### 第 1 步：确认油站信息

从 `油站编号.xlsx`（公众号配置 sheet）获取油站名称和 shop_id。

### 第 2 步：查询员工信息

通过 shop_id 查询员工表，获取对应员工 ID 和岗位。

```sql
-- 查询油站管理员
SELECT eu.id, eu.real_name, eu.mobile, ej.name AS job_name
FROM lc_employee_user eu
JOIN lc_employee_job ej ON eu.job_id = ej.id
WHERE eu.shop_id = {shop_id} AND eu.deleted = 0;
```

**规则：**
- 未指定管理员时，默认取查询结果的第一条作为管理员
- 若指定了具体员工姓名或手机号，以此为准

### 第 3 步：分配通用角色

根据员工岗位赋予对应通用角色：

| 岗位 | 角色 |
|------|------|
| 后台管理员 | `WEB_ADMIN` |
| 站长 / 现场负责人 | `STATION_MASTER` |

```sql
-- 查询当前是否已有通用角色
SELECT urs.id, urs.role_id, sr.role_value AS role_name
FROM lc_system_user_role urs
JOIN lc_system_role sr ON urs.role_id = sr.id
WHERE urs.shop_id = {shop_id} AND urs.employee_id = {employee_id}
  AND sr.role_value IN ('WEB_ADMIN', 'STATION_MASTER');
```

**约束：同一员工不可同时持有 `WEB_ADMIN` 和 `STATION_MASTER` 两个通用角色。**

插入角色映射：
```sql
INSERT INTO lc_system_user_role (employee_id, role_id, shop_id, create_by)
VALUES ({employee_id}, {role_id}, {shop_id}, {create_by});
```

查询通用角色 ID：
```sql
SELECT id FROM lc_system_role WHERE role_value = '{WEB_ADMIN|STATION_MASTER}';
```

### 第 4 步：专属角色创建（仅当通用角色资源不足时）

> ⚠️ **必须先获得用户明确授权** 才能执行此步骤。
> ⚠️ **严禁改动通用角色的菜单/资源内容。**

涉及三张表：
1. `lc_system_role` — 新角色定义
2. `lc_system_role_resource_map` — 角色与菜单资源映射
3. `lc_system_user_role` — 角色分配

```sql
-- 1. 创建角色
INSERT INTO lc_system_role (role_name, role_value, role_description, role_type, create_by, shop_id)
VALUES ('{role_name}', '{role_value}', '{description}', 2, {create_by}, {shop_id});

-- 2. 绑定资源（从参考角色复制）
INSERT INTO lc_system_role_resource_map (role_id, resource_id, create_by)
SELECT {new_role_id}, resource_id, {create_by}
FROM lc_system_role_resource_map
WHERE role_id = {reference_role_id};

-- 3. 分配给员工
INSERT INTO lc_system_user_role (employee_id, role_id, shop_id, create_by)
VALUES ({employee_id}, {new_role_id}, {shop_id}, {create_by});
```

### 第 5 步：公众号配置

从 `油站编号.xlsx` 读取该油站的 Token 和 AESSecretKey，生成服务器 URL。

**URL 生成算法（对应 `scripts/mp_server_url.py`）：**

1. 构造 JSON 参数对象：
   ```json
   {"shopId": {shop_id}, "token": "{token}", "encodingAESKey": "{aes_key}"}
   ```
2. AES-128-CBC/PKCS5Padding 加密（密钥 `@LianCheXiongQi!`，IV 同密钥前 16 字节）
3. Base64 编码第一轮
4. Base64 编码第二轮
5. 拼接前缀：
   - 生产：`http://wmp.cslianche.com/api/v1/official/accounts/common/server/`
   - 测试：`http://beta-wmp.cslianche.com/api/v1/official/accounts/common/server/`

**数据入库：**

在 `lc_wxnumber_shop` 表中更新 token 和 encoding_aeskey：

```sql
UPDATE lc_wxnumber_shop
SET token = '{token}',
    encoding_aeskey = '{aes_key}'
WHERE shop_id = {shop_id} AND id = {id};
```

> 🔴 **铁律：更新 SQL 必须先发给用户审查，用户确认后才能执行。严禁 DELETE 操作。**

---

## 安全铁律

1. **SQL 审查** — 所有 UPDATE/INSERT 语句必须在执行前发给用户审查
2. **严禁 DELETE** — 任何时候都不执行删除操作
3. **不改通用角色** — 通用角色的菜单/资源配置不可改动
4. **专属角色需授权** — 创建专属角色前必须先获得用户明确同意
5. **线上操作谨慎** — 更新数据后必须验证结果

## 关键数据库表

| 表名 | 用途 |
|------|------|
| `lc_employee_user` | 员工信息（包含 shop_id, job_id） |
| `lc_employee_job` | 岗位定义 |
| `lc_system_role` | 角色定义（role_value 字段标识角色） |
| `lc_system_user_role` | 员工-角色映射 |
| `lc_system_role_resource_map` | 角色-菜单资源映射 |
| `lc_wxnumber_shop` | 公众号配置（shop_id 唯一） |
