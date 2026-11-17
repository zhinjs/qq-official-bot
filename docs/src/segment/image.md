---
layout: doc
---

# 图片消息段

图片消息段用于发送图片内容，支持多种图片格式和来源。

## 类型定义

```typescript
interface ImageElement {
  type: 'image'
  file: string | Buffer
  url?: string
  name?: string  // 仅接收消息时有效
}
```

## 参数说明

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | string | ✅ | 消息段类型，固定为 `image` |
| file | string \| Buffer | ✅ | 图片文件数据，支持多种格式 |
| url | string | ❌ | 图片 URL 地址（接收消息时可能存在） |
| name | string | ❌ | 图片文件名（仅接收消息时有效） |

## 文件格式支持

### file 参数支持的格式：
- **本地文件路径**: `/tmp/image.jpg` 或 `./assets/photo.png`
- **网络图片地址**: `http://example.com/image.png`
- **Base64 编码**: `base64://iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...`
- **Data URL**: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...`
- **Buffer 数据**: 直接传入图片的 Buffer 对象

群聊/单聊发送本地图片、Buffer、Base64 时，SDK 会走官方[分片上传](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/rich-media.html)；`http(s)` 地址仍走平台 URL 转存。频道消息仍使用原来的表单/图片字段。

## 支持的图片格式

- **JPEG/JPG** - 最常用的图片格式
- **PNG** - 支持透明背景  
- **WebP** - 现代化图片格式，文件更小
- **GIF** - 支持动图

## 图片来源与用法

### 本地文件

```typescript
import { segment } from 'qq-official-bot'

// 相对路径
const image1 = segment.image('./assets/photo.jpg')

// 绝对路径
const image2 = segment.image('/path/to/image.png')

// 使用 file:// 协议
const image3 = segment.image('file:///path/to/image.gif')
```

### 网络图片

```typescript
import { segment } from 'qq-official-bot'

// HTTP/HTTPS URL
const image1 = segment.image('https://example.com/photo.jpg')
const image2 = segment.image('https://cdn.example.com/image.png')
```

### Base64 编码

```typescript
import { segment } from 'qq-official-bot'

// Base64 格式（推荐使用这种格式）
const image1 = segment.image('base64://iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')

// Data URL 格式
const image2 = segment.image('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
```

### Buffer 数据

```typescript
import { segment } from 'qq-official-bot'
import fs from 'fs'

// 直接使用 Buffer
const imageBuffer = fs.readFileSync('./image.png')
const image = segment.image(imageBuffer)
```

## 使用示例

### 发送单张图片

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 发送本地图片
await bot.sendGuildMessage(channelId, [
  segment.image('./photo.jpg')
])

// 发送网络图片
await bot.sendGuildMessage(channelId, [
  segment.image('https://example.com/image.png')
])
```

### 图片与文字组合

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

await bot.sendGuildMessage(channelId, [
  segment.text('看看这张图片：'),
  segment.image('./photo.jpg'),
  segment.text('怎么样？')
])
```

### 发送多张图片

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

await bot.sendGuildMessage(channelId, [
  segment.text('这是一些图片：'),
  segment.image('./photo1.jpg'),
  segment.image('./photo2.png'),
  segment.image('https://example.com/photo3.gif')
])
```

### 图片与回复组合

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 回复消息并发送图片
await bot.sendGuildMessage(channelId, [
  segment.reply(originalMessageId),
  segment.image('./response.jpg')
])
```

## 在服务模块中使用

### 群聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 群聊中发送图片
await bot.sendGroupMessage(groupId, [
  segment.image('./group_photo.jpg')
])
```

### 私聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 私聊中发送图片
await bot.sendPrivateMessage(userId, [
  segment.image('./private_photo.png')
])
```

### 频道服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 频道中发送图片
await bot.sendGuildMessage(channelId, [
  segment.image('https://cdn.example.com/channel_image.webp')
])
```

## 图片处理最佳实践

### 文件大小限制

```typescript
// 检查文件大小（建议小于 10MB）
import fs from 'fs'

function checkImageSize(filePath: string): boolean {
  const stats = fs.statSync(filePath)
  const fileSizeInMB = stats.size / (1024 * 1024)
  return fileSizeInMB <= 10
}

if (checkImageSize('./large_image.jpg')) {
  await bot.sendGuildMessage(channelId, [
    segment.image('./large_image.jpg')
  ])
} else {
  console.log('图片文件过大，请压缩后再发送')
}
```

### 图片格式优化

```typescript
// 根据内容选择合适的格式
function getOptimalFormat(hasTransparency: boolean, isAnimated: boolean): string {
  if (isAnimated) return 'gif'
  if (hasTransparency) return 'png'
  return 'jpg'
}
```

### 错误处理

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

try {
  await bot.sendGuildMessage(channelId, [
    segment.image('./photo.jpg')
  ])
} catch (error) {
  if (error.message.includes('file not found')) {
    console.error('图片文件不存在')
  } else if (error.message.includes('unsupported format')) {
    console.error('不支持的图片格式')
  } else {
    console.error('发送图片失败:', error)
  }
}
```

## 组合规则

图片消息段可以与以下消息段组合使用：

- ✅ **文本消息段** - 图片配文字说明
- ✅ **回复消息段** - 回复时发送图片
- ✅ **@消息段** - @用户并发送图片
- ✅ **其他图片消息段** - 发送多张图片
- ❌ **语音消息段** - 不能同时发送
- ❌ **视频消息段** - 不能同时发送

## 限制说明

1. **文件大小**：单个图片文件建议不超过 10MB
2. **格式支持**：支持 JPEG、PNG、WebP、GIF 格式
3. **网络图片**：需要确保 URL 可访问
4. **本地文件**：需要确保文件路径正确且有读取权限
5. **Base64**：编码后的字符串不能过长
