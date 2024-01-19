import {AuditType, Bot, Dict} from "@";
import {EventParser} from "@/event/index";

export class NoticeEvent {
    notice_type: NoticeEvent.Type
    sub_type: string
    guild_id?: string
    channel_id?: string
    group_id?: string
    operator_id?: string

    constructor(public bot: Bot, payload: Dict) {
    }

}

export namespace NoticeEvent {
    export type Type = 'friend' | 'group' | 'direct' | 'channel' | 'forum' | 'guild'
}

export class ActionNoticeEvent extends NoticeEvent {
    notice_id: string
    data: ActionNoticeEvent.ActionData
    private replied: boolean = false

    constructor(bot: Bot, payload: Dict) {
        super(bot, payload);
        this.sub_type = 'action'
        this.notice_id = payload.id
        this.data = payload.data
    }

    /**
     * 回应操作
     * @param code {0|1|2|3|4|5} 结果编码，释义见官网，默认0
     */
    async reply(code: ActionNoticeEvent.ReplyCode = 0) {
        if (this.replied) return true
        this.replied = true
        return this.bot.replyAction(this.notice_id, code)
    }
}

export class FriendActionNoticeEvent extends ActionNoticeEvent {
    operator_id: string
    notice_type: 'friend' = 'friend'

    constructor(public bot: Bot, payload: Dict) {
        super(bot, payload)
        this.operator_id = payload.user_openid
        bot.emit(`notice.${this.notice_type}`, this)
        bot.emit(`notice.${this.notice_type}.action`, this)
    }
}

export class GroupActionNoticeEvent extends ActionNoticeEvent {
    group_id: string
    operator_id: string
    notice_type: 'group' = 'group'

    constructor(bot: Bot, payload: Dict) {
        super(bot, payload)
        this.group_id = payload.group_openid
        this.operator_id = payload.group_member_openid
        bot.emit(`notice.${this.notice_type}`, this)
        bot.emit(`notice.${this.notice_type}.action`, this)
    }
}

export class GuildActionNoticeEvent extends ActionNoticeEvent {
    guild_id: string
    channel_id: string
    operator_id: string
    notice_type: 'guild' = 'guild'

    constructor(bot: Bot, payload: Dict) {
        super(bot, payload)
        this.guild_id = payload.guild_id
        this.channel_id = payload.channel_id
        this.operator_id = payload.data.resoloved.user_id
        bot.emit(`notice.${this.notice_type}`, this)
        bot.emit(`notice.${this.notice_type}.action`, this)
    }
}

export namespace ActionNoticeEvent {
    export type ReplyCode = 0 | 1 | 2 | 3 | 4 | 5
    export type ActionData = {
        button_data: string
        button_id: string
        user_id: string
        feature_id: string
        message_id: string
    }
    export const parse: EventParser = function (this: Bot, event: string, payload) {
        switch (payload.scene) {
            case "c2c":
                return new FriendActionNoticeEvent(this, payload)
            case "group":
                return new GroupActionNoticeEvent(this, payload)
            case "guild":
                return new GuildActionNoticeEvent(this, payload)
        }
    }
}

export class FriendChangeNoticeEvent extends NoticeEvent {
    user_id: string
    time: number

    constructor(bot: Bot, sub_type: 'increase' | 'decrease', payload: Dict) {
        super(bot, payload);
        this.notice_type = 'friend'
        this.sub_type = sub_type
        this.user_id = payload.openid
        this.time = Math.floor(payload.timestamp / 1000)
    }
}

export namespace FriendChangeNoticeEvent {
    export const parse: EventParser = function (this: Bot, event: string, payload) {
        switch (event) {
            case "notice.friend.increase":
                return new FriendChangeNoticeEvent(this, 'increase', payload)
            case "notice.friend.decrease":
                return new FriendChangeNoticeEvent(this, 'decrease', payload)
        }
    }
}

export class GroupChangeNoticeEvent extends NoticeEvent {
    group_id: string
    operator_id: string
    time: number

    constructor(bot: Bot, sub_type: 'increase' | 'decrease', payload: Dict) {
        super(bot, payload);
        this.notice_type = 'group'
        this.sub_type = sub_type
        this.group_id = payload.group_openid
        this.operator_id = payload.op_member_openid
        this.time = Math.floor(payload.timestamp / 1000)
    }
}

export namespace GroupChangeNoticeEvent {
    export const parse: EventParser = function (this: Bot, event, payload) {
        switch (event) {
            case "notice.group.increase":
                return new GroupChangeNoticeEvent(this, 'increase', payload)
            case "notice.group.decrease":
                return new GroupChangeNoticeEvent(this, 'decrease', payload)
        }
    }
}

export class GuildChangeNoticeEvent extends NoticeEvent {
    guild_id: string
    guild_name: string
    operator_id: string
    time: number
    sub_type: 'increase' | 'update' | 'decrease'

    constructor(bot: Bot, sub_type: 'increase' | 'decrease' | 'update', payload: Dict) {
        super(bot, payload);
        this.notice_type = 'guild'
        this.sub_type = sub_type
        this.guild_id = payload.id
        this.guild_name = payload.name
        this.operator_id = payload.op_user_id
        this.time = Math.floor(new Date(payload.joined_at).getTime() / 1000)
    }
}

export namespace GuildChangeNoticeEvent {
    export const parse: EventParser = function (this: Bot, event, payload) {
        switch (event) {
            case "notice.guild.increase":
                return new GuildChangeNoticeEvent(this, 'increase', payload)
            case "notice.guild.update":
                return new GuildChangeNoticeEvent(this, 'update', payload)
            case "notice.guild.decrease":
                return new GuildChangeNoticeEvent(this, 'decrease', payload)
        }
    }
}

export class ChannelChangeNoticeEvent extends NoticeEvent {
    guild_id: string
    channel_id: string
    channel_name: string
    channel_type: number // 0 普通频道 2 语音频道 5 直播频道
    operator_id: string
    time: number
    sub_type: ChannelChangeNoticeEvent.SubType

    constructor(bot: Bot, sub_type: ChannelChangeNoticeEvent.SubType, payload: Dict) {
        super(bot, payload);
        this.notice_type = 'channel'
        this.sub_type = sub_type
        this.guild_id = payload.guild_id
        this.channel_id = payload.channel_id || payload.id
        this.channel_type = payload.channel_type || 0
        this.channel_name = payload.channel_name || payload.name
        this.operator_id = payload.op_user_id || payload.user_id
        this.time = Math.floor(new Date(payload.joined_at).getTime() / 1000)
    }
}

export namespace ChannelChangeNoticeEvent {
    export type SubType = 'increase' | 'update' | 'decrease' | 'enter' | 'exit'
    export const parse: EventParser = function (this: Bot, event, payload) {
        switch (event) {
            case "notice.channel.increase":
                return new ChannelChangeNoticeEvent(this, 'increase', payload)
            case "notice.channel.update":
                return new ChannelChangeNoticeEvent(this, 'update', payload)
            case "notice.channel.decrease":
                return new ChannelChangeNoticeEvent(this, 'decrease', payload)
            case "notice.channel.enter":
                return new ChannelChangeNoticeEvent(this, 'enter', payload)
            case "notice.channel.exit":
                return new ChannelChangeNoticeEvent(this, 'exit', payload)
        }
    }
}

export class GuildMemberChangeNoticeEvent extends NoticeEvent {
    guild_id: string
    operator_id: string
    user_id: string
    user_name: string
    is_bot: boolean
    time: number
    sub_type: 'member.increase' | 'member.update' | 'member.decrease'

    constructor(bot: Bot, sub_type: 'member.increase' | 'member.decrease' | 'member.update', payload: Dict) {
        super(bot, payload);
        this.notice_type = 'guild'
        this.sub_type = sub_type
        this.guild_id = payload.guild_id
        this.operator_id = payload.op_user_id
        this.time = Math.floor(new Date(payload.joined_at).getTime() / 1000)
        this.user_id = payload.user.id
        this.user_name = payload.user.nickname
        this.is_bot = payload.user.bot
    }
}

export namespace GuildMemberChangeNoticeEvent {
    export const parse: EventParser = function (this: Bot, event, payload) {
        switch (event) {
            case "notice.guild.member.increase":
                return new GuildMemberChangeNoticeEvent(this, 'member.increase', payload)
            case "notice.guild.member.update":
                return new GuildMemberChangeNoticeEvent(this, 'member.update', payload)
            case "notice.guild.member.decrease":
                return new GuildMemberChangeNoticeEvent(this, 'member.decrease', payload)
        }
    }
}

export class ForumNoticeEvent extends NoticeEvent {
    guild_id: string
    channel_id: string
    author_id: string
    sub_type: ForumNoticeEvent.SubType

    constructor(bot: Bot, payload: Dict) {
        super(bot, payload);
        this.notice_type = 'forum'
        this.guild_id = payload.guild_id
        this.channel_id = payload.channel_id
        this.author_id = payload.author_id
    }
}

export namespace ForumNoticeEvent {
    export type SubType =
        'thread.create'
        | 'thread.delete'
        | 'thread.update'
        | 'post.create'
        | 'post.delete'
        | 'reply.create'
        | 'reply.delete'
        | 'audit'
    export const parse: EventParser = function (this: Bot, event, payload) {
        switch (event) {
            case "notice.forum":
                return new ForumNoticeEvent(this, payload)
            case "notice.forum.thread.create":
                return new ThreadChangeNoticeEvent(this, 'create', payload)
            case "notice.forum.thread.update":
                return new ThreadChangeNoticeEvent(this, 'update', payload)
            case "notice.forum.thread.delete":
                return new ThreadChangeNoticeEvent(this, 'delete', payload)
            case "notice.forum.post.create":
                return new PostChangeNoticeEvent(this, 'create', payload)
            case "notice.forum.post.delete":
                return new ThreadChangeNoticeEvent(this, 'delete', payload)
            case "notice.forum.reply.create":
                return new ReplyChangeNoticeEvent(this, 'create', payload)
            case "notice.forum.reply.delete":
                return new ReplyChangeNoticeEvent(this, 'create', payload)
            case "notice.forum.audit":
                return new AuditNoticeEvent(this, payload)
        }
    }
}

export class ThreadChangeNoticeEvent extends ForumNoticeEvent {
    thread_id: string
    title: string
    content: string
    time: number

    constructor(bot: Bot, sub_type: 'create' | 'update' | 'delete', payload: Dict) {
        super(bot, payload);
        this.sub_type = `thread.${sub_type}`
        this.thread_id = payload.thread_info.thread_id
        this.title = payload.thread_info.title
        this.content = payload.thread_info.content
        this.time = Math.floor(new Date(payload.thread_info.date_time).getTime() / 1000)
    }
}

export class PostChangeNoticeEvent extends ForumNoticeEvent {
    thread_id: string
    post_id: string
    content: string
    time: number

    constructor(bot: Bot, sub_type: 'create' | 'delete', payload: Dict) {
        super(bot, payload);
        this.sub_type = `post.${sub_type}`
        this.thread_id = payload.post_info.thread_id
        this.post_id = payload.post_info.post_id
        this.content = payload.post_info.content
        this.time = Math.floor(new Date(payload.post_info.date_time).getTime() / 1000)
    }
}

export class ReplyChangeNoticeEvent extends ForumNoticeEvent {
    thread_id: string
    post_id: string
    reply_id: string
    content: string
    time: number

    constructor(bot: Bot, sub_type: 'create' | 'delete', payload: Dict) {
        super(bot, payload);
        this.sub_type = `reply.${sub_type}`
        this.thread_id = payload.reply_info.thread_id
        this.post_id = payload.reply_info.post_id
        this.reply_id = payload.reply_info.reply_id
        this.content = payload.reply_info.content
        this.time = Math.floor(new Date(payload.reply_info.date_time).getTime() / 1000)
    }
}

export class AuditNoticeEvent extends ForumNoticeEvent {
    thread_id: string
    post_id: string
    reply_id: string
    type: AuditType
    /** 审核结果： 0 成功 1 失败 */
    result: 0 | 1
    message?: string

    constructor(bot: Bot, payload: Dict) {
        super(bot, payload)
        this.sub_type = 'audit'
        this.thread_id = payload.thread_id
        this.post_id = payload.post_id
        this.reply_id = payload.reply_id
        this.type = payload.type
        this.result = payload.result
        this.message = payload.err_msg
    }
}
