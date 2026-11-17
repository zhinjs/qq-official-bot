---
layout: doc
---

# 快速开始

`qq-official-bot` 是基于 Node.js 和 TypeScript 开发的现代化 QQ 机器人 SDK，采用模块化架构设计。

## 📋 环境要求

- **Node.js**: 16.0.0 或更高版本
- **TypeScript**: 4.5.0 或更高版本（可选，但推荐）

## 🚀 安装

### 1. 初始化项目

```bash
mkdir my-qq-bot
cd my-qq-bot
npm init -y
```

### 2. 安装依赖

```bash
# 使用 npm
npm install qq-official-bot

# 使用 yarn
yarn add qq-official-bot

# 使用 pnpm
pnpm add qq-official-bot
```

### 3. TypeScript 支持（推荐）

```bash
npm install -D typescript @types/node
npx tsc --init
```

## 🎯 快速上手

### WebSocket 连接模式

```typescript
import { Bot, ReceiverMode } from 'qq-official-bot'

const bot = new Bot({
    appid: 'your_app_id',           // QQ 机器人的 App ID
    secret: 'your_app_secret',      // QQ 机器人的 App Secret
    sandbox: false,                 // 是否为沙箱环境
    removeAt: true,                 // 自动移除消息中的 @机器人
    logLevel: 'info',               // 日志级别
    maxRetry: 10,                   // 最大重连次数
    intents: [
        'GUILD_MESSAGES',           // 频道消息事件
        'GUILD_MESSAGE_REACTIONS',  // 频道消息表态事件
        'DIRECT_MESSAGE',           // 频道私信事件
        'GROUP_AND_C2C_EVENT',  // 群聊@与私聊消息事件
    ],
    mode: ReceiverMode.WEBSOCKET,   // WebSocket 连接模式
})

// 监听消息事件
bot.on('message', async (event) => {
    console.log('收到消息:', event.content)
    
    if (event.content === 'hello') {
        await event.reply('Hello! 我是 QQ 机器人 🤖')
    }
})

// 启动机器人
bot.start()
```

#### 自定义网关地址

WebSocket 模式下，SDK 默认请求官方接口获取 token 和 gateway 信息。若需通过代理、内网穿透或自建服务转发，可配置以下选项：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `accessTokenUrl` | 获取 access token 的**完整 URL** | `https://bots.qq.com/app/getAppAccessToken` |
| `gatewayUrl` | 获取网关信息的 **URL 或路径**；响应中的 `url` 为 WebSocket 连接地址 | `/gateway/bot` |

```typescript
const bot = new Bot({
    appid: process.env.QQ_BOT_APPID!,
    secret: process.env.QQ_BOT_SECRET!,
    intents: ['GUILD_MESSAGES'],
    mode: ReceiverMode.WEBSOCKET,
    accessTokenUrl: process.env.QQ_BOT_ACCESS_TOKEN_URL,
    gatewayUrl: process.env.QQ_BOT_GATEWAY_URL,
})
```

连接流程：

1. 向 `accessTokenUrl` 发送 `{ appId, clientSecret }` 换取 token
2. 携带 `Authorization: QQBot <token>` 请求 `gatewayUrl`
3. 使用 gateway 响应中的 `url` 建立 WebSocket 连接

> `gatewayUrl` 为相对路径时，会拼接到 OpenAPI 根地址。QQ 官方现已统一使用 `https://api.bot.qq.com`；如配置了 `apiBaseUrl`，则使用自定义根地址。

### Webhook 连接模式

```typescript
import { Bot, ReceiverMode } from 'qq-official-bot'

const bot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    sandbox: false,
    intents: ['GUILD_MESSAGES', 'DIRECT_MESSAGE'],
    mode: ReceiverMode.WEBHOOK,
    port: 3000,                     // Webhook 监听端口
    path: '/webhook',               // Webhook 路径
})

bot.on('message', async (event) => {
    await event.reply(`你说: ${event.content}`)
})

bot.start()
```

### Express/Koa 中间件模式

```typescript
import { Bot, ReceiverMode, ApplicationPlatform } from 'qq-official-bot'
import express from 'express'

const bot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    sandbox: false,
    intents: ['GUILD_MESSAGES'],
    mode: ReceiverMode.MIDDLEWARE,
    application: ApplicationPlatform.EXPRESS, // 或 ApplicationPlatform.KOA
})

const app = express()

// 使用机器人中间件
app.use('/bot', bot.middleware)

bot.on('message', async (event) => {
    await event.reply('通过中间件接收到消息!')
})

app.listen(3000, () => {
    console.log('服务器启动在端口 3000')
})

bot.start()
```

## 🔧 使用服务模块

新版本采用服务模块化设计，每个服务负责特定的功能领域：

```typescript
await bot.channel(channel_id).send('Hello from channel')
await bot.group(group_id).send('Hello from group')
await bot.user(user_id).send('Hello from C2C')

await bot.memberService.muteGuildMember(guild_id, user_id, 600)

// 使用权限管理服务
const permissions = await bot.permissionService.getChannelMemberPermission(
    channel_id, 
    user_id
)
```

## 📝 消息构建

### 文本消息

```typescript
// 简单文本
await event.reply('Hello World!')

// 带格式的文本
await event.reply('**粗体文本** 和 *斜体文本*')
```

### 富媒体消息

```typescript
import { segment } from 'qq-official-bot'

// 图片消息
await event.reply([
    segment.text('看看这张图片:'),
    segment.image('https://example.com/image.jpg')
])

// 混合消息
await event.reply([
    segment.text('用户信息:'),
    segment.at(user_id),
    segment.text(' 欢迎加入!')
])
```

## 🎉 运行项目

```bash
# TypeScript
npx tsx bot.ts

# 或编译后运行
npx tsc
node dist/bot.js

# JavaScript
node bot.js
```

## ⚠️ 注意事项

1. **凭证安全**: 请妥善保管你的 `appid` 和 `secret`，不要在代码中硬编码
2. **权限配置**: 确保在 QQ 开放平台配置了正确的机器人权限
3. **事件订阅**: 根据你的需求配置 `intents` 数组
4. **环境区分**: 开发时使用 `sandbox: true`，生产环境使用 `sandbox: false`

## 📚 下一步

- 查看 [配置文档](../config.md) 了解更多配置选项
- 查看 [API 参考](../api/) 了解详细的 API 使用方法
- 查看 [接口文档](../interface/) 了解类型定义

