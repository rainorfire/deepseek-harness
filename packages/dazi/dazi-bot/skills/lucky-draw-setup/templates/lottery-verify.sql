-- 开奖结果验证查询
-- 注意：表名是 lc_lucky_activity，不是 lc_activity！

-- 1. 查当晚应开奖的活动
SELECT shop_id, activity_id, activity_name, active_state,
       DATE_FORMAT(lottery_time, '%Y-%m-%d %H:%i:%s') AS lottery_time,
       DATE_FORMAT(end_time, '%Y-%m-%d %H:%i:%s') AS end_time
FROM lc_lucky_activity
WHERE activity_type = 15 AND delete_flag = 0
  AND DATE(lottery_time) = '2026-07-03'  -- 替换日期
ORDER BY shop_id;

-- 2. 查奖品中出情况
SELECT id, item_name, max_winner_num, current_winner_num,
       winning_probability, real_prize, prize_data
FROM lc_lucky_activity_item
WHERE activity_id = 'LA_58507_20260629151703682'  -- 替换活动ID
ORDER BY id;

-- 3. 查参与人数和发奖统计
SELECT activity_id,
       COUNT(DISTINCT open_id) AS participants,
       SUM(CASE WHEN distribution_state = 10 THEN 1 ELSE 0 END) AS winners
FROM lc_lucky_activity_lottery_record
WHERE activity_id = 'LA_58507_20260629151703682'
GROUP BY activity_id;
