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
     * 回应操作
     */
    async replyAction(actionId: string, code: ActionNoticeEvent.ReplyCode = 0): Promise<boolean> {
        const result = await this.request.put(`/interactions/${actionId}`, { code })
        return result.status === 200
    }
}
