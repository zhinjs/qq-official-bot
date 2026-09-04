/**
 * 成员服务类 - 负责所有成员相关的API操作
 */
import { AxiosInstance } from 'axios'
import { GuildMember } from '@/entries/guildMember'
import { resolve } from 'node:path'
import { ListCacheStore } from './member-cache'

export interface GuildMemberCacheOptions {
    /** 将缓存写入 JSON 文件；也可直接配置 path 启用持久化。 */
    persist?: boolean;
    /** 缓存文件路径。相对路径基于当前工作目录解析。 */
    path?: string;
    /** 缓存最长有效期（毫秒）；0 或不传表示不过期，由事件保持同步。 */
    maxAge?: number;
}

export interface MemberServiceOptions {
    memberCache?: boolean | GuildMemberCacheOptions;
    dataDir?: string;
    appid?: string;
}

export class MemberService {
    private readonly memberCache?: ListCacheStore<GuildMember.ApiInfo>
    private readonly pendingMemberRequests = new Map<string, Promise<GuildMember.ApiInfo[]>>()
    private readonly pendingMemberMutations = new Map<string, Promise<void>>()

    constructor(private request: AxiosInstance, options: MemberServiceOptions = {}) {
        const cache = resolveMemberCacheOptions(options)
        if (cache) {
            this.memberCache = new ListCacheStore(cache, member => member.member_id)
        }
    }

    /**
     * 获取频道成员列表
     */
    async getGuildMemberList(guildId: string, force = false): Promise<GuildMember.ApiInfo[]> {
        await this.pendingMemberMutations.get(guildId)?.catch(() => undefined)
        if (!force && this.memberCache) {
            const cached = await this.memberCache.get(guildId)
            if (cached) return cached
        }

        if (!force) {
            const pending = this.pendingMemberRequests.get(guildId)
            if (pending) return pending
        }

        const request = (async () => {
            const { members, cacheable } = await this.fetchGuildMembers(guildId)
            if (cacheable) await this.memberCache?.set(guildId, members)
            return members
        })()
        this.pendingMemberRequests.set(guildId, request)
        try {
            return await request
        } finally {
            if (this.pendingMemberRequests.get(guildId) === request) {
                this.pendingMemberRequests.delete(guildId)
            }
        }
    }

    clearMemberCache(guildId: string): Promise<void>
    clearMemberCache(): Promise<void>
    async clearMemberCache(guildId?: string): Promise<void> {
        if (!this.memberCache) return
        if (guildId) {
            const pendingRequest = this.pendingMemberRequests.get(guildId)
            return this.queueMemberMutation(guildId, async () => {
                await pendingRequest?.catch(() => undefined)
                await this.memberCache!.delete(guildId)
            })
        }
        await Promise.allSettled([
            ...this.pendingMemberRequests.values(),
            ...this.pendingMemberMutations.values(),
        ])
        await this.memberCache.clear()
    }

    handleMemberChanged(guildId: string, memberId: string): Promise<void> {
        if (!this.memberCache) return Promise.resolve()
        return this.queueMemberMutation(guildId, async () => {
            await this.pendingMemberRequests.get(guildId)?.catch(() => undefined)
            if (!await this.memberCache!.has(guildId)) return
            try {
                const member = await this.getGuildMemberInfo(guildId, memberId)
                await this.memberCache!.upsert(guildId, member)
            } catch (error) {
                await this.memberCache!.delete(guildId)
                throw error
            }
        })
    }

    handleMemberRemoved(guildId: string, memberId: string): Promise<void> {
        if (!this.memberCache) return Promise.resolve()
        return this.queueMemberMutation(guildId, async () => {
            await this.pendingMemberRequests.get(guildId)?.catch(() => undefined)
            await this.memberCache!.removeMembers(guildId, [memberId])
        })
    }

    private queueMemberMutation(guildId: string, mutation: () => Promise<void>): Promise<void> {
        const previous = this.pendingMemberMutations.get(guildId) ?? Promise.resolve()
        const current = previous.catch(() => undefined).then(mutation)
        this.pendingMemberMutations.set(guildId, current)
        current.then(
            () => this.finishMemberMutation(guildId, current),
            () => this.finishMemberMutation(guildId, current)
        )
        return current
    }

    private finishMemberMutation(guildId: string, mutation: Promise<void>): void {
        if (this.pendingMemberMutations.get(guildId) === mutation) {
            this.pendingMemberMutations.delete(guildId)
        }
    }

    /**
     * 获取频道成员信息
     */
    async getGuildMemberInfo(guildId: string, memberId: string): Promise<GuildMember.ApiInfo> {
        const { data: { user: { id: member_id, ...member }, roles, joined_at, nick } } =
            await this.request.get(`/guilds/${guildId}/members/${memberId}`)

        return {
            member_id,
            card: nick,
            roles,
            ...member,
            join_time: new Date(joined_at).getTime() / 1000,
        }
    }

    /**
     * 批量禁言频道成员
     */
    async muteMembers(
        guildId: string, 
        memberIds: string[], 
        seconds: number, 
        endTime?: number
    ): Promise<boolean> {
        const result = await this.request.put(`/guilds/${guildId}/mute`, {
            mute_seconds: `${seconds}`,
            mute_end_timestamp: `${endTime}`,
            user_ids: memberIds
        })
        return result.status === 200
    }

    /**
     * 批量取消频道成员禁言
     */
    async unmuteMembers(guildId: string, memberIds: string[]): Promise<boolean> {
        return await this.muteMembers(guildId, memberIds, 0, 0)
    }

    /**
     * 添加频道成员角色
     */
    async addMemberRole(
        guildId: string, 
        channelId: string, 
        memberId: string, 
        roleId: string
    ): Promise<boolean> {
        const result = await this.request.put(
            `/guilds/${guildId}/members/${memberId}/roles/${roleId}`, 
            { id: channelId }
        )
        const success = result.status === 204
        if (success) await this.handleMemberChanged(guildId, memberId)
        return success
    }

    /**
     * 移除频道成员角色
     */
    async removeMemberRole(
        guildId: string, 
        channelId: string, 
        memberId: string, 
        roleId: string
    ): Promise<boolean> {
        const result = await this.request.delete(
            `/guilds/${guildId}/members/${memberId}/roles/${roleId}`, 
            { data: { id: channelId } }
        )
        const success = result.status === 204
        if (success) await this.handleMemberChanged(guildId, memberId)
        return success
    }

    /**
     * 踢出频道成员
     */
    async kickMember(
        guildId: string, 
        memberId: string, 
        clean: -1 | 0 | 3 | 7 | 15 | 30 = 0, 
        blacklist?: boolean
    ): Promise<boolean> {
        const result = await this.request.delete(`/guilds/${guildId}/members/${memberId}`, {
            data: {
                add_blacklist: blacklist,
                delete_message_days: clean
            }
        })
        const success = result.status === 204
        if (success) await this.handleMemberRemoved(guildId, memberId)
        return success
    }

    async muteGuildMember(guildId: string, memberId: string, seconds: number, endTime?: number): Promise<boolean> {
        const result = await this.request.put(`/guilds/${guildId}/members/${memberId}/mute`, {
            mute_seconds: `${seconds}`,
            mute_end_timestamp: `${endTime || 0}`
        })
        return result.status === 204
    }

    async unmuteGuildMember(guildId: string, memberId: string): Promise<boolean> {
        return this.muteGuildMember(guildId, memberId, 0, 0)
    }

    /**
     * 私有方法：获取频道成员列表的实现
     */
    private async fetchGuildMembers(
        guildId: string
    ): Promise<{ members: GuildMember.ApiInfo[]; cacheable: boolean }> {
        const members: GuildMember.ApiInfo[] = []
        const seenMemberIds = new Set<string>()
        let after: string | undefined

        while (true) {
            let res
            try {
                res = await this.request.get(`/guilds/${guildId}/members`, {
                    params: { after, limit: 100 }
                })
            } catch {
                // 公域没有权限时保持原有的空数组兼容行为，但不缓存失败结果。
                return { members, cacheable: false }
            }

            if (!res.data?.length) break
            const page = (res.data || []).map(m => {
                const { user: { id: member_id, ...member }, roles, joined_at, nick } = m
                return {
                    member_id,
                    card: nick,
                    roles,
                    ...member,
                    join_time: new Date(joined_at).getTime() / 1000,
                }
            })
            members.push(...page)
            if (page.length < 100) break

            const nextAfter = page[page.length - 1].member_id
            if (seenMemberIds.has(nextAfter)) {
                throw new Error(`频道成员分页游标重复: ${nextAfter}`)
            }
            seenMemberIds.add(nextAfter)
            after = nextAfter
        }
        return { members, cacheable: true }
    }
}

function resolveMemberCacheOptions(options: MemberServiceOptions): { filePath?: string; maxAge?: number } | undefined {
    const config = options.memberCache
    if (!config) return undefined
    if (config === true) return {}

    const persist = config.persist || !!config.path
    let filePath: string | undefined
    if (persist) {
        const safeAppid = (options.appid || 'default').replace(/[^a-zA-Z0-9_-]/g, '_')
        filePath = resolve(
            config.path || options.dataDir || '.qq-official-bot',
            config.path ? '' : `${safeAppid}-guild-members.json`
        )
    }
    return { filePath, maxAge: config.maxAge }
}
