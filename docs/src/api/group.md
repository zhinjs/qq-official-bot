# 群聊 API

群聊消息相关的 API 操作，包括群消息发送、消息管理、群成员操作等功能。

::: tip 权限要求
需要机器人拥有群聊权限和相应的 Intent 配置
:::

## 📱 群消息管理

### 发送群消息

向指定群聊发送消息。

**方法名**: `bot.group(groupId).send(message, source?)` / `bot.sendGroupMessage(groupId, message, source?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `groupId` | `string` | ✅ | 群 ID |
| `message` | `Sendable` | ✅ | 消息内容 |
| `source` | `Quotable` | ❌ | 引用消息 |

```typescript
await bot.group(group_id).send('Hello Group!')

await bot.sendGroupMessage(group_id, 'Hello, World!')

// 发送富媒体消息
import { segment } from 'qq-official-bot'
await bot.messageService.sendGroupMessage(group_id, [
    segment.text('大家看看这张图片:'),
    segment.image('https://example.com/image.jpg')
])

// 回复群消息
await bot.messageService.sendGroupMessage(group_id, '这是回复', {
    message_id: original_message_id
})

// @群成员
await bot.messageService.sendGroupMessage(group_id, [
    segment.at(user_id),
    segment.text(' 你好!')
])
```

### 撤回群消息

撤回指定的群消息。

**方法名**: `bot.messageService.recallGroupMessage(groupId, messageId)` / `bot.recallGroupMessage(groupId, messageId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `groupId` | `string` | ✅ | 群 ID |
| `messageId` | `string` | ✅ | 消息 ID |

```typescript
// 使用服务模块（推荐）
const result = await bot.messageService.recallGroupMessage(group_id, message_id)
if (result.success) {
    console.log('群消息撤回成功')
}

// 使用传统方法（向后兼容）
const success = await bot.recallGroupMessage(group_id, message_id)
```

## 👥 群聊管理

最新群管理接口集中在 `bot.groupService`，同时提供 `bot.getGroupInfo()` 等快捷方法。

::: warning 权限与频控
群基本信息、机器人群内状态目前仅对白名单机器人开放（30 QPM）。入群审批与禁言要求机器人是群管理员；详细频控以 QQ 官方文档为准。
:::

### 群信息与机器人状态

```typescript
const info = await bot.getGroupInfo(group_openid)
console.log(info.group_name, info.group_member_num, info.group_tags)

const state = await bot.getGroupBotState(group_openid)
console.log(state.member_role, state.recv_msg_setting, state.allow_proactive_msg)
```

### 群成员查询

`members()` 和兼容方法 `getGroupMemberList()` 会自动沿 `next_cursor` 拉取所有分页，最终返回完整成员数组：

```typescript
const members = await bot.group(group_openid).members()

for (const member of members) {
    console.log(member.member_openid, member.username, member.member_role)
}

const member = await bot.group(group_openid).member(member_openid)
console.log(member.joined_at, member.bot, member.union_openid)

// 等价的 Bot 快捷方法，同样返回全部成员
await bot.getGroupMemberList(group_openid)
await bot.getGroupMemberList(group_openid, true) // 忽略缓存，强制重新拉取
await bot.getGroupMemberInfo(group_openid, member_openid)
```

如果需要自行控制请求节奏，可使用单页方法；官方每页最多返回 30 条：

```typescript
const page = await bot.group(group_openid).membersPage({ cursor: '' })
const nextPage = await bot.group(group_openid).membersPage({
    cursor: page.next_cursor,
})
```

成员角色为 `member`、`owner` 或 `admin`，`joined_at` 使用 RFC3339 格式。

#### 可选缓存

配置 `groupMemberCache: true` 后，完整成员列表会缓存在内存中，避免每次调用都重新拉取全部分页；默认不缓存。需要主动更新时：

```typescript
await bot.getGroupMemberList(group_openid, true)
await bot.group(group_openid).refreshMembers()
await bot.group(group_openid).clearMemberCache()
```

缓存支持本地 JSON 持久化，并会根据机器人进退群、成员增加/减少事件增量更新或失效。完整配置参见[群成员缓存](../config.md#群成员缓存)。

### 批量移除群成员

```typescript
const result = await bot.group(group_openid).removeMembers({
    member_openids: ['member-openid-1', 'member-openid-2'],
    add_to_member_blacklist: true,
})

console.log(result.remove_members_result)
console.log(result.add_to_member_blacklist_fail_openids)

// 等价的 Bot 快捷方法
await bot.removeGroupMembers(group_openid, {
    member_openids: ['member-openid-1'],
})
```

单次最多移除 20 名成员。开启 `add_to_member_blacklist` 后，应检查返回的 `add_to_member_blacklist_fail_openids`。

### 群黑名单

```typescript
const blacklist = await bot.group(group_openid).blacklist({
    cursor: '',
    limit: 100,
})

await bot.group(group_openid).blockMembers(['member-openid-1'])
await bot.group(group_openid).unblockMembers(['member-openid-1'])

// 也可以直接指定官方操作结构
await bot.updateGroupMemberBlacklist(group_openid, {
    op: 'add',
    member_openids: ['member-openid-1'],
})
```

黑名单查询默认每页 20 条，最大 100 条；增删单次最多 20 人。只有目标用户已不在群中时才能加入黑名单，可使用批量移除接口的 `add_to_member_blacklist` 一次完成移除和拉黑。

::: warning 内邀能力
群成员列表、成员详情、批量移除及黑名单接口目前均处于官方内邀阶段，未开通的机器人会收到错误码 `11253`。
:::

### 入群申请拉取与审批

```typescript
const page = await bot.getGroupJoinRequests(group_openid, {
    cursor: '',
    limit: 100,
})

const request = page.list[0]
await bot.approveGroupJoinRequest(group_openid, request.member_openid, {
    op: 'approve',
    join_request_id: request.join_request_id,
})

// 拒绝并加入群黑名单
await bot.approveGroupJoinRequest(group_openid, request.member_openid, {
    op: 'decline',
    join_request_id: request.join_request_id,
    reject_reason: '未通过入群验证',
    add_to_member_blacklist: true,
})
```

`limit` 默认 20，最大 100。列表响应中的 `next_cursor` 为空时表示已到末页。

### 群成员禁言

```typescript
const setting = await bot.group(group_openid).muteSetting()

await bot.group(group_openid).mute(member_openid, '2026-08-12T12:00:00+08:00')
await bot.group(group_openid).unmute(member_openid)
```

单次最多设置 10 个成员；只能禁言普通成员，不能操作群主、管理员或机器人。

### 入群自动审批策略

```typescript
const strategy = await bot.createGroupJoinApprovalStrategy({
    group_openids: [group_openid],
    is_enable: 'on',
    remark: '活动白名单',
})

await bot.updateGroupJoinApprovalWhitelist(strategy.strategy_id, {
    op: 'add',
    whitelist_users: ['1234567', '1234568'], // QQ 号使用字符串，避免精度丢失
})

await bot.executeGroupJoinApprovalStrategy(strategy.strategy_id)

const strategies = await bot.getGroupJoinApprovalStrategies({ limit: 20 })
await bot.updateGroupJoinApprovalStrategy(strategy.strategy_id, {
    is_enable: 'off',
})
await bot.deleteGroupJoinApprovalStrategy(strategy.strategy_id)
```

创建策略时 `group_openids` 与 `group_ids` 二选一，最多关联 100 个群；每个机器人最多 20 个策略。白名单单次最多操作 10,000 个 QQ 号，策略总上限 100,000 个。

### 用户申请加群事件

订阅 `GROUP_AND_C2C_EVENT` 后，群管理员机器人可接收官方 `GROUP_JOIN_REQUEST` 事件：

```typescript
bot.on('notice.group.join_request', async (event) => {
    console.log(event.group_id, event.user_id, event.verify_info)

    await bot.approveGroupJoinRequest(event.group_id, event.user_id, {
        op: 'approve',
        join_request_id: event.join_request_id,
    })
})
```

自动审批通过的下行事件会额外携带 `event.auto_approved.strategy_id`。

## 🎯 群消息类型

### 文本消息

```typescript
// 纯文本
await bot.messageService.sendGroupMessage(group_id, 'Hello Group!')

// 带格式文本
await bot.messageService.sendGroupMessage(group_id, '**重要通知** 群聊规则更新')

// @成员消息
import { segment } from 'qq-official-bot'
await bot.messageService.sendGroupMessage(group_id, [
    segment.at(user_id),
    segment.text(' 请注意查看群公告')
])

// @全体成员
await bot.messageService.sendGroupMessage(group_id, [
    segment.at('all'),
    segment.text(' 大家好!')
])
```

### 富媒体消息

```typescript
import { segment } from 'qq-official-bot'

// 公网图片：平台 URL 转存
await bot.messageService.sendGroupMessage(group_id, 
    segment.image('https://example.com/image.jpg')
)

// 本地图片/视频：自动走官方分片上传
await bot.sendGroupMessage(group_id, segment.image('./photo.png'))
await bot.sendGroupMessage(group_id, segment.video('./demo.mp4'))
```

// 语音消息
await bot.messageService.sendGroupMessage(group_id,
    segment.record('https://example.com/audio.mp3')
)

// 视频消息
await bot.messageService.sendGroupMessage(group_id,
    segment.video('https://example.com/video.mp4')
)

// 混合消息
await bot.messageService.sendGroupMessage(group_id, [
    segment.text('群活动通知:'),
    segment.image('https://example.com/activity.jpg'),
    segment.text('\n参与方式请查看图片说明')
])
```

### 卡片消息

```typescript
// Ark 消息（JSON 卡片）
await bot.messageService.sendGroupMessage(group_id, {
    ark: {
        template_id: 23,
        kv: [
            { key: 'title', value: '群活动' },
            { key: 'desc', value: '本周群活动安排' },
            { key: 'img', value: 'https://example.com/activity.jpg' }
        ]
    }
})

// Embed 消息
await bot.messageService.sendGroupMessage(group_id, {
    embed: {
        title: '群公告',
        description: '群聊规则更新通知',
        color: 0x00FF00,
        fields: [
            { name: '更新内容', value: '新增发言规则' },
            { name: '生效时间', value: '即日起' }
        ]
    }
})
```

## 🔗 事件处理

### 监听群消息事件

```typescript
// 监听群消息
bot.on('message.group', async (event) => {
    console.log('收到群消息:', event.raw_message)
    console.log('群 ID:', event.group_id)
    console.log('发送者:', event.sender.user_name)
    
    // 自动回复
    await event.reply('收到群消息了!')
})

// 监听群消息中的@机器人
bot.on('message.group.at', async (event) => {
    await event.reply('有人@我了!')
})
```

> 注意：事件名采用前缀传播，监听 `message.group` 也会收到 `message.group.at` 事件；如需忽略 @ 机器人消息，请在 `message.group` 回调中自行过滤 `event.sub_type === 'at'`。

### 监听群成员变更事件

当群内有成员加入或退出时，会触发 `notice.group.member` 事件（对应官方 `GROUP_MEMBER_ADD` / `GROUP_MEMBER_REMOVE`）。需在 `intents` 中订阅 `GROUP_MEMBER`（`1 << 24`）。

```typescript
const bot = new Bot({
    intents: ['GROUP_AND_C2C_EVENT', 'GROUP_MEMBER'],
    // ...
})
```

```typescript
// 成员加入 / 退出（汇总）
bot.on('notice.group.member', (event) => {
    console.log(`群 ${event.group_id} 成员 ${event.user_id} ${event.actionText}`)
})

// 仅成员加入
bot.on('notice.group.member.increase', (event) => {
    console.log(`新成员 ${event.user_id} 加入群 ${event.group_id}`)
})

// 仅成员退出
bot.on('notice.group.member.decrease', (event) => {
    console.log(`成员 ${event.user_id} 退出群 ${event.group_id}`)
})
```

> 注意：`notice.group.increase` / `notice.group.decrease` 表示**机器人被加入/移出群聊**（`GROUP_ADD_ROBOT` / `GROUP_DEL_ROBOT`），与群成员进退事件不同。

### 群消息过滤

```typescript
// 只处理特定群的消息
bot.on('message.group', async (event) => {
    if (event.group_id === target_group_id) {
        await event.reply('这是来自指定群的消息')
    }
})

// 过滤机器人消息
bot.on('message.group', async (event) => {
    if (event.sender.user_id === bot.self_id) return // 忽略自己的消息
    
    await event.reply('只回复其他成员的消息')
})

// 管理员命令处理
bot.on('message.group', async (event) => {
    if (event.sender.permissions.includes('admin') && event.raw_message.startsWith('/')) {
        // 处理管理员命令
        const command = event.raw_message.slice(1)
        await handleAdminCommand(event, command)
    }
})
```

## 📊 TypeScript 接口

```typescript
// 群消息事件接口
interface GroupMessageEvent extends Message {
    message_type: 'group'
    group_id: string
    group_name?: string
    sender: {
        user_id: string
        user_name: string
        permissions: string[]
    }
    
    // 方法
    reply(message: Sendable): Promise<any>
}

interface GroupInfo {
    group_openid: string
    group_name: string
    group_finger_memo: string
    group_class_text: string
    group_tags: string[]
    group_member_num: number
}

interface GroupBotState {
    member_openid: string
    joined_at: string // RFC3339
    allow_proactive_msg: boolean
    recv_msg_setting: 'all' | 'only_mention' | 'mention_and_context'
    member_role: 'member' | 'owner' | 'admin'
}
```

## ⚠️ 注意事项

1. **权限要求**: 发送群消息需要相应的 Intent 权限配置
2. **频率限制**: 群消息有发送频率限制，请合理控制发送速度
3. **@功能**: 使用@功能时需要确保机器人有@权限
4. **消息类型**: 不同群可能对消息类型有不同限制
5. **群管理**: 入群审批、禁言等操作要求机器人拥有群管理员身份
6. **机器人限制**: 某些群可能禁止机器人发言或限制功能
7. **API 支持**: 部分群管理 API 可能在某些版本中不支持

## 📚 相关链接

- [QQ 机器人获取群基本信息](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_info.get.html)
- [QQ 机器人群管理变更记录](https://bot.q.qq.com/wiki/develop/api-v2/changelog.html)
- [消息格式参考](../interface/index.md#消息类型)
- [权限配置指南](../config.md#intent-配置)
