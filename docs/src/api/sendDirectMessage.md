---
layout: doc
---
# sendDirectMessage
- 用于发送私信消息
- 须传入私信会话的guild_id和[Sendable](../segment/index.md#sendable)
- 将返回发送的消息对象
## 使用示例
```javascript
// ...
// 创建私信会话
const session=await bot.createDirectSession('abc','def')
// 发送私信
bot.sendDirectMessage(session.guild_id,'hello')
```
