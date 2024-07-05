import {QQBot} from "./qqBot";
import {Channel} from './entries/channel'
import {Guild} from "./entries/guild";
import {
    Announce,
    ApiBaseInfo,
    ApiPermissionDemand,
    AudioControl,
    ChannelMemberPermissions,
    ChannelRolePermissions,
    ChannelUpdateInfo,
    DMS,
    EmojiType,
    PinsMessage,
    RoleCreateParam,
    RoleUpdateParam,
    ScheduleInfo,
    Thread,
    ThreadInfo,
    UpdatePermissionParams
} from "@/types";
import {Quotable, Sendable} from "@/elements";
import {UnsupportedMethodError} from "@/constans";
import {Sender} from "@/entries/sender";
import {AxiosResponse} from "axios";
import {GuildMember} from "@/entries/guildMember";
import {User} from "@/entries/user";
import {ActionNoticeEvent} from "@/event/notice";
import {GuildMessageEvent, PrivateMessageEvent} from "@/event";


export class Bot extends QQBot {

    constructor(config: Bot.Config) {
        super(config)
        const nodeVersion=parseInt(process.version.slice(1))
        if(nodeVersion<16){
            this.logger.warn(`你的node版本(${process.version}) <16，可能会出现不可预测的错误，请升级node版本，为确保服务正常运行，请升级node版本`)
        }
        process.on("uncaughtException",e=>{
            this.logger.debug(e.stack)
        })
    }

    /**
     * 获取机器人信息
     */
    async getSelfInfo() {
        const {data: result} = await this.request.get<Bot.Info>('/users/@me')
        return result
    }

    /**
     * 获取频道角色权限信息
     * @param channel_id 频道id
     * @param role_id 角色id
     */
    async getChannelPermissionOfRole(channel_id: string, role_id: string) {
        const {data: result} = await this.request.get<ChannelRolePermissions>(`/channels/${channel_id}/roles/${role_id}/permissions`)
        return result
    }

    /**
     * 设置频道公告
     * @param guild_id
     * @param channel_id
     * @param message_id
     */
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

    /**
     * 更新频道角色权限
     * @param channel_id
     * @param role_id
     * @param permission
     */
    async updateChannelPermissionOfRole(channel_id: string, role_id: string, permission: UpdatePermissionParams) {
        const result = await this.request.put(`/channels/${channel_id}/roles/${role_id}/permissions`, permission)
        return result.status === 204
    }

    /**
     * 获取频道用户权限
     * @param channel_id
     * @param member_id
     */
    async getChannelMemberPermission(channel_id: string, member_id: string) {
        const {data: result} = await this.request.get<ChannelMemberPermissions>(`/channels/${channel_id}/members/${member_id}/permissions`)
        return result
    }

    /**
     * 更新频道用户权限
     * @param channel_id
     * @param member_id
     * @param permission
     */
    async updateChannelMemberPermission(channel_id: string, member_id: string, permission: UpdatePermissionParams) {
        const result = await this.request.put(`/channels/${channel_id}/members/${member_id}/permissions`, permission)
        return result.status === 204
    }

    /**
     * 获取频道置顶消息id列表
     * @param channel_id
     */
    async getChannelPins(channel_id: string): Promise<string[]> {
        const {data: {message_ids = []} = {}} = await this.request.get(`/channels/${channel_id}/pins`)
        return message_ids
    }

    /**
     * 置顶频道消息
     * @param channel_id
     * @param message_id
     */
    async pinChannelMessage(channel_id: string, message_id: string) {
        const {data: result} = await this.request.post<PinsMessage>(`/channels/${channel_id}/pins/${message_id}`)
        return result
    }

    /**
     * 取消置顶频道消息
     * @param channel_id
     * @param message_id
     */
    async unPinChannelMessage(channel_id: string, message_id: string) {
        const result = await this.request.delete(`/channels/${channel_id}/pins/${message_id}`)
        return result.status === 204
    }

    /**
     * 创建子频道
     * @param guild_id
     * @param channelInfo
     */
    async createChannel(guild_id: string, channelInfo: Omit<Channel.Info, 'id'>) {
        const {data: result} = await this.request.post<Omit<Channel.Info, 'id'>, AxiosResponse<Channel.Info>>(`/guilds/${guild_id}/channels`, channelInfo)
        return result
    }

    /**
     * 修改子频道
     * @param channel_id
     * @param updateInfo
     */
    async updateChannel(channel_id: string, updateInfo: ChannelUpdateInfo) {
        const {data: result} = await this.request.patch<ChannelUpdateInfo, AxiosResponse<Channel.Info>>(`/channels/${channel_id}`, updateInfo)
        return result
    }

    /**
     * 删除子频道
     * @param channel_id
     */
    async deleteChannel(channel_id: string) {
        const result = await this.request.delete(`/channels/${channel_id}`)
        return result.status === 200
    }

    /**
     * 获取频道角色列表
     * @param guild_id
     */
    async getGuildRoles(guild_id: string) {
        const {data: {roles = []} = {}} = await this.request.get<{ roles: Guild.Role[] }>(`/guilds/${guild_id}/roles`)
        return roles
    }

    /**
     * 创建频道角色
     * @param guild_id
     * @param role
     */
    async creatGuildRole(guild_id: string, role: RoleCreateParam) {
        const {data: result} = await this.request.post<RoleCreateParam, AxiosResponse<{
            role: Guild.Role
        }>>(`/guilds/${guild_id}/roles`, role)
        return result.role
    }

    /**
     * 修改频道角色
     * @param guild_id
     * @param role_id
     * @param updateInfo
     */
    async updateGuildRole(guild_id: string, role_id: string, updateInfo: RoleUpdateParam) {
        const {data: result} = await this.request.patch<RoleUpdateParam, AxiosResponse<{
            role: Guild.Role
        }>>(`/guilds/${guild_id}/roles/${role_id}`, updateInfo)
        return result.role
    }

    /**
     * 删除频道角色
     * @param role_id
     */
    async deleteGuildRole(role_id: string) {
        const result = await this.request.delete(`/guilds/{guild_id}/roles/${role_id}`)
        return result.status === 204
    }

    /**
     * 获取频道可访问API类别
     * @param guild_id
     */
    async getGuildAccessApis(guild_id: string) {
        const {data: result} = await this.request.get<{
            apis: ApiPermissionDemand[]
        }>(`/guilds/${guild_id}/api_permission`)
        return result.apis || []
    }

    /**
     * 申请频道API
     * @param guild_id
     * @param channel_id
     * @param apiInfo
     * @param desc
     */
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

    /**
     * 取消频道禁言
     * @param guild_id
     */
    async unMuteGuild(guild_id: string) {
        return this.muteGuild(guild_id, 0, 0)
    }

    /**
     * 频道禁言
     * @param guild_id
     * @param seconds
     * @param end_time
     */
    async muteGuild(guild_id: string, seconds: number, end_time?: number) {
        const result = await this.request.put(`/guilds/${guild_id}/mute`, {
            mute_seconds: `${seconds}`,
            mute_end_timestamp: `${end_time}`
        })
        return result.status === 204

    }

    /**
     * 批量取消频道成员禁言
     * @param guild_id
     * @param member_ids
     */
    async unMuteGuildMembers(guild_id: string, member_ids: string[]) {
        return this.muteGuildMembers(guild_id, member_ids, 0, 0)
    }

    /**
     * 批量禁言频道成员
     * @param guild_id
     * @param member_ids
     * @param seconds
     * @param end_time
     */
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

    /**
     * 移除频道成员角色
     * @param guild_id
     * @param channel_id
     * @param member_id
     * @param role_id
     */
    async removeGuildMemberRoles(guild_id: string, channel_id: string, member_id: string, role_id: string) {
        const result = await this.request.delete(`/guilds/${guild_id}/members/${member_id}/roles/${role_id}`, {data: {id: channel_id}})
        return result.status === 204
    }

    /**
     * 踢出频道成员
     * @param guild_id
     * @param member_id
     * @param clean
     * @param blacklist
     */
    async kickGuildMember(guild_id: string, member_id: string, clean: -1 | 0 | 3 | 7 | 15 | 30 = 0, blacklist?: boolean) {
        const result = await this.request.delete(`/guilds/${guild_id}/members/${member_id}`, {
            data: {
                add_blacklist: blacklist,
                delete_message_days: clean
            }
        })
        return result.status === 204
    }

    /**
     * 取消频道成员禁言
     * @param guild_id
     * @param member_id
     */
    async unMuteGuildMember(guild_id: string, member_id: string) {
        return this.muteGuildMember(guild_id, member_id, 0, 0)
    }

    /**
     * 禁言频道成员
     * @param guild_id
     * @param member_id
     * @param seconds
     * @param end_time
     */
    async muteGuildMember(guild_id: string, member_id: string, seconds: number, end_time?: number) {
        const result = await this.request.put(`/guilds/${guild_id}/members/${member_id}/mute`, {
            mute_seconds: `${seconds}`,
            mute_end_timestamp: `${end_time}`
        })
        return result.status === 204
    }

    /**
     * 获取频道列表
     */
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

    /**
     * 获取频道信息
     * @param guild_id
     */
    async getGuildInfo(guild_id:string):Promise<Guild.ApiInfo>{
        const {data: {id: _, name: guild_name, joined_at, ...guild}}=await this.request.get(`/guilds/${guild_id}`)
        return {
            guild_id,
            guild_name,
            join_time: new Date(joined_at).getTime() / 1000,
            ...guild
        }
    }

    /**
     * 获取子频道消息
     * @param channel_id {string} 子频道id
     * @param message_id {string} 消息id
     */
    async getGuildMessage(channel_id:string,message_id:string):Promise<GuildMessageEvent>{
        const {data:payload}=await this.request.get(`/channels/${channel_id}/messages/${message_id}`)
        return this.processPayload(payload.id,`message.guild`,payload) as GuildMessageEvent
    }
    /**
     * 获取频道成员列表
     * @param guild_id
     */
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

    /**
     * 获取频道成员信息
     * @param guild_id
     * @param member_id
     */
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

    /**
     * 获取群成员列表
     * @param group_id
     */
    async getGroupMemberList(group_id: string) {
        throw UnsupportedMethodError
    }
    /**
     * 获取群成员信息
     * @param group_id
     * @param member_id
     */
    async getGroupMemberInfo(group_id: string, member_id: string) {
        throw UnsupportedMethodError
    }
    /**
     * 获取好友列表
     */
    async getFriendList() {
        throw UnsupportedMethodError
    }
    /**
     * 获取好友信息
     * @param friend_id
     */
    async getFriendInfo(friend_id: string) {
        throw UnsupportedMethodError
    }
    /**
     * 发送私聊信息
     * @param user_id
     * @param message
     * @param source
     */
    async sendPrivateMessage(user_id: string, message: Sendable, source?: Quotable) {
        const sender = new Sender(this, `/v2/users/${user_id}`, message, source)
        const result = await sender.sendMsg()
        this.logger.info(`send to User(${user_id}): ${sender.brief}`)
        return result
    }
    /**
     * 撤回私聊消息
     * @param user_id
     * @param message_id
     */
    async recallPrivateMessage(user_id:string,message_id:string) {
        const result = await this.request.delete(`/v2/users/${user_id}/messages/${message_id}`)
        return result.status === 200
    }
    /**
     * 发送群消息
     * @param group_id
     * @param message
     * @param source
     */
    async sendGroupMessage(group_id: string, message: Sendable, source?: Quotable) {
        const sender = new Sender(this, `/v2/groups/${group_id}`, message, source)
        const result = await sender.sendMsg()
        this.logger.info(`send to Group(${group_id}): ${sender.brief}`)
        return result
    }
    /**
     * 撤回群消息
     * @param group_id
     * @param message_id
     */
    async recallGroupMessage(group_id:string,message_id:string) {
        const result = await this.request.delete(`/v2/groups/${group_id}/messages/${message_id}`)
        return result.status === 200
    }
    /**
     * 获取子频道列表
     */
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
    /**
     * 获取子频道信息
     * @param channel_id
     */
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

    /**
     * 创建私信会话
     * @param guild_id
     * @param user_id
     */
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


    /**
     * 发送频道私信
     * @param guild_id
     * @param message
     * @param source
     */
    async sendDirectMessage(guild_id: string, message: Sendable, source?: Quotable) {
        const sender = new Sender(this, `/dms/${guild_id}`, message, source)
        const result = await sender.sendMsg()
        this.logger.info(`send to Direct(${guild_id}): ${sender.brief}`)
        return result
    }

    /**
     * 获取频道私信
     * @param guild_id
     * @param message_id
     */
    async getDirectMessage(guild_id:string,message_id:string){
        const {data:payload}=await this.request.get(`/dms/${guild_id}/messages/${message_id}`)
        return this.processPayload(payload.id,`message.direct`,payload) as PrivateMessageEvent
    }
    /**
     * 撤回频道私信
     * @param guild_id
     * @param message_id
     * @param hidetip
     */
    async recallDirectMessage(guild_id: string, message_id: string, hidetip?: boolean) {
        const result = await this.request.delete(`/dms/${guild_id}/messages/${message_id}?hidetip=${!!hidetip}`)
        return result.status === 200
    }

    /**
     * 发送频道消息
     * @param channel_id
     * @param message
     * @param source
     */
    async sendGuildMessage(channel_id: string, message: Sendable, source?: Quotable) {
        const sender = new Sender(this, `/channels/${channel_id}`, message, source)
        const result = await sender.sendMsg()
        this.logger.info(`send to Channel(${channel_id}/messages): ${sender.brief}`)
        return result
    }

    /**
     * 撤回频道消息
     * @param channel_id
     * @param message_id
     * @param hidetip
     */
    async recallGuildMessage(channel_id: string, message_id: string, hidetip?: boolean) {
        const result = await this.request.delete(`/channels/${channel_id}/messages/${message_id}?hidetip=${!!hidetip}`)
        return result.status === 200
    }
    /**
     * 添加频道消息表态
     * @param channel_id {string} 子频道id
     * @param message_id {string} 消息id
     * @param type {0|1} 表情类型
     * @param id {`${number}`} 表情id
     */
    async addGuildMessageReaction(channel_id: string, message_id: string, type:EmojiType,id:`${number}`){
        const result = await this.request.put(`/channels/${channel_id}/messages/${message_id}/reactions/${type}/${id}`)
        return result.status === 200
    }

    /**
     * 添加频道消息表态
     * @deprecated use addGuildMessageReaction instead
     * @param channel_id {string} 子频道id
     * @param message_id {string} 消息id
     * @param type {0|1} 表情类型
     * @param id {`${number}`} 表情id
     */
    async reactionGuildMessage(channel_id: string, message_id: string, type: EmojiType, id: `${number}`) {
        return this.addGuildMessageReaction(channel_id,message_id,type,id)
    }

    /**
     * 删除频道消息表态
     * @param channel_id {string} 子频道id
     * @param message_id {string} 消息id
     * @param type {EmojiType} 表情类型
     * @param id {`${number}`} 表情id
     */
    async deleteGuildMessageReaction(channel_id: string, message_id: string, type: EmojiType, id: `${number}`) {
        const result = await this.request.delete(`/channels/${channel_id}/messages/${message_id}/reactions/${type}/${id}`)
        return result.status === 204
    }

    /**
     * 获取表态用户列表
     * @param channel_id {string} 子频道id
     * @param message_id {string} 消息id
     * @param type {0|1} 表情类型
     * @param id {`${number}`} 表情id
     */
    async getGuildMessageReactionMembers(channel_id: string, message_id: string, type: EmojiType, id: `${number}`) {
        const formatUser = (users: User.Info[]) => {
            return users.map(user => {
                return {
                    user_id: user.id,
                    user_name: user.username,
                    avatar: user.avatar
                }
            })
        }
        const getMembers = async (cookies?: string): Promise<{
            user_id: string
            user_name: string
            avatar: string
        }[]> => {
            const {
                data: {
                    users,
                    cookie,
                    is_end
                }
            } = await this.request.get(`/channels/${channel_id}/messages/${message_id}/reactions/${type}/${id}`, {
                params: {
                    cookie: cookies
                }
            })
            if (is_end) return formatUser(users)
            return [...formatUser(users), ...await getMembers(cookie)]
        }
        return await getMembers()
    }
    /** 获取频道日程
     * @param channel_id {string}
     * @param since {number}
     */
    async getChannelSchedules(channel_id:string,since?:number){
        const {data} = await this.request.get(`/channels/${channel_id}/schedules`,{
            params:{
                since
            }
        })
        return data
    }
    /**
     * 获取日程详情
     * @param channel_id
     * @param schedule_id
     */
    async getChannelScheduleInfo(channel_id:string,schedule_id:string){
        const {data} = await this.request.get(`/channels/${channel_id}/schedules/${schedule_id}`)
        return data
    }
    /**
     * 创建日程
     * @param channel_id
     * @param schedule
     */
    async createChannelSchedule(channel_id:string,schedule:Exclude<ScheduleInfo, 'id'>):Promise<ScheduleInfo>{
        const {data} = await this.request.post(`/channels/${channel_id}/schedules`,schedule)
        return data
    }

    /**
     * 修改日程
     * @param channel_id
     * @param schedule_id
     * @param schedule
     */
    async updateChannelSchedule(channel_id:string,schedule_id:string,schedule:Exclude<ScheduleInfo, 'id'>){
        const {data} = await this.request.patch(`/channels/${channel_id}/schedules/${schedule_id}`,schedule)
        return data
    }

    /**
     * 删除日程
     * @param channel_id
     * @param schedule_id
     */
    async deleteChannelSchedule(channel_id:string,schedule_id:string){
        const {data} = await this.request.delete(`/channels/${channel_id}/schedules/${schedule_id}`)
        return data
    }

    /**
     * 音频控制
     * @param channel_id
     * @param audio_control
     */
    async controlChannelAudio(channel_id:string,audio_control:AudioControl){
        const result=await this.request.post(`/channels/${channel_id}/audio`,audio_control)
        return result.status===200
    }

    /**
     * 上麦
     * @param channel_id
     */
    async setOnlineMic(channel_id:string){
        const result=await this.request.put(`/channels/${channel_id}/mic`)
        return result.status===200
    }

    /**
     * 下麦
     * @param channel_id
     */
    async setOfflineMic(channel_id:string){
        const result=await this.request.delete(`/channels/${channel_id}/mic`)
        return result.status===204
    }

    /**
     * 获取频道帖子列表
     * @param channel_id
     */
    async getChannelThreads(channel_id:string):Promise<Thread[]>{
        const {data} = await this.request.get(`/channels/${channel_id}/threads`)
        return data
    }

    /**
     * 获取频道帖子详情
     * @param channel_id
     * @param thread_id
     */
    async getChannelThreadInfo(channel_id:string,thread_id:string){
        const {data} = await this.request.get(`/channels/${channel_id}/threads/${thread_id}`)
        return data
    }
    /**
     * 创建频道帖子
     * @param channel_id
     * @param title
     * @param content
     * @param format {1|2|3|4}
     */
    async publishThread(channel_id:string,title:string,content:string,format:1|2|3|4=3):Promise<ThreadInfo>{
        const {data}=await this.request.post(`/channels/${channel_id}/threads`,{
            title,
            content,
            format
        })
        return data
    }

    /**
     * 删除频道帖子
     * @param channel_id
     * @param thread_id
     */
    async deleteThread(channel_id:string,thread_id:string){
        const result=await this.request.delete(`/channels/${channel_id}/threads/${thread_id}`)
        return result.status===204
    }

    /**
     * 回应操作
     * @param action_id {string} 操作id
     * @param code {number}
     */
    async replyAction(action_id: string,code:ActionNoticeEvent.ReplyCode=0) {
        const result = await this.request.put(`/interactions/${action_id}`, { code })
        return result.status === 200
    }

    async start() {
        await this.sessionManager.start()
        return this
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
export function defineConfig(config:Bot.Config){
    return config
}
export function createBot(config:Bot.Config){
    return new Bot(config)
}
