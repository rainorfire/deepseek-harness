# 家政业务系统AI化能力地图

# 能力地图

## 工作台

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|获取当前用户顶级组织机构id|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48078|下面工作台部分接口，如果需要传入officeId参数时，可以通过该接口获取下面工作台接口均支持传组织机构名模糊查询使用|
|2|管理工作台_获取业绩数据_总览看板|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48138|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZGFmYzgzODI1OGZmZDI4MzU2NzJjMTI1MzZhMzZiNzZfYjM0NmI1NzJiZWE0ODUxNTZlYWM0MGY3YWViMTI4NTFfSUQ6NzYzNzQ1MjQ3NDg2MTAxNDIwOV8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|3|保姆管理工作台_获取今日日报_组织机构|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48602|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZGYzOGE2NTQ2ZTNjMzUxNmFiNWViOTk4MTFlOTM0YTdfMGE1ZTgxZTBiMzdjOWYwNGQwOGI3ZmU5ZjI3MmNmN2FfSUQ6NzYzNzQ1MjM1ODU1MzQzOTE5OV8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|4|保姆管理工作台_获取本月业绩详情_组织机构|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48136|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MWUxNjI2NDcwZDBkYzMyZTVjM2NkNWZlMDU0ZjdjNzhfMDU3NWE0YWQwODZiNjE0MGE4ZmU5Y2JiNzAwNzY2NjJfSUQ6NzYzNzczMTk2NDA4NDE3Nzg4M18xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|5|保姆管理工作台_获取具体的资源信息（如线索信息、续约信息、订单信息）_组织机构|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=50186|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ODM3YzhjMzg3NGJmZDU0NjM0Yjk3MGYwZTNlYTdjMzVfMDhlMDUxMTFmYTg0OGQwNDRkMGU4MDYxNTI4NjE2ZjNfSUQ6NzYzNzczMjMyMDI4Nzc1NTIzNF8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|6|月嫂管理工作台_获取今日日报数据_组织结构|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=49140|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MzY2MjUzOTc3MTRmY2UzMmI5NjZlN2I2MGQ1ZjNmNjNfOWI5MzIyOTQzYTM3YTdkNmZjYzkxNjkzYTJiM2RkMDFfSUQ6NzYzNzczMjk2ODEzMjI4MzU5OV8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|7|月嫂管理工作台_获取过程管理数据_组织结构|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=57770|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZTRmM2JhYmM3YTEzOWNhODM2YmMyMGI0ZWZhNWE3ODlfNDY5MDQyNjViM2JlOWQ1MDg1YjlmZjc0NTA5YmY5ZWNfSUQ6NzYzNzczMzIzNjk1NDQwMTk4MF8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|8|月嫂管理工作台_获取本月业绩进展_组织结构|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=49144|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=OWIwNjkyZWY3ZmUyMTI2ZDZiOTJlMTk4NzFkNzcwZWNfZmJjMjU4MmY5M2UzOTZkMDdjMmNkODM0MDExYWU5NjVfSUQ6NzYzNzczMzc4NTAyMzA3MzI1N18xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|9|新顾问工作台_关注数据（各个指标数据，针对一线顾问）|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=46170|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YzJiZjJjOGUzMjc0YmM4YWIwN2JlYTIwMTljNmY4ZDlfN2I2YTU0YzBkNzM5Yzk3ZjJkMjQzZjQwZDk3ODU5MDBfSUQ6NzYzNzczMzg5Njg0MjQ5NzI0NV8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|10|日目标保存|修改|||

## 客户线索

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|获取电销线索列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=25985||
|2|获取线索详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=26478||
|3|获取线索跟进记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=14093||
|4|机器人拨打记录列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=47598||
|5|人工一键呼叫拨打记录列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=31198||
|6|线索重分配统计|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=39519||
|7|电销与顾问线索重分配注：**操作前需要先统计：线索重分配统计  如果数量过多不要操作，暂不支持售后线索重分配**|**写**|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=39526clueIds 必须|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MTA0NjllOTFkNGNlYjI5NzM2NzE1ZGI1OGRmZTUxZjhfNGE4YmQ1M2UwYjJjNTVmNTQ2NmI3MTcxM2Y5MGU2MDJfSUQ6NzYzNzc2Mjc2OTc2MDM5MDM1M18xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|8|续约线索重分配注：**操作前需要先统计：线索重分配统计  如果数量过多不要操作**|**写**|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=47550|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZWE5YjljNTM4MjQwYWRiYmM4ZGIzNmJlZTA0YjI3M2VfM2Q0ODE2NzhmMThkODFjZDlmNjk2NDA1OWNkOGM2MzJfSUQ6NzYzNzc2MzI4OTkzNDEwNTc4OF8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|9|门店分配明细|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=53323|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZWIzNDVjMWU0NTY4MzY3MmM4ZDljNTAxMjQyZmJkZjhfZDI4M2NkNDkzMDhmMzBlMDM1MTdkNDM3YzY0NGFmNGRfSUQ6NzYzNzc2MzcxMTkwNjQ5OTgwNV8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|10|获取用户归属门店|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=30560||
|11|获取登陆人的权限下的门店列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=24585||
|12|榨汁经纪人流转明细|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48554|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZWY1MTAyYzhhZTc4MWVkMGE5OTNmZDVhZWQ4YzIzYTZfY2UwMWQ1MWUwMTMxZGI4OTY3MTFmZGY5NzBkMzRmZDhfSUQ6NzYzNzc2NjQ3Mzk0Nzg2MDE4M18xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|13|查询经纪人榨汁批次|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=56339|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ODM5ZTk0NDg0YzAxNDEwOGEzMDc1ZDZlNTJkMWMwZWNfNjdmMDQ0NWEyYWNmZDVkYTZlMjljOWQ0MTAxZTQxYTVfSUQ6NzYzNzc2Njg5NTc0NDEyNTkyNl8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|14|线索分配明细（不包含流转分配）|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=61473|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=OGU2M2Q1ZTUyMTViYTE0N2I0ZGQyZDcyYjJlNDM4YWZfNzk1ZjViMzViOWMwNzMzYTdlNjUzNjdkZTIyM2Y4YTVfSUQ6NzYzODQ1MTk1NzE1ODM0OTc5OF8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|15|线索操作日志|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=14094|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NTU5MDVmOWI4ZTI2MGI0ZTI3Njg4NzIyMWFjNTUwZjhfYjBlOGE1MDE2ZmQ0MDhkZWQ1OTJlNzRlZTM4NGZkNGNfSUQ6NzYzODUxODQ0ODA4NDA2MTE1MF8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|16|获取顾问线索列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=25166||
|17|根据机构ID获取人员信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=29460||
|18|获取下拉组织结构树|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=25594||
|19|**公海线索分配****目前接口没有数据权限较验，请谨慎使用，特别限制数量**|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=29485|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MjlhNjhjMjZlYmQ3N2ZiZWM3YzdiMzJhNmExOTkwOTdfMzM1YjRmYWJmYzA3MjM3YmFlODg2MzM5ZjZkZjEzMDdfSUQ6NzY0NDQ2Mjc4ODQyNTY0OTA5Ml8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|20|电销手动录入线索校验|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=49953||
|21|电销手动录入线索|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=49948|依赖电销手动录入线索校验判断是否能创建和获取passportId|
|22|手动录入线索-获取客户来源|读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=50573||
|23|获取品类下支持的服务项|读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=50568||
|24|获取城市列表信息|读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=24562||
|25|获取渠道列表信息|读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=25147||
|26|获取客户的AI外呼记录|读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62083||
|27|智能匹配推荐||[https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=18147](https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=18147)||

## 三嫂订单

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|根据订单ID查询订单金额|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63223||
|2|订单列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63173||
|3|查询订单基本信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63263|含t_order 和 t_order_extend|
|4|查询订单购买记录和金额信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63268||
|5|订单详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63988|包括：- 客户信息- 订单基本信息- 订单扩展信息- 购买商品信息- 订单费用信息|
|6|订单操作日志|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63218||
|7|订单收款记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63298||
|8|订单退款记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63398||
|9|订单合同列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63048||
|10|工作台-待办列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=64058||
|11|工作台-管理者列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=64048||
|12|签单审核列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62928||
|13|签单审核详情|只读|审核详情：https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62958劳动者证件信息：https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62963审核弹窗提示：https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62938特批附件：https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63208||
|14|签单审核提交|写|字典查询：https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62978驳回原因（保姆）：category=cla_audit_reason_212驳回原因（月嫂）：category=cla_audit_reason_205审核：https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62948||
|15|退款申请列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63528||
|16|退单退款申请详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63493||
|17|订单的属性信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63238||
|18|换单信息列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63203|传订单组中的任何一个订单都可以查，会返回包含新签/续签以及后续的所有换单记录（含已取消的换单）|

## 三嫂-营销工具

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|月度签单列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=22360||
|2|创建阅读签单活动|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=25006||
|3|常规活动列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=25028||
|4|创建常规活动|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=22270||
|5|修改优惠活动状态|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=22365||
|6|复制常规活动|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=54923||
|7|活动快速修改|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43307||
|8|活动快速修改-初始化|读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43303||
|9|用户方案列表|读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63668||
|10|新增用户活动|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=63578||

## 提成系统

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|提成列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43505||
|2|提成详情-顾问|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43541||
|3|提成详情-顾问（审核通过净营收）|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43584||
|4|提成详情-顾问（上户完成净营收）|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=67290||
|5|提成详情-顾问（业绩明细）|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43644||
|6|提成详情-主管|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43694||



## 电子合同

## 售后换人

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|售后换人申请列表|只读|[https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12893](https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12893)||
|2|退单退款待处理售后列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12893|[退单退款待处理列表](https://ywwlaii6ga7.feishu.cn/wiki/SUNgwHyhBiF0yMkOCWjclyRznyH#share-HUYsdP2H1o5ZCax6PpwcJZBAnim)|
|3|售后详细信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43914||
|4|获取创建售后单的原因|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43922||
|5|创建退单退款售后单(月嫂)|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43915||
|6|查询退款金额(月嫂)|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43923||
|7|判断是否可以发起退单(月嫂)|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43931||
|8|获取创建售后单的原因|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43922||

## 管家系统

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|回访列表|只读|[https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=30636](https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12893)||
|2|发送短信的模板|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=13948||
|3|发送短信|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=13949|不支持传入短信内容,发送的是短信模板定义的内容。|
|4|回访跟进记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=13957||
|5|客户列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=13962||
|6|更改云管家|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=33421||

## 工资结算

工资单是劳务报酬单的别名，两者表示相同的意思。

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|工资单列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=33214||
|2|工资单详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=61457||
|3|工资单操作记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=15287||
|4|撤回工资单|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=15286||
|5|生成工资单|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=61463||
|6|商家运营审核工资单|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=49356||
|7|商家信息服务费账单列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48157||
|8|商家信息服务费账单详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48160||

## 服务履约

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|保姆工资计算器|只读|-|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YjcxMmY4N2I4MGYxYWMxY2Y2ODNlZjFmZGJkZTAwZTJfMDM1ZjY1MTA0YWNkZjM3OWVmNjZjNDBlNmZjM2I4OWFfSUQ6NzYzNzcwMjM5Mjg2NzQyNTIzMF8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|2|查询订单投保记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=32455|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=OTJiNGVlNmYzZDBiMTA1N2ZiZDgyZDJjMjc1NDE2MjdfMjQ5YWVkOWI4OTNjMmY0ZGQ2NmNlN2ZiOTNhM2M3MzJfSUQ6NzYzNzcwMjExMDcwNjE5MTMzN18xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|3|后台直接上户|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=34051|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NTg5MmJiZGY4MzA0Y2JlZGRiZWNjYTAwNDU3NjBmOGZfY2VkN2RkYTExYjA4MzA4NzhjZDBjY2I3Y2I1MGE5OTJfSUQ6NzYzNzcwMjE3OTEzODUzODcxNF8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|4|后台直接下户|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=26690|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NWU4ZjY4NmQ3MDY0ZjY1OTgwMDZkZWI1NDI5NzgzYzJfMzI0YjQ5NjAxNmUzZGE0YTZkMTQ2ZjdkMWRkY2ZkYmJfSUQ6NzYzNzcwMjI3MzUzNjE5OTg3MF8xNzg2MDY4MTY3OjE3ODYxNTQ1NjdfVjM)|
|5|服务列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=32437|服务状态：0-未匹配1-待上户3-上户中4-已下户5-未服务6-匹配中7-匹配失败  |
|6|根据订单id查询服务履约信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=27218|**hourServicedCycle表示已上户天数**|
|7|销假|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=33942||
|8|请假|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=33937||
|9|换人审核列表|只读|[https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=32445](https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=32445)||
|10|换人审核|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=33768||
|11|不代发工资|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=34035||
|12|更正服务时长|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=30468||
|13|修改预约上户日期|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=29818||

## 客服工单

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|根据用户姓名查询用户ID|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=19969||
|2|获取所有城市|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=61494||
|3|工单挂起类型/工单挂起原因|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=44280|返回结果的 $.data\[i\].id 为挂起类型， $.data\[i\].children\[j\].id 为挂起原因|
|4|上传附件|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12043||
|5|工单列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=58724||
|6|我创建的工单|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=61440||
|7|待处理工单|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=58807||
|8|工单详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11998||
|9|根据工单ID获取工单流程记录（跟进记录）|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11803||
|10|根据工单ID获取工单操作记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11783||
|11|根据工单ID获取客户行为记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=57970||
|12|根据客户手机号获取客户行为记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=57853||
|13|创建工单|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62053|目前仅支持咨询类工单场景|
|14|新增工单跟进记录|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11923||
|15|根据工单ID发送短信|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11863|发送短信给客户或者商家，会添加一条跟进记录|
|16|挂起工单|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=31942|`hangType`和`hangReason`参数值可通过【工单挂起类型/工单挂起原因】接口获取`attachments`参数值可通过【上传附件】接口获取|
|17|关闭工单|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11888||
|18|提前关闭工单|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11948||
|19|升级工单|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11913|`taskId` 参数值可通过【工单详情】获取|
|20|获取重启工单的候选节点|读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11953||
|21|重启工单|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11958|先调用【获取重启工单的候选节点】确认重启到哪个流转节点|
|22|一键外呼-咨询类工单**会给客户电话，谨慎调用！！！**|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62058|该接口只支持对咨询类工单进行一键外呼|
|23|一键外呼-物损类工单**会给客户电话，谨慎调用！！！**|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=61444|该接口只支持对物损类工单进行一键外呼|
|24|理赔明细列表|读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=19241||
|25|待审核理赔列表|读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=19239||
|26|售后理赔详情|读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=19161||
|27|售后理赔审核-通过|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=19206||
|28|售后理赔审核-驳回|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=19185||
|29|售后理赔审核-加签|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=19576|`signUserId` 参数值可通过【根据用户姓名查询用户ID】获取|
|30|工单的协作任务列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12113||
|31|工单添加协作人|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12098|`masterTaskId` 参数值可通过【工单详情】获取`handlerId` 参数值可通过【根据用户姓名查询用户ID】获取|
|32|关闭工单协作任务|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12108|`masterWorkTaskId` 参数值可通过【工单详情】获取`cooperateTaskIds` 参数值可通过【工单的协作任务列表】查询处理中的协作任务|
|33|给工单指定处理人|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11878|`taskId` 参数值可通过【工单详情】获取`handlerId` 参数值可通过【根据用户姓名查询用户ID】获取|

## 呼叫系统

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|根据业务ID查询通话记录及录音|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=61468||
|2|查询用户手机号是否为系统黑名单|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=51337||
|3|添加黑名单|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=58504||
|4|移除黑名单|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=58509||
|5|新增/修改/删除外呼人员坐席|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=53303https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=53310https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=51581||
|7|拨打统计数据报表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43534||
|8|拨打电话**会给客户电话，谨慎调用！！！**|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=41741|注:网络电话依赖第三方sdk通信;手机,座机需要主叫侧有对应的通信设备|

## 商家系统

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|0|通用劳动者查询|只读|[商家通用查询](https://ywwlaii6ga7.feishu.cn/wiki/JR1KwYqJbitPFkkxXsJc8HpJnUb)|商家列表查询，支持查询的字段丰富、而且非常轻|
|1|保姆商家列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48539|一次最多30个，相同条件最多1W条。龙虾哥注意调用节奏，底层已经限流每分钟最多30次。这个接口太重，建议对接：[商家通用查询](https://ywwlaii6ga7.feishu.cn/wiki/JR1KwYqJbitPFkkxXsJc8HpJnUb)|
|2|月嫂商家列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48900|一次最多30个，相同条件最多1W条。龙虾哥注意调用节奏，底层已经限流每分钟最多30次。这个接口太重，建议对接：[商家通用查询](https://ywwlaii6ga7.feishu.cn/wiki/JR1KwYqJbitPFkkxXsJc8HpJnUb)|
|3|服务项列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8823||
|4|服务项上线|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8830||
|5|新增服务项|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8851||
|6|获取阿姨门店|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=16298||
|7|保存阿姨门店|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=16185||
|8|获取服务地址|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8344||
|9|保存服务地址|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8347||
|10|体检报告列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=26906||
|11|证件列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8642||
|12|上传证件|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8656||
|13|发起电子合同|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8867||
|14|电子合同列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8877||
|15|是否有生效合同|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=49677||
|16|获取基本信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8166||
|17|编辑基本信息|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8169||
|18|月嫂档期|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=9201||
|19|保姆匹配列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=25195|一次最多30个，相同条件最多1W条。龙虾哥注意调用节奏，底层已经限流每分钟最多30次。这个接口太重，建议对接：[商家通用查询](https://ywwlaii6ga7.feishu.cn/wiki/JR1KwYqJbitPFkkxXsJc8HpJnUb)|
|20|月嫂匹配列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=47870|一次最多30个，相同条件最多1W条。龙虾哥注意调用节奏，底层已经限流每分钟最多30次。这个接口太重，建议对接：[商家通用查询](https://ywwlaii6ga7.feishu.cn/wiki/JR1KwYqJbitPFkkxXsJc8HpJnUb)|
|21|获取家庭信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8107||
|22|获取到家工作经历|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=50207||
|23|获取外部工作经历|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8247||
|24|获取服务意向|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=9934||
|25|获取阿姨门店|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=16298||
|26|获取保姆服务经验|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=9944||
|27|综合评价（推荐理由）|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8797||
|28|客户评价建议直接用客户评价系统的能力|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8807||
|29|商家培训记录建议直接用直培的能力|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8992|依赖培训服务|
|30|商家订单记录建议直接用订单服务系统能力|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=57734|每页10条依赖订单服务|
|31|月嫂工资配置列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11131||
|32|月嫂工资日志表头|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=22922||
|33|月嫂工资日志明细列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11140||
|34|上传图片或者证件照到文件服务器|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11733||
|35|新增或者修改照片资料|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8284||
|36|新增或者修改证件资料|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8663||
|37|保姆简历详情页头部展示信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=9912||
|38|月嫂简历详情页头部信息展示|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8100||
|39|获取城市下面的门店|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=34800||
|40|获取来源以及商家负责人|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=8903||

## 招商系统

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|劳动者品类状态|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=61449||
|2|线索招商库列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=61454||
|3|线索基本信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=61460||
|4|保姆求职意向|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11121||
|5|线索工作经历|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11101||
|6|单个劳动者线索明细|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11561||
|7|家庭信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11091||
|8|服务地址|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11098||
|9|证件列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11107||
|10|照片列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11114||
|11|保姆会销列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=50019||
|12|月嫂会销列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66979||
|13|更新保姆服务意向|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11154||

## 奖惩系统

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|奖励发放记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43946||
|2|奖励补贴类型|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=43960||
|3|违规事件列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=22230||
|4|获取违规事件详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=22447||
|5|违规事件审核通过|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=22379||
|6|违规事件审核不通过|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=22381||
|7|线上补贴发放申请列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=39666||
|8|线上支持批量发放的类型|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=39662||
|9|线上补贴批量excel模板|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=39670||
|10|线上补贴申请|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=39658||
|11|线上补贴申请明细|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=39698||
|12|违规行为列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=22202||
|13|指定补贴类型发放记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=67732||


## 萌芽日记

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|宝宝列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=34745||
|2|商家记录的萌芽日志预警列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=34809||
|3|根据宝宝ID查询萌芽日志列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=34748||
|4|查看萌芽日记宝宝日志详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=34817||
|5|回复日志/评论日志|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=34825||

## 职培-招生系统

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|职培员工端工作台-查询有权限的大区列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=57218||
|2|职培员工端工作台 - 查询组织机构营收数据汇总（仅组织汇总，不含个人数据）|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62088|⚠️ 仅支持组织机构维度的汇总数据，不支持查询个人业绩。查个人数据请用序号 3。|
|3|职培员工端工作台-查询营收数据详情明细（含个人业绩\+组织机构）|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62093|✅ 查询个人营收数据的唯一入口，同时支持组织机构明细。当用户说"查我的数据""个人业绩""我的营收"时，必须使用此接口。|
|4|职培员工端工作台 - 查询组织机构关键过程数据汇总（仅组织汇总，不含个人数据）|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=57578||
|5|职培员工端工作台-查询组织机构下列表数据（含个人\+组织机构）|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=62048||
|6|劳动者线索私海列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=49037||
|7|课程线索列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48942||
|8|线索订单记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48991||
|10|线索培训记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=48993||
|||只读|||
|||只读|||

## 职培-网校系统

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|职培网校后台-绑券审核列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=64213||
|2|职培网校后台-绑券审核详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=64218||
|3|职培网校后台-绑券审核操作|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=64223||

## 券系统

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|根据手机号、用户Id、订单Id等信息分页查询优惠券列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=64346||
|2|查询绑券批次列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=64364||

## CPS系统

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|佣金记录基础信息查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66307||
|2|佣金记录列表信息查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66316|**接口查询多张表，请控制调用速度。**|
|3|佣金记录详情查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66321||
|4|打款记录基础信息查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66324||
|5|打款记录列表信息查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66331|**接口查询多张表，请控制调用速度。**|
|6|打款记录详情查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66334||
|7|推荐记录列表信息查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66404|**接口查询多张表，请控制调用速度。**|
|8|推荐记录详情查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66407||
|9|活动列表信息查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66414||
|10|活动详情查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66417||
|11|个人用户列表查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66490||
|12|佣金记录分页查询(结果同后台导出)|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66504|**接口查询多张表，请控制调用速度**|
|13|打款记录分页查询(结果同后台导出)|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66507|**接口查询多张表，请控制调用速度**|
|14|推荐记录分页查询(结果同后台导出)|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66510|**接口查询多张表，请控制调用速度**|
|15|佣金记录审核/驳回/暂缓|写|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=67208||

## CPS系统-分销相关

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|分页查询分佣规则列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=64472||
|2|查询分佣规则详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=64481||
|3|查询返佣节点信息|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66370||
|4|查询所有城市|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66387||
|5|佣金试算记录分页查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66390|**接口查询多张表，请控制调用速度。**|

## 广告投放

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|广告投放-获取腾讯小时报表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=64338||
|2|查询操作日志|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=65053||



## 保证金

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|查询保证金缴纳规则|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66337||
|2|查询保证金流水明细|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66550||

## 企微

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|查询部门列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66420||
|2|查询部门详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66384||
|3|查客户跟进人|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66397||
|4|查询部门成员列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66423||
|5|查成员关联的客户|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66443||
|6|查成员群管理|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66449||
|7|查询客户管理|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66456||
|8|查询客户群管理|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66463||
|9|查询素材列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66466||





## 商品中心

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|商品(sku)管理-商品列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11438||
|2|商品(sku)管理-获取sku详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11477||
|3|商品(sku)管理-上架|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11503||
|4|商品(sku)管理-下架|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=11511||
|5|商品(sku)管理-导出组套关系|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12118||
|6|商品(sku)管理-导出售卖关系|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12123||
|7|商品(sku)管理-组套spu校验|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12333||
|8|商品(sku)管理-修改组套sku|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=16140||
|9|商品(sku)管理-批量删除|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=17391||
|10|SPU管理-spu列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=13462||
|11|SPU管理-获取spu详情(新)|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=58739||
|12|sku价格-列表查询|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12138||
|13|sku价格-价格详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12143||
|14|sku价格-定价|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12148||
|15|sku价格-调价|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=12153||
|16|sku价格-导出基础价|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=13348||
|17|导入工作台-导入商品基础价|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66344||
|18|导入工作台-导入商品临时价格|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66357||
|19|导入工作台-商品套餐关系|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66360||
|20|导入工作台-商品搭售关系|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66367||
|21|导入工作台-更新组套价格|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=66347||
|22|城市列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=10401||

## 评价

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|客户评价劳动者|写入|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=67667||

## 短信

|序号|能力名称|权限|http接口|备注|
|---|---|---|---|---|
|1|发送短信|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=67160||

## 舆情系统

|1|任务列表|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=37622||
|---|---|---|---|---|
|2|任务详情|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=37666||
|3|任务详情-处理记录|只读|https://jz-amp.daojia-inc.com/api/interface/getWithoutAuth?id=37677||
