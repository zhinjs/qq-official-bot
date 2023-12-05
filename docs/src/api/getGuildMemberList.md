---
layout: doc
---
::: tip
仅私域机器人可用
:::
# getGuildMemberList
- 用户获取频道成员列表
- 需传入频道id
- 将返回[Member](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/role/member/model.html#member)[]
```javascript
// ...
const memberList=await bot.getGuildMemberList()
console.log(memberList)
```
