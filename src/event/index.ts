import {GroupMessageEvent, GuildMessageEvent, MessageEvent, PrivateMessageEvent} from "./message";
import {Bot, Dict} from "@";
import {
    ActionNoticeEvent,
    AuditNoticeEvent,
    ChannelChangeNoticeEvent,
    ForumNoticeEvent,
    FriendActionNoticeEvent,
    FriendChangeNoticeEvent,
    FriendReceiveNoticeEvent,
    GroupActionNoticeEvent,
    GroupChangeNoticeEvent,
    GroupReceiveNoticeEvent,
    GuildActionNoticeEvent,
    GuildChangeNoticeEvent,
    GuildMemberChangeNoticeEvent,
    MessageReactionNoticeEvent,
    NoticeEvent,
    PostChangeNoticeEvent,
    ReplyChangeNoticeEvent,
    ThreadChangeNoticeEvent
} from "@/event/notice";

export * from "./message"

export enum QQEvent {
    DIRECT_MESSAGE_CREATE = 'message.private.direct',
    AT_MESSAGE_CREATE = 'message.guild',
    MESSAGE_CREATE = 'message.guild',
    MESSAGE_REACTION_ADD='notice.reaction.add',
    MESSAGE_REACTION_REMOVE = 'notice.reaction.remove',
    GUILD_CREATE = 'notice.guild.increase',
    GUILD_UPDATE = 'notice.guild.update',
    GUILD_DELETE = 'notice.guild.decrease',
    CHANNEL_CREATE = 'notice.channel.increase',
    CHANNEL_UPDATE = 'notice.channel.update',
    CHANNEL_DELETE = 'notice.channel.decrease',
    AUDIO_OR_LIVE_CHANNEL_MEMBER_ENTER = 'notice.channel.enter',
    AUDIO_OR_LIVE_CHANNEL_MEMBER_EXIT = 'notice.channel.exit',
    GUILD_MEMBER_ADD = 'notice.guild.member.increase',
    GUILD_MEMBER_UPDATE = 'notice.guild.member.update',
    GUILD_MEMBER_REMOVE = 'notice.guild.member.decrease',
    GROUP_ADD_ROBOT = 'notice.group.increase',
    GROUP_DEL_ROBOT = 'notice.group.decrease',
    GROUP_MSG_REJECT = 'notice.group.receive_close',
    GROUP_MSG_RECEIVE = 'notice.group.receive_open',
    FRIEND_ADD = 'notice.friend.increase',
    FRIEND_DEL = 'notice.friend.decrease',
    C2C_MSG_REJECT = 'notice.friend.receive_close',
    C2C_MSG_RECEIVE = 'notice.friend.receive_open',
    INTERACTION_CREATE = 'notice',
    C2C_MESSAGE_CREATE = 'message.private.friend',
    GROUP_AT_MESSAGE_CREATE = 'message.group',
    FORUM_THREAD_CREATE = 'notice.forum.thread.create',
    FORUM_THREAD_UPDATE = 'notice.forum.thread.update',
    FORUM_THREAD_DELETE = 'notice.forum.thread.delete',
    FORUM_POST_CREATE = 'notice.forum.post.create',
    FORUM_POST_DELETE = 'notice.forum.post.delete',
    FORUM_REPLY_CREATE = 'notice.forum.reply.create',
    FORUM_REPLY_DELETE = 'notice.forum.reply.delete',
    FORUM_PUBLISH_AUDIT_RESULT = 'notice.forum.audit',
    OPEN_FORUM_THREAD_CREATE = 'notice.forum',
    OPEN_FORUM_THREAD_UPDATE = 'notice.forum',
    OPEN_FORUM_THREAD_DELETE = 'notice.forum',
    OPEN_FORUM_POST_CREATE = 'notice.forum',
    OPEN_FORUM_POST_DELETE = 'notice.forum',
    OPEN_FORUM_REPLY_CREATE = 'notice.forum',
    OPEN_FORUM_REPLY_DELETE = 'notice.forum'
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
EventParserMap.set(QQEvent.C2C_MSG_REJECT, FriendReceiveNoticeEvent.parse)
EventParserMap.set(QQEvent.C2C_MSG_RECEIVE, FriendReceiveNoticeEvent.parse)
EventParserMap.set(QQEvent.GROUP_ADD_ROBOT, GroupChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GROUP_DEL_ROBOT, GroupChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GROUP_MSG_RECEIVE, GroupReceiveNoticeEvent.parse)
EventParserMap.set(QQEvent.GROUP_MSG_REJECT, GroupReceiveNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_CREATE, GuildChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_UPDATE, GuildChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_DELETE, GuildChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.CHANNEL_CREATE, ChannelChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.CHANNEL_UPDATE, ChannelChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.CHANNEL_DELETE, ChannelChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.AUDIO_OR_LIVE_CHANNEL_MEMBER_ENTER, ChannelChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.AUDIO_OR_LIVE_CHANNEL_MEMBER_EXIT, ChannelChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_MEMBER_ADD, GuildMemberChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_MEMBER_UPDATE, GuildMemberChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.GUILD_MEMBER_REMOVE, GuildMemberChangeNoticeEvent.parse)
EventParserMap.set(QQEvent.FORUM_THREAD_CREATE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.FORUM_THREAD_UPDATE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.FORUM_THREAD_DELETE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.FORUM_POST_CREATE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.FORUM_POST_DELETE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.FORUM_REPLY_CREATE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.FORUM_REPLY_DELETE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.FORUM_PUBLISH_AUDIT_RESULT, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.OPEN_FORUM_THREAD_CREATE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.OPEN_FORUM_THREAD_UPDATE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.OPEN_FORUM_THREAD_DELETE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.OPEN_FORUM_POST_CREATE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.OPEN_FORUM_POST_DELETE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.OPEN_FORUM_REPLY_CREATE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.OPEN_FORUM_REPLY_DELETE, ForumNoticeEvent.parse)
EventParserMap.set(QQEvent.MESSAGE_REACTION_ADD,MessageReactionNoticeEvent.parse)
EventParserMap.set(QQEvent.MESSAGE_REACTION_REMOVE,MessageReactionNoticeEvent.parse)

export interface EventMap {
    'message'(e: PrivateMessageEvent | GroupMessageEvent | GuildMessageEvent): void

    'message.group'(e: GroupMessageEvent): void

    'message.private.friend'(e: PrivateMessageEvent): void

    'message.private.direct'(e: PrivateMessageEvent): void

    'message.guild'(e: GuildMessageEvent): void

    'notice'(e: NoticeEvent): void

    'notice.friend'(e: FriendActionNoticeEvent | FriendChangeNoticeEvent | FriendReceiveNoticeEvent): void

    'notice.friend.action'(e: FriendActionNoticeEvent): void

    'notice.friend.increase'(e: FriendChangeNoticeEvent): void

    'notice.friend.decrease'(e: FriendChangeNoticeEvent): void

    'notice.friend.receive_close'(e: FriendReceiveNoticeEvent): void

    'notice.friend.receive_open'(e: FriendReceiveNoticeEvent): void
    'notice.reaction.add'(e:MessageReactionNoticeEvent):void
    'notice.reaction.remove'(e: MessageReactionNoticeEvent): void

    'notice.group'(e: ActionNoticeEvent | GroupChangeNoticeEvent | GroupReceiveNoticeEvent): void

    'notice.group.increase'(e: GroupChangeNoticeEvent): void

    'notice.group.decrease'(e: GroupChangeNoticeEvent): void

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

    'notice.forum'(e: ThreadChangeNoticeEvent | AuditNoticeEvent | PostChangeNoticeEvent | ReplyChangeNoticeEvent | ForumNoticeEvent): void

    'notice.forum.thread'(e: ThreadChangeNoticeEvent): void

    'notice.forum.thread.create'(e: ThreadChangeNoticeEvent): void

    'notice.forum.thread.update'(e: ThreadChangeNoticeEvent): void

    'notice.forum.thread.delete'(e: ThreadChangeNoticeEvent): void

    'notice.forum.audit'(e: AuditNoticeEvent): void

    'notice.forum.post'(e: PostChangeNoticeEvent): void

    'notice.forum.post.create'(e: PostChangeNoticeEvent): void

    'notice.forum.post.delete'(e: PostChangeNoticeEvent): void

    'notice.forum.reply'(e: ReplyChangeNoticeEvent): void

    'notice.forum.reply.create'(e: ReplyChangeNoticeEvent): void

    'notice.forum.reply.delete'(e: ReplyChangeNoticeEvent): void
}
