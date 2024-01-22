# 频道私信
## 创建频道私信会话 
- createDirectSession
- 将返回[DMS](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/dms/model.html#dms)

| 参数名 | 类型 | 是否必填 | 描述|
|-----|----|------|----|
| guild_id|string|是|频道id|
| user_id|string|是|成员id|
## 发送频道私信
- sendDirectMessage
- 将返回发送的消息对象

| 参数名      | 类型       | 是否必填 | 描述        |
|----------|----------|------|-----------|
| guild_id | string   |是| 私信会话的频道id |
| message  | Sendable |是| 消息内容      |
## 获取频道私信
- getDirectMessage
- 将返回发送的消息对象

| 参数名        | 类型       | 是否必填 | 描述        |
|------------|----------|------|-----------|
| guild_id   | string   |是| 私信会话的频道id |
| message_id | Sendable |是| 消息id      |
## 撤回频道私信
- recallDirectMessage
- 将返回是否撤回成功

| 参数名        | 类型       | 是否必填 | 描述        |
|------------|----------|------|-----------|
| guild_id   | string   |是| 私信会话的频道id |
| message_id | Sendable |是| 消息id      |
