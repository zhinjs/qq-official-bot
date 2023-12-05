---
layout: doc
---
# createDirectSession
- 用于和用户创建私信会话
- 需传入对应的频道id和用户id
- 将返回[DMS](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/dms/model.html#dms)
## 使用示例
```javascript
// ...
// 创建私信会话
const session=await bot.createDirectSession('abc','def')
// 发送私信
bot.sendDirectMessage(session.guild_id,'hello')
```
