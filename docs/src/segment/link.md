---
layout: doc
---

# 链接消息段

链接消息段用于在**频道消息**中插入子频道跳转链接，发送时会被转换为 `<#channel_id>`，用户点击即可跳转到对应子频道。

::: warning 仅支持子频道链接
`segment.link` 只接受子频道 ID，不支持外部 URL、自定义显示文字或标题描述。
需要外部链接时，请使用 [Markdown](./markdown.md) 的链接语法，或使用跳转类型（`action.type = 0`）的[按钮](./button.md)。
:::

## 类型定义

```typescript
interface LinkElement {
  type: 'link'
  data: {
    channel_id: string
  }
}
```

## 参数说明

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| channelId | string | ✅ | 目标子频道 ID |

## 使用示例

### 发送子频道链接

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

await bot.sendGuildMessage(channelId, [
  segment.text('请前往 '),
  segment.link('target_channel_id'),
  segment.text(' 了解更多信息'),
])
// 实际发送: { "content": "请前往 <#target_channel_id> 了解更多信息" }
```

### 子频道导航

```typescript
await bot.sendGuildMessage(channelId, [
  segment.text('🏠 大厅：'),
  segment.link('general_channel_id'),
  segment.text('\n📢 公告：'),
  segment.link('announcement_channel_id'),
  segment.text('\n❓ 帮助：'),
  segment.link('help_channel_id'),
])
```

### 在事件中回复

```typescript
bot.on('message.guild', async (event) => {
  if (event.raw_message.includes('帮助')) {
    await event.reply([
      segment.text('请到 '),
      segment.link('help_channel_id'),
      segment.text(' 提问'),
    ])
  }
})
```

### 频道私信

频道私信同样使用 `<#channel_id>` 语法：

```typescript
await bot.sendDirectMessage(guildId, [
  segment.text('相关讨论在 '),
  segment.link('discussion_channel_id'),
])
```

## 外部链接的替代方案

```typescript
// 1. Markdown 链接（需要机器人具备 Markdown 能力）
await bot.sendGroupMessage(groupId, segment.markdown('[查看文档](https://docs.example.com)'))

// 2. 跳转按钮（action.type = 0 为跳转）
await bot.sendGroupMessage(groupId, [
  segment.markdown('点击下方按钮查看文档'),
  segment.button({
    id: 'open_docs',
    render_data: { label: '查看文档', style: 1 },
    action: { type: 0, data: 'https://docs.example.com' },
  }),
])
```

## 组合规则

- ✅ 文本、@、表情、回复、其他子频道链接
- ❌ 单聊、群聊：`<#channel_id>` 只在频道场景生效

## 限制说明

1. **使用范围**：频道与频道私信
2. **频道权限**：用户需要有访问目标子频道的权限
3. **仅子频道**：不支持外部 URL；外部链接请使用 Markdown 或跳转按钮
