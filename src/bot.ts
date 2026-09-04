import { Client } from "./client";

import { Guild, Channel, Group, User, Direct } from "@/entries";
import {
    ApiBaseInfo,
    AudioControl,
    ChannelUpdateInfo,
    EmojiType,
    RoleCreateParam,
    RoleUpdateParam,
    ScheduleInfo,
    Thread,
    ThreadInfo,
    UpdatePermissionParams
} from "@/types";
import { Quotable, Sendable } from "@/elements";
import { UnsupportedMethodError } from "./constants";
import { ActionNoticeEvent } from "@/events/notice";
import { GuildMessageEvent } from "./events";
import { ApplicationPlatform, Middleware, ReceiverMode } from "@/receivers";
import { ResolveReceiver } from "@/receivers";
import { FileProcessor } from "@/message";

// 导入服务模块
import {
    GuildService,
    ChannelService,
    MessageService,
    MemberService,
    PermissionService,
    ReactionService,
    ScheduleService,
    ThreadService,
    AudioService,
    BotService,
    GroupService,
    MenuPanelService
} from "@/services";


export class Bot<T extends ReceiverMode = ReceiverMode, M extends ApplicationPlatform = ApplicationPlatform> extends Client<T, M> {

    // 重构后的组件实例
    public readonly messageService: MessageService;
    public readonly fileProcessor: FileProcessor = new FileProcessor(this.request);

    // 服务实例
    public readonly guildService: GuildService = new GuildService(this.request, {
        cache: this.config.guildCache,
        dataDir: this.config.dataDir,
        appid: this.config.appid,
    });
    public readonly channelService: ChannelService = new ChannelService(this.request);
    public readonly memberService: MemberService = new MemberService(this.request, {
        memberCache: this.config.guildMemberCache,
        dataDir: this.config.dataDir,
        appid: this.config.appid,
    });
    public readonly permissionService: PermissionService = new PermissionService(this.request);
    public readonly reactionService: ReactionService = new ReactionService(this.request);
    public readonly scheduleService: ScheduleService = new ScheduleService(this.request);
    public readonly threadService: ThreadService = new ThreadService(this.request);
    public readonly audioService: AudioService = new AudioService(this.request);
    public readonly botService: BotService = new BotService(this.request);
    public readonly groupService: GroupService = new GroupService(this.request, {
        memberCache: this.config.groupMemberCache,
        dataDir: this.config.dataDir,
        appid: this.config.appid,
    });
    public readonly menuPanelService: MenuPanelService = new MenuPanelService(this.request);

    constructor(config: Bot.Config<T, M>) {
        super(config)

        // 获取基础URL
        this.messageService = new MessageService(this.request, this.config.appid, this.fileProcessor);
        const nodeVersion = parseInt(process.version.slice(1))
        if (nodeVersion < 16) {
            this.logger.warn(`你的node版本(${process.version}) <16，可能会出现不可预测的错误，请升级node版本，为确保服务正常运行，请升级node版本`)
        }
        process.on("uncaughtException", e => {
            this.logger.debug(e.stack)
        })
        process.on("unhandledRejection", e => {
            this.logger.debug(e instanceof Error ? e.stack : e)
        })
        this.setupGroupMemberCacheEvents()
        this.setupGuildMemberCacheEvents()
        this.setupGuildCacheEvents()
    }

    private setupGroupMemberCacheEvents() {
        const handleError = (error: unknown) => {
            this.logger.warn('更新群成员缓存失败', error)
        }
        this.on('notice.group.increase', event => {
            void this.groupService.clearMemberCache(event.group_id).catch(handleError)
        })
        this.on('notice.group.decrease', event => {
            void this.groupService.clearMemberCache(event.group_id).catch(handleError)
        })
        this.on('notice.group.member.increase', event => {
            void this.groupService.handleMemberAdded(event.group_id, event.user_id).catch(handleError)
        })
        this.on('notice.group.member.decrease', event => {
            void this.groupService.handleMemberRemoved(event.group_id, event.user_id).catch(handleError)
        })
    }

    private setupGuildMemberCacheEvents() {
        const handleError = (error: unknown) => {
            this.logger.warn('更新频道成员缓存失败', error)
        }
        this.on('notice.guild.increase', event => {
            void this.memberService.clearMemberCache(event.guild_id).catch(handleError)
        })
        this.on('notice.guild.decrease', event => {
            void this.memberService.clearMemberCache(event.guild_id).catch(handleError)
        })
        this.on('notice.guild.member.increase', event => {
            void this.memberService.handleMemberChanged(event.guild_id, event.user_id).catch(handleError)
        })
        this.on('notice.guild.member.update', event => {
            void this.memberService.handleMemberChanged(event.guild_id, event.user_id).catch(handleError)
        })
        this.on('notice.guild.member.decrease', event => {
            void this.memberService.handleMemberRemoved(event.guild_id, event.user_id).catch(handleError)
        })
    }

    private setupGuildCacheEvents() {
        const handleError = (error: unknown) => {
            this.logger.warn('更新频道列表缓存失败', error)
        }
        this.on('notice.guild.increase', event => {
            void this.guildService.handleGuildChanged(event.guild_id).catch(handleError)
        })
        this.on('notice.guild.update', event => {
            void this.guildService.handleGuildChanged(event.guild_id).catch(handleError)
        })
        this.on('notice.guild.decrease', event => {
            void this.guildService.handleGuildRemoved(event.guild_id).catch(handleError)
        })
    }

    group(id: string) {
        return new Group(this, id)
    }

    user(id: string) {
        return new User(this, id)
    }

    channel(id: string) {
        return new Channel(this, id)
    }

    direct(guildId: string) {
        return new Direct(this, guildId)
    }

    guild(id: string) {
        return new Guild(this, id)
    }

    get middleware(): Middleware<M> {
        if (this.config.mode !== 'middleware') throw new Error('receiver mode is not middleware')
        return (this.receiver as ResolveReceiver<ReceiverMode.MIDDLEWARE, M>).handler.middleware()
    }
    /**
     * 获取机器人信息
     */
    async getSelfInfo() {
        return this.botService.getSelfInfo()
    }

    /**
     * 获取频道角色权限信息
     * @param channel_id 频道id
     * @param role_id 角色id
     */
    async getChannelPermissionOfRole(channel_id: string, role_id: string) {
        return this.channel(channel_id).rolePermission(role_id)
    }

    /**
     * 设置频道公告
     * @param guild_id
     * @param channel_id
     * @param message_id
     */
    async setChannelAnnounce(guild_id: string, channel_id: string, message_id: string) {
        return this.guild(guild_id).announce(channel_id, message_id)
    }

    /**
     * 更新频道角色权限
     * @param channel_id
     * @param role_id
     * @param permission
     */
    async updateChannelPermissionOfRole(channel_id: string, role_id: string, permission: UpdatePermissionParams) {
        return this.channel(channel_id).updateRolePermission(role_id, permission)
    }

    /**
     * 获取频道用户权限
     * @param channel_id
     * @param member_id
     */
    async getChannelMemberPermission(channel_id: string, member_id: string) {
        return this.channel(channel_id).memberPermission(member_id)
    }

    /**
     * 更新频道用户权限
     * @param channel_id
     * @param member_id
     * @param permission
     */
    async updateChannelMemberPermission(channel_id: string, member_id: string, permission: UpdatePermissionParams) {
        return this.channel(channel_id).updateMemberPermission(member_id, permission)
    }

    /**
     * 获取频道置顶消息id列表
     * @param channel_id
     */
    async getChannelPins(channel_id: string): Promise<string[]> {
        return this.channel(channel_id).pins()
    }

    /**
     * 置顶频道消息
     * @param channel_id
     * @param message_id
     */
    async pinChannelMessage(channel_id: string, message_id: string) {
        return this.channel(channel_id).pin(message_id)
    }

    /**
     * 取消置顶频道消息
     * @param channel_id
     * @param message_id
     */
    async unPinChannelMessage(channel_id: string, message_id: string) {
        return this.channel(channel_id).unpin(message_id)
    }

    /**
     * 创建子频道
     * @param guild_id
     * @param channelInfo
     */
    async createChannel(guild_id: string, channelInfo: Omit<Channel.Info, 'id'>) {
        return this.guild(guild_id).createChannel(channelInfo)
    }

    /**
     * 修改子频道
     * @param channel_id
     * @param updateInfo
     */
    async updateChannel(channel_id: string, updateInfo: ChannelUpdateInfo) {
        return this.channel(channel_id).update(updateInfo)
    }

    /**
     * 删除子频道
     * @param channel_id
     */
    async deleteChannel(channel_id: string) {
        return this.channel(channel_id).delete()
    }

    /**
     * 获取频道角色列表
     * @param guild_id
     */
    async getGuildRoles(guild_id: string) {
        return this.guild(guild_id).roles()
    }

    /**
     * 创建频道角色
     * @param guild_id
     * @param role
     */
    async creatGuildRole(guild_id: string, role: RoleCreateParam) {
        return this.guild(guild_id).createRole(role)
    }

    /**
     * 修改频道角色
     * @param guild_id
     * @param role_id
     * @param updateInfo
     */
    async updateGuildRole(guild_id: string, role_id: string, updateInfo: RoleUpdateParam) {
        return this.guild(guild_id).updateRole(role_id, updateInfo)
    }

    /**
     * 删除频道角色
     * @param role_id
     */
    async deleteGuildRole(guild_id: string, role_id: string) {
        return this.guild(guild_id).deleteRole(role_id)
    }

    /**
     * 获取频道可访问API类别
     * @param guild_id
     */
    async getGuildAccessApis(guild_id: string) {
        return this.guild(guild_id).accessApis()
    }

    /**
     * 申请频道API
     * @param guild_id
     * @param channel_id
     * @param apiInfo
     * @param desc
     */
    async applyGuildAccess(guild_id: string, channel_id: string, apiInfo: ApiBaseInfo, desc?: string) {
        return this.guild(guild_id).applyAccess(channel_id, apiInfo, desc)
    }

    /**
     * 取消频道禁言
     * @param guild_id
     */
    async unMuteGuild(guild_id: string) {
        return this.guild(guild_id).unmute()
    }

    /**
     * 频道禁言
     * @param guild_id
     * @param seconds
     * @param end_time
     */
    async muteGuild(guild_id: string, seconds: number, end_time?: number) {
        return this.guild(guild_id).mute(seconds, end_time)
    }

    /**
     * 批量取消频道成员禁言
     * @param guild_id
     * @param member_ids
     */
    async unMuteGuildMembers(guild_id: string, member_ids: string[]) {
        return this.guild(guild_id).unmuteMembers(member_ids)
    }

    /**
     * 批量禁言频道成员
     * @param guild_id
     * @param member_ids
     * @param seconds
     * @param end_time
     */
    async muteGuildMembers(guild_id: string, member_ids: string[], seconds: number, end_time?: number) {
        return this.guild(guild_id).muteMembers(member_ids, seconds, end_time)
    }

    async addGuildMemberRoles(guild_id: string, channel_id: string, member_id: string, role_id: string) {
        return this.guild(guild_id).addMemberRole(channel_id, member_id, role_id)
    }

    /**
     * 移除频道成员角色
     * @param guild_id
     * @param channel_id
     * @param member_id
     * @param role_id
     */
    async removeGuildMemberRoles(guild_id: string, channel_id: string, member_id: string, role_id: string) {
        return this.guild(guild_id).removeMemberRole(channel_id, member_id, role_id)
    }

    /**
     * 踢出频道成员
     * @param guild_id
     * @param member_id
     * @param clean
     * @param blacklist
     */
    async kickGuildMember(guild_id: string, member_id: string, clean: -1 | 0 | 3 | 7 | 15 | 30 = 0, blacklist?: boolean) {
        return this.guild(guild_id).kick(member_id, clean, blacklist)
    }

    /**
     * 取消频道成员禁言
     * @param guild_id
     * @param member_id
     */
    async unMuteGuildMember(guild_id: string, member_id: string) {
        return this.guild(guild_id).unmuteMember(member_id)
    }

    /**
     * 禁言频道成员
     * @param guild_id
     * @param member_id
     * @param seconds
     * @param end_time
     */
    async muteGuildMember(guild_id: string, member_id: string, seconds: number, end_time?: number) {
        return this.guild(guild_id).muteMember(member_id, seconds, end_time)
    }

    /**
     * 获取频道列表
     */
    async getGuildList(force = false) {
        return this.guildService.getList(force)
    }

    /**
     * 获取频道信息
     * @param guild_id
     */
    async getGuildInfo(guild_id: string): Promise<Guild.ApiInfo> {
        return this.guild(guild_id).info()
    }

    /**
     * 获取子频道消息
     * @param channel_id {string} 子频道id
     * @param message_id {string} 消息id
     */
    async getGuildMessage(channel_id: string, message_id: string): Promise<GuildMessageEvent> {
        return this.channel(channel_id).getMessage(message_id) as Promise<GuildMessageEvent>
    }
    /**
     * 获取频道成员列表
     * @param guild_id
     */
    async getGuildMemberList(guild_id: string, force = false) {
        return this.guild(guild_id).members(force)
    }

    /**
     * 获取频道成员信息
     * @param guild_id
     * @param member_id
     */
    async getGuildMemberInfo(guild_id: string, member_id: string) {
        return this.guild(guild_id).member(member_id)
    }

    /**
     * 获取群成员列表
     * @param group_id
     * @param force 是否忽略缓存并重新拉取，默认 false
     */
    async getGroupMemberList(group_id: string, force = false) {
        return this.group(group_id).members({ forceRefresh: force })
    }
    /**
     * 获取群成员信息
     * @param group_id
     * @param member_id
     */
    async getGroupMemberInfo(group_id: string, member_id: string) {
        return this.group(group_id).member(member_id)
    }
    /** 批量移除群成员 */
    async removeGroupMembers(...args: Parameters<GroupService['removeMembers']>) {
        const [group_id, options] = args
        return this.group(group_id).removeMembers(options)
    }
    /** 查询群黑名单 */
    async getGroupMemberBlacklist(group_id: string, options?: Parameters<Group['blacklist']>[0]) {
        return this.group(group_id).blacklist(options)
    }
    /** 增删群黑名单成员 */
    async updateGroupMemberBlacklist(...args: Parameters<GroupService['updateMemberBlacklist']>) {
        const [group_id, options] = args
        return this.group(group_id).updateBlacklist(options)
    }
    /** 获取群基本信息（白名单能力） */
    async getGroupInfo(group_id: string) {
        return this.group(group_id).info()
    }
    /** 获取机器人在群内的状态（白名单能力） */
    async getGroupBotState(group_id: string) {
        return this.group(group_id).botState()
    }
    /** 拉取入群申请列表 */
    async getGroupJoinRequests(group_id: string, options?: Parameters<Group['joinRequests']>[0]) {
        return this.group(group_id).joinRequests(options)
    }
    /** 审批入群申请 */
    async approveGroupJoinRequest(...args: Parameters<GroupService['approveJoinRequest']>) {
        const [group_id, memberOpenid, options] = args
        return this.group(group_id).approveJoin(memberOpenid, options)
    }
    /** 查询群禁言状态 */
    async getGroupMuteSetting(group_id: string) {
        return this.group(group_id).muteSetting()
    }
    /** 设置或解除群成员禁言 */
    async setGroupMemberMute(...args: Parameters<GroupService['setMemberMute']>) {
        const [group_id, members] = args
        return this.group(group_id).muteMembers(members)
    }
    /** 查询入群自动审批策略 */
    async getGroupJoinApprovalStrategies(...args: Parameters<GroupService['getJoinApprovalStrategies']>) {
        return this.groupService.getJoinApprovalStrategies(...args)
    }
    /** 创建入群自动审批策略 */
    async createGroupJoinApprovalStrategy(...args: Parameters<GroupService['createJoinApprovalStrategy']>) {
        return this.groupService.createJoinApprovalStrategy(...args)
    }
    /** 修改入群自动审批策略 */
    async updateGroupJoinApprovalStrategy(...args: Parameters<GroupService['updateJoinApprovalStrategy']>) {
        return this.groupService.updateJoinApprovalStrategy(...args)
    }
    /** 删除入群自动审批策略 */
    async deleteGroupJoinApprovalStrategy(...args: Parameters<GroupService['deleteJoinApprovalStrategy']>) {
        return this.groupService.deleteJoinApprovalStrategy(...args)
    }
    /** 立即执行一次入群自动审批策略 */
    async executeGroupJoinApprovalStrategy(...args: Parameters<GroupService['executeJoinApprovalStrategy']>) {
        return this.groupService.executeJoinApprovalStrategy(...args)
    }
    /** 增删入群自动审批策略的 QQ 号白名单 */
    async updateGroupJoinApprovalWhitelist(...args: Parameters<GroupService['updateJoinApprovalWhitelist']>) {
        return this.groupService.updateJoinApprovalWhitelist(...args)
    }
    /** 查询全局自定义菜单 */
    async getCustomMenu(...args: Parameters<MenuPanelService['getCustomMenu']>) {
        return this.menuPanelService.getCustomMenu(...args)
    }
    /** 修改全局自定义菜单 */
    async updateCustomMenu(...args: Parameters<MenuPanelService['updateCustomMenu']>) {
        return this.menuPanelService.updateCustomMenu(...args)
    }
    /** 查询指令面板列表 */
    async getCommandPanels(...args: Parameters<MenuPanelService['getCommandPanels']>) {
        return this.menuPanelService.getCommandPanels(...args)
    }
    /** 创建指令面板 */
    async createCommandPanel(...args: Parameters<MenuPanelService['createCommandPanel']>) {
        return this.menuPanelService.createCommandPanel(...args)
    }
    /** 查询指令面板详情 */
    async getCommandPanel(...args: Parameters<MenuPanelService['getCommandPanel']>) {
        return this.menuPanelService.getCommandPanel(...args)
    }
    /** 修改指令面板 */
    async updateCommandPanel(...args: Parameters<MenuPanelService['updateCommandPanel']>) {
        return this.menuPanelService.updateCommandPanel(...args)
    }
    /** 删除指令面板 */
    async deleteCommandPanel(...args: Parameters<MenuPanelService['deleteCommandPanel']>) {
        return this.menuPanelService.deleteCommandPanel(...args)
    }
    /** 修改指令面板关联对象 */
    async updateCommandPanelTargets(...args: Parameters<MenuPanelService['updateCommandPanelTargets']>) {
        return this.menuPanelService.updateCommandPanelTargets(...args)
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
        return this.user(user_id).send(message, source);
    }
    /**
     * 发送一截单聊流式消息
     */
    async sendPrivateStreamMessage(...args: Parameters<MessageService['sendPrivateStreamMessage']>) {
        const [user_id, payload] = args
        return this.user(user_id).sendStreamMessage(payload)
    }
    /**
     * 创建单聊流式会话
     */
    createPrivateStream(...args: Parameters<MessageService['createPrivateStream']>) {
        const [user_id, options] = args
        return this.user(user_id).createStream(options)
    }
    /**
     * 把文本流写成单聊流式消息
     */
    async sendPrivateStream(...args: Parameters<MessageService['sendPrivateStream']>) {
        const [user_id, chunks, options] = args
        return this.user(user_id).sendStream(chunks, options)
    }
    /**
     * 撤回私聊消息
     * @param user_id
     * @param message_id
     */
    async recallPrivateMessage(user_id: string, message_id: string) {
        return this.user(user_id).recall(message_id)
    }
    /**
     * 发送群消息
     * @param group_id
     * @param message
     * @param source
     */
    async sendGroupMessage(group_id: string, message: Sendable, source?: Quotable) {
        return this.group(group_id).send(message, source);
    }
    /**
     * 上传群聊/单聊富媒体。本地文件走官方分片上传，公网 URL 走平台转存。
     */
    async uploadMedia(
        targetId: string,
        targetType: 'user' | 'group',
        fileData: string | Buffer,
        options: Omit<Parameters<FileProcessor['uploadMedia']>[1], 'targetId' | 'targetType'> = {}
    ) {
        return targetType === 'group'
            ? this.group(targetId).upload(fileData, options)
            : this.user(targetId).upload(fileData, options)
    }
    /**
     * 撤回群消息
     * @param group_id
     * @param message_id
     */
    async recallGroupMessage(group_id: string, message_id: string) {
        return this.group(group_id).recall(message_id);
    }
    /**
     * 获取子频道列表
     */
    async getChannelList(guild_id: string) {
        return this.guild(guild_id).channels();
    }
    /**
     * 获取子频道信息
     * @param channel_id
     */
    async getChannelInfo(channel_id: string) {
        return this.channel(channel_id).info();
    }

    /**
     * 创建私信会话
     * @param guild_id
     * @param user_id
     */
    async createDirectSession(guild_id: string, user_id: string) {
        return this.messageService.createDirectSession(guild_id, user_id);
    }


    /**
     * 发送频道私信
     * @param guild_id
     * @param message
     * @param source
     */
    async sendDirectMessage(guild_id: string, message: Sendable, source?: Quotable) {
        return this.direct(guild_id).send(message, source);
    }

    /**
     * 获取频道私信
     * @param guild_id
     * @param message_id
     */
    async getDirectMessage(guild_id: string, message_id: string) {
        return this.direct(guild_id).getMessage(message_id);
    }
    /**
     * 撤回频道私信
     * @param guild_id
     * @param message_id
     * @param hidetip
     */
    async recallDirectMessage(guild_id: string, message_id: string, hidetip?: boolean) {
        return this.direct(guild_id).recall(message_id, hidetip);
    }

    /**
     * 发送频道消息
     * @param channel_id
     * @param message
     * @param source
     */
    async sendGuildMessage(channel_id: string, message: Sendable, source?: Quotable) {
        return this.channel(channel_id).send(message, source);
    }

    /**
     * 撤回频道消息
     * @param channel_id
     * @param message_id
     * @param hidetip
     */
    async recallGuildMessage(channel_id: string, message_id: string, hidetip?: boolean) {
        return this.channel(channel_id).recall(message_id, hidetip);
    }

    /**
     * 添加频道消息表态
     * @param channel_id {string} 子频道id
     * @param message_id {string} 消息id
     * @param type {0|1} 表情类型
     * @param id {`${number}`} 表情id
     */
    async addGuildMessageReaction(channel_id: string, message_id: string, type: EmojiType, id: `${number}`) {
        return this.channel(channel_id).react(message_id, type, id);
    }

    /**
     * 删除频道消息表态
     * @param channel_id {string} 子频道id
     * @param message_id {string} 消息id
     * @param type {EmojiType} 表情类型
     * @param id {`${number}`} 表情id
     */
    async deleteGuildMessageReaction(channel_id: string, message_id: string, type: EmojiType, id: `${number}`) {
        return this.channel(channel_id).deleteReaction(message_id, type, id);
    }

    /**
     * 获取表态用户列表
     * @param channel_id {string} 子频道id
     * @param message_id {string} 消息id
     * @param type {0|1} 表情类型
     * @param id {`${number}`} 表情id
     */
    async getGuildMessageReactionMembers(channel_id: string, message_id: string, type: EmojiType, id: `${number}`) {
        return this.channel(channel_id).reactionMembers(message_id, type, id);
    }
    /** 获取频道日程
     * @param channel_id {string}
     * @param since {number}
     */
    async getChannelSchedules(channel_id: string, since?: number) {
        return this.channel(channel_id).schedules(since);
    }
    /**
     * 获取日程详情
     * @param channel_id
     * @param schedule_id
     */
    async getChannelScheduleInfo(channel_id: string, schedule_id: string) {
        return this.channel(channel_id).schedule(schedule_id);
    }
    /**
     * 创建日程
     * @param channel_id
     * @param schedule
     */
    async createChannelSchedule(channel_id: string, schedule: Exclude<ScheduleInfo, 'id'>): Promise<ScheduleInfo> {
        return this.channel(channel_id).createSchedule(schedule)
    }

    /**
     * 修改日程
     * @param channel_id
     * @param schedule_id
     * @param schedule
     */
    async updateChannelSchedule(channel_id: string, schedule_id: string, schedule: Exclude<ScheduleInfo, 'id'>) {
        return this.channel(channel_id).updateSchedule(schedule_id, schedule)
    }

    /**
     * 删除日程
     * @param channel_id
     * @param schedule_id
     */
    async deleteChannelSchedule(channel_id: string, schedule_id: string) {
        return this.channel(channel_id).deleteSchedule(schedule_id)
    }

    /**
     * 音频控制
     * @param channel_id
     * @param audio_control
     */
    async controlChannelAudio(channel_id: string, audio_control: AudioControl) {
        return this.channel(channel_id).controlAudio(audio_control)
    }

    /**
     * 上麦
     * @param channel_id
     */
    async setOnlineMic(channel_id: string) {
        return this.channel(channel_id).onlineMic()
    }

    /**
     * 下麦
     * @param channel_id
     */
    async setOfflineMic(channel_id: string) {
        return this.channel(channel_id).offlineMic()
    }

    /**
     * 获取频道帖子列表
     * @param channel_id
     */
    async getChannelThreads(channel_id: string): Promise<Thread[]> {
        return this.channel(channel_id).threads()
    }

    /**
     * 获取频道帖子详情
     * @param channel_id
     * @param thread_id
     */
    async getChannelThreadInfo(channel_id: string, thread_id: string) {
        return this.channel(channel_id).thread(thread_id)
    }
    /**
     * 创建频道帖子
     * @param channel_id
     * @param title
     * @param content
     * @param format {1|2|3|4}
     */
    async publishThread(channel_id: string, title: string, content: string, format: 1 | 2 | 3 | 4 = 3): Promise<ThreadInfo> {
        return this.channel(channel_id).publishThread(title, content, format)
    }

    /**
     * 删除频道帖子
     * @param channel_id
     * @param thread_id
     */
    async deleteThread(channel_id: string, thread_id: string) {
        return this.channel(channel_id).deleteThread(thread_id)
    }

    /**
     * 回应操作
     * @param action_id {string} 操作id
     * @param code {number}
     */
    async replyAction(action_id: string, code: ActionNoticeEvent.ReplyCode = 0) {
        return this.botService.replyAction(action_id, code)
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

    export type Config<T extends ReceiverMode, M extends ApplicationPlatform = ApplicationPlatform> = {
    } & Client.Config<T, M>
}
export function defineConfig<T extends ReceiverMode, M extends ApplicationPlatform = ApplicationPlatform>(config: Bot.Config<T, M>) {
    return config
}
export function createBot<T extends ReceiverMode, M extends ApplicationPlatform = ApplicationPlatform>(config: Bot.Config<T, M>) {
    return new Bot(config)
}
