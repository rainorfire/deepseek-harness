---
name: lucky-draw-setup
description: 为，包括「配置抽奖活动」「创建抽奖」「设置抽奖」「开奖」时触发。
model: opus
triggers: ["抽奖", "抽奖活动", "lucky draw", "luck_draw", "开奖", "设置抽奖", "配置抽奖"]
---

# 链车加油站抽奖活动设置技能

为链车加油站创建 `activity_type=15 (LUCK_DRAW_PERSON)` 类型抽奖活动的标准流程。



- 需要为某个加油站创建"加汽油满200元抽奖"活动
- 奖品为实物（电饭煲、凳子、水杯、洁面巾等）
- 按人抽奖（每人每期最多中一次实物奖）
- 定时开奖（非转盘/概率模式）

## 核心枚举值

```python
ACTIVITY_TYPE_LUCK_DRAW_PERSON = 15   # 抽奖活动类型
ACTIVE_STATE_DRAWING = 10              # 进行中（可参与）
ACTIVE_STATE_OFFLINE = 5               # 未开启
DELETE_FLAG_NORMAL = 0                 # 正常（非删除）
LOTTERY_TYPE_DELAY_FIX_TIME = 10       # 定时开奖
REAL_PRIZE_YES = 1                     # 实物奖标记
PRIZE_TYPE_PHYSICAL = 1               # 实物奖品类型
PLATFORM_TYPE_LC = 1                  # 链车平台
MAX_PARTICIPANTS_NUM = 10000000       # 参与人数上限
```

## 配置格式模板

### 参与条件（condition_config）—— 满200元汽油
```json
[{"conditionType":10,"goodsTypeList":[1,2,3],"conditions":[{"minAmount":200.0,"maxAmount":100000.0,"permitCount":1}]}]
```
- conditionType=10: 油品消费
- goodsTypeList: [1=92#, 2=95#, 3=98#]
- permitCount=1: 满足条件参与1次

### 活动规则（activity_rule）—— 每人每期限1次
```json
[{"ruleType":3,"personMaxCount":1}]
```

### 实物奖品数据（prize_data）
```json
[{"prizeName":"电饭煲","prizeType":1,"platformType":1,"bizDataId":"","prizeNum":1.0,"prizePicUrl":""}]
```

### 优惠券奖品数据（prize_data）—— prizeType=2
```json
[{"prizeName":"汽油优惠券50元","prizeType":2,"platformType":1,"bizDataId":"477","prizeNum":1.0,"prizePicUrl":"","couponRuleId":477}]
```
- `prizeType=2`=优惠券，`bizDataId`=couponRuleId的字符串形式，`couponRuleId`=数字形式

## 活动ID生成规则
```
LA_{shopId}_{YYYYMMDD}_{NNN}
# 示例：LA_58508_20260702_001
# NNN = 3位序号，当天从001开始递增
```
**实现方式**：查询当天该站已有最大 activity_id，取末位序号+1；若无则从001开始。

## Database

**线上环境**：
- host: rm-bp10mfa9gc0asj8luho.mysql.rds.aliyuncs.com
- port: 3306
- user: liancheprod
- password: 在 DAZI.md 中查找
- database: lianche_prod

**测试环境**：
- host: 39.98.67.216
- port: 3306
- user: root
- password: Lianche@123456@_
- database: lianche



### 步骤1：查询油站信息
```sql
SELECT id, name FROM lc_shop WHERE id = {shop_id};
```

### 步骤2：插入活动（lc_lucky_activity）
列全部 NOT NULL，注意：
- `delete_flag` = 0（正常），不是 1！
- 空字符串传 `""` 而不是 `None`
- `lottery_time` = `end_time`（定时任务每分钟扫描）
- **必须设置以下字段**：
  - `activity_introducy`：活动介绍文案（如"加油满200元即可参与抽奖！每周日晚9点准时开奖..."）
  - `activity_rule_desc`：活动规则描述，直接陈述 activity_rule 配置（如"每期活动每位顾客限参与1次"）

### 步骤3：插入奖项（lc_lucky_activity_item）
- `winningProbability` 对 activity_type=15 **不生效**（`LuckDrawWithPersonStrategy` 不读此字段），设 0.0 即可
- `lottery_type` = 10（DELAY_FIX_TIME 定时开奖）

### 步骤4：验证
```sql
SELECT activity_id, start_time, end_time, active_state, delete_flag,
       activity_rule, condition_config
FROM lc_lucky_activity
WHERE shop_id = {shop_id};

SELECT item_name, max_winner_num, prize_data
FROM lc_lucky_activity_item
WHERE activity_id = '{activity_id}';
```

## 活动设置 Python 脚本模板

```python
"""
为指定加油站创建LUCK_DRAW_PERSON抽奖活动
"""
import pymysql
from datetime import datetime, timedelta

DB_CONFIG = {
    "host": "rm-bp10mfa9gc0asj8luho.mysql.rds.aliyuncs.com",
    "port": 3306,
    "user": "liancheprod",
    "password": "PASSWORD",
    "database": "lianche_prod",
    "connect_timeout": 5
}

SHOP_ID = 58508
MERCHANT_NO = "58508"

# 枚举常量
ACTIVITY_TYPE_LUCK_DRAW_PERSON = 15
ACTIVE_STATE_DRAWING = 10
DELETE_FLAG_NORMAL = 0
LOTTERY_TYPE_DELAY_FIX_TIME = 10
MAX_PARTICIPANTS_NUM = 10000000

def get_next_activity_id(cursor):
    """生成活动ID：LA_{shop_id}_{YYYYMMDD}_{NNN}，序号3位从001开始"""
    now = datetime.now()
    date_str = now.strftime('%Y%m%d')
    cursor.execute(
        "SELECT activity_id FROM lc_lucky_activity WHERE activity_id LIKE %s AND shop_id = %s ORDER BY activity_id DESC LIMIT 1",
        (f"LA_{SHOP_ID}_{date_str}_%", SHOP_ID)
    )
    row = cursor.fetchone()
    if row:
        last_seq = int(row[0].split('_')[-1])
        seq = last_seq + 1
    else:
        seq = 1
    return f"LA_{SHOP_ID}_{date_str}_{seq:03d}"

def build_condition_config():
    """参与条件：加油满200元"""
    return (
        '[{"conditionType":10,'
        '"goodsTypeList":[1,2,3],'
        '"conditions":[{"minAmount":200.0,"maxAmount":100000.0,"permitCount":1}]'
        "}]"
    )

def build_activity_rule():
    """活动规则：每人每期限1次"""
    return '[{"ruleType":3,"personMaxCount":1}]'

def build_prize_data_coupon(name, coupon_rule_id):
    """优惠券类奖品数据（prizeType=2）"""
    return (
        '[{"prizeName":"' + name + '",'
        '"prizeType":2,'
        '"platformType":1,'
        '"bizDataId":"' + str(coupon_rule_id) + '",'
        '"prizeNum":1.0,'
        '"prizePicUrl":"",'
        '"couponRuleId":' + str(coupon_rule_id) + '}]'
    )

def build_prize_data_physical(name):
    """实物奖品数据（prizeType=1）"""
    return (
        '[{"prizeName":"' + name + '",'
        '"prizeType":1,'
        '"platformType":1,'
        '"bizDataId":"",'
        '"prizeNum":1.0,'
        '"prizePicUrl":""}]'
    )
```

## 重要注意事项

 `0000-00-00 00:00:00`** - INSERT 时 `start_time`、`end_time`、`lottery_time`、`create_time` 等时间字段必须显式传有效值（`NOW()`），不要依赖 MySQL 默认值。Java 的 `java.sql.Timestamp` 无法解析零值日期（血泪教训：lc_config.update_time 默认值为零值导致线上报错）
1. **`winningProbability` 无效**：activity_type=15 使用 `LuckDrawWithPersonStrategy`，不读取概率字段，设为 0.0 即可
2. **delete_flag**：0=正常，1=已删除
3. **所有字段 NOT NULL**：空值传 `""` 而非 `None`
4. **maxWinnerNum 上限**：实际开奖数 = min(配置值, 当前参与人数)
5. **活动状态**：设为 10(DRAWING) 时定时任务自动开奖；设为 5(OFFLINE) 则不生效
6. **同一个员工不可同时持有 WEB_ADMIN 和 STATION_MASTER 两个通用角色**
7. **通用角色菜单/资源不可修改**
8. 如需创建**专属角色**（非通用角色），必须先获得用户明确授权



- [ ] 活动ID格式正确（LA_{shopId}_{YYYYMMDD}_{NNN}，序号3位从001开始）
- [ ] activity_introducy 已设置（活动介绍文案，描述参与条件和开奖时间）
- [ ] activity_rule_desc 已设置（直接陈述 activity_rule 配置）
- [ ] start_time / end_time / lottery_time 正确（end_time = lottery_time）
- [ ] active_state 正确（5=未开启, 10=进行中, 20=已开奖）
- [ ] delete_flag = 0
- [ ] condition_config 中 goodsTypeList 包含所有油品
- [ ] 奖项名称和 max_winner 正确
- [ ] prize_data 格式正确（实物 prizeType=1，优惠券 prizeType=2 带 couponRuleId）
- [ ] 实物/优惠券奖标记 real_prize = 1
