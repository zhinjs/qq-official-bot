---
layout: doc
---

# 配置项

QQ 机器人 SDK 提供了灵活的配置选项，支持多种连接模式和自定义参数。

## 🔧 基础配置

### Bot.Config 接口

```typescript
interface Config<T extends ReceiverMode, M extends ApplicationPlatform> {
    // 必填项
    appid: string                           // QQ 机器人的 App ID
    secret: string                          // QQ 机器人的 App Secret  
    intents: Intent[]                       // 事件订阅列表
    mode: T                                 // 连接模式

    // 可选项
    sandbox?: boolean                       // 已废弃，保留用于兼容旧配置
    apiBaseUrl?: string                     // OpenAPI 根地址，默认 https://api.bot.qq.com
    groupMemberCache?: boolean | GroupMemberCacheOptions // 群成员缓存，默认 false
    guildMemberCache?: boolean | GuildMemberCacheOptions // 频道成员缓存，默认 false
    guildCache?: boolean | GuildCacheOptions             // 频道列表缓存，默认 false
    logLevel?: LogLevel                     // 日志级别，默认 'info'
    removeAt?: boolean                      // 是否移除消息中的 @机器人，默认 false
    maxRetry?: number                       // 最大重连次数，默认 10
    timeout?: number                        // 请求超时时间(ms)，默认 5000

    // WebSocket 模式专用
    accessTokenUrl?: string               // 获取 token 的完整 URL，默认官方地址
    gatewayUrl?: string                   // 获取网关信息的 URL 或路径，响应 url 为 WebSocket 地址

    // Webhook 模式专用
    port?: number                           // 监听端口，mode 为 webhook 时必填
    path?: string                           // 监听路径，mode 为 webhook 时必填

    // 中间件模式专用
    application?: M                         // 应用平台类型，mode 为 middleware 时必填
}
```

## 📋 配置详解

### 基础配置

| 属性名 | 类型 | 必填 | 描述 | 默认值 |
|-------|------|------|------|--------|
| `appid` | `string` | ✅ | QQ 机器人的 App ID | - |
| `secret` | `string` | ✅ | QQ 机器人的 App Secret | - |
| `intents` | `Intent[]` | ✅ | 事件订阅列表 | - |
| `mode` | `ReceiverMode` | ✅ | 连接模式 | - |
| `sandbox` | `boolean` | ❌ | 已废弃；QQ OpenAPI 已统一域名 | - |
| `apiBaseUrl` | `string` | ❌ | OpenAPI 根地址，可用于代理或 mock | `https://api.bot.qq.com` |
| `groupMemberCache` | `boolean \| GroupMemberCacheOptions` | ❌ | 群成员列表缓存；`true` 使用内存缓存 | `false` |
| `guildMemberCache` | `boolean \| GuildMemberCacheOptions` | ❌ | 频道成员列表缓存；`true` 使用内存缓存 | `false` |
| `guildCache` | `boolean \| GuildCacheOptions` | ❌ | 频道列表缓存；`true` 使用内存缓存 | `false` |
| `logLevel` | `LogLevel` | ❌ | 日志输出级别 | `'info'` |
| `removeAt` | `boolean` | ❌ | 自动移除消息中的@机器人 | `false` |
| `maxRetry` | `number` | ❌ | 最大重连次数 | `10` |
| `timeout` | `number` | ❌ | 请求超时时间(毫秒) | `5000` |

### 群成员缓存

群成员缓存默认关闭，不改变现有请求行为：

```typescript
// 默认：不缓存，每次 getGroupMemberList 都重新拉取
groupMemberCache: false

// 仅内存缓存
groupMemberCache: true

// 内存缓存 + 本地 JSON 持久化
groupMemberCache: {
    persist: true,
    path: './data/group-members.json', // 可选
    maxAge: 24 * 60 * 60 * 1000,      // 可选，毫秒；默认不过期
}
```

配置 `persist: true` 且未指定 `path` 时，缓存默认写入 `dataDir`（未设置则为 `.qq-official-bot`）下的 `<appid>-group-members.json`。

缓存开启后：

- 首次读取仍会自动拉取全部分页，后续读取直接返回缓存。
- `GROUP_MEMBER_ADD` 会查询新增成员详情并写入已有群缓存。
- `GROUP_MEMBER_REMOVE` 会从缓存删除对应成员。
- `GROUP_ADD_ROBOT` / `GROUP_DEL_ROBOT` 会清除对应群的旧缓存，下次读取重新拉取。
- SDK 成功调用批量移除成员接口后，会立即同步删除缓存中的成员。

若要依靠成员事件长期维护缓存，应订阅 `GROUP_MEMBER` 和 `GROUP_AND_C2C_EVENT`。也可以随时强制刷新或清除：

```typescript
await bot.getGroupMemberList(group_openid, true) // force = true，强制刷新
await bot.group(group_openid).refreshMembers()
await bot.group(group_openid).clearMemberCache()

// 或直接使用服务
await bot.groupService.getMembers(group_openid, { forceRefresh: true })
await bot.groupService.clearMemberCache() // 清空所有群
```

### 频道成员缓存

频道成员缓存与群成员缓存采用相同配置，默认同样关闭：

```typescript
guildMemberCache: true

// 或启用本地 JSON 持久化
guildMemberCache: {
    persist: true,
    path: './data/guild-members.json',
    maxAge: 24 * 60 * 60 * 1000,
}
```

未指定 `path` 时，持久化文件为 `dataDir` 下的 `<appid>-guild-members.json`。`GUILD_MEMBER_ADD / UPDATE / REMOVE` 会增量维护缓存，`GUILD_CREATE / DELETE` 会使对应缓存失效；SDK 主动踢出成员或修改成员角色成功后也会同步缓存。事件同步需要订阅 `GUILD_MEMBERS` 和 `GUILDS`。

```typescript
await bot.getGuildMemberList(guild_id, true) // force = true，强制刷新
await bot.guild(guild_id).refreshMembers()
await bot.guild(guild_id).clearMemberCache()
await bot.memberService.clearMemberCache() // 清空所有频道
```

### 频道列表缓存

`getGuildList()` 也支持默认关闭的内存或持久化缓存：

```typescript
guildCache: true

// 或启用本地 JSON 持久化
guildCache: {
    persist: true,
    path: './data/guild-list.json',
    maxAge: 24 * 60 * 60 * 1000,
}
```

未指定 `path` 时，持久化文件为 `dataDir` 下的 `<appid>-guild-list.json`。`GUILD_CREATE / UPDATE / DELETE` 会增量维护已有缓存，需要订阅 `GUILDS`。

```typescript
await bot.getGuildList()       // 优先读取缓存
await bot.getGuildList(true)   // 忽略缓存，重新拉取全部分页
await bot.guildService.clearCache()
```

### 连接模式配置

#### WebSocket 模式

```typescript
import { Bot, ReceiverMode } from 'qq-official-bot'

// 默认：直连官方网关
const bot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    intents: ['GUILD_MESSAGES'],
    mode: ReceiverMode.WEBSOCKET,
})

// 自定义：通过代理或自建服务转发
const proxiedBot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    intents: ['GUILD_MESSAGES'],
    mode: ReceiverMode.WEBSOCKET,
    accessTokenUrl: 'https://your-proxy.example.com/app/getAppAccessToken',
    gatewayUrl: 'https://your-proxy.example.com/gateway/bot',
})
```

| 属性名 | 类型 | 必填 | 描述 | 默认值 |
|-------|------|------|------|--------|
| `accessTokenUrl` | `string` | ❌ | 获取 access token 的完整 URL | `https://bots.qq.com/app/getAppAccessToken` |
| `gatewayUrl` | `string` | ❌ | 获取网关信息的 URL 或路径；响应中的 `url` 为 WebSocket 连接地址 | `/gateway/bot` |
| `heartbeatInterval` | `number` | ❌ | 心跳间隔(ms) | `45000` |
| `maxRetries` | `number` | ❌ | 连接重试次数 | `10` |
| `reconnectDelay` | `number` | ❌ | 重连延迟(ms) | `1000` |

##### 自定义网关地址说明

WebSocket 连接分三步，其中前两步可通过配置覆盖默认地址：

| 步骤 | 默认行为 | 自定义配置 |
|------|----------|------------|
| 1. 获取 token | `POST https://bots.qq.com/app/getAppAccessToken` | `accessTokenUrl` |
| 2. 获取 gateway | `GET /gateway/bot`（相对 API 根地址） | `gatewayUrl` |
| 3. 建立 WebSocket | 使用 gateway 响应中的 `url` 字段 | 不可配置，由 gateway 返回 |

适用场景：

- 需要通过反向代理、内网穿透（如 ngrok）访问官方网关
- 企业内网部署了转发官方 API 的中间层
- 开发调试时需要将流量路由到本地 mock 服务

注意事项：

- `accessTokenUrl` 必须是**完整 URL**；请求体仍为 `{ appId, clientSecret }`
- `gatewayUrl` 支持完整 URL，也支持相对路径（如 `/gateway/bot`）
- 代理服务应返回与[官方 gateway 接口](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/reference.html)兼容的响应格式，尤其是 `url` 字段
- 两个配置项可单独使用，例如只自定义 token 地址、gateway 仍走默认路径

#### Webhook 模式

```typescript
import { Bot, ReceiverMode } from 'qq-official-bot'

const bot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    intents: ['GUILD_MESSAGES'],
    mode: ReceiverMode.WEBHOOK,
    port: 3000,                    // 必填：监听端口
    path: '/webhook',              // 必填：监听路径
})
```

#### 中间件模式

```typescript
import { Bot, ReceiverMode, ApplicationPlatform } from 'qq-official-bot'

const bot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    intents: ['GUILD_MESSAGES'],
    mode: ReceiverMode.MIDDLEWARE,
    application: ApplicationPlatform.EXPRESS, // 必填：Express 或 Koa
})
```

## 🎯 事件订阅 (Intents)

### 可用的 Intent 列表

| Intent | 描述 | 适用范围 |
|--------|------|----------|
| `GUILDS` | 频道变更事件 | 所有机器人 |
| `GUILD_MEMBERS` | 频道成员变更事件 | 所有机器人 |
| `GUILD_MESSAGES` | 私域频道消息事件 | 私域机器人 |
| `PUBLIC_GUILD_MESSAGES` | 公域频道消息事件 | 公域机器人 |
| `GUILD_MESSAGE_REACTIONS` | 频道消息表态事件 | 所有机器人 |
| `DIRECT_MESSAGE` | 频道私信事件 | 所有机器人 |
| `GROUP_MEMBER` | 群成员变更事件（`GROUP_MEMBER_ADD` / `GROUP_MEMBER_REMOVE`） | 有群聊权限的机器人 |
| `GROUP_AND_C2C_EVENT` | 群聊@与私聊消息事件 | 有群或私聊权限的机器人 |
| `MESSAGE_AUDIT` | 消息审核事件 | 所有机器人 |
| `FORUMS_EVENTS` | 论坛事件 | 私域机器人 |
| `AUDIO_ACTIONS` | 音频操作事件 | 所有机器人 |
| `INTERACTION` | 互动事件 | 所有机器人 |

### Intent 配置示例

```typescript
// 私域机器人配置
const privateBotIntents = [
    'GUILD_MESSAGES',           // 频道消息
    'GUILD_MESSAGE_REACTIONS',  // 消息表态
    'DIRECT_MESSAGE',           // 私信
    'GUILDS',                   // 频道变更
    'GUILD_MEMBERS',            // 成员变更
]

// 公域机器人配置
const publicBotIntents = [
    'PUBLIC_GUILD_MESSAGES',    // 公域频道消息
    'GUILD_MESSAGE_REACTIONS',  // 消息表态
    'DIRECT_MESSAGE',           // 私信
]

// 群机器人配置
const groupBotIntents = [
    'GROUP_AND_C2C_EVENT',  // 群@消息与私聊消息
    'GROUP_MEMBER',         // 群成员进退
]
```

## 📊 日志级别

```typescript
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
```

| 级别 | 描述 |
|------|------|
| `trace` | 最详细的日志信息 |
| `debug` | 调试信息 |
| `info` | 一般信息（默认） |
| `warn` | 警告信息 |
| `error` | 错误信息 |
| `fatal` | 致命错误 |

## 🌍 API 地址配置

QQ 官方 OpenAPI 已统一使用 `https://api.bot.qq.com`。通常无需配置；使用反向代理或本地 mock 时可覆盖：

```typescript
const devBot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    apiBaseUrl: 'http://127.0.0.1:3001', // 可选：本地 mock / 代理
    logLevel: 'debug',          // 详细日志
    // ...其他配置
})

// 默认连接 QQ 官方统一域名
const prodBot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    logLevel: 'info',           // 普通日志
    // ...其他配置
})
```

## ⚡ 最佳实践

### 1. 使用环境变量

```typescript
// .env 文件
QQ_BOT_APPID=your_app_id
QQ_BOT_SECRET=your_app_secret
QQ_BOT_API_BASE_URL=https://api.bot.qq.com
# 可选：WebSocket 模式自定义网关（留空则使用官方默认地址）
QQ_BOT_ACCESS_TOKEN_URL=https://your-proxy.example.com/app/getAppAccessToken
QQ_BOT_GATEWAY_URL=https://your-proxy.example.com/gateway/bot

// 配置文件
const bot = new Bot({
    appid: process.env.QQ_BOT_APPID!,
    secret: process.env.QQ_BOT_SECRET!,
    apiBaseUrl: process.env.QQ_BOT_API_BASE_URL,
    mode: ReceiverMode.WEBSOCKET,
    intents: ['GUILD_MESSAGES'],
    ...(process.env.QQ_BOT_ACCESS_TOKEN_URL && {
        accessTokenUrl: process.env.QQ_BOT_ACCESS_TOKEN_URL,
    }),
    ...(process.env.QQ_BOT_GATEWAY_URL && {
        gatewayUrl: process.env.QQ_BOT_GATEWAY_URL,
    }),
})
```

### 2. 类型安全的配置

```typescript
import { defineConfig, ReceiverMode } from 'qq-official-bot'

const config = defineConfig({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    mode: ReceiverMode.WEBSOCKET,
    intents: ['GUILD_MESSAGES', 'DIRECT_MESSAGE'],
    logLevel: 'info',
})

const bot = new Bot(config)
```

### 3. 条件配置

```typescript
const isDev = process.env.NODE_ENV === 'development'

const bot = new Bot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    ...(isDev && { apiBaseUrl: 'http://127.0.0.1:3001' }),
    logLevel: isDev ? 'debug' : 'info',
    maxRetry: isDev ? 3 : 10,
    mode: ReceiverMode.WEBSOCKET,
    intents: ['GUILD_MESSAGES'],
})
