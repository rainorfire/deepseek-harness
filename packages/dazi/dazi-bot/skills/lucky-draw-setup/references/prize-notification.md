# 中奖通知机制

开奖完成后，系统通过 Spring Event 异步发送微信公众号模板消息通知中奖用户。

## 触发链路

```
定时任务 (LuckyDrawActivityLotteryTask, cron: 0 */1 * * * ?)
  → LuckyActivityBizDelegate.drawWinningPrizeOfLuckDraw()
    → LuckDrawWithPersonStrategy 随机选人
    → LuckyActivityBizImpl.drawWinningPrize()
      → DistributionPrizeStrategyDelegate 发奖
      → 发布 LuckyDrawingPrizeSuccessfulEvent
        → LuckyActivityEventListener.pushDrawWinningPrizeNoticeMsg()
          → WechatMsgPusherConfigDelegate
            → DrawWinningPrizeNotice 构建模板消息
            → 推送微信公众号模板消息
```

## 模板消息配置

| 项目 | 内容 |
|------|------|
| 消息类型 | 微信公众号模板消息 |
| 服务类目 | 交通服务→加油站服务→活动开奖通知 |
| 模板编码 | HDKJTZ |
| 字段 | `thing1`="恭喜中奖【奖品名称】"，`time2`=中奖时间 |
| 配置表 | lc_config, module=`draw_winning_prize_mp_msg` |

## 注意事项

- 客户必须关注了该油站的公众号才能收到
- 油站必须先在后台配置模板消息ID（lc_config 表）
- **未配置则静默跳过，无任何通知**
- 只通知中奖用户，未中奖用户不通知

## 相关代码文件

| 文件 | 路径 |
|------|------|
| 事件 | `common/event/listener/LuckyActivityEventListener.java` |
| 消息策略 | `common/component/wechat/message/strategy/concrete/DrawWinningPrizeNotice.java` |
| 配置委托 | `common/component/wechat/message/WechatMsgPusherConfigDelegate.java` |
| 参数 | `common/component/wechat/message/bean/param/DrawWinningPrizeNoticeParam.java` |
| 发奖 | `common/biz/luckydraw/impl/LuckyActivityBizImpl.java` |
