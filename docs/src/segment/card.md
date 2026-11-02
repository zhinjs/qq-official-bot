---
layout: doc
---

# 图文卡片

图文卡片用于群聊和单聊发送，使用 `msg_type=8` 与 `card` 字段。它与 `segment.ark()` 的模板卡片不同，也不需要先上传图片获取 `file_info`。

```typescript
import { segment } from 'qq-official-bot'

const card = segment.card({
    title: '最新公告',
    description: '点击查看公告详情',
    url: 'https://example.com/news',
    pic_url: 'https://example.com/cover.png',
})

await bot.sendGroupMessage(group_id, card, { id: original_message_id }, { msgSeq: 1 })
await bot.sendPrivateMessage(user_id, card)
```

公开类型为 `MessageCard` 与 `CardElem`，也可直接构造消息段：

```typescript
interface MessageCard {
    type: 'tuwen'
    content: {
        title: string
        description: string
        url: string
        pic_url: string
    }
}

interface CardElem {
    type: 'card'
    data: MessageCard
}
```

官方要求标题 1–50 字符，描述 1–200 字符；`url` 与 `pic_url` 必须为 HTTPS 地址，长度分别不超过 1024 字符。SDK 按原字段发送，内容和权限由平台校验，发送失败不自动重试。

建议单独发送卡片；需要引用时可用 `[segment.reply(message_id), card]`。频道和频道私信不支持此新类型，SDK 会在发请求前报错。

官方接口：[发送群聊消息](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html)、[发送单聊消息](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html)。
