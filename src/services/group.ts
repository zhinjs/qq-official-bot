import type { AxiosInstance } from 'axios'
import { resolve } from 'node:path'
import { ListCacheStore } from './member-cache'

export interface GroupMemberCacheOptions {
    /** 将缓存写入 JSON 文件；也可直接配置 path 启用持久化。 */
    persist?: boolean;
    /** 缓存文件路径。相对路径基于当前工作目录解析。 */
    path?: string;
    /** 缓存最长有效期（毫秒）；0 或不传表示不过期，由事件保持同步。 */
    maxAge?: number;
}

export interface GroupServiceOptions {
    memberCache?: boolean | GroupMemberCacheOptions;
    dataDir?: string;
    appid?: string;
}

export interface GetGroupMembersOptions {
    /** 忽略缓存并重新拉取全部分页。 */
    forceRefresh?: boolean;
}

export interface GroupInfo {
    group_openid: string;
    group_name: string;
    group_finger_memo: string;
    group_class_text: string;
    group_tags: string[];
    group_member_num: number;
}

export type GroupMemberRole = 'member' | 'owner' | 'admin'
export type GroupReceiveMessageSetting = 'all' | 'only_mention' | 'mention_and_context'

export interface GroupBotState {
    member_openid: string;
    joined_at: string;
    allow_proactive_msg: boolean;
    recv_msg_setting: GroupReceiveMessageSetting;
    member_role: GroupMemberRole;
}

export interface GroupMemberInfo {
    member_openid: string;
    username: string;
    member_role: GroupMemberRole;
    bot: boolean;
    joined_at: string;
    union_openid?: string;
}

export interface GroupMemberListOptions {
    cursor?: string;
}

export interface GroupMemberList {
    members: GroupMemberInfo[];
    next_cursor: string;
}

export interface RemoveGroupMembersOptions {
    member_openids: string[];
    add_to_member_blacklist?: boolean;
}

export interface RemoveGroupMembersResult {
    remove_members_result: 'success' | string;
    add_to_member_blacklist_fail_openids: string[];
}

export interface GroupBlacklistUser {
    union_openid?: string;
    member_openid: string;
    username: string;
    banned_at: string;
    bot: boolean;
}

export interface GroupMemberBlacklist {
    users: GroupBlacklistUser[];
    next_cursor: string;
}

export interface UpdateGroupMemberBlacklistOptions {
    op: 'add' | 'del';
    member_openids: string[];
}

export interface UpdateGroupMemberBlacklistResult {
    fail_openids: string[];
}

export interface ReviewQA {
    question: string;
    answer: string;
}

export interface JoinRequestVerifyInfo {
    method: 'verify_message' | 'admin_review_qa';
    verify_message?: string;
    review_qa_list?: ReviewQA[];
}

export interface GroupJoinRequest {
    join_request_id: string;
    risk_tips?: string;
    union_openid?: string;
    member_openid: string;
    username: string;
    apply_at: string;
    apply_source: 'self_apply' | 'invited';
    invited_by?: string;
    bot?: boolean;
    verify_info?: JoinRequestVerifyInfo;
}

export interface PageOptions {
    cursor?: string;
    limit?: number;
}

export interface GroupJoinRequestList {
    list: GroupJoinRequest[];
    next_cursor: string;
}

export interface ApproveJoinRequestOptions {
    op: 'approve' | 'decline';
    join_request_id?: string;
    reject_reason?: string;
    add_to_member_blacklist?: boolean;
}

export interface MuteScheduleRule {
    task_id: string;
    start_at: string;
    end_at: string;
    enabled: boolean;
}

export interface MuteRecurringRule {
    task_id: string;
    weekdays: number[];
    start_time: string;
    end_time: string;
    enabled: boolean;
}

export interface GlobalMuteRule {
    mode: 'none' | 'always' | 'schedule';
    schedule_rules: MuteScheduleRule[];
    recurring_rules: MuteRecurringRule[];
}

export interface MemberMuteState {
    member_openid: string;
    mute_expire_at: string;
    username: string;
    union_openid?: string;
}

export interface GroupMuteSetting {
    global_rule: GlobalMuteRule;
    members: MemberMuteState[];
}

export interface SetMemberMuteState {
    op: 'add' | 'update' | 'del';
    member_openid: string;
    mute_expire_at?: string;
}

export type JoinApprovalStrategyState = 'on' | 'off'

export interface JoinApprovalStrategy {
    strategy_id: string;
    group_openids: string[];
    group_ids: string[];
    whitelist_user_count: number;
    is_enable: JoinApprovalStrategyState;
    expire_at: string;
    created_at: string;
    updated_at: string;
    remark?: string;
}

export interface JoinApprovalStrategyList {
    strategies: JoinApprovalStrategy[];
    next_cursor: string;
}

export interface CreateJoinApprovalStrategyOptions {
    group_openids?: string[];
    group_ids?: string[];
    is_enable?: JoinApprovalStrategyState;
    expire_at?: string;
    remark?: string;
}

export interface CreateJoinApprovalStrategyResult {
    strategy_id: string;
    is_enable: JoinApprovalStrategyState;
    expire_at: string;
}

export interface UpdateJoinApprovalStrategyResult {
    is_enable: JoinApprovalStrategyState;
    expire_at: string;
}

export interface JoinApprovalGroupAction {
    op: 'add' | 'del';
    group_openids?: string[];
    group_ids?: string[];
}

export interface UpdateJoinApprovalStrategyOptions {
    is_enable?: JoinApprovalStrategyState;
    expire_at?: string;
    group_action?: JoinApprovalGroupAction;
    remark?: string;
}

export interface UpdateJoinApprovalWhitelistOptions {
    op: 'add' | 'del';
    whitelist_users: string[];
}

export interface JoinApprovalWhitelistResult {
    strategy_id: string;
    whitelist_user_count: number;
    updated_at: string;
}

/**
 * QQ 群管理 API。
 * 部分接口仅对白名单机器人开放，入群审批和禁言接口还要求机器人是群管理员。
 */
export class GroupService {
    private readonly memberCache?: ListCacheStore<GroupMemberInfo>
    private readonly pendingMemberRequests = new Map<string, Promise<GroupMemberInfo[]>>()
    private readonly pendingMemberMutations = new Map<string, Promise<void>>()

    constructor(private request: AxiosInstance, options: GroupServiceOptions = {}) {
        const cache = resolveMemberCacheOptions(options)
        if (cache) {
            this.memberCache = new ListCacheStore(cache, member => member.member_openid)
        }
    }

    async getInfo(groupOpenid: string): Promise<GroupInfo> {
        const { data } = await this.request.get<GroupInfo>(`/v2/groups/${groupOpenid}/info`)
        return data
    }

    async getBotState(groupOpenid: string): Promise<GroupBotState> {
        const { data } = await this.request.get<GroupBotState>(`/v2/groups/${groupOpenid}/bot_state`)
        return data
    }

    /** 获取单页群成员，适合需要自行控制请求节奏的场景。 */
    async getMembersPage(
        groupOpenid: string,
        options: GroupMemberListOptions = {}
    ): Promise<GroupMemberList> {
        const { data } = await this.request.get<GroupMemberList>(`/v2/groups/${groupOpenid}/members`, {
            params: options
        })
        return data
    }

    /** 自动遍历 next_cursor，获取群内全部成员。 */
    async getMembers(
        groupOpenid: string,
        options: GetGroupMembersOptions = {}
    ): Promise<GroupMemberInfo[]> {
        await this.pendingMemberMutations.get(groupOpenid)?.catch(() => undefined)
        if (!options.forceRefresh && this.memberCache) {
            const cached = await this.memberCache.get(groupOpenid)
            if (cached) return cached
        }

        if (!options.forceRefresh) {
            const pending = this.pendingMemberRequests.get(groupOpenid)
            if (pending) return pending
        }

        const request = (async () => {
            const members = await this.fetchAllMembers(groupOpenid)
            await this.memberCache?.set(groupOpenid, members)
            return members
        })()
        this.pendingMemberRequests.set(groupOpenid, request)
        try {
            return await request
        } finally {
            if (this.pendingMemberRequests.get(groupOpenid) === request) {
                this.pendingMemberRequests.delete(groupOpenid)
            }
        }
    }

    private async fetchAllMembers(groupOpenid: string): Promise<GroupMemberInfo[]> {
        const members: GroupMemberInfo[] = []
        let cursor = ''
        const seenCursors = new Set<string>()

        do {
            const page = await this.getMembersPage(groupOpenid, { cursor })
            members.push(...(page.members ?? []))

            const nextCursor = page.next_cursor ?? ''
            if (!nextCursor) break
            if (seenCursors.has(nextCursor)) {
                throw new Error(`群成员分页游标重复: ${nextCursor}`)
            }
            seenCursors.add(nextCursor)
            cursor = nextCursor
        } while (cursor)

        return members
    }

    clearMemberCache(groupOpenid: string): Promise<void>
    clearMemberCache(): Promise<void>
    async clearMemberCache(groupOpenid?: string): Promise<void> {
        if (!this.memberCache) return
        if (groupOpenid) {
            const pendingRequest = this.pendingMemberRequests.get(groupOpenid)
            return this.queueMemberMutation(groupOpenid, async () => {
                await pendingRequest?.catch(() => undefined)
                await this.memberCache!.delete(groupOpenid)
            })
        }
        await Promise.allSettled([
            ...this.pendingMemberRequests.values(),
            ...this.pendingMemberMutations.values(),
        ])
        await this.memberCache.clear()
    }

    handleMemberAdded(groupOpenid: string, memberOpenid: string): Promise<void> {
        if (!this.memberCache) return Promise.resolve()
        return this.queueMemberMutation(groupOpenid, async () => {
            await this.pendingMemberRequests.get(groupOpenid)?.catch(() => undefined)
            if (!await this.memberCache!.has(groupOpenid)) return
            try {
                const member = await this.getMemberInfo(groupOpenid, memberOpenid)
                await this.memberCache!.upsert(groupOpenid, member)
            } catch (error) {
                await this.memberCache!.delete(groupOpenid)
                throw error
            }
        })
    }

    handleMemberRemoved(groupOpenid: string, memberOpenid: string): Promise<void> {
        if (!this.memberCache) return Promise.resolve()
        return this.queueMemberMutation(groupOpenid, async () => {
            await this.pendingMemberRequests.get(groupOpenid)?.catch(() => undefined)
            await this.memberCache!.removeMembers(groupOpenid, [memberOpenid])
        })
    }

    private queueMemberMutation(groupOpenid: string, mutation: () => Promise<void>): Promise<void> {
        const previous = this.pendingMemberMutations.get(groupOpenid) ?? Promise.resolve()
        const current = previous.catch(() => undefined).then(mutation)
        this.pendingMemberMutations.set(groupOpenid, current)
        current.then(
            () => this.finishMemberMutation(groupOpenid, current),
            () => this.finishMemberMutation(groupOpenid, current)
        )
        return current
    }

    private finishMemberMutation(groupOpenid: string, mutation: Promise<void>): void {
        if (this.pendingMemberMutations.get(groupOpenid) === mutation) {
            this.pendingMemberMutations.delete(groupOpenid)
        }
    }

    async getMemberInfo(groupOpenid: string, memberOpenid: string): Promise<GroupMemberInfo> {
        const { data } = await this.request.get<GroupMemberInfo>(
            `/v2/groups/${groupOpenid}/members/${memberOpenid}`
        )
        return data
    }

    async removeMembers(
        groupOpenid: string,
        options: RemoveGroupMembersOptions
    ): Promise<RemoveGroupMembersResult> {
        const { data } = await this.request.post<RemoveGroupMembersResult>(
            `/v2/groups/${groupOpenid}/batch_remove_members`,
            options
        )
        if (data.remove_members_result === 'success') {
            await this.handleMembersRemoved(groupOpenid, options.member_openids)
        }
        return data
    }

    private handleMembersRemoved(groupOpenid: string, memberOpenids: string[]): Promise<void> {
        if (!this.memberCache) return Promise.resolve()
        return this.queueMemberMutation(groupOpenid, async () => {
            await this.pendingMemberRequests.get(groupOpenid)?.catch(() => undefined)
            await this.memberCache!.removeMembers(groupOpenid, memberOpenids)
        })
    }

    async getMemberBlacklist(
        groupOpenid: string,
        options: PageOptions = {}
    ): Promise<GroupMemberBlacklist> {
        const { data } = await this.request.get<GroupMemberBlacklist>(
            `/v2/groups/${groupOpenid}/member_blacklist`,
            { params: options }
        )
        return data
    }

    async updateMemberBlacklist(
        groupOpenid: string,
        options: UpdateGroupMemberBlacklistOptions
    ): Promise<UpdateGroupMemberBlacklistResult> {
        const { data } = await this.request.post<UpdateGroupMemberBlacklistResult>(
            `/v2/groups/${groupOpenid}/member_blacklist`,
            options
        )
        return data
    }

    async getJoinRequests(groupOpenid: string, options: PageOptions = {}): Promise<GroupJoinRequestList> {
        const { data } = await this.request.get<GroupJoinRequestList>(`/v2/groups/${groupOpenid}/join_request_list`, {
            params: options
        })
        return data
    }

    async approveJoinRequest(
        groupOpenid: string,
        memberOpenid: string,
        options: ApproveJoinRequestOptions
    ): Promise<void> {
        await this.request.post(`/v2/groups/${groupOpenid}/approval_join_request/${memberOpenid}`, options)
    }

    async getMuteSetting(groupOpenid: string): Promise<GroupMuteSetting> {
        const { data } = await this.request.get<GroupMuteSetting>(`/v2/groups/${groupOpenid}/restrict_chat_setting`)
        return data
    }

    async setMemberMute(groupOpenid: string, members: SetMemberMuteState[]): Promise<void> {
        await this.request.post(`/v2/groups/${groupOpenid}/restrict_chat_setting`, { members })
    }

    async getJoinApprovalStrategies(options: PageOptions = {}): Promise<JoinApprovalStrategyList> {
        const { data } = await this.request.get<JoinApprovalStrategyList>('/v2/groups/join_approval_strategy', {
            params: options
        })
        return data
    }

    async createJoinApprovalStrategy(options: CreateJoinApprovalStrategyOptions): Promise<CreateJoinApprovalStrategyResult> {
        const { data } = await this.request.post<CreateJoinApprovalStrategyResult>('/v2/groups/join_approval_strategy', options)
        return data
    }

    async updateJoinApprovalStrategy(
        strategyId: string,
        options: UpdateJoinApprovalStrategyOptions
    ): Promise<UpdateJoinApprovalStrategyResult> {
        const { data } = await this.request.patch<UpdateJoinApprovalStrategyResult>(
            `/v2/groups/join_approval_strategy/${strategyId}`,
            options
        )
        return data
    }

    async deleteJoinApprovalStrategy(strategyId: string): Promise<void> {
        await this.request.delete(`/v2/groups/join_approval_strategy/${strategyId}`)
    }

    async executeJoinApprovalStrategy(strategyId: string): Promise<void> {
        await this.request.post(`/v2/groups/join_approval_strategy/${strategyId}/execute`, {})
    }

    async updateJoinApprovalWhitelist(
        strategyId: string,
        options: UpdateJoinApprovalWhitelistOptions
    ): Promise<JoinApprovalWhitelistResult> {
        const { data } = await this.request.post<JoinApprovalWhitelistResult>(
            `/v2/groups/join_approval_strategy/${strategyId}/whitelist_users`,
            options
        )
        return data
    }
}

function resolveMemberCacheOptions(options: GroupServiceOptions): { filePath?: string; maxAge?: number } | undefined {
    const config = options.memberCache
    if (!config) return undefined
    if (config === true) return {}

    const persist = config.persist || !!config.path
    let filePath: string | undefined
    if (persist) {
        const safeAppid = (options.appid || 'default').replace(/[^a-zA-Z0-9_-]/g, '_')
        filePath = resolve(
            config.path || options.dataDir || '.qq-official-bot',
            config.path ? '' : `${safeAppid}-group-members.json`
        )
    }
    return { filePath, maxAge: config.maxAge }
}
