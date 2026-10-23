---
layout: doc
---

# 频道私信 API

频道私信相关的 API 操作，包括私信会话创建、消息发送、消息管理等功能。

## 💬 私信会话管理

### 创建频道私信会话

在指定频道中与用户创建私信会话。

**方法名**: `bot.messageService.createDirectSession(guildId, userId)` / `bot.createDirectSession(guildId, userId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `userId` | `string` | ✅ | 用户 ID |

```typescript
// 使用服务模块（推荐）
const result = await bot.messageService.createDirectSession(guild_id, user_id)
if (result.success) {
    console.log('私信会话信息:', result.data)
}

// 使用传统方法（向后兼容）
const dms = await bot.createDirectSession(guild_id, user_id)
```

**返回数据结构**:
```typescript
interface DMS {
    guild_id: string        // 频道 ID
    channel_id: string      // 私信频道 ID
    create_time: string     // 创建时间
}
```

## 📝 私信消息管理

### 发送频道私信

向指定用户发送频道私信。

**方法名**: `bot.direct(guildId).send(message, source?, options?)` / `bot.sendDirectMessage(guildId, message, source?, options?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `message` | `Sendable` | ✅ | 消息内容 |
| `source` | `Quotable` | ❌ | 引用消息 |
| `options` | `SendOptions` | ❌ | `msgSeq` 指定消息序号，`timeout` 设置发送超时；详见[发送选项](./common.md#发送选项) |

```typescript
await bot.direct(guild_id).send('Hello, 这是一条私信!')

// 发送富媒体私信
import { segment } from 'qq-official-bot'
await bot.messageService.sendDirectMessage(guild_id, [
    segment.text('私信中的图片:'),
    segment.image('https://example.com/image.jpg')
])

// 回复私信
await bot.messageService.sendDirectMessage(guild_id, '这是回复', {
    message_id: original_message_id
})
```

### 获取频道私信

获取指定的频道私信内容。

**方法名**: `bot.messageService.getDirectMessage(guildId, messageId)` / `bot.getDirectMessage(guildId, messageId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `messageId` | `string` | ✅ | 消息 ID |

```typescript
const result = await bot.messageService.getDirectMessage(guild_id, message_id)
if (result.success) {
    console.log('私信内容:', result.data)
}
```

### 撤回频道私信

撤回指定的频道私信。

**方法名**: `bot.messageService.recallDirectMessage(guildId, messageId, hideWarning?)` / `bot.recallDirectMessage(guildId, messageId, hideWarning?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `messageId` | `string` | ✅ | 消息 ID |
| `hideWarning` | `boolean` | ❌ | 是否隐藏撤回提示 |

```typescript
// 撤回私信
await bot.messageService.recallDirectMessage(guild_id, message_id)

// 撤回私信并隐藏提示
await bot.messageService.recallDirectMessage(guild_id, message_id, true)
```

## 🎯 私信消息类型

### 文本消息

```typescript
// 纯文本
await bot.messageService.sendDirectMessage(guild_id, 'Hello World!')

// 带格式文本
await bot.messageService.sendDirectMessage(guild_id, '**粗体** 和 *斜体* 文本')
```

### 富媒体消息

```typescript
import { segment } from 'qq-official-bot'

// 图片消息
await bot.messageService.sendDirectMessage(guild_id, 
    segment.image('https://example.com/image.jpg')
)

// 语音消息
await bot.messageService.sendDirectMessage(guild_id,
    segment.record('https://example.com/audio.mp3')
)

// 视频消息
await bot.messageService.sendDirectMessage(guild_id,
    segment.video('https://example.com/video.mp4')
)

// 混合消息
await bot.messageService.sendDirectMessage(guild_id, [
    segment.text('用户资料:'),
    segment.image('https://example.com/avatar.jpg'),
    segment.text('\n欢迎加入我们的频道!')
])
```

### 卡片消息

```typescript
// Ark 消息（JSON 卡片）
await bot.messageService.sendDirectMessage(guild_id, {
    ark: {
        template_id: 23,
        kv: [
            { key: 'title', value: '卡片标题' },
            { key: 'desc', value: '卡片描述' },
            { key: 'img', value: 'https://example.com/image.jpg' }
        ]
    }
})

// Embed 消息
await bot.messageService.sendDirectMessage(guild_id, {
    embed: {
        title: '嵌入消息标题',
        description: '这是一条嵌入消息',
        color: 0xFF0000,
        fields: [
            { name: '字段1', value: '值1' },
            { name: '字段2', value: '值2' }
        ]
    }
})
```

## 🔗 事件处理

### 监听私信事件

```typescript
// 监听私信消息
bot.on('direct.message', async (event) => {
    console.log('收到私信:', event.content)
    console.log('发送者:', event.author.username)
    console.log('频道 ID:', event.guild_id)
    
    // 自动回复
    await event.reply('收到你的私信了!')
})

// 监听私信消息撤回
bot.on('direct.message.delete', async (event) => {
    console.log('私信被撤回:', event.message.id)
})
```

### 私信消息过滤

```typescript
// 只处理特定频道的私信
bot.on('direct.message', async (event) => {
    if (event.guild_id === target_guild_id) {
        await event.reply('这是来自指定频道的私信')
    }
})

// 过滤机器人消息
bot.on('direct.message', async (event) => {
    if (event.author.bot) return // 忽略机器人消息
    
    await event.reply('只回复真实用户的私信')
})
```

## ⚠️ 注意事项

1. **权限要求**: 发送私信需要 `DIRECT_MESSAGE` intent 权限
2. **会话创建**: 首次发送私信前需要先创建私信会话
3. **频率限制**: 私信有发送频率限制，请合理控制发送速度
4. **消息类型**: 私信支持的消息类型可能与频道消息有所不同
5. **用户同意**: 只能向已经在频道中的用户发送私信
6. **机器人限制**: 某些类型的机器人可能无法发送私信，请查阅官方文档

## 📚 相关链接

- [QQ 机器人私信 API 文档](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/dms/)
- [消息格式参考](../interface/index.md#消息类型)
