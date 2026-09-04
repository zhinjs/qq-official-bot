# TypeScript 接口定义

本文档详细介绍了 QQ 官方机器人 SDK 中的所有 TypeScript 接口定义，包括事件类型、数据结构和服务响应类型。

## 📋 目录

- [基础类型](#基础类型)
- [机器人配置](#机器人配置)
- [事件接口](#事件接口)
- [数据实体](#数据实体)
- [服务响应](#服务响应)
- [消息类型](#消息类型)
- [权限与角色](#权限与角色)

## 🔧 基础类型

### 通用类型定义

```typescript
// 通用字典类型
type Dict<T = any, K extends string | symbol = string> = Record<K, T>

// 日志级别
type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "mark" | "off"

// WebSocket 数据包
interface DataPacket {
    op: number      // opcode ws的类型
    d?: Record<string, any>
    s: number       // 心跳的唯一标识
    t: string       // 事件类型
    id?: string     // 事件ID
}

// API 基础信息
type ApiBaseInfo = {
    path: string
    method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT"
}
```

### 事件意图类型

```typescript
type Intent = 
    // 频道事件
    | 'GUILDS'
    // 频道成员事件
    | 'GUILD_MEMBERS'
    // 频道消息事件
    | 'GUILD_MESSAGES'
    // 频道消息表态事件
    | 'GUILD_MESSAGE_REACTIONS'
    // 频道私信事件
    | 'DIRECT_MESSAGE'
    // 群成员变更事件
    | 'GROUP_MEMBER'
    // 私聊与群聊消息事件
    | 'GROUP_AND_C2C_EVENT'
    // 互动事件
    | 'INTERACTION'
    // 消息审核事件
    | 'MESSAGE_AUDIT'
    // 论坛事件(仅私域)
    | 'FORUMS_EVENT'
    // 音频操作事件
    | 'AUDIO_ACTION'
    // 公域机器人消息事件
    | 'PUBLIC_GUILD_MESSAGES'
```

## ⚙️ 机器人配置

### 机器人基础配置

```typescript
namespace Bot {
    interface Info {
        id: string
        username: string
        avatar: string
        union_openid?: string
        union_user_account?: string
    }

    type Config<T extends ReceiverMode, M extends ApplicationPlatform = ApplicationPlatform> = {
        appid: string              // 机器人 APP ID
        secret: string             // 机器人密钥
        sandbox?: boolean          // 已废弃，保留用于兼容旧配置
        apiBaseUrl?: string        // OpenAPI 根地址，默认 https://api.bot.qq.com
        groupMemberCache?: boolean | GroupMemberCacheOptions // 默认关闭
        guildMemberCache?: boolean | GuildMemberCacheOptions // 默认关闭
        guildCache?: boolean | GuildCacheOptions // 默认关闭
        timeout?: number           // 请求超时时间（毫秒）
        maxRetry?: number          // 最大重试次数
        removeAt?: boolean         // 是否移除 @ 提及
        intents?: Intent[]         // 事件监听意图
        logLevel?: LogLevel        // 日志级别
        mode: T                    // 接收器模式
    } & Client.Config<T, M>
}
```

### 客户端配置

```typescript
namespace Client {
    type Config<T extends ReceiverMode, M extends ApplicationPlatform = ApplicationPlatform> = {
        // 基础配置继承自 Bot.Config
    }
}
```

## 📨 事件接口

### 消息事件

```typescript
// 消息事件基础接口
interface MessageEvent {
    reply(message: Sendable, quote?: boolean): Promise<any>
}

// 私聊消息事件
class PrivateMessageEvent extends Message implements MessageEvent {
    message_type: 'private'
    sub_type: 'direct' | 'friend'
    
    async reply(message: Sendable): Promise<any>
    async recall(): Promise<boolean>
}

// 群聊消息事件
class GroupMessageEvent extends Message implements MessageEvent {
    message_type: 'group'
    group_id: string
    
    async reply(message: Sendable): Promise<any>
    async recall(): Promise<boolean>
}

// 频道消息事件
class GuildMessageEvent extends Message implements MessageEvent {
    message_type: 'guild'
    guild_id: string
    guild_name: string
    channel_id: string
    channel_name: string
    
    async reply(message: Sendable): Promise<any>
    async recall(hidetip?: boolean): Promise<boolean>
    async asAnnounce(): Promise<Announce>
    async pin(): Promise<PinsMessage>
    async reaction(type: EmojiType, id: `${number}`): Promise<boolean>
    async deleteReaction(type: EmojiType, id: `${number}`): Promise<boolean>
    async getReactionMembers(type: EmojiType, id: `${number}`): Promise<any[]>
}
```

### 通知事件

```typescript
// 通知事件基础类
class NoticeEvent {
    notice_type: 'friend' | 'group' | 'direct' | 'channel' | 'forum' | 'guild'
    sub_type: string
    guild_id?: string
    channel_id?: string
    group_id?: string
    operator_id?: string
    
    constructor(public bot: Bot, payload: Dict)
}

// 频道变更通知
class GuildChangeNoticeEvent extends NoticeEvent {
    guild_id: string
    guild_name: string
    operator_id: string
    time: number
    sub_type: 'increase' | 'update' | 'decrease'
}

// 频道成员变更通知
class GuildMemberChangeNoticeEvent extends NoticeEvent {
    guild_id: string
    operator_id: string
    user_id: string
    user_name: string
    is_bot: boolean
    time: number
    sub_type: 'member.increase' | 'member.update' | 'member.decrease'
}

// 消息表态通知
class MessageReactionNoticeEvent extends NoticeEvent {
    user_id: string
    message_id: string
    channel_id: string
    sub_type: 'add' | 'remove'
    guild_id: string
    emoji: Emoji
}

// 操作通知事件
class ActionNoticeEvent extends NoticeEvent {
    event_id: string
    notice_id: string
    data: ActionNoticeEvent.ActionData
    
    async reply(code: ActionNoticeEvent.ReplyCode = 0): Promise<boolean>
}

namespace ActionNoticeEvent {
    type ReplyCode = 0 | 1 | 2 | 3 | 4 | 5
    type ActionData = {
        type: number
        resolved: {
            button_data?: string
            button_id: string
            user_id?: string
            feature_id?: string
            message_id?: string
        }
    }
}
```

## 🏢 数据实体

### 用户信息

```typescript
namespace User {
    interface Info {
        id: string
        username: string
        avatar: string
        bot: boolean
        public_flag: number
    }

    enum Permission {
        normal = 1,
        admin = 2,
        owner = 4,
        channelAdmin = 5,
    }
}
```

### 频道信息

```typescript
namespace Guild {
    interface Info {
        id: string
        name: string
        icon: string
        owner_id: string
        owner: boolean
        join_time: number
        member_count: number
        max_members: number
        description: string
    }

    type ApiInfo = Omit<Info, 'id' | 'name'> & {
        guild_id: string
        guild_name: string
    }

    interface Role {
        id: string
        name: string
        color: string
        hoist: boolean
        number: number
        member_limit: number
    }
}
```

### 子频道信息

```typescript
namespace Channel {
    interface Info {
        id: string
        guild_id: string
        name: string
        type: ChannelType
        sub_type: ChannelSubType
        position: number
        parent_id?: string
        owner_id: string
        private_type: PrivateType
        speak_permission: SpeakPermission
        application_id?: string
        permissions?: string
    }

    type ApiInfo = Omit<Info, 'id' | 'name'> & {
        channel_id: string
        channel_name: string
    }
}

// 频道类型枚举
enum ChannelType {
    Content = 0,    // 文本频道
    Record = 2,     // 语音频道
    ChannelGroup = 4, // 频道分组
    Live = 10005,   // 直播频道
    App = 10006,    // 应用频道
    Forms = 10007,  // 论坛频道
}

// 频道子类型
enum ChannelSubType {
    Chat = 0,       // 闲聊
    Announces = 1,  // 公告
    Strategy = 2,   // 攻略
    Black = 3,      // 开黑
}

// 私有类型
enum PrivateType {
    Public = 0,     // 公开
    Admin = 1,      // 频道主和管理员
    Some = 2,       // 频道主、管理员以及指定成员
}

// 发言权限
enum SpeakPermission {
    All = 1,        // 所有人
    // ... 其他权限值
}
```

### 频道成员信息

```typescript
namespace GuildMember {
    interface Info {
        user: User.Info
        nick: string
        roles: string[]
        join_time: number
    }

    interface ApiInfo {
        member_id: string
        username: string
        avatar: string
        card: string
        bot?: boolean
        roles: string[]
        join_time: number
        union_openid?: string
        union_user_account?: string
    }
}
```

### 群组信息

```typescript
namespace Group {
    interface Info {
        id: string
        name: string
    }
}

namespace GroupMember {
    interface Info {
        user: User.Info
        group_id: string
    }
}
```

### 好友信息

```typescript
namespace Friend {
    interface Info {
        id: string
        user: User.Info
        name: string
    }
}
```

## 🔄 服务响应

### 统一响应格式

```typescript
type ApiResponse<T> = {
    success: boolean
    data?: T
    message?: string
    error?: {
        code: number
        message: string
    }
}
```

### 消息相关类型

```typescript
namespace Message {
    interface Sender {
        user_id: string
        user_name: string
        permissions: User.Permission[]
    }

    type Ret = MessageRet | FileInfo
    
    type MessageRet = {
        id: string
        timestamp: number
    }
    
    type Audit = {
        message_audit: {
            audit_id: string
        }
    }
    
    type FileInfo = {
        file_uuid: string
        file_info: string
        ttl: number
    }
    
    type Type = 'private' | 'group' | 'guild'
    type SubType = 'direct' | 'friend' | 'temp' | 'normal'
}
```

## 🎨 消息元素类型

### 可发送内容

```typescript
// 可发送的内容类型
type Sendable = string | MessageElem | (string | MessageElem)[]

// 可引用的消息
interface Quotable {
    id?: string
    event_id?: string
}

// 消息元素接口
interface MessageElem {
    type: string
    [key: string]: any
}
```

### 表态相关

```typescript
// 表情类型
enum EmojiType {
    System = 1,     // 系统表情
    Emoji = 2       // emoji 表情
}

// 表态目标类型
enum ReactionTargetType {
    Message,
    Thread,
    Comment,
    Reply,
    ReactionTargetType_MSG = 'ReactionTargetType_MSG'
}

// 表情信息
type Emoji = {
    id: string
    type: EmojiType
}

// 表态目标
type ReactionTarget = {
    id: string
    type: ReactionTargetType
}
```

## 📝 论坛相关

### 帖子信息

```typescript
interface Thread {
    guild_id: string
    channel_id: string
    author_id: string
    thread_info: ThreadInfo
}

interface ThreadInfo {
    thread_id: string
    title: string
    content: string
    date_time: number
}

interface Post {
    guild_id: string
    channel_id: string
    author_id: string
    post_info: PostInfo
}

interface PostInfo {
    thread_id: string
    post_id: string
    content: string
    date_time: number
}

interface Reply {
    guild_id: string
    channel_id: string
    author_id: string
    reply_info: ReplyInfo
}

interface ReplyInfo {
    thread_id: string
    post_id: string
    reply_id: string
    content: string
    date_time: number
}
```

## 🎵 音频相关

### 音频控制

```typescript
interface AudioControl {
    audio_url?: string
    text?: string
    status: AudioStatus
}

interface AudioAction {
    guild_id: string
    channel_id: string
    audio_url: string
    text: string
}

type AudioStatus = 0 | 1 | 2 | 3
```

## 📅 日程相关

```typescript
interface ScheduleInfo {
    id?: string
    name: string
    description?: string
    start_timestamp: string
    end_timestamp: string
    creator?: GuildMember.ApiInfo
    jump_channel_id: string
    remind_type: RemindType
}

type RemindType = 0 | 1 | 2 | 3 | 4 | 5 | 6
```

## 🔐 权限相关

### 权限参数

```typescript
type ChannelPermissions = {
    channel_id: string
    permissions: string
}

type ChannelMemberPermissions = {
    user_id: string
} & ChannelPermissions

type ChannelRolePermissions = {
    role_id: string
} & ChannelPermissions

type UpdatePermissionParams = {
    add?: string
    remove?: string
}
```

### 角色管理

```typescript
type RoleCreateParam = {
    name?: string
    color: number
    hoist: 0 | 1
}

type RoleUpdateParam = Partial<Pick<Guild.Role, 'id' | 'name' | 'color' | 'hoist'>>
```

## 📢 公告相关

```typescript
enum AnnounceType {
    Member,
    Welcome
}

type Announce = {
    guild_id: string
    channel_id: string
    message_id: string
    announces_type: AnnounceType
    recommend_channels: { 
        channel_id: string
        introduce: string 
    }[]
}

type PinsMessage = {
    guild_id: string
    channel_id: string
    message_ids: string[]
}
```

## 🔗 私信相关

```typescript
interface DMS {
    guild_id: string
    channel_id: string
    create_time: number
}
```

## 🛠️ API 权限

```typescript
type ApiPermissionDemand = {
    guild_id: string
    channel_id: string
    api_identify: ApiBaseInfo
    title: string
    desc: string
}
```

## 📖 使用示例

### 事件监听示例

```typescript
import { Bot, GuildMessageEvent, PrivateMessageEvent } from 'qq-official-bot'

const bot = new Bot({
    appid: 'your_app_id',
    secret: 'your_secret',
    intents: ['GUILD_MESSAGES', 'DIRECT_MESSAGE'],
    mode: 'websocket'
})

// 频道消息事件
bot.on('message.guild', (event: GuildMessageEvent) => {
    console.log(`收到频道消息: ${event.raw_message}`)
    event.reply('你好！')
})

// 私聊消息事件
bot.on('message.private.friend', (event: PrivateMessageEvent) => {
    console.log(`收到私聊消息: ${event.raw_message}`)
    event.reply('私聊回复')
})
```

### 服务调用示例

```typescript
// 使用服务模块
const guildInfo = await bot.guildService.getInfo('guild_id')
if (guildInfo.success) {
    console.log('频道信息:', guildInfo.data)
}

// 发送消息
const result = await bot.messageService.sendGuildMessage(
    'channel_id',
    '这是一条消息'
)
```

---

💡 **提示**: 所有接口都提供了完整的 TypeScript 类型支持，IDE 会提供智能提示和类型检查。
