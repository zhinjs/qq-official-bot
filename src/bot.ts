import {QQBot} from "./qqBot";
import {Channel} from './entries/channel'
import {Guild} from "./entries/guild";
import {
    Announce,
    ApiBaseInfo, ApiPermissionDemand,
    ChannelMemberPermissions,
    ChannelRolePermissions, ChannelUpdateInfo, DMS, PinsMessage, RoleCreateParam, RoleUpdateParam,
    UpdatePermissionParams
} from "@/types";
import {Quotable, Sendable} from "@/elements";
import {UnsupportedMethodError} from "@/constans";
import {Sender} from "@/entries/sender";
import {AxiosResponse} from "axios";
import {GuildMember} from "@/entries/guildMember";


export class Bot extends QQBot {

    constructor(config: Bot.Config) {
        super(config)
    }

    async getSelfInfo() {
        const {data: result} = await this.request.get<Bot.Info>('/users/@me')
        return result
    }

    async getChannelPermissionOfRole(channel_id: string, role_id: string) {
        const {data: result} = await this.request.get<ChannelRolePermissions>(`/channels/${channel_id}/roles/${role_id}/permissions`)
        return result
    }

    async setChannelAnnounce(guild_id: string, channel_id: string, message_id: string) {
        const {data: result} = await this.request.post<{
            message_id: string
            channel_id: string
        }, AxiosResponse<Announce>>(`/guilds/${guild_id}/announces`, {
            message_id,
            channel_id
        })
        return result
    }

    async updateChannelPermissionOfRole(channel_id: string, role_id: string, permission: UpdatePermissionParams) {
        const result = await this.request.put(`/channels/${channel_id}/roles/${role_id}/permissions`, permission)
        return result.status === 204
    }

    async getChannelMemberPermission(channel_id: string, member_id: string) {
        const {data: result} = await this.request.get<ChannelMemberPermissions>(`/channels/${channel_id}/members/${member_id}/permissions`)
        return result
    }

    async updateChannelMemberPermission(channel_id: string, member_id: string, permission: UpdatePermissionParams) {
        const result = await this.request.put(`/channels/${channel_id}/members/${member_id}/permissions`, permission)
        return result.status === 204
    }

    async getChannelPins(channel_id: string): Promise<string[]> {
        const {data: {message_ids = []} = {}} = await this.request.get(`/channels/${channel_id}/pins`)
        return message_ids
    }

    async pinChannelMessage(channel_id: string, message_id: string) {
        const {data: result} = await this.request.post<PinsMessage>(`/channels/${channel_id}/pins/${message_id}`)
        return result
    }

    async unPinChannelMessage(channel_id: string, message_id: string) {
        const result = await this.request.delete(`/channels/${channel_id}/pins/${message_id}`)
        return result.status === 204
    }

    async createChannel(guild_id: string, channelInfo: Omit<Channel.Info, 'id'>) {
        const {data: result} = await this.request.post<Omit<Channel.Info, 'id'>, AxiosResponse<Channel.Info>>(`/guilds/${guild_id}/channels`, channelInfo)
        return result
    }

    async updateChannel(channel_id: string, updateInfo: ChannelUpdateInfo) {
        const {data: result} = await this.request.patch<ChannelUpdateInfo, AxiosResponse<Channel.Info>>(`/channels/${channel_id}`, updateInfo)
        return result
    }

    async deleteChannel(channel_id: string) {
        const result = await this.request.delete(`/channels/${channel_id}`)
        return result.status === 200
    }

    async getGuildRoles(guild_id: string) {
        const {data: {roles = []} = {}} = await this.request.get<{ roles: Guild.Role[] }>(`/guilds/${guild_id}/roles`)
        return roles
    }

    async creatGuildRole(guild_id: string, role: RoleCreateParam) {
        const {data: result} = await this.request.post<RoleCreateParam, AxiosResponse<{
            role: Guild.Role
        }>>(`/guilds/${guild_id}/roles`, role)
        return result.role
    }

    async updateGuildRole(guild_id: string, role_id: string, updateInfo: RoleUpdateParam) {
        const {data: result} = await this.request.patch<RoleUpdateParam, AxiosResponse<{
            role: Guild.Role
        }>>(`/guilds/${guild_id}/roles/${role_id}`, updateInfo)
        return result.role
    }

    async deleteGuildRole(role_id: string) {
        const result = await this.request.delete(`/guilds/{guild_id}/roles/${role_id}`)
        return result.status === 204
    }

    async getGuildAccessApis(guild_id: string) {
        const {data: result} = await this.request.get<{
            apis: ApiPermissionDemand[]
        }>(`/guilds/${guild_id}/api_permission`)
        return result.apis || []
    }

    async applyGuildAccess(guild_id: string, channel_id: string, apiInfo: ApiBaseInfo, desc?: string) {
        const {data: result} = await this.request.post<{
            channel_id: string
            api_identify: ApiBaseInfo
            desc: string
        }, AxiosResponse<ApiPermissionDemand>>(`/guilds/${guild_id}/api_permission/demand`, {
            channel_id,
            api_identify: apiInfo,
            desc,
        })
        return result
    }

    async unMuteGuild(guild_id: string) {
        return this.muteGuild(guild_id, 0, 0)
    }

    async muteGuild(guild_id: string, seconds: number, end_time?: number) {
        const result = await this.request.put(`/guilds/${guild_id}/mute`, {
            mute_seconds: `${seconds}`,
            mute_end_timestamp: `${end_time}`
        })
        return result.status === 204

    }

    async unMuteGuildMembers(guild_id: string, member_ids: string[]) {
        return this.muteGuildMembers(guild_id, member_ids, 0, 0)
    }

    async muteGuildMembers(guild_id: string, member_ids: string[], seconds: number, end_time?: number) {
        const result = await this.request.put(`/guilds/${guild_id}/mute`, {
            mute_seconds: `${seconds}`,
            mute_end_timestamp: `${end_time}`,
            user_ids: member_ids
        })
        return result.status === 200
    }

    async addGuildMemberRoles(guild_id: string, channel_id: string, member_id: string, role_id: string) {
        const result = await this.request.put(`/guilds/${guild_id}/members/${member_id}/roles/${role_id}`, {id: channel_id})
        return result.status === 204
    }

    async removeGuildMemberRoles(guild_id: string, channel_id: string, member_id: string, role_id: string) {
        const result = await this.request.delete(`/guilds/${guild_id}/members/${member_id}/roles/${role_id}`, {data: {id: channel_id}})
        return result.status === 204
    }

    async kickGuildMember(guild_id: string, member_id: string, clean: -1 | 0 | 3 | 7 | 15 | 30 = 0, blacklist?: boolean) {
        const result = await this.request.delete(`/guilds/${guild_id}/members/${member_id}`, {
            data: {
                add_blacklist: blacklist,
                delete_message_days: clean
            }
        })
        return result.status === 204
    }

    async unMuteGuildMember(guild_id: string, member_id: string) {
        return this.muteGuildMember(guild_id, member_id, 0, 0)
    }

    async muteGuildMember(guild_id: string, member_id: string, seconds: number, end_time?: number) {
        const result = await this.request.put(`/guilds/${guild_id}/members/${member_id}/mute`, {
            mute_seconds: `${seconds}`,
            mute_end_timestamp: `${end_time}`
        })
        return result.status === 204
    }

    async getGuildList() {
        const _getGuildList = async (after: string = undefined) => {
            const res = await this.request.get('/users/@me/guilds', {
                params: {
                    after
                }
            }).catch(() => ({data: []}))// 私域不支持获取频道列表，做个兼容
            if (!res.data?.length) return []
            const result = (res.data || []).map(g => {
                const {id: guild_id, name: guild_name, joined_at, ...guild} = g
                return {
                    guild_id,
                    guild_name,
                    join_time: new Date(joined_at).getTime() / 1000,
                    ...guild
                }
            })
            const last = result[result.length - 1]
            return [...result, ...await _getGuildList(last.guild_id)]
        }
        return await _getGuildList() as Guild.ApiInfo[]
    }

    async getGuildMemberList(guild_id: string) {
        const _getGuildMemberList = async (after: string = undefined) => {
            const res = await this.request.get(`/guilds/${guild_id}/members`, {
                params: {
                    after,
                    limit: 100
                }
            }).catch(() => ({data: []}))// 公域没有权限，做个兼容
            if (!res.data?.length) return []
            const result = (res.data || []).map(m => {
                const {user: {id: member_id, ...member}, roles, joined_at, nick} = m
                return {
                    member_id,
                    card: nick,
                    roles,
                    ...member,
                    join_time: new Date(joined_at).getTime() / 1000,
                }
            })
            const last = result[result.length - 1]
            return [...result, ...await _getGuildMemberList(last.member_id)]
        }
        return await _getGuildMemberList() as GuildMember.ApiInfo[]
    }

    async getGuildMemberInfo(guild_id: string, member_id: string) {
        const {
            data: {
                user: {id: _, ...member},
                roles,
                joined_at,
                nick
            }
        } = await this.request.get(`/guilds/${guild_id}/members/${member_id}`)
        return {
            member_id,
            card: nick,
            roles,
            ...member,
            join_time: new Date(joined_at).getTime() / 1000,
        } as GuildMember.ApiInfo
    }


    async getGroupMemberList(group_id: string) {
        throw UnsupportedMethodError
    }

    async getGroupMemberInfo(group_id: string, member_id: string) {
        throw UnsupportedMethodError
    }

    async getFriendList() {
        throw UnsupportedMethodError
    }

    async getFriendInfo(friend_id: string) {
        throw UnsupportedMethodError
    }

    async getChannelList(guild_id: string): Promise<Channel.ApiInfo> {
        const {data: result = []} = await this.request.get(`/guilds/${guild_id}/channels`)
        return result.map(({id: channel_id, name: channel_name, ...channel}) => {
            return {
                channel_id,
                channel_name,
                ...channel
            }
        })
    }

    async getChannelInfo(channel_id: string) {
        const {
            data: {
                id: _,
                name: channel_name,
                ...channel
            }
        } = await this.request.get<Channel.Info>(`/channels/${channel_id}`)
        return {
            channel_id,
            channel_name,
            ...channel
        } as Channel.ApiInfo
    }

    async createDirectSession(guild_id: string, user_id: string) {
        const {data: result} = await this.request.post<{
            recipient_id: string
            source_guild_id: string
        }, AxiosResponse<DMS>>(`/users/@me/dms`, {
            recipient_id: user_id,
            source_guild_id: guild_id
        })
        return {
            ...result,
            create_time: new Date(result.create_time).getTime() / 1000
        } as DMS
    }

    async sendPrivateMessage(user_id: string, message: Sendable, source?: Quotable) {
        const sender = new Sender(this, `/v2/users/${user_id}`, message, source)
        const result = await sender.sendMsg()
        this.logger.info(`send to User(${user_id}): ${sender.brief}`)
        return result
    }

    async sendDirectMessage(guild_id: string, message: Sendable, source?: Quotable) {
        const sender = new Sender(this, `/dms/${guild_id}`, message, source)
        const result = await sender.sendMsg()
        this.logger.info(`send to Direct(${guild_id}): ${sender.brief}`)
        return result
    }

    async recallDirectMessage(guild_id: string, message_id: string, hidetip?: boolean) {
        const result = await this.request.delete(`/dms/${guild_id}/messages/${message_id}?hidetip=${!!hidetip}`)
        return result.status === 200
    }

    async sendGuildMessage(channel_id: string, message: Sendable, source?: Quotable) {
        const sender = new Sender(this, `/channels/${channel_id}`, message, source)
        const result = await sender.sendMsg()
        this.logger.info(`send to Channel(${channel_id}): ${sender.brief}`)
        return result
    }

    async recallGuildMessage(channel_id: string, message_id: string, hidetip?: boolean) {
        const result = await this.request.delete(`/channels/${channel_id}/messages/${message_id}?hidetip=${!!hidetip}`)
        return result.status === 200
    }

    async sendGroupMessage(group_id: string, message: Sendable, source?: Quotable) {
        const sender = new Sender(this, `/v2/groups/${group_id}`, message, source)
        const result = await sender.sendMsg()
        this.logger.info(`send to Group(${group_id}): ${sender.brief}`)
        return result
    }

    async start() {
        await this.sessionManager.start()
    }

    async stop() {
        await this.sessionManager.stop()
    }
}

export namespace Bot {
    export interface Info {
        id: string
        username: string
        avatar: string
        union_openid?: string
        union_user_account?: string
    }

    export interface Config extends QQBot.Config {
    }
}
