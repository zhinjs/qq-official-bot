import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { Client } from '@/client'
import { Bot } from '@/bot'
import { ReceiverFactory, ReceiverMode } from '@/receivers'
import type { GroupMessageEvent } from '@/events'
import type { GroupActionNoticeEvent } from '@/events/notice'
import { createFakeRequest } from './fake-http'

afterEach(() => {
    ReceiverFactory.clearAll()
})

function createClient() {
    return new Client({
        appid: `test-${Date.now()}-${Math.random()}`,
        secret: 'secret',
        mode: ReceiverMode.WEBSOCKET,
        logLevel: 'off',
    })
}

test('GROUP_MESSAGE_CREATE emits message.group with the group id', async () => {
    const client = createClient()
    const seen: GroupMessageEvent[] = []
    client.on('message.group', (event) => {
        seen.push(event)
    })
    client.dispatchEvent('GROUP_MESSAGE_CREATE', {
        op: 0,
        s: 1,
        t: 'GROUP_MESSAGE_CREATE',
        id: 'evt-1',
        d: {
            id: 'mid-1',
            group_id: 'group-openid',
            content: 'hello',
            timestamp: '2024-01-01T00:00:00.000Z',
            author: { id: 'user-1', username: 'alice' },
        },
    })
    assert.equal(seen.length, 1)
    assert.equal(seen[0].group_id, 'group-openid')
    assert.equal(seen[0].message_id, 'mid-1')
})

test('INTERACTION_CREATE in a group emits notice.group.action once via em bubbling', async () => {
    const client = createClient()
    const names: string[] = []
    client.on('notice', () => names.push('notice'))
    client.on('notice.group', () => names.push('notice.group'))
    client.on('notice.group.action', (event: GroupActionNoticeEvent) => {
        names.push('notice.group.action')
        assert.equal(event.group_id, 'group-openid')
    })
    client.dispatchEvent('INTERACTION_CREATE', {
        op: 0,
        s: 2,
        t: 'INTERACTION_CREATE',
        id: 'evt-2',
        d: {
            id: 'notice-1',
            scene: 'group',
            group_openid: 'group-openid',
            group_member_openid: 'user-1',
            data: {
                type: 1,
                resolved: { button_id: 'btn-1' },
            },
        },
    })
    assert.deepEqual(names, ['notice', 'notice.group', 'notice.group.action'])
})

test('unknown gateway name does not emit application events', async () => {
    const client = createClient()
    let emitted = false
    client.on('message', () => {
        emitted = true
    })
    client.dispatchEvent('NOT_A_REAL_EVENT', {
        op: 0,
        s: 3,
        t: 'NOT_A_REAL_EVENT',
        id: 'evt-3',
        d: { id: 'x' },
    })
    assert.equal(emitted, false)
})

test('group membership events update and invalidate the optional member cache', async () => {
    let listFetches = 0
    const fake = createFakeRequest((call) => {
        if (call.url.endsWith('/members/member-2')) {
            return {
                data: {
                    member_openid: 'member-2',
                    username: 'bob',
                    member_role: 'member',
                    bot: false,
                    joined_at: '2026-09-04T00:00:00+08:00',
                },
            }
        }
        if (call.url.endsWith('/members')) {
            listFetches += 1
            return {
                data: {
                    members: [{
                        member_openid: listFetches === 1 ? 'member-1' : 'member-2',
                        username: listFetches === 1 ? 'alice' : 'bob',
                        member_role: 'member',
                        bot: false,
                        joined_at: '2026-09-04T00:00:00+08:00',
                    }],
                    next_cursor: '',
                },
            }
        }
        return { data: {} }
    })
    const bot = new Bot({
        appid: `cache-test-${Date.now()}`,
        secret: 'secret',
        mode: ReceiverMode.WEBSOCKET,
        logLevel: 'off',
        groupMemberCache: true,
    })
    bot.request.defaults.adapter = fake.request.defaults.adapter
    await bot.getGroupMemberList('group-openid')

    const membersSeenByUserListener = new Promise<string[]>((resolve, reject) => {
        bot.once('notice.group.member.increase', async () => {
            try {
                resolve((await bot.getGroupMemberList('group-openid')).map(item => item.member_openid))
            } catch (error) {
                reject(error)
            }
        })
    })
    bot.dispatchEvent('GROUP_MEMBER_ADD', {
        op: 0,
        s: 4,
        t: 'GROUP_MEMBER_ADD',
        d: { group_openid: 'group-openid', member_openid: 'member-2', timestamp: 1 },
    })
    assert.deepEqual(await membersSeenByUserListener, [
        'member-1',
        'member-2',
    ])

    bot.dispatchEvent('GROUP_MEMBER_REMOVE', {
        op: 0,
        s: 5,
        t: 'GROUP_MEMBER_REMOVE',
        d: { group_openid: 'group-openid', member_openid: 'member-1', timestamp: 2 },
    })
    await waitFor(async () => (await bot.getGroupMemberList('group-openid')).length === 1)

    bot.dispatchEvent('GROUP_DEL_ROBOT', {
        op: 0,
        s: 6,
        t: 'GROUP_DEL_ROBOT',
        d: { group_openid: 'group-openid', op_member_openid: 'owner', timestamp: 3 },
    })
    await waitFor(async () => {
        await bot.getGroupMemberList('group-openid')
        return listFetches === 2
    })
})

test('guild membership events update and invalidate the optional member cache', async () => {
    let listFetches = 0
    const rawMember = (id: string) => ({
        user: { id, username: id, avatar: '', bot: false },
        nick: id,
        roles: [],
        joined_at: '2026-09-04T00:00:00+08:00',
    })
    const fake = createFakeRequest((call) => {
        if (call.url.endsWith('/members/member-2')) return { data: rawMember('member-2') }
        if (call.url.endsWith('/members')) {
            listFetches += 1
            return { data: [rawMember(listFetches === 1 ? 'member-1' : 'member-2')] }
        }
        return { data: {} }
    })
    const bot = new Bot({
        appid: `guild-cache-test-${Date.now()}`,
        secret: 'secret',
        mode: ReceiverMode.WEBSOCKET,
        logLevel: 'off',
        guildMemberCache: true,
    })
    bot.request.defaults.adapter = fake.request.defaults.adapter
    await bot.getGuildMemberList('guild-id')

    const membersSeenByUserListener = new Promise<string[]>((resolve, reject) => {
        bot.once('notice.guild.member.increase', async () => {
            try {
                resolve((await bot.getGuildMemberList('guild-id')).map(item => item.member_id))
            } catch (error) {
                reject(error)
            }
        })
    })
    bot.dispatchEvent('GUILD_MEMBER_ADD', {
        op: 0,
        s: 7,
        t: 'GUILD_MEMBER_ADD',
        d: {
            guild_id: 'guild-id',
            op_user_id: 'owner',
            ...rawMember('member-2'),
        },
    })
    assert.deepEqual(await membersSeenByUserListener, ['member-1', 'member-2'])

    bot.dispatchEvent('GUILD_MEMBER_REMOVE', {
        op: 0,
        s: 8,
        t: 'GUILD_MEMBER_REMOVE',
        d: {
            guild_id: 'guild-id',
            op_user_id: 'owner',
            ...rawMember('member-1'),
        },
    })
    await waitFor(async () => (await bot.getGuildMemberList('guild-id')).length === 1)

    bot.dispatchEvent('GUILD_DELETE', {
        op: 0,
        s: 9,
        t: 'GUILD_DELETE',
        d: {
            id: 'guild-id',
            name: 'guild',
            op_user_id: 'owner',
            joined_at: '2026-09-04T00:00:00+08:00',
        },
    })
    await waitFor(async () => {
        await bot.getGuildMemberList('guild-id')
        return listFetches === 2
    })
})

test('guild events incrementally maintain the optional guild list cache', async () => {
    const rawGuild = (name: string) => ({
        id: 'guild-id',
        name,
        joined_at: '2026-09-04T00:00:00+08:00',
        owner_id: 'owner',
        owner: false,
        member_count: 1,
        max_members: 100,
        description: '',
        icon: '',
    })
    const fake = createFakeRequest((call) => {
        if (call.url === '/users/@me/guilds') return { data: [rawGuild('initial')] }
        if (call.url === '/guilds/guild-id') return { data: rawGuild('updated') }
        return { data: {} }
    })
    const bot = new Bot({
        appid: `guild-list-cache-test-${Date.now()}`,
        secret: 'secret',
        mode: ReceiverMode.WEBSOCKET,
        logLevel: 'off',
        guildCache: true,
    })
    bot.request.defaults.adapter = fake.request.defaults.adapter
    await bot.getGuildList()

    const nameSeenByUserListener = new Promise<string>((resolve, reject) => {
        bot.once('notice.guild.update', async () => {
            try {
                resolve((await bot.getGuildList())[0].guild_name)
            } catch (error) {
                reject(error)
            }
        })
    })
    bot.dispatchEvent('GUILD_UPDATE', {
        op: 0,
        s: 10,
        t: 'GUILD_UPDATE',
        d: { ...rawGuild('updated'), op_user_id: 'owner' },
    })
    assert.equal(await nameSeenByUserListener, 'updated')

    bot.dispatchEvent('GUILD_DELETE', {
        op: 0,
        s: 11,
        t: 'GUILD_DELETE',
        d: { ...rawGuild('updated'), op_user_id: 'owner' },
    })
    await waitFor(async () => (await bot.getGuildList()).length === 0)
})

async function waitFor(predicate: () => boolean | Promise<boolean>): Promise<void> {
    for (let attempt = 0; attempt < 50; attempt += 1) {
        if (await predicate()) return
        await new Promise<void>(resolve => setImmediate(resolve))
    }
    throw new Error('condition was not met')
}
