---
name: apply-shift-draw
description: 。开通/关闭油站的交班对账功能，支持指定支付通道（富友/易宝）、指定商户编号。
traits:
  - method-tool
tags:
  - 链车
  - 交班对账
  - 数据库
  - MySQL
---

# 交班对账业务开通/关闭

## 适用场景

用户请求处理链车加油站交班对账业务（开通或关闭），例如：
- "给某某油站开通交班到账"
- "关闭某某站交班对账"
- "海湾长兴两个账户都开通交班到账"



1. 确定以下参数：
   - **shop_id**: 油站ID（如海湾石油长兴加油站 = 58510）
   - 当用户输入站名存在错字/同音字（如"叫油站"应理解为"加油站"）时，按关键词 LIKE 匹配；当用户说"XX与XX站开通"时，拆分为两个独立油站分别查询 shop_id 和商户配置。
   - **staff_id**: 操作人ID（默认 5）
   - **switch_flag**: True=开通, False=关闭
   - **payment_channels**: 支付通道（富友=1, 易宝=2）
   - **merchant_no_list**: 可选，指定商户编号列表，不传则处理该通道所有商户

2. 数据库连接（线上环境）：
   - Host: `rm-bp10mfa9gc0asj8luho.mysql.rds.aliyuncs.com`
   - DB: `lianche_prod`
   - User/Pass 见 DAZI.md



### 1. 查询油站商户配置（先预览，不直接操作）

```sql
-- 查看油站有哪些支付商户
SELECT id, shop_id, pay_channel, third_merchant_no
FROM lianche_prod.lc_pay_merchant
WHERE shop_id = {shop_id};
```

### 2. 查询当前交班对账状态

```sql
-- 查看已有申请记录
SELECT id, shop_id, pay_channel, merchant_no, biz_type, open_status, apply_time
FROM lianche_prod.lc_shop_payment_biz_apply
WHERE shop_id = {shop_id} AND biz_type = 5;
```

### 3. 执行开通/关闭操作

使用 Python 脚本执行（脚本路径见下文），或直接引导用户确认后执行。

## 脚本路径

`/Users/chenyujia/Desktop/陈璟逸/四年级下册/apply_shift_draw.py`

## 调用方式

```bash
python3 /Users/chenyujia/Desktop/陈璟逸/四年级下册/apply_shift_draw.py
```

脚本内的 `__main__` 块需按本次需求修改参数后执行。常用参数示例：

```python
# 为某油站开通易宝通道交班对账（所有商户）
apply_shift_draw(
    shop_id=58510,
    staff_id=5,
    switch_flag=True,
    payment_channels=[2],  # 易宝
)

# 指定具体商户编号
apply_shift_draw(
    shop_id=58510,
    staff_id=5,
    switch_flag=True,
    payment_channels=[2],
    merchant_no_list=["10093500763"],
)

# 查询当前状态
query_apply_status(shop_id=58510)
```

## 注意事项

- 如果已有记录的 open_status 与目标状态一致，会跳过（幂等操作）
- 易宝(YeePay)的 `applyShiftDrawMoney` 是 mock 实现，无真实第三方调用，生成随机单号
- 同一员工不可同时持有 WEB_ADMIN 和 STATION_MASTER 两个通用角色（新站入网时注意）
- 操作前先查询确认，避免误操作
- 必须先获得用户明确授权才能执行写入操作
