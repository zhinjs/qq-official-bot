import {DirectMessageEvent, MessageEvent, GroupMessageEvent, GuildMessageEvent, PrivateMessageEvent} from "./message";
import {Bot, Dict} from "@";
import {
    ActionNoticeEvent, ChannelChangeNoticeEvent, FriendChangeNoticeEvent,
    GroupActionNoticeEvent, GroupChangeNoticeEvent, GuildActionNoticeEvent, GuildMemberChangeNoticeEvent,
    PrivateActionNoticeEvent
} from "@/event/notice";

export * from "./message"

export enum QQEvent {
    DIRECT_MESSAGE_CREATE = 'message.direct',
    AT_MESSAGE_CREATE = 'message.guild',
    MESSAGE_CREATE = 'message.guild',
    GUILD_CREATE = 'notice.guild.increase',
    GUILD_UPDATE = 'notice.guild.update',
    GUILD_DELETE = 'notice.guild.decrease',
    CHANNEL_CREATE = 'notice.channel.increase',
    CHANNEL_UPDATE = 'notice.channel.update',
    CHANNEL_DELETE = 'notice.channel.decrease',
    GUILD_MEMBER_ADD = 'notice.guild.member.increase',
    GUILD_MEMBER_UPDATE = 'notice.guild.member.update',
    GUILD_MEMBER_REMOVE = 'notice.guild.member.decrease',
    GROUP_ADD_ROBOT = 'notice.group.increase',
    GROUP_DEL_ROBOT = 'notice.group.decrease',
    FRIEND_ADD = 'notice.friend.increase',
    FRIEND_DEL = 'notice.friend.decrease',
    INTERACTION_CREATE = 'notice',
    C2C_MESSAGE_CREATE = 'message.private',
    GROUP_AT_MESSAGE_CREATE = 'message.group',
}

export type EventParser<T extends keyof EventMap = keyof EventMap> = (this: Bot, event: T, payload: Dict) => Parameters<EventMap[T]>[0]
export const EventParserMap: Map<string, EventParser> = new Map<string, EventParser>()

EventParserMap.set(QQEvent.AT_MESSAGE_CREATE, MessageEvent.parse)
EventParserMap.set(QQEvent.DIRECT_MESSAGE_CREATE, MessageEvent.parse)
EventParserMap.set(QQEvent.MESSAGE_CREATE, MessageEvent.parse)
EventParserMap.set(QQEvent.GROUP_AT_MESSAGE_CREATE, MessageEvent.parse)
EventParserMap.set(QQEvent.C2C_MESSAGE_CREATE, MessageEvent.parse)
EventParserMap.set(QQEvent.INTERACTION_CREATE, ActionNoticeEvent.parse)
EventParserMap.set(QQEvent.FRIEND_ADD, FriendChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.FRIEND_DEL, FriendChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GROUP_ADD_ROBOT, GroupChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GROUP_DEL_ROBOT, GroupChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_CREATE, GroupChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_UPDATE, GroupChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_DELETE, GroupChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.CHANNEL_CREATE, ChannelChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.CHANNEL_UPDATE, ChannelChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.CHANNEL_DELETE, ChannelChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_MEMBER_ADD, GuildMemberChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_MEMBER_UPDATE, GuildMemberChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_MEMBER_REMOVE, GuildMemberChangeNoticeEvent.parse)

export interface EventMap {
    'message'(e: PrivateMessageEvent | GroupMessageEvent | GuildMessageEvent | DirectMessageEvent): void

    'message.direct'(e: DirectMessageEvent): void

    'message.group'(e: GroupMessageEvent): void

    'message.private'(e: PrivateMessageEvent): void

    'message.guild'(e: GuildMessageEvent): void

    'notice'(e: ActionNoticeEvent | Dict): void

    'notice.private'(e: ActionNoticeEvent | Dict): void

    'notice.private.action'(e: PrivateActionNoticeEvent): void

    'notice.group'(e: ActionNoticeEvent | Dict): void

    'notice.group.action'(e: GroupActionNoticeEvent): void

    'notice.guild'(e: ActionNoticeEvent | Dict): void

    'notice.guild.action'(e: GuildActionNoticeEvent): void
}
