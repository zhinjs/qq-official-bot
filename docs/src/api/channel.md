---
layout: doc
---

# 子频道 API

子频道相关的 API 操作，包括子频道管理、消息发送、权限设置等功能。

## 📝 子频道管理

### 获取子频道列表

获取指定频道下的所有子频道。

**方法名**: `bot.channelService.getList(guildId)` / `bot.getChannelList(guildId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |

```typescript
// 使用服务模块（推荐）
const result = await bot.channelService.getList(guild_id)
if (result.success) {
    console.log('子频道列表:', result.data)
}

// 使用传统方法（向后兼容）
const channels = await bot.getChannelList(guild_id)
```

**返回数据结构**:
```typescript
interface Channel.ApiInfo {
    channel_id: string      // 子频道 ID
    channel_name: string    // 子频道名称
    type: number           // 子频道类型
    sub_type: number       // 子频道子类型
    position: number       // 排序位置
    parent_id: string      // 父频道 ID
    owner_id: string       // 创建者 ID
    private_type: number   // 私密类型
}
```

### 获取子频道信息

获取指定子频道的详细信息。

**方法名**: `bot.channelService.getInfo(channelId)` / `bot.getChannelInfo(channelId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 子频道 ID |

```typescript
const result = await bot.channelService.getInfo(channel_id)
if (result.success) {
    console.log('子频道信息:', result.data)
}
```

### 创建子频道

在指定频道下创建新的子频道。

**方法名**: `bot.channelService.create(guildId, channelInfo)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `channelInfo` | `Omit<Channel.Info, 'id'>` | ✅ | 子频道信息 |

```typescript
interface ChannelInfo {
    name: string           // 子频道名称
    type: number          // 子频道类型（0:文字，2:语音，4:分组）
    sub_type?: number     // 子频道子类型
    position?: number     // 排序位置
    parent_id?: string    // 父分组 ID
    private_type?: number // 私密类型
}

const result = await bot.channelService.create(guild_id, {
    name: '新的文字频道',
    type: 0,
    position: 1
})
```

### 修改子频道

修改指定子频道的信息。

**方法名**: `bot.channelService.update(channelId, updateInfo)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 子频道 ID |
| `updateInfo` | `ChannelUpdateInfo` | ✅ | 更新信息 |

```typescript
interface ChannelUpdateInfo {
    name?: string         // 子频道名称
    position?: number     // 排序位置
    parent_id?: string    // 父分组 ID
    private_type?: number // 私密类型
}

await bot.channelService.update(channel_id, {
    name: '修改后的频道名',
    position: 2
})
```

### 删除子频道

删除指定的子频道。

**方法名**: `bot.channelService.delete(channelId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 子频道 ID |

```typescript
const result = await bot.channelService.delete(channel_id)
if (result.success) {
    console.log('删除成功')
}
```

## 💬 消息管理

### 发送子频道消息

向指定子频道发送消息。

**方法名**: `bot.channel(channelId).send(message, source?, options?)` / `bot.sendGuildMessage(channelId, message, source?, options?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 子频道 ID |
| `message` | `Sendable` | ✅ | 消息内容 |
| `source` | `Quotable` | ❌ | 引用消息 |
| `options` | `SendOptions` | ❌ | `msgSeq` 指定消息序号，`timeout` 设置发送超时；详见[发送选项](./common.md#发送选项) |

```typescript
await bot.channel(channel_id).send('Hello World!')

// 发送富媒体消息
import { segment } from 'qq-official-bot'
await bot.messageService.sendGuildMessage(channel_id, [
    segment.text('看看这张图片:'),
    segment.image('https://example.com/image.jpg')
])

// 回复消息
await bot.messageService.sendGuildMessage(channel_id, '这是回复', {
    message_id: original_message_id
})
```

### 获取子频道消息

获取指定子频道的消息。

**方法名**: `bot.messageService.getGuildMessage(channelId, messageId)` / `bot.getGuildMessage(channelId, messageId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 子频道 ID |
| `messageId` | `string` | ✅ | 消息 ID |

```typescript
const result = await bot.messageService.getGuildMessage(channel_id, message_id)
if (result.success) {
    console.log('消息内容:', result.data)
}
```

### 撤回子频道消息

撤回指定的子频道消息。

**方法名**: `bot.messageService.recallGuildMessage(channelId, messageId, hideWarning?)` / `bot.recallGuildMessage(channelId, messageId, hideWarning?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 子频道 ID |
| `messageId` | `string` | ✅ | 消息 ID |
| `hideWarning` | `boolean` | ❌ | 是否隐藏撤回提示 |

```typescript
// 撤回消息
await bot.messageService.recallGuildMessage(channel_id, message_id)

// 撤回消息并隐藏提示
await bot.messageService.recallGuildMessage(channel_id, message_id, true)
```

## 📌 置顶消息管理

### 获取置顶消息

获取子频道的置顶消息列表。

**方法名**: `bot.channelService.getPins(channelId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 子频道 ID |

```typescript
const result = await bot.channelService.getPins(channel_id)
if (result.success) {
    console.log('置顶消息 ID 列表:', result.data)
}
```

### 添加置顶消息

将指定消息设为置顶。

**方法名**: `bot.channelService.addPin(channelId, messageId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 子频道 ID |
| `messageId` | `string` | ✅ | 消息 ID |

```typescript
await bot.channelService.addPin(channel_id, message_id)
```

### 取消置顶消息

取消指定消息的置顶状态。

**方法名**: `bot.channelService.removePin(channelId, messageId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 子频道 ID |
| `messageId` | `string` | ✅ | 消息 ID |

```typescript
await bot.channelService.removePin(channel_id, message_id)
```

## 🔔 公告管理

### 设置子频道公告

将指定消息设为子频道公告。

**方法名**: `bot.setChannelAnnounce(guildId, channelId, messageId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `channelId` | `string` | ✅ | 子频道 ID |
| `messageId` | `string` | ✅ | 消息 ID |

```typescript
await bot.setChannelAnnounce(guild_id, channel_id, message_id)
```

### 取消子频道公告

取消指定子频道的公告。

**方法名**: `bot.deleteChannelAnnounce(guildId, channelId, messageId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `channelId` | `string` | ✅ | 子频道 ID |
| `messageId` | `string` | ✅ | 消息 ID |

```typescript
await bot.deleteChannelAnnounce(guild_id, channel_id, message_id)
```

## 🎵 语音频道管理

### 音频控制

控制语音频道的音频播放。

**方法名**: `bot.audioService.controlChannelAudio(channelId, audioControl)` / `bot.controlChannelAudio(channelId, audioControl)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 语音频道 ID |
| `audioControl` | `AudioControl` | ✅ | 音频控制参数 |

```typescript
interface AudioControl {
    audio_url: string      // 音频文件 URL
    text: string          // 状态文本
    status: number        // 播放状态 (0:暂停 1:播放)
}

await bot.audioService.controlChannelAudio(channel_id, {
    audio_url: 'https://example.com/audio.mp3',
    text: '正在播放音乐',
    status: 1
})
```

### 上麦操作

在语音频道中上麦。

**方法名**: `bot.setOnlineMic(channelId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 语音频道 ID |

```typescript
await bot.setOnlineMic(channel_id)
```

### 下麦操作

在语音频道中下麦。

**方法名**: `bot.setOfflineMic(channelId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `channelId` | `string` | ✅ | 语音频道 ID |

```typescript
await bot.setOfflineMic(channel_id)
```

## ⚠️ 注意事项

1. **权限要求**: 子频道操作需要相应的管理权限
2. **频道类型**: 不同类型的子频道支持的操作可能不同
3. **音频功能**: 音频控制功能仅适用于语音频道
4. **消息限制**: 部分消息类型可能有特殊的发送限制
