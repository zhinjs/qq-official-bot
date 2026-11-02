# 消息段 API

消息段（Segment）是 QQ 官方机器人 SDK 中用于构建富媒体消息的核心概念。通过组合不同类型的消息段，您可以发送包含文本、图片、视频、音频、表情等多种内容的复杂消息。

## 📋 目录

- [基础概念](#基础概念)
- [类型定义](#类型定义)
- [组合规则](#组合规则)
- [使用示例](#使用示例)
- [消息段列表](#消息段列表)

## 🎯 基础概念

### 消息段结构

每个消息段都遵循统一的数据结构：

```typescript
interface MessageElem {
    type: string        // 消息段类型
    [key: string]: any  // 消息段数据
}
```

### 发送消息类型

```typescript
// 可发送的内容类型
type Sendable = string | MessageElem | (string | MessageElem)[]

// 可引用的消息（用于回复）
interface Quotable {
    id?: string         // 消息 ID
    event_id?: string   // 事件 ID
}
```

## 📝 类型定义

### 可重复组合的消息元素

这些消息段可以在同一条消息中多次使用：

```typescript
type RepeatableCombineElem = 
    | TextElem      // 文本消息段
    | FaceElem      // 表情消息段
    | LinkElem      // 链接消息段（仅频道支持）
    | AtElem        // @提及消息段
    | ButtonElem    // 按钮消息段
```

### 独立消息元素

这些消息段通常独立使用，不与其他同类型消息段组合：

```typescript
type IndependentElem = 
    | ImageElem     // 图片消息段
    | VideoElem     // 视频消息段
    | AudioElem     // 音频消息段
    | MDElem        // Markdown 消息段
    | ArkElem       // Ark 卡片消息段
    | CardElem      // 群聊/单聊图文卡片
    | EmbedElem     // Embed 嵌入消息段
```

### 带回复的消息元素

```typescript
type WithReply<T extends MessageElem> =
    | T
    | [T]
    | [ReplyElem, T]
    | [ReplyElem, ...RepeatableCombineElem[]]
```

### 完整的 Sendable 定义

```typescript
export type Sendable =
    | string                                    // 纯文本
    | RepeatableCombineElem                    // 单个可重复元素
    | (RepeatableCombineElem | string)[]       // 可重复元素数组
    | WithReply<IndependentElem>               // 带回复的独立元素
```

## 📐 组合规则

### 1. 可重复消息段
- ✅ 可以多个同时使用
- ✅ 可以与其他可重复消息段组合
- ✅ 可以添加回复引用

**包括:**
- [文本 (TextElem)](./text.md)
- [表情 (FaceElem)](./face.md)
- [@提及 (AtElem)](./at.md)
- [链接 (LinkElem)](./link.md)
- [按钮 (ButtonElem)](./button.md)

### 2. 独立消息段
- ⚠️ 每条消息只能包含一个
- ✅ 可以添加回复引用
- ⚠️ 不能与其他独立消息段组合

**包括:**
- [图片 (ImageElem)](./image.md)
- [视频 (VideoElem)](./video.md)
- [音频 (AudioElem)](./audio.md)
- [Markdown (MDElem)](./markdown.md)
- [Ark 卡片 (ArkElem)](./ark.md)
- [图文卡片 (CardElem)](./card.md)
- [Embed 嵌入 (EmbedElem)](./embed.md)

群聊和单聊的正文槽位只能选择一个：`markdown`、`ark`、`image` / `video` / `audio`（共享媒体槽位）、`card`。混用这些片段或重复传入同一个正文类型，SDK 会在文件处理、上传和消息请求之前抛出 `TypeError`，错误中包含冲突的片段类型。模板字符串展开后也遵循同一规则，不会自动拆成多条消息。

例如 `[segment.markdown('md'), segment.video(url)]` 及相反顺序都会报错；两张图片也需要分别发送。引用、文本、@、键盘和按钮不占用上述正文槽位，附属片段的排列不会覆盖已选正文的 `msg_type`。没有正文时，单独键盘或 @成员沿用现有的 Markdown 类型选择。

频道和频道私信使用另一套字段契约，保留现有组合行为，例如文字加图片、文字加 ARK。群聊/单聊的预检仅检查上述正文冲突，不保证所有附属字段组合均被服务端接受；消息权限、各字段的有效性和内容限制仍以[官方群消息接口](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html)、[单聊接口](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html)和[频道接口](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/message/send.html)为准。

### 3. 特殊消息段
- [回复 (ReplyElem)](./reply.md) - 只能与其他消息段组合使用

## 💡 使用示例

### 基础文本消息

```typescript
// 发送纯文本
await bot.sendMessage(channelId, "这是一条文本消息")

// 发送文本消息段
await bot.sendMessage(channelId, {
    type: "text",
    text: "这是一条文本消息"
})
```

### 组合消息

```typescript
// 文本 + 表情 + @提及
await bot.sendMessage(channelId, [
    { type: "text", text: "你好 " },
    { type: "at", user_id: "123456" },
    { type: "text", text: " " },
    { type: "face", id: "1" }
])
```

### 带回复的消息

```typescript
// 回复 + 图片
await bot.sendMessage(channelId, [
    { type: "reply", message_id: "原消息ID" },
    { type: "image", file: "https://example.com/image.jpg" }
])
```

### 服务模块使用

```typescript
// 使用消息服务发送
const result = await bot.messageService.sendGuildMessage(
    channelId,
    [
        { type: "text", text: "查看这张图片：" },
        { type: "image", file: "local_image.jpg" }
    ]
)

import { segment } from 'qq-official-bot'

await bot.sendGuildMessage(channelId, [
    segment.text('欢迎 '),
    segment.at(userId),
    segment.text(' 加入频道！'),
    segment.face('1'),
])
```

## 📚 消息段列表

| 类型 | 说明 | 可重复 | 支持平台 | 文档链接 |
|------|------|--------|----------|----------|
| text | 文本消息 | ✅ | 全部 | [文档](./text.md) |
| face | 表情消息 | ✅ | 全部 | [文档](./face.md) |
| at | @提及消息 | ✅ | 全部 | [文档](./at.md) |
| link | 链接消息 | ✅ | 频道 | [文档](./link.md) |
| button | 按钮消息 | ✅ | 全部 | [文档](./button.md) |
| image | 图片消息 | ❌ | 全部 | [文档](./image.md) |
| video | 视频消息 | ❌ | 全部 | [文档](./video.md) |
| audio | 音频消息 | ❌ | 全部 | [文档](./audio.md) |
| markdown | Markdown | ❌ | 频道 | [文档](./markdown.md) |
| ark | Ark 卡片 | ❌ | 频道 | [文档](./ark.md) |
| card | 图文卡片 | ❌ | 群聊、单聊 | [文档](./card.md) |
| embed | 嵌入消息 | ❌ | 频道 | [文档](./embed.md) |
| reply | 回复引用 | 特殊 | 全部 | [文档](./reply.md) |

## ⚡ 快速开始

### 1. 安装和导入

```typescript
import { Bot, MessageBuilder } from 'qq-official-bot'

const bot = new Bot({
    appid: 'your_app_id',
    secret: 'your_secret',
    mode: 'websocket'
})
```

### 2. 发送基础消息

```typescript
// 文本消息
await bot.sendMessage(channelId, "Hello, World!")

// 图片消息
await bot.sendMessage(channelId, {
    type: "image",
    file: "https://example.com/image.jpg"
})
```

### 3. 发送复合消息

```typescript
await bot.sendMessage(channelId, [
    { type: "text", text: "欢迎新成员 " },
    { type: "at", user_id: newMemberId },
    { type: "text", text: "！" },
    { type: "face", id: "1" }
])
```

### 4. 使用消息构建器

```typescript
const message = new MessageBuilder()
    .text("这是一条包含多种元素的消息：")
    .image("image.jpg")
    .reply(sourceMessage)
    .build()

await bot.sendMessage(channelId, message)
```

## 🔧 高级功能

### 消息模板

```typescript
// 创建消息模板
function createWelcomeMessage(userId: string, userName: string) {
    return [
        { type: "text", text: `欢迎 ` },
        { type: "at", user_id: userId },
        { type: "text", text: ` (${userName}) 加入频道！` },
        { type: "face", id: "1" }
    ]
}

// 使用模板
await bot.sendMessage(channelId, createWelcomeMessage("123", "张三"))
```

### 条件消息

```typescript
function createConditionalMessage(hasImage: boolean, text: string, imageUrl?: string) {
    const elements = [{ type: "text", text }]
    
    if (hasImage && imageUrl) {
        elements.push({ type: "image", file: imageUrl })
    }
    
    return elements
}
```

## 🚨 注意事项

1. **类型安全**: 使用 TypeScript 时，IDE 会提供智能提示和类型检查
2. **平台限制**: 某些消息段仅在特定平台（如频道）中支持
3. **组合规则**: 严格遵循消息段组合规则，避免发送失败
4. **文件处理**: 图片、视频、音频支持本地文件、URL 和 Base64 格式
5. **权限要求**: 某些消息类型需要特定的机器人权限

## 📖 更多资源

- [API 参考文档](../api/)
- [TypeScript 接口定义](../interface/)
- [配置指南](../config.md)
- [快速开始](../guide/start.md)

---

💡 **提示**: 消息段设计遵循类型安全原则，能够在编译时发现大部分消息构建错误，提升开发体验。
