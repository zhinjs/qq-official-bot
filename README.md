# qq-official-bot

[![CI](https://github.com/zhinjs/qq-official-bot/actions/workflows/release.yaml/badge.svg?branch=master&event=push)](https://github.com/zhinjs/qq-official-bot/actions/workflows/release.yaml)
[![Docs](https://github.com/zhinjs/qq-official-bot/actions/workflows/docs.yaml/badge.svg?branch=master&event=push)](https://github.com/zhinjs/qq-official-bot/actions/workflows/docs.yaml)
[![npm version](https://img.shields.io/npm/v/qq-official-bot/latest.svg)](https://www.npmjs.com/package/qq-official-bot)
[![qq group](https://img.shields.io/badge/group-446290761-blue?style=flat-square&labelColor=FAFAFA&logo=data:image/png;base64,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&logoColor=000000)](https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=rYaL-gcqTjWYqwBs9TDoVSXKu-i5ircB&authKey=TO02faBOpfhmfkw3YQuUCG2HxUEwWCuFdMBf5nSt3qyWD%2FqaO453O9Dx%2BK8JwBdM&noverify=0&group_code=446290761)

基于 Node.js 的 QQ 官方机器人开发 SDK，采用现代化的模块化架构设计，提供完整的类型支持和丰富的功能。

## ✨ 特性

- 🏗️ **模块化架构** - 采用服务化设计，职责分离，易于维护和扩展
- 🔌 **多种连接方式** - 支持 WebSocket、Webhook 和中间件模式
- 🌐 **自定义网关地址** - WebSocket 模式可配置 `accessTokenUrl` 与 `gatewayUrl`，便于代理或私有部署
- 📝 **完整类型支持** - 使用 TypeScript 开发，提供完整的类型定义
- 🚀 **简单易用** - 提供直观的 API 接口和丰富的示例
- 🛠️ **功能全面** - 覆盖 QQ 官方 API 的所有功能
- 🔒 **安全可靠** - 内置请求验证和错误处理机制

## 📦 安装

```bash
npm install qq-official-bot
# 或者
yarn add qq-official-bot
# 或者
pnpm add qq-official-bot
```

## 🎯 核心架构

项目采用分层架构设计：

- **Bot 层** - 对外提供统一的 API 接口
- **Service 层** - 业务逻辑服务，负责具体功能实现
- **Client 层** - 底层客户端，处理认证和连接管理
- **Message 层** - 消息处理和构建
- **Events 层** - 事件系统和调度器
## 🚀 快速开始

### 1. WebSocket 连接模式

```typescript
import { Bot, ReceiverMode } from 'qq-official-bot'

const bot = new Bot({
    appid: 'your_app_id',           // QQ 机器人的 App ID
    secret: 'your_app_secret',      // QQ 机器人的 App Secret
    removeAt: true,                 // 自动移除消息中的 @机器人
    logLevel: 'info',               // 日志级别
    maxRetry: 10,                   // 最大重连次数
    intents: [
        'GROUP_AND_C2C_EVENT',     // 群聊@消息与私聊事件
        'GUILD_MESSAGES',              // 频道消息事件
        'DIRECT_MESSAGE',              // 频道私信事件
        'GUILD_MESSAGE_REACTIONS',     // 频道消息表态事件
        'GUILDS',                      // 频道变更事件
        'GUILD_MEMBERS',               // 频道成员变更事件
    ],
    mode: ReceiverMode.WEBSOCKET,   // 连接模式
})

// 启动机器人
await bot.start()
```

如需通过代理或自建服务接入官方网关，可自定义认证与 gateway 接口地址（WebSocket 地址仍由 gateway 响应中的 `url` 字段返回）：

```typescript
const bot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    intents: ['GUILD_MESSAGES'],
    mode: ReceiverMode.WEBSOCKET,
    // 可选：自定义 token 接口（完整 URL）
    accessTokenUrl: 'https://your-proxy.example.com/app/getAppAccessToken',
    // 可选：自定义 gateway 接口（完整 URL 或相对路径）
    gatewayUrl: 'https://your-proxy.example.com/gateway/bot',
})
```

### 2. Webhook 连接模式

```typescript
import { Bot, ReceiverMode } from 'qq-official-bot'

const bot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    // ...其他配置
    mode: ReceiverMode.WEBHOOK,
    port: 3000,                     // Webhook 监听端口
    path: '/webhook',               // Webhook 路径
})

await bot.start()
```

### 3. 中间件模式 (Express/Koa)

```typescript
import { Bot, ReceiverMode } from 'qq-official-bot'
import express from 'express'

const bot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    // ...其他配置
    mode: ReceiverMode.MIDDLEWARE,
    application: 'express',         // 或 'koa'
})

const app = express()
app.use(bot.middleware)
app.listen(3000)

await bot.start()
```

## 📝 基本用法

### 发送消息

```typescript
// 监听消息事件
bot.on('message.guild', async (event) => {
    // 频道消息回复
    await event.reply('Hello, World!')
})

bot.on('message.group', async (event) => {
    await event.reply('Hello, Group!')
    await event.group.send('也可以直接对这个群发')
})

bot.on('message.private', async (event) => {
    // 私聊消息回复
    await event.reply('Hello, Private!')
})

// 主动发送消息
await bot.channel(channel_id).send('Hello from bot!')
await bot.group(group_id).send('Hello, Group!')
await bot.user(user_id).send('Hello, User!')

// 旧方法名仍可用
await bot.sendGuildMessage(channel_id, 'Hello from bot!')
await bot.sendGroupMessage(group_id, 'Hello, Group!')
await bot.sendPrivateMessage(user_id, 'Hello, User!')
```

### 使用服务模块

```typescript
// 频道服务
const guilds = await bot.guildService.getList()
const guildInfo = await bot.guildService.getInfo(guild_id)

// 消息服务
await bot.messageService.sendGuildMessage(channel_id, 'Hello!')
await bot.messageService.recallGuildMessage(channel_id, message_id)

// 成员管理（Bot 层也提供同名便捷方法）
await bot.muteGuildMember(guild_id, user_id, 600)
await bot.kickGuildMember(guild_id, user_id)

// 权限管理
const permissions = await bot.getChannelMemberPermission(channel_id, user_id)
await bot.updateChannelMemberPermission(channel_id, user_id, { add: 'permission', remove: 'permission' })
```
## 🔧 服务模块架构

项目采用服务模块化设计，每个服务负责特定的功能领域：

### 核心服务

| 服务模块 | 功能描述 | 主要方法 |
|---------|---------|----------|
| **GuildService** | 频道管理 | `getList()`, `getInfo()`, `getRoles()` |
| **ChannelService** | 子频道管理 | `getList()`, `getInfo()`, `create()`, `update()` |
| **MessageService** | 消息处理 | `sendGuildMessage()`, `sendGroupMessage()`, `sendPrivateMessage()`, `createPrivateStream()` |
| **MemberService** | 成员管理 | `getGuildMemberList()`, `muteMembers()`, `kickMember()` |
| **PermissionService** | 权限管理 | `getChannelMemberPermission()`, `updateChannelMemberPermission()` |
| **ReactionService** | 表态管理 | `addGuildMessageReaction()`, `deleteGuildMessageReaction()` |
| **ScheduleService** | 日程管理 | `getChannelSchedules()`, `createChannelSchedule()`, `updateChannelSchedule()` |
| **ThreadService** | 帖子管理 | `getChannelThreads()`, `publishThread()`, `deleteThread()` |
| **AudioService** | 音频控制 | `controlChannelAudio()`, `setOnlineMic()`, `setOfflineMic()` |
| **BotService** | 机器人信息 | `getSelfInfo()`, `replyAction()` |
| **GroupService** | 群聊管理 | `getInfo()`, `getMembers()`, `removeMembers()`, `getMemberBlacklist()`, `getJoinRequests()` |
| **MenuPanelService** | 自定义菜单与指令面板 | `getCustomMenu()`, `updateCustomMenu()`, `getCommandPanels()`, `createCommandPanel()` |

### 服务特性

- ✅ **Bot 便捷方法** - `Bot` 类封装了常用 API，与服务层方法对应
- ✅ **错误处理** - 内置请求拦截与错误转换
- ✅ **类型安全** - 完整的 TypeScript 类型定义
- ✅ **服务分层** - 也可直接调用 `bot.*Service` 访问底层能力

## 🎯 API 参考

### 基础 API

| 功能 | 方法 | 参数 | 返回值 |
|-----|------|------|--------|
| 获取机器人信息 | `getSelfInfo()` | - | `Bot.Info` |
| 获取频道列表 | `getGuildList()` | - | `Guild.ApiInfo[]` |
| 获取频道信息 | `getGuildInfo(guild_id)` | `guild_id: string` | `Guild.ApiInfo` |
| 获取子频道列表 | `getChannelList(guild_id)` | `guild_id: string` | `Channel.ApiInfo[]` |
| 获取子频道信息 | `getChannelInfo(channel_id)` | `channel_id: string` | `Channel.ApiInfo` |

### 消息 API

| 功能 | 方法 | 参数 | 返回值 |
|-----|------|------|--------|
| 发送频道消息 | `bot.channel(id).send(content)` | `channel_id: string, content: Sendable` | `SendResult` |
| 发送私聊消息 | `bot.user(id).send(content)` | `user_id: string, content: Sendable` | `SendResult` |
| 流式发送私聊 | `bot.user(id).createStream(options?)` | `user_id: string, options?: CreatePrivateStreamOptions` | `PrivateMessageStream` |
| 发送群消息 | `bot.group(id).send(content)` | `group_id: string, content: Sendable` | `SendResult` |
| 发送频道私信 | `bot.direct(guildId).send(content)` | `guild_id: string, content: Sendable` | `SendResult` |
| 撤回频道消息 | `recallGuildMessage(channel_id, message_id)` | `channel_id: string, message_id: string` | `boolean` |
| 撤回群消息 | `recallGroupMessage(group_id, message_id)` | `group_id: string, message_id: string` | `boolean` |
| 撤回私聊消息 | `recallPrivateMessage(user_id, message_id)` | `user_id: string, message_id: string` | `boolean` |

### 成员管理 API

| 功能 | 方法 | 参数 | 返回值 |
|-----|------|------|--------|
| 获取频道成员 | `getGuildMemberList(guild_id)` | `guild_id: string` | `GuildMember.ApiInfo[]` |
| 禁言成员 | `muteGuildMember(guild_id, user_id, seconds)` | `guild_id: string, user_id: string, seconds: number` | `boolean` |
| 踢出成员 | `kickGuildMember(guild_id, user_id)` | `guild_id: string, user_id: string` | `boolean` |

### 权限管理 API

| 功能 | 方法 | 参数 | 返回值 |
|-----|------|------|--------|
| 获取成员权限 | `getChannelMemberPermission(channel_id, user_id)` | `channel_id: string, user_id: string` | `ChannelMemberPermissions` |
| 更新成员权限 | `updateChannelMemberPermission(channel_id, user_id, permission)` | `channel_id: string, user_id: string, permission: UpdatePermissionParams` | `boolean` |

### 菜单与指令面板 API

| 功能 | 方法 | 参数 | 返回值 |
|-----|------|------|--------|
| 查询全局自定义菜单 | `getCustomMenu()` | - | `CustomMenuInfo` |
| 修改全局自定义菜单 | `updateCustomMenu(menu)` | `menu: CustomMenu` | `UpdateCustomMenuResult` |
| 查询指令面板列表 | `getCommandPanels(options)` | `options: CommandPanelListOptions` | `CommandPanelList` |
| 创建指令面板 | `createCommandPanel(options)` | `options: CreateCommandPanelOptions` | `CreateCommandPanelResult` |
| 查询指令面板详情 | `getCommandPanel(panelId)` | `panelId: string` | `CommandPanelDetail` |
| 修改指令面板 | `updateCommandPanel(panelId, panel)` | `panelId: string, panel: CommandPanel` | `UpdateCommandPanelResult` |
| 删除指令面板 | `deleteCommandPanel(panelId)` | `panelId: string` | `void` |
| 修改面板关联对象 | `updateCommandPanelTargets(panelId, options)` | `panelId: string, options: UpdateCommandPanelTargetsOptions` | `void` |

创建菜单和面板时可用 `menu` / `panel` 工厂（与 `segment` 相同风格）：

```typescript
import { menu, panel, segment } from 'qq-official-bot'

await bot.updateCustomMenu(menu.build(
    menu.sendMessage('帮助', '/help'),
    menu.sendMessage('签到', segment.text('/sign')),
    menu.link('官网', 'https://example.com'),
    menu.switch('搜索', 'search'),
    menu.submenu('更多', menu.sendMessage('设置', '/settings')),
))

await bot.createCommandPanel({
    scope: 'c2c',
    target_type: 'all',
    panel: panel.build([
        panel.command('查询天气', { desc: '查询当前天气' }),
        panel.link('更多服务', 'https://example.com'),
    ], 'C2C 面板'),
})

await bot.sendPrivateMessage(user_id, menu.text('/help'))
```

## 🔧 配置选项

### Bot 配置

```typescript
interface BotConfig {
    appid: string              // 机器人 App ID
    secret: string             // 机器人 App Secret
    sandbox?: boolean          // 已废弃，保留用于兼容旧配置
    apiBaseUrl?: string        // OpenAPI 根地址，默认 https://api.bot.qq.com
    groupMemberCache?: boolean | {
        persist?: boolean      // 是否持久化为本地 JSON
        path?: string          // 自定义缓存文件路径
        maxAge?: number        // 最长有效期（毫秒），默认不过期
    }
    guildMemberCache?: boolean | {
        persist?: boolean      // 频道成员缓存持久化
        path?: string
        maxAge?: number
    }
    guildCache?: boolean | {
        persist?: boolean      // 频道列表缓存持久化
        path?: string
        maxAge?: number
    }
    removeAt?: boolean         // 是否移除消息中的 @，默认 false
    logLevel?: string          // 日志级别，默认 'info'
    maxRetry?: number          // 最大重连次数，默认 10
    intents: Intent[]          // 订阅的事件类型
    mode: ReceiverMode         // 连接模式
    
    // WebSocket 模式特有配置
    accessTokenUrl?: string    // 获取 access token 的完整 URL
    gatewayUrl?: string        // 获取网关信息的 URL 或路径，响应 url 为 WebSocket 地址
    heartbeatInterval?: number // 心跳间隔(ms)
    maxRetries?: number        // 连接重试次数
    reconnectDelay?: number    // 重连延迟(ms)
    
    // Webhook 模式特有配置
    port?: number              // 监听端口
    path?: string              // Webhook 路径
    
    // 中间件模式特有配置
    application?: 'express' | 'koa'  // 使用的框架
}
```

### 事件类型 (Intents)

```typescript
type Intent = 
    // 频道事件
    | 'GUILDS'
    // 频道成员事件
    | 'GUILD_MEMBERS'
    // 频道消息事件
    | 'GUILD_MESSAGES'
    // 频道消息表态事件
    | 'GUILD_MESSAGE_REACTIONS'
    // 频道私信事件
    | 'DIRECT_MESSAGE'
    // 群成员变更事件
    | 'GROUP_MEMBER'
    // 私聊与群聊消息事件
    | 'GROUP_AND_C2C_EVENT'
    // 互动事件
    | 'INTERACTION'
    // 消息审核事件
    | 'MESSAGE_AUDIT'
    // 论坛事件(仅私域)
    | 'FORUMS_EVENT'
    // 音频操作事件
    | 'AUDIO_ACTION'
    // 公域机器人消息事件
    | 'PUBLIC_GUILD_MESSAGES'
```

## 🎨 消息构建

### 基础消息

```typescript
import { segment } from 'qq-official-bot'

// 文本消息
await bot.sendGuildMessage(channel_id, 'Hello, World!')

// 组合消息段
await bot.sendGuildMessage(channel_id, [
    segment.text('这是一条包含 '),
    segment.at(user_id),
    segment.text(' 的消息'),
])
```

### 富媒体与 Markdown

```typescript
import { segment } from 'qq-official-bot'

await bot.sendGroupMessage(group_id, [
    segment.markdown('## 通知\n**重要内容**'),
    segment.image('https://example.com/image.png'),
])
```

> 业务侧用 `segment` 组装 `Sendable`。`MessageBuilder` 只在 `MessageService` 内部使用。
