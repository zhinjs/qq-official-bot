---
layout: doc
---

# @消息段

@消息段用于在消息中@（提及）特定用户，让用户收到通知。本项目提供了基于segment的抽象封装，底层会自动转换为QQ官方API要求的格式。

## 类型定义

```typescript
interface AtElement {
  type: 'at'
  user_id: string | 'all'
}
```

## 参数说明

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | string | ✅ | 消息段类型，固定为 `at` |
| user_id | string \| 'all' | ✅ | 用户 ID，支持 QQ 号、频道用户 ID 或特殊值 |

## 特殊用户 ID

| 用户 ID | 说明 | 转换后格式 |
|---------|------|----------|
| `all` | @全体成员（群聊需管理员权限，每群每天 1 次） | `<qqbot-at-everyone />` |
| 具体用户ID | @特定用户 | `<@用户ID>` |

## 底层实现

本项目会自动将segment格式转换为QQ官方API格式：

```typescript
// segment使用方式
segment.at('123456789')

// 底层转换为官方API格式
{
  "content": "<@123456789>hello world"
}

// @全体成员的转换
segment.at('all')
// 转换为
{
  "content": "<qqbot-at-everyone />hello world"
}
```

## 使用示例

### @特定用户

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// @单个用户
await bot.client.sendMessage(channelId, [
  segment.at('123456789'),
  segment.text(' 你好！')
])
// 实际发送: { "content": "<@123456789> 你好！" }
```

### @全体成员

群聊的文本、Markdown 均支持原生标记 `<qqbot-at-everyone />`。机器人必须为该群管理员，每个群每天仅可发送 1 次；权限和配额由 QQ 平台校验，SDK 不自动重试。参见[官方变更记录](https://bot.q.qq.com/wiki/develop/api-v2/changelog.html#_20261026)。

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 文本中 @全体成员
await bot.sendGroupMessage(group_id, [
  segment.at('all'),
  segment.text(' 重要通知：明天休息！')
])
// 实际发送: { "content": "<qqbot-at-everyone /> 重要通知：明天休息！" }

// 也可在原始文本中使用官方标记
await bot.sendGroupMessage(group_id, '<qqbot-at-everyone /> 请查看公告')

// Markdown 中把标记直接写入 markdown.content
await bot.sendGroupMessage(group_id, segment.markdown(
  '<qqbot-at-everyone />\n## 重要通知\n请查看公告',
))
```

以上为不同发送方式示例，不表示同一天可以在同一群发送多次。

### @多个用户

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// @多个用户
await bot.client.sendMessage(channelId, [
  segment.at('123456789'),
  segment.text(' '),
  segment.at('987654321'),
  segment.text(' 你们两个来一下')
])
// 实际发送: { "content": "<@123456789> <@987654321> 你们两个来一下" }

// 或者使用循环
const userIds = ['123456789', '987654321', '111222333']
const atElements = userIds.map(id => segment.at(id))

await bot.client.sendMessage(channelId, [
  ...atElements,
  segment.text(' 大家一起讨论这个问题')
])
// 实际发送: { "content": "<@123456789><@987654321><@111222333> 大家一起讨论这个问题" }
```

## 在不同服务中使用

### 群聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 群聊中@用户
await bot.groupService.sendMessage(groupId, [
  segment.at('123456789'),
  segment.text(' 群友你好！')
])

// @群管理员
await bot.groupService.sendMessage(groupId, [
  segment.at('admin_user_id'),
  segment.text(' 管理员请处理举报')
])
```

### 私聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 私聊中一般不使用@，但在某些情况下可能有用
await bot.friendService.sendMessage(userId, [
  segment.text('转发消息：'),
  segment.at('original_sender_id'),
  segment.text(' 说了这句话')
])
```

### 频道服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 频道中@用户
await bot.guildService.sendChannelMessage(channelId, [
  segment.at('user_id'),
  segment.text(' 欢迎加入频道！')
])

// 频道公告@全体
await bot.guildService.sendChannelMessage(channelId, [
  segment.at('all'),
  segment.text(' 频道规则更新，请查看置顶消息')
])
```

## 高级用法

### 基于事件的@回复

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 监听消息事件并@发送者
bot.on('message.guild', async (event) => {
  if (event.content === 'ping') {
    await bot.guildService.sendChannelMessage(event.channel_id, [
      segment.at(event.author.id),
      segment.text(' pong!')
    ])
  }
})
```

### 权限检查的@全体

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

async function sendAtAllMessage(channelId: string, message: string) {
  try {
    // 检查是否有@全体权限
    const permissions = await bot.guildService.getChannelPermissions(channelId)
    
    if (permissions.mention_everyone) {
      await bot.guildService.sendChannelMessage(channelId, [
        segment.at('all'),
        segment.text(` ${message}`)
      ])
    } else {
      console.log('没有@全体成员的权限')
      await bot.guildService.sendChannelMessage(channelId, [
        segment.text(message)
      ])
    }
  } catch (error) {
    console.error('发送@全体消息失败:', error)
  }
}
```

### 批量@用户

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

async function mentionMultipleUsers(channelId: string, userIds: string[], message: string) {
  // 构建@消息
  const mentions = []
  
  for (const userId of userIds) {
    mentions.push(segment.at(userId))
    mentions.push(segment.text(' '))
  }
  
  mentions.push(segment.text(message))
  
  await bot.client.sendMessage(channelId, mentions)
}

// 使用示例
await mentionMultipleUsers(channelId, ['123', '456', '789'], '请参加会议')
```

### 智能@用户

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 根据用户在当前频道状态@用户
async function smartMention(channelId: string, userId: string, message: string) {
  try {
    // 检查用户是否在当前频道/群组中
    const memberInfo = await bot.client.getChannelMember(channelId, userId)
    
    if (memberInfo) {
      // 用户在频道中，可以@
      await bot.client.sendMessage(channelId, [
        segment.at(userId),
        segment.text(` ${message}`)
      ])
      // 实际发送: { "content": "<@用户ID> 消息内容" }
    } else {
      // 用户不在频道中，发送普通消息
      await bot.client.sendMessage(channelId, [
        segment.text(`消息给 ${userId}: ${message}（用户不在当前频道）`)
      ])
    }
  } catch (error) {
    // 获取用户信息失败，仍然尝试@
    console.warn('获取用户信息失败，尝试直接@:', error)
    await bot.client.sendMessage(channelId, [
      segment.at(userId),
      segment.text(` ${message}`)
    ])
  }
}

### 条件@消息

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 根据时间决定是否@全体
async function timeBasedMention(channelId: string, message: string) {
  const now = new Date()
  const hour = now.getHours()
  
  // 工作时间(9-18点)才@全体，避免打扰
  if (hour >= 9 && hour <= 18) {
    await bot.client.sendMessage(channelId, [
      segment.at('all'),
      segment.text(` ${message}`)
    ])
    // 实际发送: { "content": "<qqbot-at-everyone /> 消息内容" }
  } else {
    await bot.client.sendMessage(channelId, [
      segment.text(`🔔 ${message} (非工作时间，未@全体)`)
    ])
  }
}

// 根据消息重要程度决定@范围
async function priorityBasedMention(channelId: string, message: string, priority: 'low' | 'normal' | 'high') {
  const elements = []
  
  switch (priority) {
    case 'high':
      elements.push(segment.at('all'))
      elements.push(segment.text(' 🚨 '))
      break
    case 'normal':
      // 普通消息不@任何人
      break
    case 'low':
      // 低优先级消息不@
      break
  }
  
  elements.push(segment.text(message))
  await bot.client.sendMessage(channelId, elements)
}

### @消息的防滥用

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// @消息频率控制
const mentionCooldown = new Map<string, number>()

async function rateLimitedMention(channelId: string, userId: string, message: string) {
  const cooldownKey = `${channelId}:${userId}`
  const now = Date.now()
  const lastMention = mentionCooldown.get(cooldownKey) || 0
  
  // 防止30秒内重复@同一用户
  if (now - lastMention < 30000) {
    console.log('@消息发送过于频繁，已跳过')
    return
  }
  
  await bot.client.sendMessage(channelId, [
    segment.at(userId),
    segment.text(` ${message}`)
  ])
  
  mentionCooldown.set(cooldownKey, now)
}
```

## @消息的过滤和处理

### 检测消息中的@

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

bot.on('message.guild', async (event) => {
  // 检查消息是否@了机器人
  const botMentioned = event.mentions?.some(mention => 
    mention.id === bot.config.app_id
  )
  
  if (botMentioned) {
    console.log('机器人被@了')
    
    // 回复@消息
    await bot.guildService.sendChannelMessage(event.channel_id, [
      segment.at(event.author.id),
      segment.text(' 我收到了你的@消息！')
    ])
    // 实际发送: { "content": "<@发送者ID> 我收到了你的@消息！" }
  }
})

// 解析收到的消息中的@信息
bot.on('message.guild', async (event) => {
  const content = event.content
  
  // 使用正则表达式提取@用户ID
  const mentionPattern = /<@!?(\d+|everyone)>/g
  const mentions = []
  let match
  
  while ((match = mentionPattern.exec(content)) !== null) {
    mentions.push(match[1]) // 提取用户ID
  }
  
  if (mentions.length > 0) {
    console.log('消息中@了这些用户:', mentions)
  }
})
```

### 提取@的用户列表

```typescript
// 从消息段中提取@用户
function extractMentions(elements: any[]): string[] {
  return elements
    .filter(element => element.type === 'at')
    .map(element => element.user_id)
}

// 从消息内容中提取@用户
function extractMentionsFromContent(content: string): string[] {
  const mentionPattern = /<@!?(\d+|everyone)>/g
  const mentions = []
  let match
  
  while ((match = mentionPattern.exec(content)) !== null) {
    mentions.push(match[1])
  }
  
  return mentions
}

// 使用示例
const userIds = extractMentions(messageElements)
console.log('被@的用户:', userIds)

const contentMentions = extractMentionsFromContent('<@123456> <@everyone> 大家好')
console.log('内容中的@:', contentMentions) // ['123456', 'everyone']
```

### @消息统计和分析

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// @消息统计
const mentionStats = {
  total: 0,
  byUser: new Map<string, number>(),
  byChannel: new Map<string, number>()
}

bot.on('message.guild', async (event) => {
  const mentions = extractMentionsFromContent(event.content)
  
  if (mentions.length > 0) {
    mentionStats.total++
    
    // 统计频道@次数
    const channelCount = mentionStats.byChannel.get(event.channel_id) || 0
    mentionStats.byChannel.set(event.channel_id, channelCount + 1)
    
    // 统计用户@次数
    const userCount = mentionStats.byUser.get(event.author.id) || 0
    mentionStats.byUser.set(event.author.id, userCount + 1)
  }
})

// 获取@统计报告
function getMentionReport(): string {
  const topChannels = Array.from(mentionStats.byChannel.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    
  const topUsers = Array.from(mentionStats.byUser.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    
  return `@消息统计报告:
总@次数: ${mentionStats.total}
活跃频道: ${topChannels.map(([id, count]) => `${id}(${count}次)`).join(', ')}
活跃用户: ${topUsers.map(([id, count]) => `${id}(${count}次)`).join(', ')}`
}
```

## 最佳实践

### @消息礼仪

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// ✅ 好的做法：礼貌@用户
await bot.client.sendMessage(channelId, [
  segment.at(userId),
  segment.text(' 你好，请问有时间讨论一下项目进展吗？')
])
// 实际发送: { "content": "<@用户ID> 你好，请问有时间讨论一下项目进展吗？" }

// ✅ 好的做法：@时提供上下文
await bot.client.sendMessage(channelId, [
  segment.at(userId),
  segment.text(' 关于昨天提到的API设计问题，我有一些想法想和你交流')
])

// ❌ 避免的做法：重复@骚扰
await bot.client.sendMessage(channelId, [
  segment.at(userId),
  segment.at(userId),
  segment.at(userId),
  segment.text(' 快回复！！！')
])

// ❌ 避免的做法：无意义@
await bot.client.sendMessage(channelId, [
  segment.at(userId),
  segment.text(' .')
])
```

### 避免滥用@全体

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// ✅ 适当使用@全体的场景
const appropriateScenarios = {
  // 重要系统通知
  systemNotice: async (channelId: string, message: string) => {
    await bot.client.sendMessage(channelId, [
      segment.at('all'),
      segment.text(` 🚨 系统通知: ${message}`)
    ])
  },
  
  // 紧急事件
  emergency: async (channelId: string, message: string) => {
    await bot.client.sendMessage(channelId, [
      segment.at('all'),
      segment.text(` ⚠️ 紧急通知: ${message}`)
    ])
  },
  
  // 重要投票或决策
  voting: async (channelId: string, message: string) => {
    await bot.client.sendMessage(channelId, [
      segment.at('all'),
      segment.text(` 📊 重要投票: ${message}`)
    ])
  }
}

// ❌ 避免@全体的场景
const avoidScenarios = [
  '日常聊天',
  '个人分享',
  '非紧急问题',
  '测试消息',
  '重复提醒'
]

// 智能@全体决策
async function smartAtAll(channelId: string, message: string, priority: 'low' | 'normal' | 'high' | 'urgent') {
  const now = new Date()
  const hour = now.getHours()
  
  // 非工作时间只有紧急消息才@全体
  const isWorkingHours = hour >= 9 && hour <= 18
  const shouldAtAll = priority === 'urgent' || (priority === 'high' && isWorkingHours)
  
  if (shouldAtAll) {
    await bot.client.sendMessage(channelId, [
      segment.at('all'),
      segment.text(` ${message}`)
    ])
  } else {
    // 使用其他方式通知
    await bot.client.sendMessage(channelId, [
      segment.text(`📢 ${message}`)
    ])
  }
}
```

### 错误处理和重试

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 带重试的@消息发送
async function sendMentionWithRetry(channelId: string, userId: string, message: string, maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await bot.client.sendMessage(channelId, [
        segment.at(userId),
        segment.text(` ${message}`)
      ])
      
      console.log(`@消息发送成功 (尝试 ${attempt}/${maxRetries})`)
      return true
      
    } catch (error: any) {
      console.error(`@消息发送失败 (尝试 ${attempt}/${maxRetries}):`, error.message)
      
      // 根据错误类型决定是否重试
      if (error.message.includes('user not found')) {
        console.error('用户不存在，停止重试')
        return false
      }
      
      if (error.message.includes('permission denied')) {
        console.error('没有@用户的权限，停止重试')
        return false
      }
      
      if (error.message.includes('rate limit')) {
        // 频率限制，等待后重试
        const delay = Math.pow(2, attempt) * 1000 // 指数退避
        console.log(`频率限制，等待 ${delay}ms 后重试`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // 其他错误，如果还有重试次数就继续
      if (attempt === maxRetries) {
        console.error('达到最大重试次数，放弃发送')
        return false
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  return false
}

// 使用示例
const success = await sendMentionWithRetry(channelId, userId, '你好，有时间吗？')
if (!success) {
  console.log('@消息发送最终失败')
}
```

### 用户体验优化

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// @消息的用户体验优化
class MentionManager {
  private mentionHistory = new Map<string, Date>()
  
  // 检查是否应该@用户（避免频繁打扰）
  shouldMentionUser(userId: string, cooldownMinutes = 30): boolean {
    const lastMention = this.mentionHistory.get(userId)
    if (!lastMention) return true
    
    const now = new Date()
    const timeDiff = now.getTime() - lastMention.getTime()
    const cooldownMs = cooldownMinutes * 60 * 1000
    
    return timeDiff >= cooldownMs
  }
  
  // 记录@用户的时间
  recordMention(userId: string): void {
    this.mentionHistory.set(userId, new Date())
  }
  
  // 智能@用户（带冷却和用户偏好）
  async smartMention(channelId: string, userId: string, message: string, options: {
    respectCooldown?: boolean
    urgency?: 'low' | 'normal' | 'high'
    fallbackToNormal?: boolean
  } = {}): Promise<void> {
    const {
      respectCooldown = true,
      urgency = 'normal',
      fallbackToNormal = true
    } = options
    
    // 检查冷却时间
    if (respectCooldown && urgency !== 'high' && !this.shouldMentionUser(userId)) {
      if (fallbackToNormal) {
        // 发送普通消息而不是@
        await bot.client.sendMessage(channelId, [
          segment.text(`消息给用户 ${userId}: ${message}`)
        ])
        console.log('在冷却期内，发送普通消息替代@')
        return
      } else {
        console.log('在冷却期内，跳过@消息')
        return
      }
    }
    
    try {
      await bot.client.sendMessage(channelId, [
        segment.at(userId),
        segment.text(` ${message}`)
      ])
      
      this.recordMention(userId)
      console.log(`成功@用户 ${userId}`)
      
    } catch (error) {
      console.error('@消息发送失败:', error)
      
      if (fallbackToNormal) {
        // 失败时发送普通消息
        await bot.client.sendMessage(channelId, [
          segment.text(`消息给用户 ${userId}: ${message}`)
        ])
      }
    }
  }
}

// 使用示例
const mentionManager = new MentionManager()

// 普通@消息（会检查冷却时间）
await mentionManager.smartMention(channelId, userId, '有个问题想请教')

// 高优先级@消息（忽略冷却时间）
await mentionManager.smartMention(channelId, userId, '紧急：服务器出现问题', {
  urgency: 'high'
})

// 不使用备选方案的@消息
await mentionManager.smartMention(channelId, userId, '可选消息', {
  fallbackToNormal: false
})
```

## 组合规则

@消息段可以与以下消息段组合使用：

### ✅ 推荐组合

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 与文本消息段组合
await bot.client.sendMessage(channelId, [
  segment.at('123456789'),
  segment.text(' 你好，请查看这个重要信息')
])

// 与图片消息段组合
await bot.client.sendMessage(channelId, [
  segment.at('123456789'),
  segment.text(' 请看这张图片：'),
  segment.image('/path/to/image.jpg')
])

// 与回复消息段组合
await bot.client.sendMessage(channelId, [
  segment.reply(originalMessageId),
  segment.at('123456789'),
  segment.text(' 关于你刚才的问题')
])

// 与表情消息段组合
await bot.client.sendMessage(channelId, [
  segment.at('123456789'),
  segment.text(' '),
  segment.face(1), // 微笑表情
  segment.text(' 早上好！')
])

// 与多个@消息段组合
await bot.client.sendMessage(channelId, [
  segment.at('123456789'),
  segment.text(' '),
  segment.at('987654321'),
  segment.text(' 请参加今天的会议')
])
```

### ⚠️ 条件组合

```typescript
// 与Markdown消息段组合（仅频道支持）
await bot.guildService.sendChannelMessage(channelId, [
  segment.at('123456789'),
  segment.markdown({
    content: '# 重要通知\n请查看新的项目要求'
  })
])

// 与ARK消息段组合（仅频道支持）
await bot.guildService.sendChannelMessage(channelId, [
  segment.at('123456789'),
  segment.ark({
    template_id: 1,
    kv: [{ key: '#DESC#', value: '重要通知' }]
  })
])
```

### ❌ 不建议组合

```typescript
// 避免：单独发送@消息段（缺少内容）
// 这样的消息可能被视为无意义
await bot.client.sendMessage(channelId, [
  segment.at('123456789')
])

// 避免：过多@消息段（可能被视为骚扰）
await bot.client.sendMessage(channelId, [
  segment.at('123456789'),
  segment.at('123456789'),
  segment.at('123456789'),
  segment.text(' 快回复！！！')
])
```

### 组合顺序建议

```typescript
// 建议的消息段顺序
await bot.client.sendMessage(channelId, [
  // 1. 回复段（如果有）
  segment.reply(messageId),
  
  // 2. @消息段
  segment.at('123456789'),
  
  // 3. 主要内容
  segment.text(' 关于项目进展，'),
  
  // 4. 媒体内容（如果有）
  segment.image('/path/to/screenshot.png'),
  
  // 5. 补充文本
  segment.text(' 请查看截图并反馈意见')
])
```

## 性能优化

### 批量@消息的优化

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// ✅ 推荐：单条消息包含所有@
async function efficientBatchMention(channelId: string, userIds: string[], message: string) {
  const elements = []
  
  // 添加所有@消息段
  userIds.forEach((userId, index) => {
    elements.push(segment.at(userId))
    if (index < userIds.length - 1) {
      elements.push(segment.text(' ')) // 在@之间添加空格
    }
  })
  
  elements.push(segment.text(` ${message}`))
  
  // 一次性发送
  await bot.client.sendMessage(channelId, elements)
}

// ❌ 不推荐：多条消息分别发送
async function inefficientBatchMention(channelId: string, userIds: string[], message: string) {
  for (const userId of userIds) {
    await bot.client.sendMessage(channelId, [
      segment.at(userId),
      segment.text(` ${message}`)
    ])
    // 这样会产生多条消息，可能触发频率限制
  }
}
```

### @消息缓存策略

```typescript
class MentionCache {
  private userCache = new Map<string, { isValid: boolean, lastCheck: number }>()
  private cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  
  // 检查用户是否可以被@（带缓存）
  async canMentionUser(channelId: string, userId: string): Promise<boolean> {
    const cacheKey = `${channelId}:${userId}`
    const cached = this.userCache.get(cacheKey)
    const now = Date.now()
    
    // 检查缓存是否有效
    if (cached && (now - cached.lastCheck) < this.cacheTimeout) {
      return cached.isValid
    }
    
    // 缓存过期或不存在，重新检查
    try {
      const member = await bot.client.getChannelMember(channelId, userId)
      const isValid = !!member
      
      this.userCache.set(cacheKey, { isValid, lastCheck: now })
      return isValid
    } catch (error) {
      // 检查失败，缓存为无效
      this.userCache.set(cacheKey, { isValid: false, lastCheck: now })
      return false
    }
  }
  
  // 清理过期缓存
  cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.userCache.entries()) {
      if (now - value.lastCheck > this.cacheTimeout) {
        this.userCache.delete(key)
      }
    }
  }
}

// 使用缓存的@消息发送
const mentionCache = new MentionCache()

async function cachedMention(channelId: string, userId: string, message: string) {
  const canMention = await mentionCache.canMentionUser(channelId, userId)
  
  if (canMention) {
    await bot.client.sendMessage(channelId, [
      segment.at(userId),
      segment.text(` ${message}`)
    ])
  } else {
    console.log(`用户 ${userId} 不在频道中，跳过@`)
  }
}

// 定期清理缓存
setInterval(() => mentionCache.cleanExpiredCache(), 60000) // 每分钟清理一次
```

## 调试和监控

### @消息发送监控

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// @消息监控器
class MentionMonitor {
  private stats = {
    sent: 0,
    failed: 0,
    rateLimited: 0,
    permissionDenied: 0
  }
  
  // 监控@消息发送
  async monitoredMention(channelId: string, userId: string, message: string): Promise<boolean> {
    const startTime = Date.now()
    
    try {
      await bot.client.sendMessage(channelId, [
        segment.at(userId),
        segment.text(` ${message}`)
      ])
      
      this.stats.sent++
      console.log(`✅ @消息发送成功，耗时: ${Date.now() - startTime}ms`)
      return true
      
    } catch (error: any) {
      this.stats.failed++
      
      if (error.message.includes('rate limit')) {
        this.stats.rateLimited++
        console.error('❌ @消息发送失败: 频率限制')
      } else if (error.message.includes('permission')) {
        this.stats.permissionDenied++
        console.error('❌ @消息发送失败: 权限不足')
      } else {
        console.error('❌ @消息发送失败:', error.message)
      }
      
      return false
    }
  }
  
  // 获取统计信息
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.sent / (this.stats.sent + this.stats.failed) || 0
    }
  }
  
  // 重置统计
  resetStats() {
    this.stats = { sent: 0, failed: 0, rateLimited: 0, permissionDenied: 0 }
  }
}

// 使用示例
const monitor = new MentionMonitor()

await monitor.monitoredMention(channelId, userId, '测试消息')

// 查看统计
console.log('@消息统计:', monitor.getStats())
```

### 调试工具

```typescript
// @消息调试助手
class MentionDebugger {
  // 验证@消息格式
  static validateMentionFormat(elements: any[]): { isValid: boolean, issues: string[] } {
    const issues: string[] = []
    
    const atElements = elements.filter(el => el.type === 'at')
    
    if (atElements.length === 0) {
      issues.push('消息中没有@消息段')
    }
    
    for (const atEl of atElements) {
      if (!atEl.user_id) {
        issues.push('@消息段缺少user_id')
      }
      
      if (atEl.user_id && typeof atEl.user_id !== 'string') {
        issues.push('user_id必须是字符串类型')
      }
    }
    
    const hasContent = elements.some(el => 
      el.type === 'text' && el.text.trim().length > 0
    )
    
    if (!hasContent) {
      issues.push('建议在@消息中包含文本内容')
    }
    
    return {
      isValid: issues.length === 0,
      issues
    }
  }
  
  // 模拟@消息转换
  static simulateConversion(elements: any[]): string {
    let content = ''
    
    for (const element of elements) {
      switch (element.type) {
        case 'at':
          const userId = element.user_id === 'all' ? 'everyone' : element.user_id
          content += `<@${userId}>`
          break
        case 'text':
          content += element.text
          break
        default:
          content += `[${element.type}]`
      }
    }
    
    return content
  }
}

// 调试使用示例
const debugElements = [
  segment.at('123456789'),
  segment.text(' 你好'),
  segment.at('all'),
  segment.text('!')
]

const validation = MentionDebugger.validateMentionFormat(debugElements)
console.log('验证结果:', validation)

const converted = MentionDebugger.simulateConversion(debugElements)
console.log('转换结果:', converted) // "<@123456789> 你好<@everyone>!"
```
