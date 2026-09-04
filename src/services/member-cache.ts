import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

interface CacheEntry<Member> {
    members: Member[];
    updatedAt: number;
}

interface PersistedCache<Member> {
    version: 1;
    groups: Record<string, CacheEntry<Member>>;
}

export interface MemberCacheStoreOptions {
    filePath?: string;
    maxAge?: number;
}

/** Internal persistent list cache shared by group and guild member services. */
export class ListCacheStore<Member extends object> {
    private readonly entries = new Map<string, CacheEntry<Member>>()
    private readonly ready: Promise<void>
    private writeQueue: Promise<void> = Promise.resolve()

    constructor(
        private readonly options: MemberCacheStoreOptions = {},
        private readonly getMemberId: (member: Member) => string
    ) {
        this.ready = this.load()
    }

    async get(scopeId: string): Promise<Member[] | undefined> {
        await this.ready
        const entry = this.entries.get(scopeId)
        if (!entry) return undefined

        const maxAge = this.options.maxAge ?? 0
        if (maxAge > 0 && Date.now() - entry.updatedAt >= maxAge) {
            this.entries.delete(scopeId)
            await this.persist()
            return undefined
        }
        return cloneMembers(entry.members)
    }

    async has(scopeId: string): Promise<boolean> {
        return (await this.get(scopeId)) !== undefined
    }

    async set(scopeId: string, members: Member[]): Promise<void> {
        await this.ready
        this.entries.set(scopeId, {
            members: cloneMembers(members),
            updatedAt: Date.now(),
        })
        await this.persist()
    }

    async upsert(scopeId: string, member: Member): Promise<boolean> {
        await this.ready
        const entry = this.entries.get(scopeId)
        if (!entry) return false

        const memberId = this.getMemberId(member)
        const index = entry.members.findIndex(item => this.getMemberId(item) === memberId)
        if (index === -1) entry.members.push({ ...member })
        else entry.members[index] = { ...member }
        entry.updatedAt = Date.now()
        await this.persist()
        return true
    }

    async removeMembers(scopeId: string, memberIds: string[]): Promise<boolean> {
        await this.ready
        const entry = this.entries.get(scopeId)
        if (!entry) return false

        const removed = new Set(memberIds)
        entry.members = entry.members.filter(member => !removed.has(this.getMemberId(member)))
        entry.updatedAt = Date.now()
        await this.persist()
        return true
    }

    async delete(scopeId: string): Promise<void> {
        await this.ready
        if (!this.entries.delete(scopeId)) return
        await this.persist()
    }

    async clear(): Promise<void> {
        await this.ready
        if (!this.entries.size) return
        this.entries.clear()
        await this.persist()
    }

    private async load(): Promise<void> {
        if (!this.options.filePath) return
        try {
            const raw = await readFile(this.options.filePath, 'utf8')
            const cache = JSON.parse(raw) as Partial<PersistedCache<Member>>
            if (cache.version !== 1 || !cache.groups || typeof cache.groups !== 'object') return
            for (const [scopeId, entry] of Object.entries(cache.groups)) {
                if (!entry || !Array.isArray(entry.members) || typeof entry.updatedAt !== 'number') continue
                this.entries.set(scopeId, {
                    members: cloneMembers(entry.members),
                    updatedAt: entry.updatedAt,
                })
            }
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                this.entries.clear()
            }
        }
    }

    private persist(): Promise<void> {
        const filePath = this.options.filePath
        if (!filePath) return Promise.resolve()

        const groups = Object.fromEntries(
            [...this.entries.entries()].map(([scopeId, entry]) => [scopeId, {
                members: cloneMembers(entry.members),
                updatedAt: entry.updatedAt,
            }])
        )
        const data = JSON.stringify({ version: 1, groups } satisfies PersistedCache<Member>)
        const tempPath = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
        const write = this.writeQueue.then(async () => {
            await mkdir(dirname(filePath), { recursive: true })
            await writeFile(tempPath, data, 'utf8')
            await rename(tempPath, filePath)
        })
        this.writeQueue = write.catch(() => undefined)
        return write
    }
}

function cloneMembers<Member extends object>(members: Member[]): Member[] {
    return cloneValue(members)
}

function cloneValue<Value>(value: Value): Value {
    if (Array.isArray(value)) {
        return value.map(item => cloneValue(item)) as Value
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, cloneValue(item)])
        ) as Value
    }
    return value
}
