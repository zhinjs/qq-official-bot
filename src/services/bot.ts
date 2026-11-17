/**
 * 机器人服务类 - 负责机器人基础信息和操作相关的API
 */
import { AxiosInstance } from 'axios'
import { Bot } from '@/bot'
import { ActionNoticeEvent } from '@/events/notice'

export interface GenerateUrlLinkOptions {
    /** 用户通过分享链接添加机器人时透传给后台的数据，最长 32 字符。 */
    callback_data?: string;
}

export interface GenerateUrlLinkResponse {
    data: {
        /** 生成的机器人分享链接。 */
        url: string;
    };
}

/** 用户基本信息（GET /v2/users/{user_openid}/info）。 */
export interface UserBasicInfo {
    /** 用户名。 */
    username: string;
    /** 用户头像原图 URL。 */
    avatar: string;
    /** 是否接收主动推送：true 表示用户允许机器人主动推送消息。 */
    allow_proactive_msg: boolean;
    /** 跨应用关联用户 openid，绑定了第三方应用时有效。 */
    union_openid?: string;
}

export class BotService {
    constructor(private request: AxiosInstance) {}

    /**
     * 获取机器人信息
     */
    async getSelfInfo(): Promise<Bot.Info> {
        const { data: result } = await this.request.get<Bot.Info>('/users/@me')
        return result
    }

    /**
     * 生成邀请用户添加机器人为好友的分享链接。
     */
    async generateUrlLink(options: GenerateUrlLinkOptions = {}): Promise<GenerateUrlLinkResponse> {
        const { data } = await this.request.post<GenerateUrlLinkResponse>('/v2/generate_url_link', options)
        return data
    }

    /**
     * 获取用户基本信息（单聊场景 user_openid）。
     * 用户与机器人无好友关系时接口返回 40184001。
     * @see https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_info.get.html
     */
    async getUserInfo(userOpenid: string): Promise<UserBasicInfo> {
        const { data } = await this.request.get<UserBasicInfo>(`/v2/users/${userOpenid}/info`)
        return data
    }

    /**
     * 回应操作
     */
    async replyAction(actionId: string, code: ActionNoticeEvent.ReplyCode = 0): Promise<boolean> {
        const result = await this.request.put(`/interactions/${actionId}`, { code })
        return result.status === 200
    }
}
