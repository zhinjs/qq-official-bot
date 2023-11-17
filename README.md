# ts-qqbot

## 安装依赖

```shell
npm i qq-group-bot # or yarn add qq-group-bot
```

## 使用

```js
const {Bot} = require('qq-group-bot')
// 创建机器人
const bot = new Bot({
	appid: '', // qq机器人的appID (必填)
	token: '', // qq机器人的appToken (必填)
	secret: '', // qq机器人的secret (必填)
	sandbox: true, // 是否是沙箱环境 默认 false
	removeAt: true, // 移除第一个at 默认 false
	logLevel: 'info', // 日志等级 默认 info
	maxRetry: 10, // 最大重连次数 默认 10
	intents: [
		'GROUP_AT_MESSAGE_CREATE', // 群聊@消息事件 没有群权限请注释
		'C2C_MESSAGE_CREATE', // 私聊事件 没有私聊权限请注释
		'GUILD_MESSAGES', // 私域机器人频道消息事件 公域机器人请注释
		'PUBLIC_GUILD_MESSAGES', // 公域机器人频道消息事件 私域机器人请注释
		'DIRECT_MESSAGE', // 频道私信事件
		'GUILD_MESSAGE_REACTIONS', // 频道消息表态事件
		'GUILDS', // 频道变更事件
		'GUILD_MEMBERS', // 频道成员变更事件
		'DIRECT_MESSAGE', // 频道私信事件
	], // (必填)
})
// 启动机器人
bot.start()
```

## 发送消息

```javascript
const {Bot} = require('qq-group-bot')
const bot = new Bot({
	// ...
})
// 只有启动后，才能发送
bot.start().then(() => {
	// 频道被动回复
	bot.on('message.guild', (e) => {
		e.reply('hello world')
	})
	// 频道私信被动回复
	bot.on('message.direct', (e) => {
		e.reply('hello world')
	})
	// 群聊被动回复
	bot.on('message.group', (e) => {
		e.reply('hello world')
	})
	// 私聊被动回复
	bot.on('message.private', (e) => {
		e.reply('hello world')
	})
	// 主动发送频道消息
	bot.sendGuildMessage(channel_id, 'hello')
	// 主动发送群消息
	bot.sendGroupMessage(group_id, 'hello')
	// 主动发送私聊消息
	bot.sendPrivateMessage(user_id, 'hello')
	// 主动发送频道消息，注：需要先调用bot.createDirectSession(guild_id,user_id)创建私信会话，此处传入的guild_id为创建的session会话中返回的guild_id
	bot.sendDirectMessage(guild_id, 'hello')
})
```

## API

| 功能           | 方法名                | 参数1         | 参数2        | 参数3 | 参数4 | 返回值                                                                                                              |
|--------------|--------------------|-------------|------------|-----|-----|------------------------------------------------------------------------------------------------------------------|
| 获取当前机器人信息    | getSelfInfo        |             |            |     |     | 见[获取用户详情](https://bot.q.qq.com/wiki/develop/api-231017/server-inter/channel/manage/user/me.html#content-type)    |
| 获取频道列表       | getGuildList       |             |            |     |     | [Guild](https://bot.q.qq.com/wiki/develop/api-231017/server-inter/channel/manage/guild/model.html)[]             |
| 获取频道详情       | getGuildInfo       | guild_id    |            |     |     | [Guild](https://bot.q.qq.com/wiki/develop/api-231017/server-inter/channel/manage/guild/model.html)               |
| 获取频道成员列表     | getGuildMemberList | guild_id    |            |     |     | [Member](https://bot.q.qq.com/wiki/develop/api-231017/server-inter/channel/role/member/model.html#member)[]      |
| 获取频道成员详情     | getGuildMemberInfo | guild_id    | member_id  |     |     | [Member](https://bot.q.qq.com/wiki/develop/api-231017/server-inter/channel/role/member/model.html#member)        |
| 获取子频道列表      | getChannelList     | guild_id    |            |     |     | [Channel](https://bot.q.qq.com/wiki/develop/api-231017/server-inter/channel/manage/channel/model.html#channel)[] |
| 获取子频道详情      | getChannelInfo     | guild_id    | channel_id |     |     | [Channel](https://bot.q.qq.com/wiki/develop/api-231017/server-inter/channel/manage/channel/model.html#channel)   |
| 发送频道消息       | sendGuildMessage   | channel_id  | message    |     |     | -                                                                                                                | 
| 发送频道私信消息     | sendDirectMessage  | guild_id    | message    |     |     | -                                                                                                                |
| 发送群消息        | sendGroupMessage   | group_id    | message    |     |     | -                                                                                                                |
| 发送私信消息       | sendPrivateMessage | user_openid | message    |     |     | -                                                                                                                |
| 更多API文档信息待补充 |                    |             |            |     |     | -                                                                                                                |
