---
layout: doc
---
# getGuildList
- 用于获取机器人加入的频道列表
- 将返回[Guild](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/manage/guild/model.html#guild)[]
## 使用示例
```javascript
// ...
const guildList=await bot.getGuildList()
console.log(guildList)
```

