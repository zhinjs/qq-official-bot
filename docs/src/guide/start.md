---
layout: doc
---
# 快速开始
由于 `qq-group-bot` 是基于 `NodeJS` 编写，要使用 "qq-group-bot"，你可以按照以下步骤进行操作：
## 1. 安装 Node.js
首先，确保你的计算机上已经安装了 Node.js。你可以在 Node.js 的官方网站上下载并安装适合你操作系统的版本。
## 2. 创建新项目
在你的项目文件夹中，打开终端或命令行界面，并运行以下命令来初始化一个新的 Node.js 项目：
```shell
npm init # 这将会引导你创建一个新的 `package.json` 文件，用于管理你的项目依赖和配置。
```
## 3. 安装 `qq-group-bot` 包
运行以下命令来安装 `qq-group-bot` 包:
```shell
npm install qq-group-bot
```
## 4. 编写代码
创建一个 JavaScript 或 TypeScript 文件（例如 bot.js），并在其中编写你的 QQ 群机器人代码。你可以使用下面的示例代码作为起点：
```javascript
const {Bot} = require('qq-group-bot');

const bot = new Bot({
	// 在这里配置你的 QQ 机器人的appid和secret等信息
    appid: '你的 appid',
    secret: '你的 secret',
    intents:[ // 监听事件类型
        // 'GROUP_AT_MESSAGE_CREATE', // 群聊@消息事件 没有群权限请注释
	    'C2C_MESSAGE_CREATE', // 私聊事件 没有私聊权限请注释
	    'GUILD_MESSAGES', // 私域机器人频道消息事件 公域机器人请注释
	    'PUBLIC_GUILD_MESSAGES', // 公域机器人频道消息事件 私域机器人请注释
	    'DIRECT_MESSAGE', // 频道私信事件
	    'GUILD_MESSAGE_REACTIONS', // 频道消息表态事件
	    'GUILDS', // 频道变更事件
	    'GUILD_MEMBERS', // 频道成员变更事件
	    'DIRECT_MESSAGE', // 频道私信事件
    ]
});

// 监听消息事件
bot.on('message', (event) => {
	// 在这里处理消息
	console.log('收到消息:', event.message);
	// 回复消息
	event.reply('hello world')
});

// 启动机器人
bot.start();
```

- 注意：在配置中，你需要填写你的 `appid`和 `secret`。请确保妥善保管你的账号信息，并遵循相关使用条款和隐私政策。
- 示例中的配置仅为基础配置，更多配置信息请查看 [配置项](../config.md) 章节


