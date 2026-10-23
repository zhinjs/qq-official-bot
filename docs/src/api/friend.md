# 好友/私聊 API

私聊消息相关的 API 操作，包括私聊消息发送、消息管理等功能。

::: tip 权限要求
需要机器人拥有私聊权限和相应的 Intent 配置
:::

## 📱 私聊消息管理

### 发送私聊消息

向指定用户发送私聊消息。

**方法名**: `bot.user(userId).send(message, source?, options?)` / `bot.sendPrivateMessage(userId, message, source?, options?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `userId` | `string` | ✅ | 用户 ID |
| `message` | `Sendable` | ✅ | 消息内容 |
| `source` | `Quotable` | ❌ | 引用消息 |
| `options` | `SendOptions` | ❌ | `msgSeq` 指定消息序号，`timeout` 设置发送超时；详见[发送选项](./common.md#发送选项) |

```typescript
await bot.user(user_id).send('Hello!')

await bot.sendPrivateMessage(user_id, 'Hello, World!')

// 发送富媒体消息
import { segment } from 'qq-official-bot'
await bot.messageService.sendPrivateMessage(user_id, [
    segment.text('这是一张图片:'),
    segment.image('https://example.com/image.jpg')
])

// 回复私聊消息
await bot.messageService.sendPrivateMessage(user_id, '这是回复', {
    message_id: original_message_id
})
```

### 撤回私聊消息

撤回指定的私聊消息。

**方法名**: `bot.messageService.recallPrivateMessage(userId, messageId)` / `bot.recallPrivateMessage(userId, messageId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `userId` | `string` | ✅ | 用户 ID |
| `messageId` | `string` | ✅ | 消息 ID |

```typescript
// 使用服务模块（推荐）
const result = await bot.messageService.recallPrivateMessage(user_id, message_id)
if (result.success) {
    console.log('私聊消息撤回成功')
}

// 使用传统方法（向后兼容）
const success = await bot.recallPrivateMessage(user_id, message_id)
```

### 流式发送私聊消息

仅单聊可用，群聊不支持。每个分片共用 `stream_msg_id`，`index` 从 0 递增；首片由服务端返回 `id`，后续分片必须带上。

官方文档：[流式发送单聊消息](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_stream_messages.post.html)

**方法名**: `bot.createPrivateStream(userId, options?)` / `bot.sendPrivateStream(userId, chunks, options?)` / `bot.sendPrivateStreamMessage(userId, payload)`

```typescript
bot.on('message.private', async (event) => {
    const stream = event.replyStream({
        contentType: 'markdown',
        inputMode: 'replace',
    })

    await stream.write('正在生成回答，请稍候')
    await stream.write('。目前已完成大部分内容')
    await stream.end('，以下是最终结果。')
})

// 直接消费 LLM token 流
await bot.sendPrivateStream(user_id, tokenIterator, {
    source: event,
    contentType: 'markdown',
    inputMode: 'replace',
})
```

`replace` 模式下 SDK 会把已下发前缀拼成全文再发，满足官方「须以上游已下发前缀开头」的约束。`append` 则每次只下发本次新增文本。

底层也可自己控分片：

```typescript
const first = await bot.sendPrivateStreamMessage(user_id, {
    input_mode: 'replace',
    input_state: 1,
    index: 0,
    content_type: 'markdown',
    content_raw: '正在生成回答，请稍候',
    msg_id: event.id,
    msg_seq: 1,
})

await bot.sendPrivateStreamMessage(user_id, {
    input_mode: 'replace',
    input_state: 10,
    index: 1,
    content_type: 'markdown',
    content_raw: '正在生成回答，请稍候。目前已完成全部内容。',
    msg_id: event.id,
    stream_msg_id: first.id,
    msg_seq: 1,
})
```

| 字段 | 说明 |
|------|------|
| `input_mode` | `append`（默认）拼接增量；`replace` 下发当前全文 |
| `input_state` | `1` 生成中，`10` 生成结束 |
| `content_type` | `text` 或 `markdown` |
| `is_wakeup` | `true` 时不校验 `msg_id` / `event_id` 有效期 |

## 🎯 私聊消息类型

### 文本消息

```typescript
// 纯文本
await bot.messageService.sendPrivateMessage(user_id, 'Hello World!')

// 带格式文本
await bot.messageService.sendPrivateMessage(user_id, '**粗体** 和 *斜体* 文本')
```

### 富媒体消息

```typescript
import { segment } from 'qq-official-bot'

// 图片消息
await bot.messageService.sendPrivateMessage(user_id, 
    segment.image('https://example.com/image.jpg')
)

// 语音消息
await bot.messageService.sendPrivateMessage(user_id,
    segment.record('https://example.com/audio.mp3')
)

// 视频消息
await bot.messageService.sendPrivateMessage(user_id,
    segment.video('https://example.com/video.mp4')
)

// 混合消息
await bot.messageService.sendPrivateMessage(user_id, [
    segment.text('用户资料:'),
    segment.image('https://example.com/avatar.jpg'),
    segment.text('\n欢迎使用我们的服务!')
])
```

### 卡片消息

```typescript
// Ark 消息（JSON 卡片）
await bot.messageService.sendPrivateMessage(user_id, {
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
await bot.messageService.sendPrivateMessage(user_id, {
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

### 监听私聊事件

```typescript
// 监听私聊消息
bot.on('message.private', async (event) => {
    console.log('收到私聊:', event.raw_message)
    console.log('发送者:', event.sender.user_name)
    console.log('用户 ID:', event.user_id)
    
    // 自动回复
    await event.reply('收到你的私聊了!')
})

// 监听好友消息
bot.on('message.private.friend', async (event) => {
    console.log('收到好友消息:', event.raw_message)
    await event.reply('Hello, my friend!')
})
```

### 私聊消息过滤

```typescript
// 只处理特定用户的私聊
bot.on('message.private', async (event) => {
    if (event.user_id === target_user_id) {
        await event.reply('这是来自指定用户的私聊')
    }
})

// 过滤机器人消息
bot.on('message.private', async (event) => {
    if (event.sender.user_id === bot.self_id) return // 忽略自己的消息
    
    await event.reply('只回复其他用户的私聊')
})
```

## 📊 TypeScript 接口

```typescript
// 私聊消息事件接口
interface PrivateMessageEvent extends Message {
    message_type: 'private'
    sub_type: 'friend' | 'temp' | 'direct'
    user_id: string
    sender: {
        user_id: string
        user_name: string
        permissions: string[]
    }
    
    // 方法
    reply(message: Sendable): Promise<any>
    recall(): Promise<boolean>
}

// 服务方法返回类型
interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: {
        code: number
        message: string
    }
}
```

## ⚠️ 注意事项

1. **权限要求**: 发送私聊需要相应的 Intent 权限配置
2. **频率限制**: 私聊有发送频率限制，请合理控制发送速度
3. **消息类型**: 不同平台支持的私聊消息类型可能有差异
4. **用户关系**: 某些情况下需要先建立好友关系才能发送私聊
5. **机器人限制**: 部分机器人类型可能无法主动发起私聊
6. **消息长度**: 私聊消息有长度限制，超长消息会被截断

## 📚 相关链接

- [QQ 机器人私聊 API 文档](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/private/)
- [消息格式参考](../interface/index.md#消息类型)
- [权限配置指南](../config.md#intent-配置)
