---
layout: doc
---

# 音频消息段

音频消息段用于发送语音和音频内容，支持多种音频格式。

## 类型定义

```typescript
interface AudioElement {
  type: 'audio'
  file: string
  url?: string
  name?: string  // 仅接收消息时有效
}
```

## 参数说明

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | string | ✅ | 消息段类型，固定为 `audio` |
| file | string | ✅ | 音频文件路径、URL 或标识符 |
| url | string | ❌ | 音频 URL 地址（接收消息时可能存在） |
| name | string | ❌ | 音频文件名（仅接收消息时有效） |

## 支持的音频格式

- **MP3** - 最常用的音频格式，兼容性最好
- **WAV** - 无损音频格式，文件较大
- **M4A** - Apple 音频格式
- **OGG** - 开源音频格式
- **AMR** - 语音编码格式，适合语音消息

## 音频来源

### 本地文件

```typescript
import { segment } from 'qq-official-bot'

// 相对路径
const audio1 = segment.audio('./audios/voice.mp3')

// 绝对路径
const audio2 = segment.audio('/path/to/audio.wav')

// 使用 file:// 协议
const audio3 = segment.audio('file:///path/to/audio.m4a')
```

### 网络音频

```typescript
import { segment } from 'qq-official-bot'

// HTTP URL
const audio1 = segment.audio('https://example.com/audio.mp3')

// HTTPS URL
const audio2 = segment.audio('https://cdn.example.com/music.wav')
```

### 带参数的音频

```typescript
import { segment } from 'qq-official-bot'

// 指定音频信息
const audio = segment.audio('./voice.mp3', {
  duration: 30,
  format: 'mp3'
})
```

## 使用示例

### 发送语音消息

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 发送本地语音
await bot.sendGuildMessage(channelId, [
  segment.audio('./voice.mp3')
])

// 发送网络音频
await bot.sendGuildMessage(channelId, [
  segment.audio('https://example.com/audio.mp3')
])
```

### 音频与文字组合

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

await bot.sendGuildMessage(channelId, [
  segment.text('听听这个语音消息：'),
  segment.audio('./voice.mp3')
])
```

### 音频与回复组合

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 回复消息并发送语音
await bot.sendGuildMessage(channelId, [
  segment.reply(originalMessageId),
  segment.audio('./response_voice.mp3')
])
```

### 发送音乐片段

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

await bot.sendGuildMessage(channelId, [
  segment.text('分享一段音乐：'),
  segment.audio('./music_clip.mp3', {
    duration: 60,
    format: 'mp3'
  })
])
```

## 在服务模块中使用

### 群聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 群聊中发送语音
await bot.sendGroupMessage(groupId, [
  segment.audio('./group_voice.mp3')
])
```

### 私聊服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 私聊中发送语音
await bot.sendPrivateMessage(userId, [
  segment.audio('./private_voice.mp3')
])
```

### 频道服务

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 频道中发送音频
await bot.sendGuildMessage(channelId, [
  segment.text('语音播报：'),
  segment.audio('./announcement.mp3')
])
```

## 音频处理最佳实践

### 文件大小和时长限制

```typescript
import fs from 'fs'
import { getAudioDuration } from 'audio-duration' // 第三方库

async function checkAudioLimits(filePath: string): Promise<boolean> {
  // 检查文件大小（建议小于 20MB）
  const stats = fs.statSync(filePath)
  const fileSizeInMB = stats.size / (1024 * 1024)
  
  if (fileSizeInMB > 20) {
    console.log('音频文件过大')
    return false
  }
  
  // 检查时长（建议小于 5 分钟）
  try {
    const duration = await getAudioDuration(filePath)
    if (duration > 300) { // 5分钟
      console.log('音频时长过长')
      return false
    }
  } catch (error) {
    console.error('无法获取音频时长:', error)
    return false
  }
  
  return true
}

// 使用示例
if (await checkAudioLimits('./audio.mp3')) {
  await bot.sendGuildMessage(channelId, [
    segment.audio('./audio.mp3')
  ])
}
```

### 音频格式转换

```typescript
// 推荐使用 MP3 格式以确保最佳兼容性
function recommendAudioFormat(originalFormat: string): string {
  const supportedFormats = ['mp3', 'wav', 'm4a', 'ogg', 'amr']
  
  if (!supportedFormats.includes(originalFormat.toLowerCase())) {
    return 'mp3' // 推荐转换为 MP3
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
    segment.audio('./voice.mp3')
  ])
} catch (error) {
  if (error.message.includes('file not found')) {
    console.error('音频文件不存在')
  } else if (error.message.includes('unsupported format')) {
    console.error('不支持的音频格式')
  } else if (error.message.includes('file too large')) {
    console.error('音频文件过大')
  } else {
    console.error('发送音频失败:', error)
  }
}
```

## 进阶功能

### 音频压缩

```typescript
// 使用 FFmpeg 进行音频压缩
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function compressAudio(inputPath: string, outputPath: string): Promise<void> {
  const command = `ffmpeg -i "${inputPath}" -c:a mp3 -b:a 128k "${outputPath}"`
  
  try {
    await execAsync(command)
    console.log('音频压缩完成')
  } catch (error) {
    console.error('音频压缩失败:', error)
    throw error
  }
}

// 使用示例
await compressAudio('./original.wav', './compressed.mp3')
await bot.sendGuildMessage(channelId, [
  segment.audio('./compressed.mp3')
])
```

### 录音转语音消息

```typescript
// 将录音文件转换为适合发送的格式
async function prepareVoiceMessage(recordingPath: string): Promise<string> {
  const outputPath = recordingPath.replace(/\.[^.]+$/, '.mp3')
  
  // 转换为 MP3 格式并优化
  const command = `ffmpeg -i "${recordingPath}" -c:a mp3 -b:a 64k -ar 16000 "${outputPath}"`
  
  try {
    await execAsync(command)
    return outputPath
  } catch (error) {
    console.error('录音转换失败:', error)
    throw error
  }
}

// 使用示例
const voicePath = await prepareVoiceMessage('./recording.wav')
await bot.sendGuildMessage(channelId, [
  segment.audio(voicePath)
])
```

### 音频时长检测

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function getAudioInfo(filePath: string): Promise<{duration: number, format: string}> {
  const command = `ffprobe -v quiet -show_entries format=duration,format_name -of csv=p=0 "${filePath}"`
  
  try {
    const { stdout } = await execAsync(command)
    const [format, durationStr] = stdout.trim().split(',')
    const duration = parseFloat(durationStr)
    
    return { duration, format }
  } catch (error) {
    console.error('获取音频信息失败:', error)
    throw error
  }
}

// 使用示例
const { duration, format } = await getAudioInfo('./audio.mp3')
console.log(`音频时长: ${duration}秒, 格式: ${format}`)

await bot.sendGuildMessage(channelId, [
  segment.audio('./audio.mp3', { duration, format })
])
```

## 语音消息特殊处理

### 语音识别集成

```typescript
// 可以结合语音识别服务
interface VoiceRecognitionResult {
  text: string
  confidence: number
}

async function recognizeVoice(audioPath: string): Promise<VoiceRecognitionResult> {
  // 这里是示例，实际需要调用语音识别 API
  // 比如百度、腾讯、阿里云的语音识别服务
  return {
    text: '识别到的文字内容',
    confidence: 0.95
  }
}

// 发送语音消息并提供文字版本
const voiceResult = await recognizeVoice('./voice.mp3')

await bot.sendGuildMessage(channelId, [
  segment.audio('./voice.mp3'),
  segment.text(`\n[语音转文字]: ${voiceResult.text}`)
])
```

## 组合规则

音频消息段可以与以下消息段组合使用：

- ✅ **文本消息段** - 音频配文字说明
- ✅ **回复消息段** - 回复时发送语音
- ✅ **@消息段** - @用户并发送语音
- ❌ **图片消息段** - 不能同时发送
- ❌ **视频消息段** - 不能同时发送
- ❌ **其他音频消息段** - 一次只能发送一个音频

## 限制说明

1. **文件大小**：单个音频文件建议不超过 20MB
2. **时长限制**：建议音频时长不超过 5 分钟
3. **格式支持**：推荐使用 MP3 格式以确保最佳兼容性
4. **语音质量**：建议采样率 16kHz，比特率 64-128kbps
5. **网络音频**：需要确保 URL 可访问且稳定
6. **本地文件**：需要确保文件路径正确且有读取权限
7. **并发限制**：一条消息中只能包含一个音频文件
