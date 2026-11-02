# Segment 工具

`segment` 是一个便捷的消息段工厂函数集合，用于快速创建各种类型的消息段。它提供了简洁的API来构建复杂的消息内容。

## 导入方式

```typescript
import { segment } from 'qq-official-bot'
```

## API 参考

### 基础消息段

#### `segment.text(text: string)`

创建文本消息段。

```typescript
// 基础用法
const textSegment = segment.text('Hello World')

// 组合使用
const message = [
  segment.text('欢迎 '),
  segment.at('123456789'),
  segment.text(' 加入群聊！')
]
```

#### `segment.at(userId: string | 'all')`

创建@消息段，用于提及用户或全体成员。

```typescript
// @特定用户
const atUser = segment.at('123456789')

// @全体成员
const atAll = segment.at('all')

// 组合使用
const message = [
  segment.at('123456789'),
  segment.text(' 请查看重要通知')
]
```

#### `segment.face(id: number, text?: string)`

创建表情消息段。

```typescript
// 基础表情
const smile = segment.face(14)

// 带说明文字的表情（接收消息时有效）
const namedFace = segment.face(14, '微笑')

// 常用表情ID
const expressions = [
  segment.face(14),  // 微笑
  segment.face(1),   // 大笑
  segment.face(76),  // 点赞
  segment.face(70)   // 鼓掌
]
```

### 多媒体消息段

#### `segment.image(file: string | Buffer, options?)`

创建图片消息段。

```typescript
// 本地图片
const localImage = segment.image('./image.jpg')

// 网络图片
const webImage = segment.image('https://example.com/image.jpg')

// Buffer数据
const imageBuffer = fs.readFileSync('./image.jpg')
const bufferImage = segment.image(imageBuffer)

// 带可选参数
const imageWithOptions = segment.image('./image.jpg', {
  url: 'https://example.com/image.jpg',
  name: 'my-image.jpg'
})
```

#### `segment.video(file: string, options?)`

创建视频消息段。

```typescript
// 本地视频
const localVideo = segment.video('./video.mp4')

// 网络视频
const webVideo = segment.video('https://example.com/video.mp4')

// 带可选参数
const videoWithOptions = segment.video('./video.mp4', {
  url: 'https://example.com/video.mp4',
  name: 'demo-video.mp4'
})
```

#### `segment.audio(file: string, options?)`

创建音频消息段。

```typescript
// 本地音频
const localAudio = segment.audio('./audio.mp3')

// 网络音频
const webAudio = segment.audio('https://example.com/audio.mp3')

// 带可选参数
const audioWithOptions = segment.audio('./audio.mp3', {
  url: 'https://example.com/audio.mp3',
  name: 'voice-message.mp3'
})
```

### 富文本消息段

#### `segment.markdown(content: string)`

创建Markdown消息段。

```typescript
// 直接内容模式
const markdownContent = segment.markdown(`
# 标题

**粗体文字**

- 列表项1
- 列表项2

> 引用文字
`)

// 自定义模板模式
const markdownTemplate = segment.markdown('template_id', [
  { key: 'title', values: ['标题内容'] },
  { key: 'content', values: ['正文内容'] }
])
```

#### `segment.card(content: MessageCard['content'])`

创建群聊/单聊图文卡片，发送时使用 `msg_type=8`。

```typescript
const card = segment.card({
  title: '最新公告',
  description: '点击查看详情',
  url: 'https://example.com/news',
  pic_url: 'https://example.com/cover.png',
})
await bot.sendGroupMessage(group_id, card)
```

字段长度和 HTTPS 要求见[图文卡片](./card.md)。

#### `segment.ark(templateId: number, kv: Array)`

创建ARK消息段。

```typescript
const arkMessage = segment.ark(37, [
  { key: 'title', value: '卡片标题' },
  { key: 'content', value: '卡片内容' },
  { key: 'url', value: 'https://example.com' }
])
```

#### `segment.embed(title: string, prompt: string, thumbnail: object, fields: Array)`

创建Embed消息段（仅频道支持）。

```typescript
const embedMessage = segment.embed(
  '嵌入消息标题',
  '嵌入消息描述',
  { url: 'https://example.com/thumbnail.jpg' },
  [
    { name: '字段1' },
    { name: '字段2' }
  ]
)
```

### 交互消息段

#### `segment.button(data: object)`

创建按钮消息段。

```typescript
const button = segment.button({
  text: '点击我',
  action: 'callback',
  data: 'button_clicked'
})
```

#### `segment.keyboard(id: string)`

创建键盘按钮组消息段。

```typescript
const keyboard = segment.keyboard('keyboard_template_id')
```

#### `segment.link(channelId: string)`

创建链接消息段（仅频道支持）。

```typescript
const channelLink = segment.link('channel_123456')
```

### 引用消息段

#### `segment.reply(idOrQuotable: string | Quotable)`

创建回复消息段。

```typescript
// 使用消息ID
const replyById = segment.reply('message_123')

// 使用Quotable对象
const replyByQuotable = segment.reply({
  id: 'message_123',
  event_id: 'event_456'
})
```

## 使用示例

### 基础组合消息

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 发送组合消息
await bot.client.sendMessage(channelId, [
  segment.text('欢迎新成员 '),
  segment.at('123456789'),
  segment.text('！'),
  segment.face(14)
])
```

### 富媒体消息

```typescript
// 图片配文字
await bot.client.sendMessage(channelId, [
  segment.text('分享一张图片：'),
  segment.image('./photo.jpg'),
  segment.text('拍摄于今天的活动现场')
])

// 视频分享
await bot.client.sendMessage(channelId, [
  segment.text('精彩视频回顾 '),
  segment.face(76),
  segment.video('./highlight.mp4')
])
```

### 带回复的消息

```typescript
// 回复特定消息
await bot.client.sendMessage(channelId, [
  segment.reply('original_message_id'),
  segment.text('好的，我知道了！'),
  segment.face(76)
])
```

### Markdown格式消息

```typescript
const reportMarkdown = segment.markdown(`
# 📊 每日数据报告

## 用户活跃度
- **在线用户**: 1,234
- **新增用户**: 56
- **总用户数**: 12,345

## 消息统计
| 类型 | 数量 | 占比 |
|------|------|------|
| 文本 | 890 | 65% |
| 图片 | 234 | 17% |
| 其他 | 246 | 18% |

> 数据更新时间：${new Date().toLocaleString()}
`)

await bot.client.sendMessage(channelId, [reportMarkdown])
```

## 类型支持

`segment` 工具提供完整的TypeScript类型支持：

```typescript
import type { SegmentFactory } from 'qq-official-bot'

// segment 的类型
const segmentFactory: SegmentFactory = segment

// 各种消息段的类型
import type {
  TextElem,
  AtElem,
  FaceElem,
  ImageElem,
  // ... 其他类型
} from 'qq-official-bot'
```

## 最佳实践

### 1. 合理组合消息段

```typescript
// ✅ 好的做法：逻辑清晰
const message = [
  segment.text('任务完成 '),
  segment.face(76),
  segment.text(' 感谢 '),
  segment.at('user_id'),
  segment.text(' 的帮助！')
]

// ❌ 避免：过度复杂
const complexMessage = [
  segment.face(1), segment.face(1), segment.face(1),
  segment.text('!!!'),
  segment.at('user1'), segment.at('user2'), segment.at('user3'),
  // ... 过多的段落
]
```

### 2. 平台兼容性

```typescript
// 检查平台支持的消息段类型
const isChannelMessage = true // 根据实际情况判断

const message = [
  segment.text('通用消息'),
  segment.face(14)
]

// 只在频道中使用embed
if (isChannelMessage) {
  message.push(segment.embed('标题', '描述', {}, []))
}
```

### 3. 错误处理

```typescript
try {
  const message = [
    segment.text('发送消息'),
    segment.image('./image.jpg')
  ]
  
  await bot.client.sendMessage(channelId, message)
} catch (error) {
  console.error('消息发送失败:', error)
  
  // 降级为纯文本消息
  await bot.client.sendMessage(channelId, [
    segment.text('图片发送失败，请稍后重试')
  ])
}
```

## 相关链接

- [消息段概述](../docs/src/segment/index.md)
- [消息系统文档](../docs/src/guide/message.md)
- [API 参考](../docs/src/api/index.md)
- [示例代码](../examples/)
