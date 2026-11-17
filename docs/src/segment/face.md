---
layout: doc
---

# 表情消息段

表情消息段用于发送 QQ 表情，让消息更加生动有趣。

## 类型定义

```typescript
interface FaceElement {
  type: 'face'
  id: number
  text?: string  // 仅接收消息时有效
}
```

## 参数说明

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | string | ✅ | 消息段类型，固定为 `face` |
| id | number | ✅ | 表情 ID（范围：0~348） |
| text | string | ❌ | 表情说明文字（仅接收消息时有效） |

## 常用表情 ID

| 表情 | ID | 名称 | 表情 | ID | 名称 |
|-----|----|----|-----|----|----|
| 😀 | 14 | 微笑 | 😂 | 1 | 大笑 |
| 😊 | 13 | 害羞 | 😍 | 66 | 爱心眼 |
| 😭 | 9 | 大哭 | 😡 | 59 | 愤怒 |
| 😴 | 8 | 睡觉 | 😎 | 78 | 墨镜 |
| 👍 | 76 | 点赞 | 👎 | 77 | 踩 |
| 👏 | 70 | 鼓掌 | 🙏 | 71 | 祈祷 |
| ❤️ | 66 | 爱心 | 💔 | 67 | 心碎 |
| 🌹 | 63 | 玫瑰 | 🎂 | 53 | 蛋糕 |

## 表情分类

### 基础表情

```typescript
import { segment } from 'qq-official-bot'

// 开心表情
const happy = segment.face(14)    // 微笑
const laugh = segment.face(1)     // 大笑
const shy = segment.face(13)      // 害羞

// 难过表情
const cry = segment.face(9)       // 大哭
const sad = segment.face(6)       // 难过
const angry = segment.face(59)    // 愤怒
```

### 手势表情

```typescript
import { segment } from 'qq-official-bot'

// 手势
const thumbsUp = segment.face(76)     // 点赞
const thumbsDown = segment.face(77)   // 踩
const clap = segment.face(70)         // 鼓掌
const pray = segment.face(71)         // 祈祷
const ok = segment.face(74)           // OK
```

### 爱情表情

```typescript
import { segment } from 'qq-official-bot'

// 爱情相关
const heart = segment.face(66)        // 爱心
const heartBreak = segment.face(67)   // 心碎
const kiss = segment.face(2)          // 亲亲
const rose = segment.face(63)         // 玫瑰
```

## 使用示例

### 发送单个表情

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 发送微笑表情
await bot.sendGuildMessage(channelId, [
  segment.face(14)
])

// 带名称的表情
await bot.sendGuildMessage(channelId, [
  segment.face(14, '微笑')
])
```

### 表情与文字组合

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 文字加表情
await bot.sendGuildMessage(channelId, [
  segment.text('今天心情很好'),
  segment.face(14),
  segment.face(1)
])

// 表情穿插在文字中
await bot.sendGuildMessage(channelId, [
  segment.text('工作完成了'),
  segment.face(76),
  segment.text('可以休息了'),
  segment.face(8)
])
```

### 多个表情组合

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 表情组合表达情感
await bot.sendGuildMessage(channelId, [
  segment.face(70),  // 鼓掌
  segment.face(76),  // 点赞
  segment.face(66),  // 爱心
  segment.text(' 太棒了！')
])
```

### 表情回应

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 监听消息并用表情回应
bot.on('message.guild', async (event) => {
  const content = event.content?.toLowerCase()
  
  if (content?.includes('好消息')) {
    await bot.sendGuildMessage(event.channel_id, [
      segment.face(70),  // 鼓掌
      segment.face(76)   // 点赞
    ])
  } else if (content?.includes('难过')) {
    await bot.sendGuildMessage(event.channel_id, [
      segment.face(71),  // 祈祷
      segment.face(13)   // 安慰
    ])
  }
})
```

## 在不同服务中使用

### 群聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 群聊中发送表情
await bot.sendGroupMessage(groupId, [
  segment.text('群友们好'),
  segment.face(14)
])

// 群聊互动表情
await bot.sendGroupMessage(groupId, [
  segment.face(70),  // 鼓掌
  segment.text('欢迎新群友')
])
```

### 私聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 私聊中发送表情
await bot.sendPrivateMessage(userId, [
  segment.text('谢谢你的帮助'),
  segment.face(66)   // 爱心
])
```

### 频道服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 频道中发送表情
await bot.sendGuildMessage(channelId, [
  segment.face(53),  // 蛋糕
  segment.text('生日快乐！')
])
```

## 智能表情回复

### 情感分析表情回复

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 根据消息内容选择合适的表情
function getEmotionFace(content: string): number {
  const lowerContent = content.toLowerCase()
  
  // 开心相关
  if (lowerContent.includes('开心') || lowerContent.includes('高兴')) {
    return 14 // 微笑
  }
  
  // 难过相关
  if (lowerContent.includes('难过') || lowerContent.includes('伤心')) {
    return 9 // 大哭
  }
  
  // 愤怒相关
  if (lowerContent.includes('生气') || lowerContent.includes('愤怒')) {
    return 59 // 愤怒
  }
  
  // 感谢相关
  if (lowerContent.includes('谢谢') || lowerContent.includes('感谢')) {
    return 66 // 爱心
  }
  
  // 赞美相关
  if (lowerContent.includes('厉害') || lowerContent.includes('棒')) {
    return 76 // 点赞
  }
  
  // 默认微笑
  return 14
}

bot.on('message.guild', async (event) => {
  if (event.content) {
    const emotionFace = getEmotionFace(event.content)
    
    await bot.sendGuildMessage(event.channel_id, [
      segment.face(emotionFace)
    ])
  }
})
```

### 随机表情生成器

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 表情池
const happyFaces = [14, 1, 13, 66]      // 开心表情
const sadFaces = [9, 6, 67]             // 难过表情
const excitedFaces = [70, 76, 53]       // 兴奋表情

function getRandomFace(category: 'happy' | 'sad' | 'excited'): number {
  let faces: number[]
  
  switch (category) {
    case 'happy':
      faces = happyFaces
      break
    case 'sad':
      faces = sadFaces
      break
    case 'excited':
      faces = excitedFaces
      break
  }
  
  return faces[Math.floor(Math.random() * faces.length)]
}

// 使用示例
await bot.sendGuildMessage(channelId, [
  segment.text('恭喜获胜！'),
  segment.face(getRandomFace('excited'))
])
```

### 表情连击

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 发送表情连击
async function sendFaceCombo(channelId: string, faceId: number, count: number) {
  const faces = Array(count).fill(null).map(() => segment.face(faceId))
  
  await bot.sendGuildMessage(channelId, faces)
}

// 使用示例
await sendFaceCombo(channelId, 76, 5) // 连续5个点赞
```

## 表情映射工具

### Emoji 转 QQ 表情

```typescript
// emoji 到 QQ 表情的映射
const emojiToFace: Record<string, number> = {
  '😀': 14,   // 微笑
  '😂': 1,    // 大笑
  '😊': 13,   // 害羞
  '😭': 9,    // 大哭
  '😡': 59,   // 愤怒
  '😴': 8,    // 睡觉
  '👍': 76,   // 点赞
  '👎': 77,   // 踩
  '👏': 70,   // 鼓掌
  '❤️': 66,   // 爱心
  '💔': 67,   // 心碎
  '🌹': 63,   // 玫瑰
  '🎂': 53    // 蛋糕
}

function convertEmojiToFace(text: string): any[] {
  const elements: any[] = []
  let currentText = ''
  
  for (const char of text) {
    if (emojiToFace[char]) {
      // 保存之前的文字
      if (currentText) {
        elements.push(segment.text(currentText))
        currentText = ''
      }
      // 添加表情
      elements.push(segment.face(emojiToFace[char]))
    } else {
      currentText += char
    }
  }
  
  // 保存剩余文字
  if (currentText) {
    elements.push(segment.text(currentText))
  }
  
  return elements
}

// 使用示例
const elements = convertEmojiToFace('今天很开心😀👍')
await bot.sendGuildMessage(channelId, elements)
```

## 表情管理

### 表情使用统计

```typescript
class FaceUsageTracker {
  private usage: Map<number, number> = new Map()
  
  trackUsage(faceId: number) {
    const count = this.usage.get(faceId) || 0
    this.usage.set(faceId, count + 1)
  }
  
  getMostUsedFaces(limit: number = 5): Array<{id: number, count: number}> {
    return Array.from(this.usage.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }
  
  getUsageReport(): string {
    const total = Array.from(this.usage.values()).reduce((sum, count) => sum + count, 0)
    const top5 = this.getMostUsedFaces(5)
    
    return `表情使用统计（总计: ${total}）:\n` +
           top5.map((item, index) => 
             `${index + 1}. 表情ID ${item.id}: ${item.count}次`
           ).join('\n')
  }
}

const faceTracker = new FaceUsageTracker()

// 在发送表情时记录
async function sendFaceWithTracking(channelId: string, faceId: number) {
  faceTracker.trackUsage(faceId)
  
  await bot.sendGuildMessage(channelId, [
    segment.face(faceId)
  ])
}
```

## 最佳实践

### 表情使用建议

```typescript
// ✅ 好的做法
await bot.sendGuildMessage(channelId, [
  segment.text('恭喜通过考试'),
  segment.face(76),   // 适量使用表情
  segment.face(70)
])

// ❌ 避免的做法
await bot.sendGuildMessage(channelId, [
  segment.face(76),   // 过度使用表情
  segment.face(76),
  segment.face(76),
  segment.face(76),
  segment.face(76)
])
```

### 表情与文字平衡

```typescript
// 表情作为文字的补充，而非替代
await bot.sendGuildMessage(channelId, [
  segment.text('项目完成了，大家辛苦了'),
  segment.face(70),   // 鼓掌
  segment.text('明天可以休息一天'),
  segment.face(8)     // 睡觉
])
```

## 组合规则

表情消息段可以与以下消息段组合使用：

- ✅ **文本消息段** - 最常见的组合
- ✅ **@消息段** - @用户并发送表情
- ✅ **图片消息段** - 图片配表情
- ✅ **回复消息段** - 回复时发送表情
- ✅ **其他表情消息段** - 表情组合
- ❌ **语音消息段** - 不建议同时使用
- ❌ **视频消息段** - 不建议同时使用

## 限制说明

1. **表情 ID 有效性**：使用的表情 ID 必须是有效的
2. **平台差异**：不同平台可能支持的表情数量不同
3. **显示差异**：表情在不同客户端可能显示略有差异
4. **使用频率**：避免过度使用表情导致消息混乱
