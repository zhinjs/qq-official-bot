import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GuildService } from '@/services/guild'
import { createFakeRequest } from './fake-http'

function rawGuild(id: string, name = `guild-${id}`) {
    return {
        id,
        name,
        joined_at: '2026-09-04T00:00:00+08:00',
        owner_id: 'owner',
        owner: false,
        member_count: 1,
        max_members: 100,
        description: '',
        icon: '',
    }
}

test('getList follows all guild pages', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => rawGuild(`guild-${index}`))
    const fake = createFakeRequest((call) => ({
        data: call.params && (call.params as { after?: string }).after
            ? [rawGuild('guild-100')]
            : firstPage,
    }))
    const guilds = new GuildService(fake.request)

    const result = await guilds.getList()

    assert.equal(result.length, 101)
    assert.deepEqual(fake.calls.map(call => call.params), [
        { after: undefined },
        { after: 'guild-99' },
    ])
})

test('guild list cache is disabled by default and force refresh bypasses it', async () => {
    let fetches = 0
    const fake = createFakeRequest(() => {
        fetches += 1
        return { data: [rawGuild(`guild-${fetches}`)] }
    })

    const uncached = new GuildService(fake.request)
    await uncached.getList()
    await uncached.getList()
    assert.equal(fetches, 2)

    const cached = new GuildService(fake.request, { cache: true })
    assert.equal((await cached.getList())[0].guild_id, 'guild-3')
    assert.equal((await cached.getList())[0].guild_id, 'guild-3')
    assert.equal((await cached.getList(true))[0].guild_id, 'guild-4')
    assert.equal(fetches, 4)
})

test('guild list cache can be restored from a persistent JSON file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'qq-guild-list-cache-'))
    const cachePath = join(directory, 'guilds.json')
    try {
        const firstFake = createFakeRequest(() => ({ data: [rawGuild('guild-1')] }))
        const first = new GuildService(firstFake.request, {
            cache: { persist: true, path: cachePath },
        })
        await first.getList()

        const secondFake = createFakeRequest(() => {
            throw new Error('persistent cache miss')
        })
        const second = new GuildService(secondFake.request, {
            cache: { persist: true, path: cachePath },
        })

        assert.equal((await second.getList())[0].guild_id, 'guild-1')
        assert.equal(secondFake.calls.length, 0)
    } finally {
        await rm(directory, { recursive: true, force: true })
    }
})

test('guild change handlers maintain an existing list cache', async () => {
    const fake = createFakeRequest((call) => {
        if (call.url === '/guilds/guild-2') return { data: rawGuild('guild-2', 'updated') }
        return { data: [rawGuild('guild-1')] }
    })
    const guilds = new GuildService(fake.request, { cache: true })
    await guilds.getList()

    await guilds.handleGuildChanged('guild-2')
    await guilds.handleGuildRemoved('guild-1')

    assert.deepEqual(
        (await guilds.getList()).map(guild => [guild.guild_id, guild.guild_name]),
        [['guild-2', 'updated']]
    )
    assert.equal(fake.calls.length, 2)
})

test('failed guild list requests are not cached', async () => {
    let attempt = 0
    const fake = createFakeRequest(() => {
        attempt += 1
        if (attempt === 1) throw new Error('unsupported')
        return { data: [rawGuild('guild-1')] }
    })
    const guilds = new GuildService(fake.request, { cache: true })

    assert.deepEqual(await guilds.getList(), [])
    assert.equal((await guilds.getList())[0].guild_id, 'guild-1')
    assert.equal(fake.calls.length, 2)
})
