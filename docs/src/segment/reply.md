---
layout: doc
---

# 回复消息段

回复消息段用于回复特定的消息，形成对话的上下文关联。

## 类型定义

```typescript
interface ReplyElement {
  type: 'reply'
  id?: string
  event_id?: string
  ref_idx?: string
}
```

## 参数说明

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | string | ✅ | 消息段类型，固定为 `reply` |
| id | string | ❌ | 被回复消息的 ID |
| event_id | string | ❌ | 被回复事件的 ID |
| ref_idx | string | ❌ | 单聊/群聊引用索引（`REFIDX_…`），用于以引用形式展示 |

::: tip 参数说明
- 使用 `id` 来被动回复具体的消息（`msg_id`）
- 使用 `event_id` 来被动回复特定的事件
- 单聊/群聊中 `msg_id` 与 `event_id` 二选一，同时提供时 SDK 只发送 `msg_id`
:::

## 单聊 / 群聊的引用回复

按[官方文档](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html)，单聊/群聊的引用展示（`message_reference`）需要使用 **REFIDX 引用索引**，而不是 `ROBOT1.0_` 开头的消息 ID：

- 用户发的消息：取消息事件的 `event.msg_idx`（来自 `message_scene.ext` 中的 `msg_idx`）
- 机器人自己发的消息：取发送结果的 `result.ref_idx`（来自响应 `ext_info.ref_idx`）

```typescript
bot.on('message.private.friend', async (event) => {
  // 传入事件对象：SDK 同时设置被动回复 msg_id 与引用索引 event.msg_idx
  await event.reply([segment.reply(event), '收到！'])
})

// 引用机器人自己的消息
const sent = await bot.sendPrivateMessage(user_openid, '第一条')
await bot.sendPrivateMessage(user_openid, [segment.reply(sent.ref_idx!), '补充说明'])
```

收到的引用消息（`event.content_type === 103`）会在 `event.ref_msg_idx` 与 `event.source.id` 中给出被引用消息的索引，被引用内容见 `event.msg_elements`。

## 使用示例

### 基础回复

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 回复特定消息
await bot.sendGuildMessage(channelId, [
  segment.reply('message_id_123'),
  segment.text('收到了，谢谢！')
])
```

### 传入 Quotable 对象回复

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// segment.reply 接收消息 ID 字符串或 Quotable 对象（id / event_id / ref_idx）
await bot.sendGuildMessage(channelId, [
  segment.reply({ id: 'message_id_123' }),
  segment.text('这是我的回复内容')
])

// 在事件回调中可直接传入事件对象
bot.on('message.guild', async (event) => {
  await event.reply([segment.reply(event), segment.text('收到')])
})
```

### 回复与@组合

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 回复消息并@发送者
await bot.sendGuildMessage(channelId, [
  segment.reply('message_id_123'),
  segment.at('user_456'),
  segment.text(' 你说得对！')
])
```

### 回复并发送图片

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 回复消息并发送图片
await bot.sendGuildMessage(channelId, [
  segment.reply('message_id_123'),
  segment.text('看看这个：'),
  segment.image('./photo.jpg')
])
```

## 在事件处理中使用

### 自动回复消息

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 监听消息并自动回复
bot.on('message.guild', async (event) => {
  const content = event.content?.toLowerCase()
  
  if (content?.includes('你好')) {
    await bot.sendGuildMessage(event.channel_id, [
      segment.reply(event.id),
      segment.text('你好！很高兴见到你 '),
      segment.face(14) // 微笑表情
    ])
  }
})
```

### 智能问答回复

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 问答系统
const qaDatabase: Record<string, string> = {
  '天气怎么样': '今天天气很好，适合出门',
  '时间': '现在时间是 ' + new Date().toLocaleString(),
  '帮助': '我可以回答各种问题，试试问我关于天气、时间等'
}

bot.on('message.guild', async (event) => {
  const content = event.content?.trim()
  
  if (content && qaDatabase[content]) {
    await bot.sendGuildMessage(event.channel_id, [
      segment.reply(event.id),
      segment.text(qaDatabase[content])
    ])
  }
})
```

### 回复链式对话

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 跟踪对话历史
const conversationHistory = new Map<string, string[]>()

bot.on('message.guild', async (event) => {
  const userId = event.author.id
  const content = event.content
  
  if (!content) return
  
  // 获取用户对话历史
  const history = conversationHistory.get(userId) || []
  history.push(content)
  
  // 保持最近5条对话
  if (history.length > 5) {
    history.shift()
  }
  conversationHistory.set(userId, history)
  
  // 根据对话历史智能回复
  if (content.includes('之前说什么')) {
    const previousMessage = history[history.length - 2]
    
    await bot.sendGuildMessage(event.channel_id, [
      segment.reply(event.id),
      segment.text(`你之前说的是: "${previousMessage || '暂无历史记录'}"`)
    ])
  }
})
```

## 在不同服务中使用

### 群聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 群聊中回复消息
await bot.sendGroupMessage(groupId, [
  segment.reply('message_id_123'),
  segment.text('群友说得对！')
])

// 群聊管理回复
bot.on('message.group', async (event) => {
  if (event.content?.includes('违规')) {
    await bot.sendGroupMessage(event.group_id, [
      segment.reply(event.id),
      segment.text('请注意群规，文明交流')
    ])
  }
})
```

### 私聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 私聊中回复消息
await bot.sendPrivateMessage(userId, [
  segment.reply('message_id_123'),
  segment.text('明白了，我会处理的')
])

// 私聊客服回复
bot.on('message.private', async (event) => {
  if (event.content?.includes('咨询')) {
    await bot.sendPrivateMessage(event.user_id, [
      segment.reply(event.id),
      segment.text('请问有什么可以帮您的吗？')
    ])
  }
})
```

### 频道服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 频道中回复消息
await bot.sendGuildMessage(channelId, [
  segment.reply('message_id_123'),
  segment.text('感谢分享！')
])

// 频道互动回复
bot.on('message.guild', async (event) => {
  if (event.content?.includes('签到')) {
    await bot.sendGuildMessage(event.channel_id, [
      segment.reply(event.id),
      segment.text('签到成功！'),
      segment.face(76) // 点赞
    ])
  }
})
```

## 高级回复功能

### 条件回复

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 根据用户权限回复
async function conditionalReply(event: any, message: string) {
  // sender.permissions 含成员身份组 ID：2 管理员，4 频道主，5 子频道管理员
  const isAdmin = event.sender.permissions.some((role: unknown) => ['2', '4', '5'].includes(String(role)))
  
  if (isAdmin) {
    await bot.sendGuildMessage(event.channel_id, [
      segment.reply(event.id),
      segment.text(`管理员您好！${message}`)
    ])
  } else {
    await bot.sendGuildMessage(event.channel_id, [
      segment.reply(event.id),
      segment.text(message)
    ])
  }
}
```

### 延迟回复

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 延迟几秒后回复
async function delayedReply(channelId: string, messageId: string, content: string, delay: number) {
  setTimeout(async () => {
    await bot.sendGuildMessage(channelId, [
      segment.reply(messageId),
      segment.text(content)
    ])
  }, delay * 1000)
}

// 使用示例
bot.on('message.guild', async (event) => {
  if (event.content?.includes('思考')) {
    await delayedReply(event.channel_id, event.id, '我想到了一个好主意！', 3)
  }
})
```

### 多条回复

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 分多条消息回复
async function multiPartReply(channelId: string, messageId: string, parts: string[]) {
  for (let i = 0; i < parts.length; i++) {
    await bot.sendGuildMessage(channelId, [
      i === 0 ? segment.reply(messageId) : null,
      segment.text(`${i + 1}. ${parts[i]}`)
    ].filter(Boolean))
    
    // 间隔发送
    if (i < parts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

// 使用示例
const steps = [
  '首先打开应用',
  '然后找到设置页面',
  '最后修改相关配置'
]

await multiPartReply(channelId, messageId, steps)
```

### 回复消息统计

```typescript
class ReplyTracker {
  private replyCount = new Map<string, number>()
  private userReplies = new Map<string, string[]>()
  
  trackReply(userId: string, messageId: string) {
    // 统计用户回复次数
    const count = this.replyCount.get(userId) || 0
    this.replyCount.set(userId, count + 1)
    
    // 记录用户回复的消息
    const replies = this.userReplies.get(userId) || []
    replies.push(messageId)
    this.userReplies.set(userId, replies)
  }
  
  getUserReplyCount(userId: string): number {
    return this.replyCount.get(userId) || 0
  }
  
  getMostActiveUsers(limit: number = 5): Array<{userId: string, count: number}> {
    return Array.from(this.replyCount.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }
}

const replyTracker = new ReplyTracker()

bot.on('message.guild', async (event) => {
  // 检查是否包含回复
  const hasReply = event.message_reference?.message_id
  
  if (hasReply) {
    replyTracker.trackReply(event.author.id, event.id)
  }
})
```

## 回复消息验证

### 检查消息是否存在

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

async function safeReply(channelId: string, replyToId: string, content: string) {
  try {
    // 尝试获取被回复的消息
    const originalMessage = await bot.getGuildMessage(channelId, replyToId)
    
    if (originalMessage) {
      await bot.sendGuildMessage(channelId, [
        segment.reply(replyToId),
        segment.text(content)
      ])
    } else {
      // 消息不存在，发送普通消息
      await bot.sendGuildMessage(channelId, [
        segment.text(content)
      ])
    }
  } catch (error) {
    console.error('回复消息失败:', error)
    
    // 回退到普通消息
    await bot.sendGuildMessage(channelId, [
      segment.text(content)
    ])
  }
}
```

### 回复权限检查

```typescript
async function checkReplyPermission(userId: string, channelId: string): Promise<boolean> {
  try {
    const { permissions } = await bot.getChannelMemberPermission(channelId, userId)
    // 子频道权限位：1 可查看，2 可管理，4 可发言
    return (Number(permissions) & 4) !== 0
  } catch (error) {
    return false
  }
}

bot.on('message.guild', async (event) => {
  const canReply = await checkReplyPermission(bot.config.app_id, event.channel_id)
  
  if (canReply && event.content?.includes('求助')) {
    await bot.sendGuildMessage(event.channel_id, [
      segment.reply(event.id),
      segment.text('我来帮您！请详细描述问题。')
    ])
  }
})
```

## 最佳实践

### 回复内容相关性

```typescript
// ✅ 好的做法 - 回复内容与原消息相关
bot.on('message.guild', async (event) => {
  if (event.content?.includes('天气')) {
    await bot.sendGuildMessage(event.channel_id, [
      segment.reply(event.id),
      segment.text('今天天气很好，适合外出活动')
    ])
  }
})

// ❌ 避免的做法 - 回复内容与原消息无关
bot.on('message.guild', async (event) => {
  await bot.sendGuildMessage(event.channel_id, [
    segment.reply(event.id),
    segment.text('随机回复内容') // 与原消息无关
  ])
})
```

### 避免回复循环

```typescript
const recentReplies = new Set<string>()

bot.on('message.guild', async (event) => {
  // 避免回复机器人自己的消息
  if (event.author.bot) return
  
  // 避免短时间内重复回复
  const key = `${event.channel_id}:${event.author.id}`
  if (recentReplies.has(key)) return
  
  recentReplies.add(key)
  setTimeout(() => recentReplies.delete(key), 30000) // 30秒后允许再次回复
  
  if (event.content?.includes('帮助')) {
    await bot.sendGuildMessage(event.channel_id, [
      segment.reply(event.id),
      segment.text('有什么可以帮助您的吗？')
    ])
  }
})
```

## 组合规则

回复消息段可以与以下消息段组合使用：

- ✅ **文本消息段** - 最常见的组合
- ✅ **@消息段** - 回复并@用户
- ✅ **图片消息段** - 回复并发送图片
- ✅ **视频消息段** - 回复并发送视频
- ✅ **音频消息段** - 回复并发送语音
- ✅ **表情消息段** - 回复并发送表情
- ✅ **其他所有消息段** - 回复可以与任何内容组合

## 限制说明

1. **不可单独发送**：回复消息段必须与其他消息段组合使用
2. **消息存在性**：被回复的消息必须存在且可访问
3. **权限要求**：需要有发送消息的权限
4. **消息ID有效性**：回复的消息 ID 必须是有效的
5. **时效性**：过旧的消息可能无法回复
6. **每条消息限制**：一条消息中只能包含一个回复消息段
