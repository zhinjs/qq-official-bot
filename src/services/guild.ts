/**
 * 频道服务类 - 负责所有频道相关的API操作
 */
import { AxiosResponse, AxiosInstance } from 'axios'
import { Guild } from '@'
import { resolve } from 'node:path'
import { ListCacheStore } from './member-cache'
import {
    RoleCreateParam,
    RoleUpdateParam,
    ApiBaseInfo,
    ApiPermissionDemand
} from '@'

export interface GuildCacheOptions {
    /** 将缓存写入 JSON 文件；也可直接配置 path 启用持久化。 */
    persist?: boolean;
    /** 缓存文件路径。相对路径基于当前工作目录解析。 */
    path?: string;
    /** 缓存最长有效期（毫秒）；0 或不传表示不过期，由事件保持同步。 */
    maxAge?: number;
}

export interface GuildServiceOptions {
    cache?: boolean | GuildCacheOptions;
    dataDir?: string;
    appid?: string;
}

const GUILD_LIST_CACHE_KEY = 'guilds'

export class GuildService {
    private readonly cache?: ListCacheStore<Guild.ApiInfo>
    private pendingListRequest?: Promise<Guild.ApiInfo[]>
    private pendingMutation?: Promise<void>

    constructor(private request: AxiosInstance, options: GuildServiceOptions = {}) {
        const cache = resolveGuildCacheOptions(options)
        if (cache) this.cache = new ListCacheStore(cache, guild => guild.guild_id)
    }

    /**
     * 获取频道列表
     */
    async getList(force = false): Promise<Guild.ApiInfo[]> {
        await this.pendingMutation?.catch(() => undefined)
        if (!force && this.cache) {
            const cached = await this.cache.get(GUILD_LIST_CACHE_KEY)
            if (cached) return cached
        }
        if (!force && this.pendingListRequest) return this.pendingListRequest

        const request = (async () => {
            const { guilds, cacheable } = await this.fetchGuildList()
            if (cacheable) await this.cache?.set(GUILD_LIST_CACHE_KEY, guilds)
            return guilds
        })()
        this.pendingListRequest = request
        try {
            return await request
        } finally {
            if (this.pendingListRequest === request) this.pendingListRequest = undefined
        }
    }

    async clearCache(): Promise<void> {
        if (!this.cache) return
        const pendingRequest = this.pendingListRequest
        return this.queueMutation(async () => {
            await pendingRequest?.catch(() => undefined)
            await this.cache!.delete(GUILD_LIST_CACHE_KEY)
        })
    }

    handleGuildChanged(guildId: string): Promise<void> {
        if (!this.cache) return Promise.resolve()
        return this.queueMutation(async () => {
            await this.pendingListRequest?.catch(() => undefined)
            if (!await this.cache!.has(GUILD_LIST_CACHE_KEY)) return
            try {
                const guild = await this.getInfo(guildId)
                await this.cache!.upsert(GUILD_LIST_CACHE_KEY, guild)
            } catch (error) {
                await this.cache!.delete(GUILD_LIST_CACHE_KEY)
                throw error
            }
        })
    }

    handleGuildRemoved(guildId: string): Promise<void> {
        if (!this.cache) return Promise.resolve()
        return this.queueMutation(async () => {
            await this.pendingListRequest?.catch(() => undefined)
            await this.cache!.removeMembers(GUILD_LIST_CACHE_KEY, [guildId])
        })
    }

    private queueMutation(mutation: () => Promise<void>): Promise<void> {
        const previous = this.pendingMutation ?? Promise.resolve()
        const current = previous.catch(() => undefined).then(mutation)
        this.pendingMutation = current
        current.then(
            () => this.finishMutation(current),
            () => this.finishMutation(current)
        )
        return current
    }

    private finishMutation(mutation: Promise<void>): void {
        if (this.pendingMutation === mutation) this.pendingMutation = undefined
    }

    /**
     * 获取频道信息
     */
    async getInfo(guildId: string): Promise<Guild.ApiInfo> {
        const { data: { id: _, name: guild_name, joined_at, ...guild } } =
            await this.request.get(`/guilds/${guildId}`)

        const result: Guild.ApiInfo = {
            guild_id: guildId,
            guild_name,
            join_time: new Date(joined_at).getTime() / 1000,
            ...guild
        }

        return result
    }

    /**
     * 频道禁言
     */
    async mute(guildId: string, seconds: number, endTime?: number): Promise<boolean> {
        const result = await this.request.put(`/guilds/${guildId}/mute`, {
            mute_seconds: `${seconds}`,
            mute_end_timestamp: `${endTime || 0}`
        })

        return result.status === 204
    }

    /**
     * 取消频道禁言
     */
    async unmute(guildId: string): Promise<boolean> {
        return this.mute(guildId, 0, 0)
    }

    /**
     * 获取频道角色列表
     */
    async getRoles(guildId: string): Promise<Guild.Role[]> {
        const { data: { roles = [] } = {} } =
            await this.request.get<{ roles: Guild.Role[] }>(`/guilds/${guildId}/roles`)

        return roles
    }

    /**
     * 创建频道角色
     */
    async createRole(guildId: string, role: RoleCreateParam): Promise<Guild.Role> {
        const { data: { role: result } } = await this.request.post<
            RoleCreateParam,
            AxiosResponse<{ role: Guild.Role }>
        >(`/guilds/${guildId}/roles`, role)

        return result
    }

    /**
     * 更新频道角色
     */
    async updateRole(
        guildId: string,
        roleId: string,
        updateInfo: RoleUpdateParam
    ): Promise<Guild.Role> {
        const { data: { role: result } } = await this.request.patch<
            RoleUpdateParam,
            AxiosResponse<{ role: Guild.Role }>
        >(`/guilds/${guildId}/roles/${roleId}`, updateInfo)

        return result
    }

    /**
     * 删除频道角色
     */
    async deleteRole(guildId: string, roleId: string): Promise<boolean> {
        const result = await this.request.delete(`/guilds/${guildId}/roles/${roleId}`)
        return result.status === 204
    }

    /**
     * 获取频道可访问API类别
     */
    async getAccessApis(guildId: string): Promise<ApiPermissionDemand[]> {
        const { data: { apis = [] } } = await this.request.get<{
            apis: ApiPermissionDemand[]
        }>(`/guilds/${guildId}/api_permission`)

        return apis
    }

    /**
     * 申请频道API权限
     */
    async applyAccess(
        guildId: string,
        channelId: string,
        apiInfo: ApiBaseInfo,
        desc?: string
    ): Promise<ApiPermissionDemand> {
        const { data: result } = await this.request.post<{
            channel_id: string
            api_identify: ApiBaseInfo
            desc: string
        }, AxiosResponse<ApiPermissionDemand>>(`/guilds/${guildId}/api_permission/demand`, {
            channel_id: channelId,
            api_identify: apiInfo,
            desc,
        })

        return result
    }

    /**
     * 私有方法：获取频道列表的实现
     */
    private async fetchGuildList(): Promise<{ guilds: Guild.ApiInfo[]; cacheable: boolean }> {
        const guilds: Guild.ApiInfo[] = []
        const seenGuildIds = new Set<string>()
        let after: string | undefined

        while (true) {
            let res
            try {
                res = await this.request.get('/users/@me/guilds', { params: { after } })
            } catch {
                // 私域不支持时保持原有空数组兼容行为，但不缓存失败结果。
                return { guilds, cacheable: false }
            }
            if (!res.data?.length) break

            const page = (res.data || []).map(g => {
                const { id: guild_id, name: guild_name, joined_at, ...guild } = g
                return {
                    guild_id,
                    guild_name,
                    join_time: new Date(joined_at).getTime() / 1000,
                    ...guild
                }
            })
            guilds.push(...page)
            if (page.length < 100) break

            const nextAfter = page[page.length - 1].guild_id
            if (seenGuildIds.has(nextAfter)) {
                throw new Error(`频道列表分页游标重复: ${nextAfter}`)
            }
            seenGuildIds.add(nextAfter)
            after = nextAfter
        }
        return { guilds, cacheable: true }
    }
}

function resolveGuildCacheOptions(options: GuildServiceOptions): { filePath?: string; maxAge?: number } | undefined {
    const config = options.cache
    if (!config) return undefined
    if (config === true) return {}

    const persist = config.persist || !!config.path
    let filePath: string | undefined
    if (persist) {
        const safeAppid = (options.appid || 'default').replace(/[^a-zA-Z0-9_-]/g, '_')
        filePath = resolve(
            config.path || options.dataDir || '.qq-official-bot',
            config.path ? '' : `${safeAppid}-guild-list.json`
        )
    }
    return { filePath, maxAge: config.maxAge }
}
