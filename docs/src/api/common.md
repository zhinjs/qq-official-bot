---
layout: doc
---

# 公共 API

机器人的基础 API 接口，包括机器人信息获取、文件上传、操作响应等通用功能。

## 🤖 机器人信息

### 获取机器人信息

获取当前机器人的基本信息。

**方法名**: `bot.botService.getSelfInfo()` / `bot.getSelfInfo()`

**返回类型**: `Promise<ApiResponse<Bot.Info>>`

```typescript
// 使用服务模块（推荐）
const result = await bot.botService.getSelfInfo()
if (result.success) {
    console.log('机器人信息:', result.data)
}

// 使用传统方法（向后兼容）
const botInfo = await bot.getSelfInfo()
```

**返回数据结构**:
```typescript
interface Bot.Info {
    id: string              // 机器人 ID
    username: string        // 机器人用户名
    avatar: string          // 机器人头像 URL
    union_openid?: string   // 联合身份标识
    union_user_account?: string // 联合用户账号
}
```

### 生成分享链接

生成邀请用户添加机器人为好友的分享链接。`callback_data` 会在用户通过链接添加机器人时透传给机器人后台，最长 32 字符。

**方法名**: `bot.botService.generateUrlLink(options?)` / `bot.generateUrlLink(options?)`

```typescript
const result = await bot.generateUrlLink({
    callback_data: 'campaign_20260916',
})

console.log(result.data.url)
```

**请求与响应类型**:

```typescript
interface GenerateUrlLinkOptions {
    callback_data?: string
}

interface GenerateUrlLinkResponse {
    data: {
        url: string
    }
}
```

官方文档：[生成分享链接](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_generate_url_link.post.html)

## 📁 文件上传

群聊、单聊的图片/视频/语音/文件需先上传拿到 `file_info`，再以 `msg_type=7` 发送。官方推荐**分片上传**；公网可访问的地址仍可用 URL 转存。频道消息不受此流程影响。

官方文档：[富媒体消息概述](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/rich-media.html)

| 方式 | 适用 | 行为 |
|------|------|------|
| URL 转存 | `http(s)://` 公网文件 | `POST .../files`，平台下载转存 |
| 分片上传 | 本地路径 / Buffer / Base64 | 预上传 → PUT 分片 → 确认分片 → 合并 |

单聊与群聊上传互不通用，必须对对应会话上传。

### 上传富媒体文件

**方法名**: `bot.fileProcessor.uploadMedia(fileData, options)` / `bot.uploadMedia(targetId, targetType, fileData, options?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `targetId` | `string` | ✅ | 用户 OpenID 或群 OpenID |
| `targetType` | `'user' \| 'group'` | ✅ | 上传场景 |
| `fileData` | `string \| Buffer` | ✅ | 本地路径、http(s) URL、Base64 或 Buffer |
| `options.fileType` | `1 \| 2 \| 3 \| 4` | ❌ | 1 图片、2 视频、3 语音、4 文件；可按扩展名推断 |
| `options.fileName` | `string` | ❌ | 文件名 |
| `options.sendMessage` | `boolean` | ❌ | `true` 时上传后直接发送（占用主动消息频次） |
| `options.forceChunked` | `boolean` | ❌ | 即使是 URL 也先下载再走分片 |

**文件数据格式**:
- **本地文件**: `/path/to/file.jpg` 或 `file:///path/to/file.jpg`
- **网络 URL**: `https://example.com/image.jpg`
- **Base64**: `base64://...` 或 `data:image/jpeg;base64,...`
- **Buffer**: 直接传入 Buffer

```typescript
// 本地文件：自动走分片上传
const local = await bot.uploadMedia(group_id, 'group', './demo.mp4', {
    fileType: 2,
    fileName: 'demo.mp4',
})
console.log(local.file_info, local.ttl, local.raw_url)

// 公网 URL：平台转存
const remote = await bot.uploadMedia(user_id, 'user', 'https://example.com/image.jpg', {
    fileType: 1,
})

// 发消息时本地图片也会自动分片上传
await bot.sendGroupMessage(group_id, segment.image('./photo.png'))
```

发送消息时一般不必手动上传：`sendGroupMessage` / `sendPrivateMessage` 遇到本地文件会先分片上传，再带 `media.file_info` 发出。

底层也可分步调用：

```typescript
const prepared = await bot.fileProcessor.prepareUpload('group', group_id, {
    file_type: 2,
    file_size: String(buffer.length),
    file_name: 'demo.mp4',
    md5,
    sha1,
    md5_10m,
})
// PUT prepared.parts[i].presigned_url 后调用 finishUploadPart
// 全部完成后 completeUpload 拿到 file_info
```

**返回数据结构**:
```typescript
interface FileUploadResult {
    file_uuid: string       // 文件唯一标识
    file_info: string       // 发送消息时透传到 media.file_info
    ttl: number             // 有效期（秒），0 表示可长期使用
    id?: string             // 仅 srv_send_msg=true 时返回
    raw_url?: string        // 分片上传合并后的预签名下载地址（图片/视频/语音）
}
```

## 🎯 操作响应

### 响应操作事件

响应用户的交互操作（如按钮点击、表单提交等）。

**方法名**: `bot.botService.replyAction(actionId, code?)` / `bot.replyAction(actionId, code?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `actionId` | `string` | ✅ | 操作 ID |
| `code` | `ActionNoticeEvent.ReplyCode` | ❌ | 响应码，默认为 0 |

**响应码说明**:
```typescript
enum ReplyCode {
    SUCCESS = 0,           // 操作成功
    FAILED = 1,            // 操作失败
    INVALID = 2,           // 无效操作
    FORBIDDEN = 3,         // 操作被禁止
    TIMEOUT = 4            // 操作超时
}
```

```typescript
// 响应成功
await bot.botService.replyAction(action_id, 0)

// 响应失败
await bot.botService.replyAction(action_id, 1)

// 使用枚举
import { ActionNoticeEvent } from 'qq-official-bot'
await bot.botService.replyAction(action_id, ActionNoticeEvent.ReplyCode.SUCCESS)
```

## 🔗 机器人生命周期

### 启动机器人

启动机器人并建立与 QQ 服务器的连接。

**方法名**: `bot.start()`

```typescript
await bot.start()
console.log('机器人启动成功')

// 监听启动事件
bot.on('ready', () => {
    console.log(`机器人 ${bot.nickname} 已上线`)
})
```

### 停止机器人

停止机器人并断开与 QQ 服务器的连接。

**方法名**: `bot.stop()`

```typescript
await bot.stop()
console.log('机器人已停止')

// 监听停止事件
bot.on('offline', () => {
    console.log('机器人已下线')
})
```

## 🔧 工具方法

### 配置定义

使用类型安全的配置定义。

**方法名**: `defineConfig(config)`

```typescript
import { defineConfig, ReceiverMode } from 'qq-official-bot'

const config = defineConfig({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    mode: ReceiverMode.WEBSOCKET,
    intents: ['GUILD_MESSAGES'],
    sandbox: false,
    logLevel: 'info',
})

const bot = new Bot(config)
```

### 创建机器人实例

快速创建机器人实例的工厂方法。

**方法名**: `createBot(config)`

```typescript
import { createBot, ReceiverMode } from 'qq-official-bot'

const bot = createBot({
    appid: 'your_app_id',
    secret: 'your_app_secret',
    mode: ReceiverMode.WEBSOCKET,
    intents: ['GUILD_MESSAGES'],
})

await bot.start()
```

## 📊 状态信息

### 获取连接状态

获取机器人的当前连接状态。

```typescript
// 获取机器人 ID
console.log('机器人 ID:', bot.self_id)

// 获取机器人昵称
console.log('机器人昵称:', bot.nickname)

// 获取连接状态
console.log('连接状态:', bot.status)

// 检查是否在线
const isOnline = bot.status === 1
```

### 日志管理

机器人内置了完整的日志系统。

```typescript
// 设置日志级别
bot.logger.level = 'debug'

// 输出不同级别的日志
bot.logger.trace('追踪信息')
bot.logger.debug('调试信息')
bot.logger.info('一般信息')
bot.logger.warn('警告信息')
bot.logger.error('错误信息')
```

## ⚠️ 注意事项

1. **异步操作**: 所有 API 方法都是异步的，请使用 `await` 或 `.then()` 处理
2. **错误处理**: 建议使用服务模块的方法，它们提供统一的错误处理
3. **文件限制**: 文件上传有大小限制，请查阅官方文档了解具体限制
4. **生命周期**: 确保在适当的时机调用 `start()` 和 `stop()` 方法
