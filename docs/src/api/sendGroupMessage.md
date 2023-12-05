---
layout: doc
---
::: tip
需要机器人拥有群聊权限
:::
# sendGroupMessage
- 用于发送群消息
- 须传入对应群聊的group_id和[Sendable](../segment/index.md#sendable)
- 将返回发送的消息对象
## 使用示例
```javascript
// ...
// 发送群消息
bot.sendGroupMessage('abc','hello')
```
