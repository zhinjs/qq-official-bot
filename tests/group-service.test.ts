import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GroupService } from '@/services/group'
import { createFakeRequest } from './fake-http'

function createGroupService(data: unknown = {}) {
    const fake = createFakeRequest(() => ({ data }))
    return { groups: new GroupService(fake.request), ...fake }
}

test('getMembersPage requests one paginated group member page', async () => {
    const payload = { members: [], next_cursor: 'next' }
    const { groups, calls } = createGroupService(payload)

    assert.deepEqual(await groups.getMembersPage('group-openid', { cursor: 'cursor-1' }), payload)
    assert.equal(calls[0].method, 'get')
    assert.equal(calls[0].url, '/v2/groups/group-openid/members')
    assert.deepEqual(calls[0].params, { cursor: 'cursor-1' })
})

test('getMembers follows next_cursor and returns all members', async () => {
    const fake = createFakeRequest((call) => {
        const cursor = (call.params as { cursor?: string })?.cursor
        if (!cursor) {
            return {
                data: {
                    members: [{ member_openid: 'member-1' }],
                    next_cursor: 'cursor-2',
                },
            }
        }
        return {
            data: {
                members: [{ member_openid: 'member-2' }],
                next_cursor: '',
            },
        }
    })
    const groups = new GroupService(fake.request)

    const members = await groups.getMembers('group-openid')

    assert.deepEqual(members, [
        { member_openid: 'member-1' },
        { member_openid: 'member-2' },
    ])
    assert.deepEqual(fake.calls.map(call => call.params), [
        { cursor: '' },
        { cursor: 'cursor-2' },
    ])
})

test('getMembers rejects a repeated cursor instead of looping forever', async () => {
    const fake = createFakeRequest(() => ({
        data: { members: [], next_cursor: 'same-cursor' },
    }))
    const groups = new GroupService(fake.request)

    await assert.rejects(
        groups.getMembers('group-openid'),
        /群成员分页游标重复: same-cursor/
    )
    assert.equal(fake.calls.length, 2)
})

test('member caching is disabled by default', async () => {
    const fake = createFakeRequest(() => ({ data: { members: [], next_cursor: '' } }))
    const groups = new GroupService(fake.request)

    await groups.getMembers('group-openid')
    await groups.getMembers('group-openid')

    assert.equal(fake.calls.length, 2)
})

test('memory member cache avoids repeated list requests and supports force refresh', async () => {
    const fake = createFakeRequest(() => ({
        data: { members: [{ member_openid: 'member-1' }], next_cursor: '' },
    }))
    const groups = new GroupService(fake.request, { memberCache: true })

    await groups.getMembers('group-openid')
    await groups.getMembers('group-openid')
    assert.equal(fake.calls.length, 1)

    await groups.getMembers('group-openid', { forceRefresh: true })
    assert.equal(fake.calls.length, 2)
})

test('member cache can be restored from a persistent JSON file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'qq-group-cache-'))
    const cachePath = join(directory, 'members.json')
    try {
        const firstFake = createFakeRequest(() => ({
            data: { members: [{ member_openid: 'member-1' }], next_cursor: '' },
        }))
        const first = new GroupService(firstFake.request, {
            memberCache: { persist: true, path: cachePath },
        })
        await first.getMembers('group-openid')

        const secondFake = createFakeRequest(() => {
            throw new Error('persistent cache miss')
        })
        const second = new GroupService(secondFake.request, {
            memberCache: { persist: true, path: cachePath },
        })

        assert.deepEqual(await second.getMembers('group-openid'), [{ member_openid: 'member-1' }])
        assert.equal(secondFake.calls.length, 0)
    } finally {
        await rm(directory, { recursive: true, force: true })
    }
})

test('member change handlers incrementally maintain an existing cache', async () => {
    const fake = createFakeRequest((call) => {
        if (call.url.endsWith('/members/member-2')) {
            return { data: { member_openid: 'member-2', username: 'new member' } }
        }
        return { data: { members: [{ member_openid: 'member-1' }], next_cursor: '' } }
    })
    const groups = new GroupService(fake.request, { memberCache: true })
    await groups.getMembers('group-openid')

    await groups.handleMemberAdded('group-openid', 'member-2')
    await groups.handleMemberRemoved('group-openid', 'member-1')

    assert.deepEqual(await groups.getMembers('group-openid'), [
        { member_openid: 'member-2', username: 'new member' },
    ])
    assert.deepEqual(fake.calls.map(call => call.url), [
        '/v2/groups/group-openid/members',
        '/v2/groups/group-openid/members/member-2',
    ])
})

test('member removal received during a list request is applied after the request', async () => {
    let resolveList!: (value: { data: unknown }) => void
    let markListStarted!: () => void
    const listStarted = new Promise<void>(resolve => {
        markListStarted = resolve
    })
    const listResponse = new Promise<{ data: unknown }>(resolve => {
        resolveList = resolve
    })
    const fake = createFakeRequest(() => {
        markListStarted()
        return listResponse
    })
    const groups = new GroupService(fake.request, { memberCache: true })

    const members = groups.getMembers('group-openid')
    await listStarted
    const removed = groups.handleMemberRemoved('group-openid', 'member-1')
    resolveList({
        data: {
            members: [{ member_openid: 'member-1' }, { member_openid: 'member-2' }],
            next_cursor: '',
        },
    })

    await members
    await removed
    assert.deepEqual(await groups.getMembers('group-openid'), [
        { member_openid: 'member-2' },
    ])
    assert.equal(fake.calls.length, 1)
})

test('getMemberInfo requests a member by openid', async () => {
    const payload = { member_openid: 'member-1' }
    const { groups, calls } = createGroupService(payload)

    assert.deepEqual(await groups.getMemberInfo('group-openid', 'member-1'), payload)
    assert.equal(calls[0].url, '/v2/groups/group-openid/members/member-1')
})

test('removeMembers posts the official batch removal payload', async () => {
    const { groups, calls } = createGroupService({ remove_members_result: 'success' })
    const options = {
        member_openids: ['member-1', 'member-2'],
        add_to_member_blacklist: true,
    }

    await groups.removeMembers('group-openid', options)
    assert.equal(calls[0].method, 'post')
    assert.equal(calls[0].url, '/v2/groups/group-openid/batch_remove_members')
    assert.deepEqual(calls[0].data, options)
})

test('getMemberBlacklist requests its cursor and limit', async () => {
    const payload = { users: [], next_cursor: '' }
    const { groups, calls } = createGroupService(payload)

    assert.deepEqual(await groups.getMemberBlacklist('group-openid', { cursor: 'c', limit: 100 }), payload)
    assert.equal(calls[0].url, '/v2/groups/group-openid/member_blacklist')
    assert.deepEqual(calls[0].params, { cursor: 'c', limit: 100 })
})

test('updateMemberBlacklist posts add or del operations', async () => {
    const payload = { fail_openids: [] }
    const { groups, calls } = createGroupService(payload)
    const options = { op: 'add' as const, member_openids: ['member-1'] }

    assert.deepEqual(await groups.updateMemberBlacklist('group-openid', options), payload)
    assert.equal(calls[0].url, '/v2/groups/group-openid/member_blacklist')
    assert.deepEqual(calls[0].data, options)
})
