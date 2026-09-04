import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MemberService } from '@/services/member'
import { createFakeRequest } from './fake-http'

function rawMember(id: string) {
    return {
        user: { id, username: `user-${id}`, avatar: '', bot: false },
        nick: `card-${id}`,
        roles: ['1'],
        joined_at: '2026-09-04T00:00:00+08:00',
    }
}

test('getGuildMemberList follows all pages', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => rawMember(`member-${index}`))
    const fake = createFakeRequest((call) => ({
        data: call.params && (call.params as { after?: string }).after
            ? [rawMember('member-100')]
            : firstPage,
    }))
    const members = new MemberService(fake.request)

    const result = await members.getGuildMemberList('guild-id')

    assert.equal(result.length, 101)
    assert.deepEqual(fake.calls.map(call => call.params), [
        { after: undefined, limit: 100 },
        { after: 'member-99', limit: 100 },
    ])
})

test('guild member cache is optional and force refresh bypasses it', async () => {
    let fetches = 0
    const fake = createFakeRequest(() => {
        fetches += 1
        return { data: [rawMember(`member-${fetches}`)] }
    })
    const members = new MemberService(fake.request, { memberCache: true })

    assert.equal((await members.getGuildMemberList('guild-id'))[0].member_id, 'member-1')
    assert.equal((await members.getGuildMemberList('guild-id'))[0].member_id, 'member-1')
    assert.equal((await members.getGuildMemberList('guild-id', true))[0].member_id, 'member-2')
    assert.equal(fetches, 2)
})

test('guild member cache is disabled by default', async () => {
    const fake = createFakeRequest(() => ({ data: [rawMember('member-1')] }))
    const members = new MemberService(fake.request)

    await members.getGuildMemberList('guild-id')
    await members.getGuildMemberList('guild-id')

    assert.equal(fake.calls.length, 2)
})

test('failed guild member requests are not cached', async () => {
    let attempt = 0
    const fake = createFakeRequest(() => {
        attempt += 1
        if (attempt === 1) throw new Error('no permission')
        return { data: [rawMember('member-1')] }
    })
    const members = new MemberService(fake.request, { memberCache: true })

    assert.deepEqual(await members.getGuildMemberList('guild-id'), [])
    assert.equal((await members.getGuildMemberList('guild-id'))[0].member_id, 'member-1')
    assert.equal(fake.calls.length, 2)
})

test('guild member cache can be restored from a persistent JSON file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'qq-guild-cache-'))
    const cachePath = join(directory, 'members.json')
    try {
        const firstFake = createFakeRequest(() => ({ data: [rawMember('member-1')] }))
        const first = new MemberService(firstFake.request, {
            memberCache: { persist: true, path: cachePath },
        })
        await first.getGuildMemberList('guild-id')

        const secondFake = createFakeRequest(() => {
            throw new Error('persistent cache miss')
        })
        const second = new MemberService(secondFake.request, {
            memberCache: { persist: true, path: cachePath },
        })
        const cached = await second.getGuildMemberList('guild-id')

        assert.equal(cached[0].member_id, 'member-1')
        cached[0].roles.push('mutated')
        assert.deepEqual((await second.getGuildMemberList('guild-id'))[0].roles, ['1'])
        assert.equal(secondFake.calls.length, 0)
    } finally {
        await rm(directory, { recursive: true, force: true })
    }
})

test('guild member change handlers update an existing cache', async () => {
    const fake = createFakeRequest((call) => {
        if (call.url.endsWith('/members/member-2')) return { data: rawMember('member-2') }
        return { data: [rawMember('member-1')] }
    })
    const members = new MemberService(fake.request, { memberCache: true })
    await members.getGuildMemberList('guild-id')

    await members.handleMemberChanged('guild-id', 'member-2')
    await members.handleMemberRemoved('guild-id', 'member-1')

    assert.deepEqual(
        (await members.getGuildMemberList('guild-id')).map(member => member.member_id),
        ['member-2']
    )
    assert.equal(fake.calls.length, 2)
})

test('kicking a guild member removes it from the cache', async () => {
    const fake = createFakeRequest((call) => {
        if (call.method === 'delete') return { status: 204 }
        return { data: [rawMember('member-1')] }
    })
    const members = new MemberService(fake.request, { memberCache: true })
    await members.getGuildMemberList('guild-id')

    assert.equal(await members.kickMember('guild-id', 'member-1'), true)
    assert.deepEqual(await members.getGuildMemberList('guild-id'), [])
    assert.equal(fake.calls.length, 2)
})
