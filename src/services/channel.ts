/**
 * 子频道服务类 - 负责所有子频道相关的API操作
 */
import { AxiosInstance } from 'axios'
import { Channel } from '@/entries/channel'
import { ChannelUpdateInfo, PinsMessage } from '@/types'

export class ChannelService {
    constructor(private request: AxiosInstance) {}

    /**
     * 获取子频道列表
     */
    async getList(guildId: string): Promise<Channel.ApiInfo[]> {
        const { data: result = [] } = await this.request.get(`/guilds/${guildId}/channels`)
        return result.map(({ id: channel_id, name: channel_name, ...channel }) => ({
            channel_id,
            channel_name,
            ...channel
        }))
    }

    /**
     * 获取子频道信息
     */
    async getInfo(channelId: string): Promise<Channel.ApiInfo> {
        const {
            data: {
                id: _,
                name: channel_name,
                ...channel
            }
        } = await this.request.get<Channel.Info>(`/channels/${channelId}`)

        return {
            channel_id: channelId,
            channel_name,
            ...channel
        }
    }

    /**
     * 创建子频道
     */
    async create(guildId: string, channelInfo: Channel.CreateParam): Promise<Channel.Info> {
        const { data: result } = await this.request.post(`/guilds/${guildId}/channels`, channelInfo)
        return result
    }

    /**
     * 修改子频道
     */
    async update(channelId: string, updateInfo: ChannelUpdateInfo): Promise<Channel.Info> {
        const { data: result } = await this.request.patch(`/channels/${channelId}`, updateInfo)
        return result
    }

    /**
     * 删除子频道
     */
    async delete(channelId: string): Promise<boolean> {
        const result = await this.request.delete(`/channels/${channelId}`)
        return result.status === 200
    }

    /**
     * 获取频道置顶消息id列表
     */
    async getPins(channelId: string): Promise<string[]> {
        const { data: { message_ids = [] } = {} } = await this.request.get(`/channels/${channelId}/pins`)
        return message_ids
    }

    /**
     * 置顶频道消息
     */
    async pinMessage(channelId: string, messageId: string): Promise<PinsMessage> {
        const { data: result } = await this.request.post<PinsMessage>(`/channels/${channelId}/pins/${messageId}`)
        return result
    }

    /**
     * 取消置顶频道消息
     */
    async unpinMessage(channelId: string, messageId: string): Promise<boolean> {
        const result = await this.request.delete(`/channels/${channelId}/pins/${messageId}`)
        return result.status === 204
    }
}
