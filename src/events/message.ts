import type { Bot } from "@/bot";
import type { Sendable } from "@/elements";
import type { Announce, EmojiType, PinsMessage, MentionedGroupMember } from "@/types";
import {Message} from "@/message/parser"
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
    group_id: string
    group_name: string
    mentions: MentionedGroupMember[]

    constructor(bot: Bot, payload: Partial<Message>) {
        super(bot, payload);
        this.group_id = payload.group_id
        this.message_type = 'group'
    }

    get group() {
        return this.bot.group(this.group_id)
    }

    async reply(message: Sendable) {
        return this.group.send(message, this)
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
        const [message, brief] = Message.parse.call(this, payload)
        payload.message = message as Sendable
        const member = payload.member
        const permissions = member?.roles || []
        Object.assign(payload, {
            user_id: payload.author?.id,
            message_id: payload.id,
            raw_message: brief,
            sender: {
                user_id: payload.author?.id,
                user_name: payload.author?.username,
                permissions: [payload.author?.member_role || 'normal'].concat(permissions),
                user_openid: payload.author?.user_openid || payload.author?.member_openid
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
                messageEvent = new GroupMessageEvent(this, payload)
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
