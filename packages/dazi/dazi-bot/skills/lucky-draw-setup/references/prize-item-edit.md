# 抽奖活动奖项编辑（lc_lucky_activity_item）

> 来源：2026-08-04 清扶加油站「每周五加油抽大奖活动」改奖项（一等奖→水杯、二等奖→洁面巾、三等奖→盆子，数量不变）。

## 表与字段

- 租户/站点主键：`lc_shop.id`（**没有 `shop_id` 字段**，`name` 存站名）。定位站点：`SELECT id, name FROM lc_shop WHERE name LIKE '%关键词%'`。
- 抽奖活动表：`lc_lucky_activity`（字段：`id`、`activity_id`、`activity_name`、`active_state`、`start_time`、`end_time`…）。按 `activity_id` 关联。
- 奖项表：`lc_lucky_activity_item`（字段：`id`、`activity_id`、`item_name`、`max_winner_num`、`current_winner_num`、`winning_probability`、`lottery_time`、`lottery_type`、`prize_data`、`merchant_no`、`shop_id`、`activity_type`、`real_prize`、`delete_flag`、`create_time`、`creator_id`、`update_time`、`updater_id`）。

## 关键字段

- `activity_id` 形如 `LA_{shop_id}_{时间戳}`，例：`LA_58507_20260629151703682`。
- `item_name` 存展示名（如 `一等奖·凳子`）。
- `prize_data` 是 **JSON 数组字符串**，改奖项名要同步改这里：
  ```json
  [{"prizeName":"水杯","prizeType":1,"platformType":1,"bizDataId":"","prizeNum":1.0,"prizePicUrl":""}]
  ```
  `prizeName` 必须与 `item_name` 一致，否则前台展示名与奖品名不一致。

## 改奖项（数量不变，只改名称）

```sql
UPDATE lc_lucky_activity_item
SET item_name = '一等奖·水杯',
    prize_data = '[{"prizeName":"水杯","prizeType":1,"platformType":1,"bizDataId":"","prizeNum":1.0,"prizePicUrl":""}]'
WHERE id = 3041;
```

## 流程

1. 先查站点 `lc_shop.id`（注意是 `id` 不是 `shop_id`）。
2. 按 `shop_id` 查 `lc_lucky_activity` 拿 `activity_id`。
3. 按 `activity_id` 查 `lc_lucky_activity_item` 看现有奖项。
4. 改 `item_name` + `prize_data` 的 `prizeName`；`max_winner_num` 等数量不变不碰。
5. 更新后立即 SELECT 回查验证（`item_name`、`prize_data`、`update_time`）。

## 连接信息

线上 RDS：`host=rm-bp10mfa9gc0asj8luho.mysql.rds.aliyuncs.com:3306`，`user=liancheprod`，`db=lianche_prod`。密码含 `$`，用 pymysql 的 `password=` 参数直接传，勿用 `MYSQL_PWD` 或 heredoc 转义。
