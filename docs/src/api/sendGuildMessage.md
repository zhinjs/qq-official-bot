---
layout: doc
---
# sendGuildMessage
- 用于发送频道消息
- 须传入对应子频道的channel_id和[Sendable](../segment/index.md#sendable)
- 将返回发送的消息对象
## 使用示例
```javascript
// ...
// 发送群消息
bot.sendGuildMessage('abc','hello')
```
