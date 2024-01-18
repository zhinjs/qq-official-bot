import {Bot, Dict} from "@";
import {EventParser} from "@/event/index";

export class ActionNoticeEvent {
    notice_id: string
    notice_type: 'friend'|'group'|'direct'|'guild'
    sub_type:'action'='action'
    guild_id?: string
    channel_id?: string
    group_id?: string
    operator_id?: string
    data: ActionNoticeEvent.ActionData
    private replied: boolean = false

    constructor(public bot: Bot, payload: Dict) {
        this.notice_id = payload.id
        this.data = payload.data
    }

    /**
     * 回应操作
     * @param code {0|1|2|3|4|5} 结果编码，释义见官网，默认0
     */
    async reply(code:ActionNoticeEvent.ReplyCode=0) {
        if (this.replied) return true
        this.replied = true
        return this.bot.replyAction(this.notice_id,code)
    }
}
export class PrivateActionNoticeEvent extends ActionNoticeEvent {
    operator_id:string
    notice_type:'friend'='friend'
    constructor(public bot: Bot, payload: Dict) {
        super(bot, payload)
        this.operator_id = payload.user_openid
        bot.emit(`notice.${this.notice_type}`,this)
        bot.emit(`notice.${this.notice_type}.action`,this)
    }
}
export class GroupActionNoticeEvent extends ActionNoticeEvent {
    group_id:string
    operator_id:string
    notice_type:'group'='group'
    constructor(bot: Bot, payload: Dict) {
        super(bot, payload)
        this.group_id = payload.group_openid
        this.operator_id = payload.group_member_openid
        bot.emit(`notice.${this.notice_type}`,this)
        bot.emit(`notice.${this.notice_type}.action`,this)
    }
}
export class GuildActionNoticeEvent extends ActionNoticeEvent {
    guild_id:string
    channel_id:string
    operator_id:string
    notice_type:'guild'='guild'
    constructor(bot: Bot, payload: Dict) {
        super(bot, payload)
        this.guild_id = payload.guild_id
        this.channel_id = payload.channel_id
        this.operator_id = payload.data.resoloved.user_id
        bot.emit(`notice.${this.notice_type}`,this)
        bot.emit(`notice.${this.notice_type}.action`,this)
    }
}
export namespace ActionNoticeEvent {
    export type ReplyCode=0|1|2|3|4|5
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
                return new PrivateActionNoticeEvent(this, payload)
            case "group":
                return new GroupActionNoticeEvent(this, payload)
            case "guild":
                return new GuildActionNoticeEvent(this, payload)
        }
    }
}
