import type { Bot } from "@/bot";
import type { Sendable } from "@/elements";
import type { Announce, Dict, EmojiType, PinsMessage, MentionedGroupMember } from "@/types";
import {Message, parseMessageSceneExt} from "@/message/parser"
import type { EventParser } from "@/events"
import type { CreatePrivateStreamOptions } from "@/message/stream"

export interface MessageEvent {
    reply(message: Sendable, quote?: boolean): Promise<any>
}

export class PrivateMessageEvent extends Message implements MessageEvent {
    constructor(bot: Bot, sub_type: Message.SubType, payload: Partial<Message>) {
        super(bot, payload);
        this.message_type = 'private'
        this.sub_type = sub_type
    }
    get user() {
        return this.bot.user(this.user_id)
    }
    get direct() {
        return this.bot.direct(this.guild_id)
    }
    async recall(){
        if(this.sub_type==='direct') return this.direct.recall(this.message_id)
    }
    async reply(message: Sendable) {
        return this.sub_type === 'direct' ?
            this.direct.send(message, this) :
            this.user.send(message, this)
    }
    /** 发送「输入中」状态（1-60 秒），频道私信不可用 */
    inputNotify(seconds?: number) {
        if (this.sub_type === 'direct') {
            throw new Error('频道私信不支持输入状态')
        }
        return this.user.sendInputNotify(seconds, this)
    }
    /** 单聊流式回复，频道私信不可用 */
    replyStream(options: CreatePrivateStreamOptions = {}) {
        if (this.sub_type === 'direct') {
            throw new Error('频道私信不支持流式发送')
        }
        return this.user.createStream({ source: this, ...options })
    }
}
export class MessageAuditEvent{
    audit_id:string
    audit_time:number
    guild_id:string
    channel_id:string
    create_time:number
    message_id:string
    constructor(public bot:Bot,payload:Partial<MessageAuditEvent>,public is_passed:boolean=false){
        Object.assign(this,{
            ...payload,
            audit_time:new Date(payload.audit_time).getTime()/1000,
            create_time:new Date(payload.create_time).getTime()/1000
        })
    }
}
export namespace MessageAuditEvent{
    export const parse: EventParser = function (this: Bot, event, payload) {
        return new MessageAuditEvent(this, payload,event==='message.audit.pass')
    }
}
export class GroupMessageEvent extends Message implements MessageEvent {
    sub_type: 'normal' | 'at'
    group_id: string
    group_name: string
    mentions?: MentionedGroupMember[]
    /** 跨应用关联群 openid，绑定了第三方应用时有效。 */
    union_group_openid?: string

    constructor(bot: Bot, payload: Partial<Message>, sub_type: 'normal' | 'at' = 'normal') {
        super(bot, payload);
        this.sub_type = sub_type
        // 官方事件字段为 group_openid，旧版本推送同时带 group_id
        this.group_id = (payload as Dict).group_openid ?? payload.group_id
        this.union_group_openid = (payload as Partial<GroupMessageEvent>).union_group_openid || undefined
        this.message_type = 'group'
    }

    get group() {
        return this.bot.group(this.group_id)
    }

    async reply(message: Sendable) {
        return this.group.send(message, this)
    }

    /** 撤回该消息（机器人为群管理员时可撤回成员消息）。 */
    async recall() {
        return this.group.recall(this.message_id)
    }
}


export class GuildMessageEvent extends Message implements MessageEvent {
    guild_id: string
    guild_name: string
    channel_id: string

    channel_name: string

    constructor(bot: Bot, payload: Partial<Message>) {
        super(bot, payload);
        this.message_type = 'guild'
    }

    get guild() {
        return this.bot.guild(this.guild_id)
    }

    get channel() {
        return this.bot.channel(this.channel_id)
    }

    /**
     * 将该消息设置为公告
     */
    async asAnnounce(): Promise<Announce> {
        return this.guild.announce(this.channel_id, this.id)
    }

    /**
     * 置顶消息
     */
    async pin(): Promise<PinsMessage> {
        return this.channel.pin(this.id)
    }

    /**
     * 撤回消息
     * @param hidetip {boolean} 是否隐藏提示
     */
    recall(hidetip?: boolean) {
        return this.channel.recall(this.message_id, hidetip)
    }

    /**
     * 回复消息
     * @param message {Sendable} 回复内容
     */
    async reply(message: Sendable) {
        return this.channel.send(message, this)
    }

    /**
     * 消息表态
     * @param type {1|2} 表情类型
     * @param id {`${number}`} 表态表情id
     */
    async reaction(type: EmojiType, id: `${number}`) {
        return this.channel.react(this.message_id, type, id)
    }

    /**
     * 删除消息表态
     * @param type {1|2} 表情类型
     * @param id {`${number}`} 表态表情id
     */
    async deleteReaction(type: EmojiType, id: `${number}`) {
        return this.channel.deleteReaction(this.message_id, type, id)
    }

    /**
     * 获取表态用户列表
     * @param type {1|2} 表情类型
     * @param id {`${number}`} 表态表情id
     */
    async getReactionMembers(type: EmojiType, id: `${number}`) {
        return this.channel.reactionMembers(this.message_id, type, id)
    }
}

export namespace MessageEvent {
    export const parse: EventParser = function (this: Bot, event, payload) {
        this.removeAt(payload)
        // 网关的数字 message_type（0/3/101/102/103）会被 SDK 的 'private' / 'group' 覆盖，先保存为 content_type
        const contentType = typeof payload.message_type === 'number' ? payload.message_type : undefined
        const sceneExt = parseMessageSceneExt(payload.message_scene)
        const [message, brief] = Message.parse.call(this, payload)
        payload.message = message as Sendable
        const member = payload.member
        const permissions = member?.roles || []
        if (sceneExt.ref_msg_idx && !payload.message_reference) {
            payload.source = { id: sceneExt.ref_msg_idx, message_id: sceneExt.ref_msg_idx, ref_idx: sceneExt.ref_msg_idx }
        }
        Object.assign(payload, {
            content_type: contentType,
            msg_idx: sceneExt.msg_idx,
            ref_msg_idx: sceneExt.ref_msg_idx,
            user_id: payload.author?.id,
            message_id: payload.id,
            raw_message: brief,
            sender: {
                user_id: payload.author?.id,
                user_name: payload.author?.username,
                permissions: [payload.author?.member_role || 'normal'].concat(permissions),
                user_openid: payload.author?.user_openid || payload.author?.member_openid,
                avatar: payload.author?.avatar,
                member_nickname: payload.author?.member_nickname,
                union_openid: payload.author?.union_openid || undefined,
            },
            timestamp: new Date(payload.timestamp).getTime() / 1000,
        })
        let messageEvent: PrivateMessageEvent | GroupMessageEvent | GuildMessageEvent
        switch (event) {
            case 'message.private.friend':
                messageEvent = new PrivateMessageEvent(this, 'friend', payload)
                this.logger.info(`recv from User(${payload.user_id}): ${payload.raw_message}`)
                break;
            case 'message.group':
            case 'message.group.at':
                messageEvent = new GroupMessageEvent(this, payload, event === 'message.group.at' ? 'at' : 'normal')
                this.logger.info(`recv from Group(${payload.group_id}): ${payload.raw_message}`)
                break;
            case 'message.guild':
                messageEvent = new GuildMessageEvent(this, payload)
                this.logger.info(`recv from Guild(${payload.guild_id})Channel(${payload.channel_id}): ${payload.raw_message}`)
                break;
            case 'message.private.direct':
                messageEvent = new PrivateMessageEvent(this, 'direct', payload)
                this.logger.info(`recv from Direct(${payload.guild_id}): ${payload.raw_message}`)
                break;
        }
        return messageEvent
    }
}
