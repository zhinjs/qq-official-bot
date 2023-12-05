---
layout: doc
---
::: tip
需要机器人拥有私聊权限
:::
# sendPrivateMessage
- 用于发送私聊消息
- 须传入对应好友的user_id和[Sendable](../segment/index.md#sendable)
- 将返回发送的消息对象
## 使用示例
```javascript
// ...
// 发送群消息
bot.sendPrivateMessage('abc','hello')
```
