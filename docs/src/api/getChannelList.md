---
layout: doc
---
# getChannelList
- 用于获取某个频道的子频道列表
- 需传入对应的频道id
- 将返回 [Channel](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/manage/channel/model.html#channel)对象
## 使用示例
```javascript
// ...
const channelList=await bot.getChannelList("abc")
console.log(channelList)
```
## Channel


