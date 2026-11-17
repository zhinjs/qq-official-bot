import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { Client } from '@/client'
import type { Bot } from '@/bot'
import { ReceiverFactory, ReceiverMode } from '@/receivers'
import type { GroupMessageEvent, PrivateMessageEvent } from '@/events'
import type { GroupChangeNoticeEvent, GroupMemberChangeNoticeEvent } from '@/events/notice'
import { BotService } from '@/services/bot'
import { GroupService } from '@/services/group'
import { User } from '@/entries/user'
import { createFakeRequest } from './fake-http'

// 覆盖 2026-11-16 平台更新：用户基本信息接口、事件发送者昵称/头像、union_group_openid。

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

test('getUserInfo requests /v2/users/{openid}/info and returns the body', async () => {
    const body = {
        username: '笑😊心',
        avatar: 'https://thirdqq.qlogo.cn/example',
        allow_proactive_msg: true,
        union_openid: 'union-user',
    }
    const fake = createFakeRequest(() => ({ data: body }))
    const service = new BotService(fake.request)

    const result = await service.getUserInfo('user-openid')

    assert.equal(fake.calls[0].method, 'get')
    assert.equal(fake.calls[0].url, '/v2/users/user-openid/info')
    assert.deepEqual(result, body)
})

test('User.info binds the entity id into the user info path', async () => {
    const fake = createFakeRequest(() => ({ data: { username: 'u', avatar: '', allow_proactive_msg: false } }))
    const user = new User({ botService: new BotService(fake.request) } as unknown as Bot, 'bound-user')

    await user.info()

    assert.equal(fake.calls[0].url, '/v2/users/bound-user/info')
})

test('GroupService.getInfo keeps union_group_openid', async () => {
    const fake = createFakeRequest(() => ({ data: { group_openid: 'g', union_group_openid: 'union-g' } }))
    const info = await new GroupService(fake.request).getInfo('g')
    assert.equal(info.union_group_openid, 'union-g')
})

test('C2C message events expose sender avatar and union_openid', () => {
    const client = createClient()
    let event: PrivateMessageEvent | undefined
    client.on('message.private.friend', e => { event = e })

    client.dispatchEvent('C2C_MESSAGE_CREATE', {
        op: 0, s: 1, t: 'C2C_MESSAGE_CREATE', id: 'evt-c2c',
        d: {
            id: 'mid-c2c',
            content: 'hi',
            timestamp: '2026-11-16T10:00:00+08:00',
            author: {
                id: 'user-openid',
                user_openid: 'user-openid',
                union_openid: 'union-user',
                username: '小明',
                avatar: 'https://thirdqq.qlogo.cn/avatar',
                bot: false,
            },
        },
    })

    assert.ok(event)
    assert.equal(event.sender.user_name, '小明')
    assert.equal(event.sender.avatar, 'https://thirdqq.qlogo.cn/avatar')
    assert.equal(event.sender.union_openid, 'union-user')
    assert.equal(event.sender.user_openid, 'user-openid')
})

test('group message events expose member nickname, avatar and union_group_openid', () => {
    const client = createClient()
    let event: GroupMessageEvent | undefined
    client.on('message.group.at', e => { event = e })

    client.dispatchEvent('GROUP_AT_MESSAGE_CREATE', {
        op: 0, s: 1, t: 'GROUP_AT_MESSAGE_CREATE', id: 'evt-group',
        d: {
            id: 'mid-group',
            group_id: 'group-openid',
            group_openid: 'group-openid',
            union_group_openid: 'union-group',
            content: 'hello',
            timestamp: '2026-11-16T10:00:00+08:00',
            author: {
                id: 'member-openid',
                member_openid: 'member-openid',
                member_role: 'admin',
                member_nickname: '群名片',
                username: '小红',
                avatar: 'https://thirdqq.qlogo.cn/member',
            },
        },
    })

    assert.ok(event)
    assert.equal(event.union_group_openid, 'union-group')
    assert.equal(event.sender.member_nickname, '群名片')
    assert.equal(event.sender.avatar, 'https://thirdqq.qlogo.cn/member')
    assert.equal(event.sender.user_openid, 'member-openid')
})

test('group robot and member change notices expose union_group_openid', () => {
    const client = createClient()
    let joined: GroupChangeNoticeEvent | undefined
    let left: GroupMemberChangeNoticeEvent | undefined
    client.on('notice.group.increase', e => { joined = e })
    client.on('notice.group.member.decrease', e => { left = e })

    client.dispatchEvent('GROUP_ADD_ROBOT', {
        op: 0, s: 1, t: 'GROUP_ADD_ROBOT', id: 'evt-add',
        d: { group_openid: 'g', op_member_openid: 'op', timestamp: 1784570534, union_group_openid: 'union-g' },
    })
    client.dispatchEvent('GROUP_MEMBER_REMOVE', {
        op: 0, s: 2, t: 'GROUP_MEMBER_REMOVE', id: 'evt-rm',
        d: { group_openid: 'g', member_openid: 'm', timestamp: 1784276759, union_group_openid: 'union-g' },
    })

    assert.equal(joined?.union_group_openid, 'union-g')
    assert.equal(left?.union_group_openid, 'union-g')
})
