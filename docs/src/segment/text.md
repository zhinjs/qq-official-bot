---
layout: doc
---

# 文本消息段

文本消息段是最基础的消息类型，用于发送纯文本内容。它可以单独使用，也可以与其他消息段组合使用。

## 📋 基本信息

- **类型标识**: `text`
- **可重复**: ✅ 是
- **支持平台**: 全部（频道、群聊、私聊）
- **组合规则**: 可与其他可重复消息段组合

## 🔧 参数说明

| 属性名 | 类型   | 必填 | 说明     |
|--------|--------|------|----------|
| type   | string | ✅   | 固定为 `text` |
| text   | string | ✅   | 文本内容 |

## 💡 使用示例

### 基础用法

```typescript
import { segment } from 'qq-official-bot'

// 直接发送字符串（推荐）
await bot.sendGuildMessage(channelId, "这是一条文本消息")

// 使用消息段格式
await bot.sendGuildMessage(channelId, segment.text("这是一条文本消息"))
```

### 服务模块用法

```typescript
// 使用消息服务
await bot.messageService.sendGuildMessage(
    channelId,
    "使用服务模块发送文本"
)

// 传统方法
await bot.sendGuildMessage(channelId, "传统方法发送文本")
```

### 组合使用

```typescript
// 与其他消息段组合
await bot.sendGuildMessage(channelId, [
    segment.text("你好，"),
    segment.at("123456"),
    segment.text("！欢迎加入频道！")
])
```

### 特殊文本处理

```typescript
// 包含换行的文本
await bot.sendGuildMessage(channelId, segment.text("第一行\n第二行\n第三行"))

// 包含特殊字符的文本
await bot.sendGuildMessage(channelId, segment.text("特殊字符：@ # $ % & *"))

// 长文本消息
const longText = "这是一条很长的文本消息...".repeat(10)
await bot.sendGuildMessage(channelId, segment.text(longText))
```

## 🔗 与其他消息段组合

### 文本 + @提及

```typescript
await bot.sendGuildMessage(channelId, [
    segment.text("欢迎新成员 "),
    segment.at("123456"),
    segment.text(" 加入我们！")
])
```

### 文本 + 表情

```typescript
await bot.sendGuildMessage(channelId, [
    segment.text("今天心情不错 "),
    segment.face(1),
    segment.text(" 大家好！")
])
```

### 文本 + 子频道链接（仅频道）

```typescript
await bot.sendGuildMessage(channelId, [
    segment.text("查看更多信息："),
    segment.link("target_channel_id") // 发送为 <#target_channel_id>
])
```

## 🎯 最佳实践

### 1. 优先使用字符串

对于纯文本消息，直接使用字符串更简洁：

```typescript
// ✅ 推荐
await bot.sendGuildMessage(channelId, "简单的文本消息")

// ❌ 不推荐（过度复杂）
await bot.sendGuildMessage(channelId, segment.text("简单的文本消息"))
```

### 2. 合理使用换行

```typescript
// ✅ 良好的格式
await bot.sendGuildMessage(channelId, 
    "欢迎使用 QQ 机器人！\n" +
    "使用 /help 查看帮助\n" +
    "祝您使用愉快！"
)
```

### 3. 处理用户输入

```typescript
function sanitizeUserInput(input: string): string {
    // 移除或转义危险字符
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .slice(0, 1000) // 限制长度
}

const userMessage = sanitizeUserInput(userInput)
await bot.sendGuildMessage(channelId, segment.text(`用户说：${userMessage)`
})
```

## 📝 组合文本

用 `segment` 组装 `Sendable`，不要依赖内部的 `MessageBuilder`：

```typescript
import { segment } from 'qq-official-bot'

await bot.sendGuildMessage(channelId, [
    segment.text('这是开头'),
    segment.text('这是中间'),
    segment.text('这是结尾'),
])
```

## ⚠️ 注意事项

1. **字符限制**: 单条文本消息有长度限制（通常为 4000 字符）
2. **换行处理**: 使用 `\n` 表示换行
3. **特殊字符**: 某些特殊字符可能需要转义
4. **编码格式**: 确保文本使用 UTF-8 编码
5. **内容安全**: 避免发送敏感或违规内容

## 🔄 事件处理

接收文本消息事件：

```typescript
bot.on('message.guild', (event) => {
    if (event.message[0]?.type === 'text') {
        const textContent = event.message[0].text
        console.log('收到文本消息:', textContent)
        
        // 回复文本消息
        event.reply(`你说的是：${textContent}`)
    }
})
```

## 🧪 错误处理

```typescript
async function sendTextSafely(channelId: string, text: string) {
    try {
        if (!text || text.trim().length === 0) {
            throw new Error('文本内容不能为空')
        }
        
        if (text.length > 4000) {
            text = text.slice(0, 4000) + '...'
        }
        
        await bot.sendGuildMessage(channelId, segment.text(text))
    } catch (error) {
        console.error('发送文本消息失败:', error)
    }
}
```

## 📚 相关链接

- [消息段概述](./index.md)
- [@提及消息段](./at.md)
- [表情消息段](./face.md)
- [回复消息段](./reply.md)

---

💡 **提示**: 文本消息段是构建复杂消息的基础，掌握其用法对于机器人开发至关重要。
