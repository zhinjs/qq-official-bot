import {GroupMessageEvent, GuildMessageEvent, MessageAuditEvent, MessageEvent, PrivateMessageEvent} from "./message";
import type { Bot } from "@/bot";
import type { Dict } from "@/types";
import {
    ActionNoticeEvent,
    FormAuditNoticeEvent,
    ChannelChangeNoticeEvent,
    ForumNoticeEvent,
    FriendActionNoticeEvent,
    FriendChangeNoticeEvent,
    FriendReceiveNoticeEvent,
    GroupActionNoticeEvent,
    GroupChangeNoticeEvent,
    GroupMemberChangeNoticeEvent,
    GroupJoinRequestNoticeEvent,
    GroupReceiveNoticeEvent,
    GuildActionNoticeEvent,
    GuildChangeNoticeEvent,
    GuildMemberChangeNoticeEvent,
    MessageReactionNoticeEvent,
    NoticeEvent,
    PostChangeNoticeEvent,
    ReplyChangeNoticeEvent,
    SubscribeStatusNoticeEvent,
    ThreadChangeNoticeEvent
} from "@/events/notice";
import {ReceiverMode} from "@/receivers";
import {ApplicationPlatform} from "@/receivers/middleware";

export * from "./message"
export { GroupJoinRequestNoticeEvent, SubscribeStatusNoticeEvent } from './notice'

export type EventParser<T extends keyof EventMap = keyof EventMap> = (this: Bot<ReceiverMode, ApplicationPlatform>, event: T, payload: Dict) => Parameters<EventMap[T]>[0]

export type EventRegistration = {
    gateway: string
    name: string
    parser: EventParser
    resolve?: (payload: Dict) => string
    also?: readonly string[]
}

function interactionName(payload: Dict): string {
    switch (ActionNoticeEvent.resolveScene(payload)) {
        case 'c2c': return 'notice.friend.action'
        case 'group': return 'notice.group.action'
        case 'guild': return 'notice.guild.action'
        default: return 'notice'
    }
}

/** 一张表：网关名 → 内部名 → parser。新事件只在这里加一行。 */
export const EVENT_REGISTRY = [
    { gateway: 'DIRECT_MESSAGE_CREATE', name: 'message.private.direct', parser: MessageEvent.parse },
    { gateway: 'AT_MESSAGE_CREATE', name: 'message.guild', parser: MessageEvent.parse },
    { gateway: 'MESSAGE_CREATE', name: 'message.guild', parser: MessageEvent.parse },
    { gateway: 'C2C_MESSAGE_CREATE', name: 'message.private.friend', parser: MessageEvent.parse },
    { gateway: 'GROUP_MESSAGE_CREATE', name: 'message.group', parser: MessageEvent.parse },
    { gateway: 'GROUP_AT_MESSAGE_CREATE', name: 'message.group.at', parser: MessageEvent.parse },
    { gateway: 'MESSAGE_AUDIT_PASS', name: 'message.audit.pass', parser: MessageAuditEvent.parse },
    { gateway: 'MESSAGE_AUDIT_REJECT', name: 'message.audit.reject', parser: MessageAuditEvent.parse },
    {
        gateway: 'INTERACTION_CREATE',
        name: 'notice',
        parser: ActionNoticeEvent.parse,
        resolve: interactionName,
        also: ['notice.friend.action', 'notice.group.action', 'notice.guild.action'] as const,
    },
    {
        gateway: 'SUBSCRIBE_MESSAGE_STATUS',
        name: 'notice',
        parser: SubscribeStatusNoticeEvent.parse,
        resolve: (payload: Dict) => payload.group_openid ? 'notice.group.subscribe' : 'notice.friend.subscribe',
        also: ['notice.friend.subscribe', 'notice.group.subscribe'] as const,
    },
    { gateway: 'FRIEND_ADD', name: 'notice.friend.increase', parser: FriendChangeNoticeEvent.parse },
    { gateway: 'FRIEND_DEL', name: 'notice.friend.decrease', parser: FriendChangeNoticeEvent.parse },
    { gateway: 'C2C_MSG_REJECT', name: 'notice.friend.receive_close', parser: FriendReceiveNoticeEvent.parse },
    { gateway: 'C2C_MSG_RECEIVE', name: 'notice.friend.receive_open', parser: FriendReceiveNoticeEvent.parse },
    { gateway: 'GROUP_ADD_ROBOT', name: 'notice.group.increase', parser: GroupChangeNoticeEvent.parse },
    { gateway: 'GROUP_DEL_ROBOT', name: 'notice.group.decrease', parser: GroupChangeNoticeEvent.parse },
    { gateway: 'GROUP_MEMBER_ADD', name: 'notice.group.member.increase', parser: GroupMemberChangeNoticeEvent.parse },
    { gateway: 'GROUP_MEMBER_REMOVE', name: 'notice.group.member.decrease', parser: GroupMemberChangeNoticeEvent.parse },
    { gateway: 'GROUP_JOIN_REQUEST', name: 'notice.group.join_request', parser: GroupJoinRequestNoticeEvent.parse },
    { gateway: 'GROUP_MSG_REJECT', name: 'notice.group.receive_close', parser: GroupReceiveNoticeEvent.parse },
    { gateway: 'GROUP_MSG_RECEIVE', name: 'notice.group.receive_open', parser: GroupReceiveNoticeEvent.parse },
    { gateway: 'GUILD_CREATE', name: 'notice.guild.increase', parser: GuildChangeNoticeEvent.parse },
    { gateway: 'GUILD_UPDATE', name: 'notice.guild.update', parser: GuildChangeNoticeEvent.parse },
    { gateway: 'GUILD_DELETE', name: 'notice.guild.decrease', parser: GuildChangeNoticeEvent.parse },
    { gateway: 'CHANNEL_CREATE', name: 'notice.channel.increase', parser: ChannelChangeNoticeEvent.parse },
    { gateway: 'CHANNEL_UPDATE', name: 'notice.channel.update', parser: ChannelChangeNoticeEvent.parse },
    { gateway: 'CHANNEL_DELETE', name: 'notice.channel.decrease', parser: ChannelChangeNoticeEvent.parse },
    { gateway: 'AUDIO_OR_LIVE_CHANNEL_MEMBER_ENTER', name: 'notice.channel.enter', parser: ChannelChangeNoticeEvent.parse },
    { gateway: 'AUDIO_OR_LIVE_CHANNEL_MEMBER_EXIT', name: 'notice.channel.exit', parser: ChannelChangeNoticeEvent.parse },
    { gateway: 'GUILD_MEMBER_ADD', name: 'notice.guild.member.increase', parser: GuildMemberChangeNoticeEvent.parse },
    { gateway: 'GUILD_MEMBER_UPDATE', name: 'notice.guild.member.update', parser: GuildMemberChangeNoticeEvent.parse },
    { gateway: 'GUILD_MEMBER_REMOVE', name: 'notice.guild.member.decrease', parser: GuildMemberChangeNoticeEvent.parse },
    { gateway: 'MESSAGE_REACTION_ADD', name: 'notice.reaction.add', parser: MessageReactionNoticeEvent.parse },
    { gateway: 'MESSAGE_REACTION_REMOVE', name: 'notice.reaction.remove', parser: MessageReactionNoticeEvent.parse },
    { gateway: 'FORUM_THREAD_CREATE', name: 'notice.forum.thread.create', parser: ForumNoticeEvent.parse },
    { gateway: 'FORUM_THREAD_UPDATE', name: 'notice.forum.thread.update', parser: ForumNoticeEvent.parse },
    { gateway: 'FORUM_THREAD_DELETE', name: 'notice.forum.thread.delete', parser: ForumNoticeEvent.parse },
    { gateway: 'FORUM_POST_CREATE', name: 'notice.forum.post.create', parser: ForumNoticeEvent.parse },
    { gateway: 'FORUM_POST_DELETE', name: 'notice.forum.post.delete', parser: ForumNoticeEvent.parse },
    { gateway: 'FORUM_REPLY_CREATE', name: 'notice.forum.reply.create', parser: ForumNoticeEvent.parse },
    { gateway: 'FORUM_REPLY_DELETE', name: 'notice.forum.reply.delete', parser: ForumNoticeEvent.parse },
    { gateway: 'FORUM_PUBLISH_AUDIT_RESULT', name: 'notice.forum.audit', parser: ForumNoticeEvent.parse },
    { gateway: 'OPEN_FORUM_THREAD_CREATE', name: 'notice.forum', parser: ForumNoticeEvent.parse },
    { gateway: 'OPEN_FORUM_THREAD_UPDATE', name: 'notice.forum', parser: ForumNoticeEvent.parse },
    { gateway: 'OPEN_FORUM_THREAD_DELETE', name: 'notice.forum', parser: ForumNoticeEvent.parse },
    { gateway: 'OPEN_FORUM_POST_CREATE', name: 'notice.forum', parser: ForumNoticeEvent.parse },
    { gateway: 'OPEN_FORUM_POST_DELETE', name: 'notice.forum', parser: ForumNoticeEvent.parse },
    { gateway: 'OPEN_FORUM_REPLY_CREATE', name: 'notice.forum', parser: ForumNoticeEvent.parse },
    { gateway: 'OPEN_FORUM_REPLY_DELETE', name: 'notice.forum', parser: ForumNoticeEvent.parse },
] as const

const gatewayIndex = new Map<string, (typeof EVENT_REGISTRY)[number]>(
    EVENT_REGISTRY.map(entry => [entry.gateway, entry])
)

/** @deprecated 由 EVENT_REGISTRY 生成；新代码请用 resolveGatewayEvent */
export const QQEvent: Record<string, string> = Object.fromEntries(
    EVENT_REGISTRY.map(entry => [entry.gateway, entry.name])
)

export const EventParserMap: Map<string, EventParser> = new Map()
for (const entry of EVENT_REGISTRY) {
    EventParserMap.set(entry.name, entry.parser)
    if ('also' in entry) {
        for (const alias of entry.also) {
            EventParserMap.set(alias, entry.parser)
        }
    }
}

export function resolveGatewayEvent(gateway: string, payload: Dict): { name: string; parser: EventParser } | undefined {
    const entry = gatewayIndex.get(gateway)
    if (!entry) return undefined
    return {
        name: 'resolve' in entry && entry.resolve ? entry.resolve(payload) : entry.name,
        parser: entry.parser,
    }
}

export interface EventMap {
    'message'(e: PrivateMessageEvent | GroupMessageEvent | GuildMessageEvent|MessageAuditEvent): void
    'message.audit'(e:MessageAuditEvent):void
    'message.audit.pass'(e:MessageAuditEvent):void
    'message.audit.reject'(e:MessageAuditEvent):void
    'message.group'(e: GroupMessageEvent): void
    'message.group.at'(e: GroupMessageEvent): void

    'message.private'(e: PrivateMessageEvent): void
    'message.private.friend'(e: PrivateMessageEvent): void

    'message.private.direct'(e: PrivateMessageEvent): void

    'message.guild'(e: GuildMessageEvent): void

    'notice'(e: NoticeEvent): void

    'notice.friend'(e: FriendActionNoticeEvent | FriendChangeNoticeEvent | FriendReceiveNoticeEvent | SubscribeStatusNoticeEvent): void

    'notice.friend.subscribe'(e: SubscribeStatusNoticeEvent): void

    'notice.friend.action'(e: FriendActionNoticeEvent): void

    'notice.friend.increase'(e: FriendChangeNoticeEvent): void

    'notice.friend.decrease'(e: FriendChangeNoticeEvent): void

    'notice.friend.receive_close'(e: FriendReceiveNoticeEvent): void

    'notice.friend.receive_open'(e: FriendReceiveNoticeEvent): void
    'notice.reaction.add'(e:MessageReactionNoticeEvent):void
    'notice.reaction.remove'(e: MessageReactionNoticeEvent): void

    'notice.group'(e: ActionNoticeEvent | GroupChangeNoticeEvent | GroupMemberChangeNoticeEvent | GroupReceiveNoticeEvent | GroupJoinRequestNoticeEvent | SubscribeStatusNoticeEvent): void

    'notice.group.subscribe'(e: SubscribeStatusNoticeEvent): void

    'notice.group.increase'(e: GroupChangeNoticeEvent): void

    'notice.group.decrease'(e: GroupChangeNoticeEvent): void

    'notice.group.member'(e: GroupMemberChangeNoticeEvent): void

    'notice.group.member.increase'(e: GroupMemberChangeNoticeEvent): void

    'notice.group.member.decrease'(e: GroupMemberChangeNoticeEvent): void

    'notice.group.join_request'(e: GroupJoinRequestNoticeEvent): void

    'notice.group.receive_close'(e: GroupReceiveNoticeEvent): void

    'notice.group.receive_open'(e: GroupReceiveNoticeEvent): void

    'notice.group.action'(e: GroupActionNoticeEvent): void

    'notice.guild'(e: ActionNoticeEvent | GuildChangeNoticeEvent | GuildMemberChangeNoticeEvent): void

    'notice.guild.action'(e: GuildActionNoticeEvent): void

    'notice.guild.increase'(e: GuildChangeNoticeEvent): void

    'notice.guild.update'(e: GuildChangeNoticeEvent): void

    'notice.guild.decrease'(e: GuildChangeNoticeEvent): void

    'notice.channel'(e: ChannelChangeNoticeEvent): void

    'notice.channel.enter'(e: ChannelChangeNoticeEvent): void

    'notice.channel.exit'(e: ChannelChangeNoticeEvent): void

    'notice.channel.increase'(e: ChannelChangeNoticeEvent): void

    'notice.channel.update'(e: ChannelChangeNoticeEvent): void

    'notice.channel.decrease'(e: ChannelChangeNoticeEvent): void

    'notice.guild.member'(e: GuildMemberChangeNoticeEvent): void

    'notice.guild.member.increase'(e: GuildMemberChangeNoticeEvent): void

    'notice.guild.member.update'(e: GuildMemberChangeNoticeEvent): void

    'notice.guild.member.decrease'(e: GuildMemberChangeNoticeEvent): void

    'notice.forum'(e: ThreadChangeNoticeEvent | FormAuditNoticeEvent | PostChangeNoticeEvent | ReplyChangeNoticeEvent | ForumNoticeEvent): void

    'notice.forum.thread'(e: ThreadChangeNoticeEvent): void

    'notice.forum.thread.create'(e: ThreadChangeNoticeEvent): void

    'notice.forum.thread.update'(e: ThreadChangeNoticeEvent): void

    'notice.forum.thread.delete'(e: ThreadChangeNoticeEvent): void

    'notice.forum.audit'(e: FormAuditNoticeEvent): void

    'notice.forum.post'(e: PostChangeNoticeEvent): void

    'notice.forum.post.create'(e: PostChangeNoticeEvent): void

    'notice.forum.post.delete'(e: PostChangeNoticeEvent): void

    'notice.forum.reply'(e: ReplyChangeNoticeEvent): void

    'notice.forum.reply.create'(e: ReplyChangeNoticeEvent): void

    'notice.forum.reply.delete'(e: ReplyChangeNoticeEvent): void
}

type EntryNames<E> = E extends { name: infer N extends string }
    ? E extends { also: infer A }
        ? N | (A extends readonly (infer I extends string)[] ? I : never)
        : N
    : never
type RegisteredEventName = EntryNames<(typeof EVENT_REGISTRY)[number]>
type AssertTrue<T extends true> = T
type _RegistryNamesCoveredByEventMap = AssertTrue<RegisteredEventName extends keyof EventMap ? true : false>
