import type { Bot } from "@/bot";
import { AuditType, ReactionTargetType, type Dict, type Emoji } from "@/types";
import type { EventParser } from "@/events/index";
import type { JoinRequestVerifyInfo } from '@/services/group'

export class NoticeEvent {
    notice_type: NoticeEvent.Type
    sub_type: string
    guild_id?: string
    channel_id?: string
    group_id?: string
    operator_id?: string
    event_id?: string
    notice_id?: string
    constructor(public bot: Bot, payload: Dict) {
        this.event_id = payload.event_id
        this.notice_id = payload.id
    }

}

export namespace NoticeEvent {
    export type Type = 'friend' | 'group' | 'direct' | 'channel' | 'forum' | 'guild'
}

export class ActionNoticeEvent extends NoticeEvent {
    data: ActionNoticeEvent.ActionData
    /** 互动类型，见 ActionNoticeEvent.InteractionType（11=按钮回调，12=快捷菜单 …）。 */
    interaction_type?: ActionNoticeEvent.InteractionType
    /** 事件场景：c2c / group / guild。 */
    scene?: ActionNoticeEvent.Scene
    /** 聊天场景：0=频道，1=群聊，2=单聊。 */
    chat_type?: 0 | 1 | 2
    /** 触发时间（Unix 秒）。 */
    time: number
    version?: number
    application_id?: string
    private replied: boolean = false

    constructor(bot: Bot, payload: Dict) {
        super(bot, payload);
        this.sub_type = 'action'
        this.data = payload.data ?? { type: payload.type, resolved: {} }
        this.interaction_type = payload.type ?? payload.data?.type
        this.scene = ActionNoticeEvent.resolveScene(payload)
        this.chat_type = payload.chat_type
        this.time = parseNoticeTimestamp(payload.timestamp)
        this.version = payload.version
        this.application_id = payload.application_id
    }

    /** 日志描述：按钮回调显示 button_id，其它互动类型显示类型编号。 */
    protected get actionDescription() {
        const buttonId = this.data?.resolved?.button_id
        return buttonId !== undefined
            ? `点击了消息按钮：${buttonId}`
            : `触发了互动事件(type=${this.interaction_type ?? 'unknown'})`
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

    constructor(bot: Bot, payload: Dict) {
        super(bot, payload)
        this.operator_id = payload.user_openid
        bot.logger.info(`好友${this.operator_id} ${this.actionDescription}`)
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
        bot.logger.info(`群(${this.group_id})成员${this.operator_id} ${this.actionDescription}`)
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
        this.operator_id = payload.data?.resolved?.user_id ?? payload.data?.resoloved?.user_id
        bot.logger.info(`频道(${this.guild_id})成员${this.operator_id}在子频道(${this.channel_id})${this.actionDescription}`)
    }
}

export namespace ActionNoticeEvent {
    export type ReplyCode = 0 | 1 | 2 | 3 | 4 | 5
    export type Scene = 'c2c' | 'group' | 'guild'
    /**
     * 互动类型：11 按钮回调，12 单聊快捷菜单，13 消息反馈，14 清空会话，15 进出故事集，
     * 16 切换模型，18 用户授权，19 群授权，20 群授权状态变更。
     * `reply()` 仅对 11 / 12 有意义。
     */
    export type InteractionType = 11 | 12 | 13 | 14 | 15 | 16 | 18 | 19 | 20 | number
    export type ActionData = {
        type: number
        resolved: {
            /** 按钮的 data 字段值；消息反馈场景下为回调数据 */
            button_data?: string
            /** 按钮的 id 字段值（按钮回调时有值） */
            button_id?: string
            /** 操作用户 ID（仅频道场景） */
            user_id?: string
            /** 功能 ID（仅快捷菜单） */
            feature_id?: string
            /** 操作的消息 ID */
            message_id?: string
            /** 反馈选项（仅 type=13）：LIKE / UNLIKE */
            feedback_opt?: 'LIKE' | 'UNLIKE' | string
            /** 反馈选项是否选中（仅 type=13） */
            checked?: number
            /** 操作类型（type=15：ENTER_STORY / QUIT_STORY；type=16：切换动作） */
            action?: string
            /** 消息场景信息（仅 type=13） */
            message_scene?: { ext?: string[] }
            /** 授权数据（仅 type=18/19） */
            authorize_data?: {
                opt_scene?: 'setting' | 'dialog' | string
                scope?: 'c2c_push' | 'group_push' | string
            }
        }
    }
    const chatTypeScene: Record<number, Scene> = { 0: 'guild', 1: 'group', 2: 'c2c' }
    /** 场景优先取 scene，缺失时按 chat_type 推断。 */
    export function resolveScene(payload: Dict): Scene | undefined {
        return payload.scene ?? chatTypeScene[payload.chat_type as number]
    }
    export const parse: EventParser = function (this: Bot, event: string, payload) {
        switch (resolveScene(payload)) {
            case "c2c":
                return new FriendActionNoticeEvent(this, payload)
            case "group":
                return new GroupActionNoticeEvent(this, payload)
            case "guild":
                return new GuildActionNoticeEvent(this, payload)
        }
    }
}
export class FriendReceiveNoticeEvent extends NoticeEvent{
    user_id: string
    time: number
    get actionText(){
        return this.sub_type===`receive_open`?'开启':'关闭'
    }
    constructor(bot: Bot, sub_type: 'receive_open' | 'receive_close', payload: Dict) {
        super(bot, payload);
        this.notice_type = 'friend'
        this.sub_type = sub_type
        this.user_id = payload.openid
        this.time = parseNoticeTimestamp(payload.timestamp)
        bot.logger.info(`好友${this.actionText}主动消息接收：${this.user_id}`)
    }
}
export namespace FriendReceiveNoticeEvent {
    export const parse: EventParser = function (this: Bot, event: string, payload) {
        switch (event) {
            case "notice.friend.receive_open":
                return new FriendReceiveNoticeEvent(this, 'receive_open', payload)
            case "notice.friend.receive_close":
                return new FriendReceiveNoticeEvent(this, 'receive_close', payload)
        }
    }
}
export class FriendChangeNoticeEvent extends NoticeEvent {
    user_id: string
    time: number
    /** 加好友场景值（仅 FRIEND_ADD）：1000 缺省，1001/1002 搜索，1003 群，1004 空间，2001-2004 分享。 */
    scene?: number
    /** 分享链接的 callback_data（仅 FRIEND_ADD）。 */
    scene_param?: string
    /** 分享链接短链 code（仅 FRIEND_ADD）。 */
    short_code?: string
    /** 跨应用关联用户 openid。 */
    union_openid?: string
    get actionText(){
        return this.sub_type===`increase`?'新增':'减少'
    }
    constructor(bot: Bot, sub_type: 'increase' | 'decrease', payload: Dict) {
        super(bot, payload);
        this.notice_type = 'friend'
        this.sub_type = sub_type
        this.user_id = payload.openid
        this.time = parseNoticeTimestamp(payload.timestamp)
        this.scene = payload.scene
        this.scene_param = payload.scene_param
        this.short_code = payload.short_code
        this.union_openid = payload.author?.union_openid || undefined
        bot.logger.info(`好友${this.actionText}：${this.user_id}`)
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
export class GroupReceiveNoticeEvent extends NoticeEvent {
    group_id: string
    operator_id: string
    time: number
    get actionText(){
        return this.sub_type===`receive_open`?'开启':'关闭'
    }
    constructor(bot: Bot, sub_type: 'receive_open' | 'receive_close', payload: Dict) {
        super(bot, payload);
        this.notice_type = 'group'
        this.sub_type = sub_type
        this.group_id = payload.group_openid
        this.operator_id = payload.op_member_openid
        this.time = parseNoticeTimestamp(payload.timestamp)
        bot.logger.info(`群${this.actionText}主动消息接收：${this.group_id}. 操作人：${this.operator_id}`)
    }
}
export namespace GroupReceiveNoticeEvent {
    export const parse: EventParser = function (this: Bot, event: string, payload) {
        switch (event) {
            case "notice.group.receive_open":
                return new GroupReceiveNoticeEvent(this, 'receive_open', payload)
            case "notice.group.receive_close":
                return new GroupReceiveNoticeEvent(this, 'receive_close', payload)
        }
    }
}
export class GroupChangeNoticeEvent extends NoticeEvent {
    group_id: string
    operator_id: string
    time: number
    /** 跨应用关联群 openid，绑定了第三方应用时有效。 */
    union_group_openid?: string
    get actionText(){
        return this.sub_type===`increase`?'新增':'减少'
    }
    constructor(bot: Bot, sub_type: 'increase' | 'decrease', payload: Dict) {
        super(bot, payload);
        this.notice_type = 'group'
        this.sub_type = sub_type
        this.group_id = payload.group_openid
        this.union_group_openid = payload.union_group_openid || undefined
        this.operator_id = payload.op_member_openid
        this.time = parseNoticeTimestamp(payload.timestamp)
        bot.logger.info(`群${this.actionText}：${this.group_id}. 操作人：${this.operator_id}`)
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

export class GroupMemberChangeNoticeEvent extends NoticeEvent {
    group_id: string
    user_id: string
    operator_id?: string
    time: number
    notice_type: 'group' = 'group'
    sub_type: 'member.increase' | 'member.decrease'
    /** 成员的用户 OpenID（GROUP_MEMBER_REMOVE 时可能为空）。 */
    user_openid?: string
    /** 跨应用关联群 openid，绑定了第三方应用时有效。 */
    union_group_openid?: string

    get actionText() {
        return this.sub_type === 'member.increase' ? '加入' : '退出'
    }

    constructor(bot: Bot, sub_type: 'member.increase' | 'member.decrease', payload: Dict) {
        super(bot, payload);
        this.sub_type = sub_type
        this.group_id = payload.group_openid ?? payload.group_id
        this.union_group_openid = payload.union_group_openid || undefined
        this.user_id = payload.member_openid ?? payload.user_openid ?? payload.user_id
        this.user_openid = payload.user_openid || undefined
        this.operator_id = payload.op_member_openid ?? payload.operator_id
        this.time = parseNoticeTimestamp(payload.timestamp)
        bot.logger.info(`群[${this.group_id}]成员(${this.user_id})${this.actionText}`)
    }
}

export namespace GroupMemberChangeNoticeEvent {
    export const parse: EventParser = function (this: Bot, event, payload) {
        switch (event) {
            case "notice.group.member.increase":
                return new GroupMemberChangeNoticeEvent(this, 'member.increase', payload)
            case "notice.group.member.decrease":
                return new GroupMemberChangeNoticeEvent(this, 'member.decrease', payload)
        }
    }
}

export class GroupJoinRequestNoticeEvent extends NoticeEvent {
    notice_type: 'group' = 'group'
    sub_type: 'join_request' = 'join_request'
    group_id: string
    join_request_id: string
    risk_tips: string
    union_openid?: string
    user_id: string
    username: string
    apply_at: string
    apply_source: 'self_apply' | 'invited'
    invited_by?: string
    is_bot?: boolean
    verify_info?: JoinRequestVerifyInfo
    auto_approved?: { strategy_id: string }

    constructor(bot: Bot, payload: Dict) {
        super(bot, payload)
        this.group_id = payload.group_openid
        this.join_request_id = payload.join_request_id
        this.risk_tips = payload.risk_tips ?? ''
        this.union_openid = payload.union_openid
        this.user_id = payload.member_openid
        this.username = payload.username
        this.apply_at = payload.apply_at
        this.apply_source = payload.apply_source
        this.invited_by = payload.invited_by
        this.is_bot = payload.bot
        this.verify_info = payload.verify_info
        this.auto_approved = payload.auto_approved
        bot.logger.info(`群[${this.group_id}]收到成员(${this.user_id})的入群申请`)
    }
}

export namespace GroupJoinRequestNoticeEvent {
    export const parse: EventParser = function (this: Bot, _event, payload) {
        return new GroupJoinRequestNoticeEvent(this, payload)
    }
}

function parseNoticeTimestamp(timestamp: unknown): number {
    if (typeof timestamp === 'number') {
        return timestamp > 1e12 ? Math.floor(timestamp / 1000) : timestamp
    }
    if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp).getTime()
        if (!Number.isNaN(parsed)) {
            return Math.floor(parsed / 1000)
        }
    }
    return Math.floor(Date.now() / 1000)
}

export class GuildChangeNoticeEvent extends NoticeEvent {
    guild_id: string
    guild_name: string
    operator_id: string
    time: number
    sub_type: 'increase' | 'update' | 'decrease'
    icon?: string
    owner_id?: string
    member_count?: number
    max_members?: number
    description?: string
    /** 机器人加入频道的时间（ISO8601），并非事件时间。 */
    joined_at?: string
    get actionText(){
        return this.sub_type===`increase`?'新增':this.sub_type===`update`?'更新':'减少'
    }
    constructor(bot: Bot, sub_type: 'increase' | 'decrease' | 'update', payload: Dict) {
        super(bot, payload);
        this.notice_type = 'guild'
        this.sub_type = sub_type
        this.guild_id = payload.id
        this.guild_name = payload.name
        this.operator_id = payload.op_user_id
        this.icon = payload.icon
        this.owner_id = payload.owner_id
        this.member_count = payload.member_count
        this.max_members = payload.max_members
        this.description = payload.description
        this.joined_at = payload.joined_at
        // 事件本身没有时间字段；有 joined_at 时沿用，否则取接收时间
        this.time = parseNoticeTimestamp(payload.joined_at)
        bot.logger.info(`频道${this.actionText}：${this.guild_id}. 操作人：${this.operator_id}`)
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
    /** 子频道类型：0 文字，2 语音，4 分组，10005 直播，10006 应用，10007 论坛 */
    channel_type: number
    /** 子频道子类型 */
    channel_sub_type?: number
    owner_id?: string
    position?: number
    operator_id: string
    time: number
    sub_type: ChannelChangeNoticeEvent.SubType

    get actionText(){
        switch (this.sub_type){
            case 'increase':
                return '新增'
            case 'update':
                return '更新'
            case 'decrease':
                return '减少'
            case "enter":
                return '进入'
            case "exit":
                return '离开'
        }
    }
    constructor(bot: Bot, sub_type: ChannelChangeNoticeEvent.SubType, payload: Dict) {
        super(bot, payload);
        this.notice_type = 'channel'
        this.sub_type = sub_type
        this.guild_id = payload.guild_id
        this.channel_id = payload.channel_id || payload.id
        // CHANNEL_* 事件使用 type；音视频/直播进出事件使用 channel_type
        this.channel_type = payload.channel_type ?? payload.type ?? 0
        this.channel_sub_type = payload.sub_type
        this.owner_id = payload.owner_id
        this.position = payload.position
        this.channel_name = payload.channel_name || payload.name
        this.operator_id = payload.op_user_id || payload.user_id
        this.time = parseNoticeTimestamp(payload.joined_at)
        if(['enter','exit'].includes(this.sub_type)){
            bot.logger.info(`用户${this.actionText}子频道：${this.channel_id}`)
        }else{
            bot.logger.info(`子频道${this.actionText}：${this.channel_id}. 操作人：${this.operator_id}`)
        }
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
    get actionText(){
        return this.sub_type===`member.increase`?'加入':this.sub_type==='member.update'?'变更':'退出'
    }
    constructor(bot: Bot, sub_type: 'member.increase' | 'member.decrease' | 'member.update', payload: Dict) {
        super(bot, payload);
        this.notice_type = 'guild'
        this.sub_type = sub_type
        this.guild_id = payload.guild_id
        this.operator_id = payload.op_user_id
        this.time = parseNoticeTimestamp(payload.joined_at)
        this.user_id = payload.user.id
        this.user_name = payload.user.nickname
        this.is_bot = payload.user.bot
        bot.logger.info(`频道(${this.guild_id})成员(${this.user_id})${this.actionText}. 操作人：${this.operator_id}`)
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
                const noticeEvent=new ForumNoticeEvent(this, payload)
                this.logger.info(`用户:${noticeEvent.author_id}操作了论坛内容`)
                return noticeEvent
            case "notice.forum.thread.create":
                return new ThreadChangeNoticeEvent(this, 'create', payload)
            case "notice.forum.thread.update":
                return new ThreadChangeNoticeEvent(this, 'update', payload)
            case "notice.forum.thread.delete":
                return new ThreadChangeNoticeEvent(this, 'delete', payload)
            case "notice.forum.post.create":
                return new PostChangeNoticeEvent(this, 'create', payload)
            case "notice.forum.post.delete":
                return new PostChangeNoticeEvent(this, 'delete', payload)
            case "notice.forum.reply.create":
                return new ReplyChangeNoticeEvent(this, 'create', payload)
            case "notice.forum.reply.delete":
                return new ReplyChangeNoticeEvent(this, 'delete', payload)
            case "notice.forum.audit":
                return new FormAuditNoticeEvent(this, payload)
        }
    }
}

export class ThreadChangeNoticeEvent extends ForumNoticeEvent {
    thread_id: string
    title: string
    content: string
    time: number
    get actionText(){
        return this.sub_type==='thread.create'?'创建':this.sub_type==='thread.update'?'更新':'删除'
    }
    constructor(bot: Bot, sub_type: 'create' | 'update' | 'delete', payload: Dict) {
        super(bot, payload);
        this.sub_type = `thread.${sub_type}`
        this.thread_id = payload.thread_info.thread_id
        this.title = payload.thread_info.title
        this.content = payload.thread_info.content
        this.time = Math.floor(new Date(payload.thread_info.date_time).getTime() / 1000)
        bot.logger.info(`用户${this.author_id}${this.actionText}了主题(${this.thread_id})`)
    }
}

export class PostChangeNoticeEvent extends ForumNoticeEvent {
    thread_id: string
    post_id: string
    content: string
    time: number
    get actionText(){
        return this.sub_type==='post.create'?'发布':'删除'
    }
    constructor(bot: Bot, sub_type: 'create' | 'delete', payload: Dict) {
        super(bot, payload);
        this.sub_type = `post.${sub_type}`
        this.thread_id = payload.post_info.thread_id
        this.post_id = payload.post_info.post_id
        this.content = payload.post_info.content
        this.time = Math.floor(new Date(payload.post_info.date_time).getTime() / 1000)
        bot.logger.info(`用户${this.author_id}${this.actionText}了帖子(${this.post_id})`)
    }
}

export class ReplyChangeNoticeEvent extends ForumNoticeEvent {
    thread_id: string
    post_id: string
    reply_id: string
    content: string
    time: number
    get actionText(){
        return this.sub_type==='reply.create'?'创建':'删除'
    }
    constructor(bot: Bot, sub_type: 'create' | 'delete', payload: Dict) {
        super(bot, payload);
        this.sub_type = `reply.${sub_type}`
        this.thread_id = payload.reply_info.thread_id
        this.post_id = payload.reply_info.post_id
        this.reply_id = payload.reply_info.reply_id
        this.content = payload.reply_info.content
        this.time = Math.floor(new Date(payload.reply_info.date_time).getTime() / 1000)
        bot.logger.info(`用户${this.author_id})${this.actionText}了回复(${this.reply_id})`)
    }
}

export class FormAuditNoticeEvent extends ForumNoticeEvent {
    thread_id: string
    post_id: string
    reply_id: string
    type: AuditType
    /** 审核结果： 0 成功 1 失败 */
    result: 0 | 1
    message?: string
    get typeText(){
        if(this.type===AuditType.Thread) return '主题'
        if(this.type===AuditType.Post) return '帖子'
        if(this.type===AuditType.Reply) return '回复'
    }
    constructor(bot: Bot, payload: Dict) {
        super(bot, payload)
        this.sub_type = 'audit'
        this.thread_id = payload.thread_id
        this.post_id = payload.post_id
        this.reply_id = payload.reply_id
        this.type = payload.type
        this.result = payload.result
        this.message = payload.err_msg
        bot.logger.info(`${this.typeText}审核${this.result===0?'通过':'拒绝'}. ${this.message||''}`)
    }
}

export class MessageReactionNoticeEvent extends NoticeEvent{
    user_id:string
    message_id:string
    channel_id:string
    sub_type:'add'|'remove'
    guild_id:string
    emoji:Emoji
    constructor(bot:Bot,sub_type:'add'|'remove',payload:Dict) {
        super(bot,payload);
        this.notice_type='channel'
        this.sub_type = sub_type
        this.guild_id = payload.guild_id
        this.channel_id = payload.channel_id
        this.user_id = payload.user_id
        if(![ReactionTargetType.Message, ReactionTargetType.ReactionTargetType_MSG].includes(payload.target.type)) throw new Error(`unsupported reaction target type: ${payload.target.type}`)
        this.message_id = payload.target.id
        this.emoji = payload.emoji
    }
}
export namespace MessageReactionNoticeEvent {
    export const parse: EventParser = function (this: Bot, event, payload) {
        switch (event) {
            case "notice.reaction.add": {
                const addEvent = new MessageReactionNoticeEvent(this, 'add', payload);
                this.logger.info(`用户:${addEvent.user_id}创建了表情表态`);
                return addEvent;
            }
            case 'notice.reaction.remove': {
                const removeEvent = new MessageReactionNoticeEvent(this, 'remove', payload);
                this.logger.info(`用户:${removeEvent.user_id}删除了表情表态`);
                return removeEvent;
            }
            default:
                throw new Error(`can not parse event ${event}`);
        }
    };
}

/**
 * 订阅消息授权状态变更（SUBSCRIBE_MESSAGE_STATUS）。
 * 个人订阅时携带 openid，群订阅时携带 group_openid。
 * @see https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/subscribe_message_status.html
 */
export class SubscribeStatusNoticeEvent extends NoticeEvent {
    sub_type: 'subscribe' = 'subscribe'
    /** 个人订阅的用户 OpenID */
    user_id?: string
    /** 群订阅的群 OpenID */
    group_id?: string
    /** 各订阅模板的授权结果 */
    results: SubscribeStatusNoticeEvent.TemplateResult[]
    /** 最近一次状态更新时间（Unix 秒） */
    time: number

    constructor(bot: Bot, payload: Dict) {
        super(bot, payload)
        this.group_id = payload.group_openid || undefined
        this.user_id = payload.openid || undefined
        this.notice_type = this.group_id ? 'group' : 'friend'
        this.results = Array.isArray(payload.result) ? payload.result : []
        const updated = this.results.map(item => item.update_ts).filter((ts): ts is number => typeof ts === 'number')
        this.time = updated.length ? Math.max(...updated) : parseNoticeTimestamp(undefined)
        bot.logger.info(`${this.group_id ? `群(${this.group_id})` : `用户(${this.user_id})`}订阅消息授权状态变更：${this.results.length} 个模板`)
    }

    /** 已允许订阅的模板 */
    get allowed() {
        return this.results.filter(item => item.op === 1)
    }

    /** 已拒绝订阅的模板 */
    get refused() {
        return this.results.filter(item => item.op === 2)
    }
}

export namespace SubscribeStatusNoticeEvent {
    export interface TemplateResult {
        /** 平台提供的订阅模板 ID */
        template_id: number
        /** 自定义模板 ID */
        custom_template_id?: string
        /** 1=允许，2=拒绝 */
        op: 1 | 2
        /** 订阅 ID，发送订阅消息时使用 */
        subscribe_id?: string
        /** 订阅操作时间（Unix 秒） */
        subscribe_ts?: number
        /** 最近一次状态更新时间（Unix 秒） */
        update_ts?: number
    }
    export const parse: EventParser = function (this: Bot, _event, payload) {
        return new SubscribeStatusNoticeEvent(this, payload)
    }
}
