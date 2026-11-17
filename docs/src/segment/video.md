---
layout: doc
---

# 视频消息段

视频消息段用于发送视频内容，支持多种视频格式和来源。

## 类型定义

```typescript
interface VideoElement {
  type: 'video'
  file: string
  url?: string
  name?: string  // 仅接收消息时有效
}
```

## 参数说明

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | string | ✅ | 消息段类型，固定为 `video` |
| file | string | ✅ | 视频文件路径、URL 或标识符 |
| url | string | ❌ | 视频 URL 地址（接收消息时可能存在） |
| name | string | ❌ | 视频文件名（仅接收消息时有效） |

## 支持的视频格式

- **MP4** - 最常用的视频格式，兼容性最好
- **AVI** - 传统视频格式
- **MOV** - Apple 格式
- **WMV** - Windows 格式
- **WebM** - 现代化网络视频格式

## 视频来源

### 本地文件

```typescript
import { segment } from 'qq-official-bot'

// 相对路径
const video1 = segment.video('./videos/demo.mp4')

// 绝对路径
const video2 = segment.video('/path/to/video.avi')

// 使用 file:// 协议
const video3 = segment.video('file:///path/to/video.mov')
```

### 网络视频

```typescript
import { segment } from 'qq-official-bot'

// HTTP URL
const video1 = segment.video('https://example.com/video.mp4')

// HTTPS URL
const video2 = segment.video('https://cdn.example.com/demo.webm')
```

### 带缩略图的视频

```typescript
import { segment } from 'qq-official-bot'

// 指定缩略图
const video = segment.video('./video.mp4', {
  thumb: './thumbnail.jpg'
})
```

## 使用示例

### 发送单个视频

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 发送本地视频
await bot.sendGuildMessage(channelId, [
  segment.video('./demo.mp4')
])

// 发送网络视频
await bot.sendGuildMessage(channelId, [
  segment.video('https://example.com/video.mp4')
])
```

### 视频与文字组合

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

await bot.sendGuildMessage(channelId, [
  segment.text('分享一个有趣的视频：'),
  segment.video('./funny.mp4'),
  segment.text('希望你喜欢！')
])
```

### 视频与回复组合

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 回复消息并发送视频
await bot.sendGuildMessage(channelId, [
  segment.reply(originalMessageId),
  segment.video('./response.mp4')
])
```

### 带缩略图的视频

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

await bot.sendGuildMessage(channelId, [
  segment.video('./video.mp4', {
    thumb: './thumbnail.jpg',
    duration: 120,
    width: 1920,
    height: 1080
  })
])
```

## 在服务模块中使用

### 群聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 群聊中发送视频
await bot.sendGroupMessage(groupId, [
  segment.text('群友们看看这个视频：'),
  segment.video('./group_video.mp4')
])
```

### 私聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 私聊中发送视频
await bot.sendPrivateMessage(userId, [
  segment.video('./private_video.mp4')
])
```

### 频道服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 频道中发送视频
await bot.sendGuildMessage(channelId, [
  segment.text('新视频发布：'),
  segment.video('https://cdn.example.com/latest.mp4')
])
```

## 视频处理最佳实践

### 文件大小和时长限制

```typescript
import fs from 'fs'
import { getVideoDuration } from 'video-duration' // 第三方库

async function checkVideoLimits(filePath: string): Promise<boolean> {
  // 检查文件大小（建议小于 100MB）
  const stats = fs.statSync(filePath)
  const fileSizeInMB = stats.size / (1024 * 1024)
  
  if (fileSizeInMB > 100) {
    console.log('视频文件过大')
    return false
  }
  
  // 检查时长（建议小于 5 分钟）
  try {
    const duration = await getVideoDuration(filePath)
    if (duration > 300) { // 5分钟
      console.log('视频时长过长')
      return false
    }
  } catch (error) {
    console.error('无法获取视频时长:', error)
    return false
  }
  
  return true
}

// 使用示例
if (await checkVideoLimits('./video.mp4')) {
  await bot.sendGuildMessage(channelId, [
    segment.video('./video.mp4')
  ])
}
```

### 视频格式转换

```typescript
// 推荐使用 MP4 格式以确保最佳兼容性
function recommendVideoFormat(originalFormat: string): string {
  const supportedFormats = ['mp4', 'avi', 'mov', 'wmv', 'webm']
  
  if (!supportedFormats.includes(originalFormat.toLowerCase())) {
    return 'mp4' // 推荐转换为 MP4
  }
  
  return originalFormat
}
```

### 错误处理

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

try {
  await bot.sendGuildMessage(channelId, [
    segment.video('./video.mp4')
  ])
} catch (error) {
  if (error.message.includes('file not found')) {
    console.error('视频文件不存在')
  } else if (error.message.includes('unsupported format')) {
    console.error('不支持的视频格式')
  } else if (error.message.includes('file too large')) {
    console.error('视频文件过大')
  } else {
    console.error('发送视频失败:', error)
  }
}
```

## 进阶功能

### 视频压缩

```typescript
// 使用 FFmpeg 进行视频压缩
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function compressVideo(inputPath: string, outputPath: string): Promise<void> {
  const command = `ffmpeg -i "${inputPath}" -c:v libx264 -crf 28 -c:a aac -b:a 128k "${outputPath}"`
  
  try {
    await execAsync(command)
    console.log('视频压缩完成')
  } catch (error) {
    console.error('视频压缩失败:', error)
    throw error
  }
}

// 使用示例
await compressVideo('./original.mp4', './compressed.mp4')
await bot.sendGuildMessage(channelId, [
  segment.video('./compressed.mp4')
])
```

### 生成缩略图

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function generateThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
  const command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 "${thumbnailPath}"`
  
  try {
    await execAsync(command)
    console.log('缩略图生成完成')
  } catch (error) {
    console.error('缩略图生成失败:', error)
    throw error
  }
}

// 使用示例
await generateThumbnail('./video.mp4', './thumbnail.jpg')
await bot.sendGuildMessage(channelId, [
  segment.video('./video.mp4', { thumb: './thumbnail.jpg' })
])
```

## 组合规则

视频消息段可以与以下消息段组合使用：

- ✅ **文本消息段** - 视频配文字说明
- ✅ **回复消息段** - 回复时发送视频
- ✅ **@消息段** - @用户并发送视频
- ❌ **图片消息段** - 不能同时发送
- ❌ **语音消息段** - 不能同时发送
- ❌ **其他视频消息段** - 一次只能发送一个视频

## 限制说明

1. **文件大小**：单个视频文件建议不超过 100MB
2. **时长限制**：建议视频时长不超过 5 分钟
3. **格式支持**：推荐使用 MP4 格式以确保最佳兼容性
4. **网络视频**：需要确保 URL 可访问且稳定
5. **本地文件**：需要确保文件路径正确且有读取权限
6. **并发限制**：一条消息中只能包含一个视频文件
