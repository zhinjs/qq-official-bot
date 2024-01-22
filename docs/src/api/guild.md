# 频道
## 获取频道列表
- getGuildList
- 将返回[Guild](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/manage/guild/model.html#guild)[]

| 参数名 | 类型 | 是否必填 | 描述|
|-----|----|------|----|

## 获取子频道列表
- getChannelList
- 将返回 [Channel](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/manage/channel/model.html#channel)对象

| 参数名 | 类型 | 是否必填 | 描述|
|-----|----|------|----|
| guild_id|string|是|频道id|
## 获取频道成员列表
::: tip
仅私域机器人可用
:::
- getGuildMemberList
- 将返回[Member](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/role/member/model.html#member)[]

| 参数名 | 类型 | 是否必填 | 描述|
|-----|----|------|----|
| guild_id|string|是|频道id|
## 发送频道消息
- sendGuildMessage
- 将返回发送的消息对象

| 参数名        | 类型       | 是否必填 | 描述    |
|------------|----------|------|-------|
| channel_id | string   |是| 子频道id |
| message    | Sendable |是| 消息内容  |
## 获取频道消息
- getGuildMessage
- 将返回发送的消息对象

| 参数名        | 类型     | 是否必填 | 描述    |
|------------|--------|------|-------|
| channel_id | string |是| 子频道id |
| message_id | string |是| 消息id  |
## 撤回频道消息
- recallGuildMessage
- 须传入对应子频道的channel_id和message_id
- 将返回是否撤回成功

| 参数名        | 类型     | 是否必填 | 描述    |
|------------|--------|------|-------|
| channel_id | string |是| 子频道id |
| message_id | string |是| 消息id  |
## 禁言频道成员
- muteGuildMember

| 参数名       | 类型     | 是否必填 | 描述   |
|-----------|--------|------|------|
| guild_id  | string |是| 频道id |
| member_id | string |是| 成员id |




