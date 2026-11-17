import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import axios from 'axios'
import { Client } from '@/client'
import { ReceiverFactory, ReceiverMode } from '@/receivers'
import { Intends } from '@/constants'
import { segment } from '@/segment'
import { MessageService } from '@/services/message'
import { FileProcessor } from '@/message'
import type { GroupMessageEvent, PrivateMessageEvent } from '@/events'
import type {
    ActionNoticeEvent,
    ChannelChangeNoticeEvent,
    FriendChangeNoticeEvent,
    GroupChangeNoticeEvent,
    GroupMemberChangeNoticeEvent,
    GuildChangeNoticeEvent,
    SubscribeStatusNoticeEvent,
} from '@/events/notice'

// 对照官方 v2 文档逐项核对后的回归用例。

afterEach(() => {
    ReceiverFactory.clearAll()
})

function createClient(removeAt?: boolean) {
    return new Client({
        appid: `doc-${Date.now()}-${Math.random()}`,
        secret: 'secret',
        mode: ReceiverMode.WEBSOCKET,
        logLevel: 'off',
        ...(removeAt === undefined ? {} : { removeAt }),
    })
}

function dispatch(client: Client, t: string, d: Record<string, unknown>, id = `evt-${t}`) {
    client.dispatchEvent(t, { op: 0, s: 1, t, id, d })
}

function createMessages(response: Record<string, unknown> = { id: 'sent' }) {
    const calls: { url: string; data: Record<string, any> }[] = []
    const request = axios.create({
        adapter: async config => {
            calls.push({ url: config.url!, data: JSON.parse(config.data) })
            return { status: 200, statusText: 'OK', headers: {}, config, data: response }
        },
    })
    return { calls, messages: new MessageService(request, 'app-id', new FileProcessor(request)) }
}

// ---------------- 通知事件 ----------------

test('notice timestamps documented as Unix seconds are not divided again', () => {
    const client = createClient()
    let joined: GroupChangeNoticeEvent | undefined
    let friend: FriendChangeNoticeEvent | undefined
    client.on('notice.group.increase', e => { joined = e })
    client.on('notice.friend.increase', e => { friend = e })

    dispatch(client, 'GROUP_ADD_ROBOT', { group_openid: 'g', op_member_openid: 'op', timestamp: 1784570534 })
    dispatch(client, 'FRIEND_ADD', {
        openid: 'u', timestamp: 1784570523, scene: 2003, scene_param: 'campaign',
        short_code: 'abc', author: { union_openid: 'union-u' },
    })

    assert.equal(joined?.time, 1784570534)
    assert.equal(friend?.time, 1784570523)
    assert.equal(friend?.scene, 2003)
    assert.equal(friend?.scene_param, 'campaign')
    assert.equal(friend?.short_code, 'abc')
    assert.equal(friend?.union_openid, 'union-u')
})

test('GROUP_MEMBER_REMOVE keeps user_openid alongside member_openid', () => {
    const client = createClient()
    let left: GroupMemberChangeNoticeEvent | undefined
    client.on('notice.group.member.decrease', e => { left = e })
    dispatch(client, 'GROUP_MEMBER_REMOVE', { group_openid: 'g', member_openid: 'm', user_openid: 'u', timestamp: 1784276759 })
    assert.equal(left?.user_id, 'm')
    assert.equal(left?.user_openid, 'u')
})

test('channel events read the channel type from `type` and have a finite time', () => {
    const client = createClient()
    let channel: ChannelChangeNoticeEvent | undefined
    client.on('notice.channel.increase', e => { channel = e })
    dispatch(client, 'CHANNEL_CREATE', {
        id: 'c', guild_id: 'g', name: '论坛', type: 10007, sub_type: 0, position: 1, owner_id: 'o',
    })
    assert.equal(channel?.channel_type, 10007)
    assert.equal(channel?.channel_sub_type, 0)
    assert.equal(channel?.position, 1)
    assert.equal(channel?.owner_id, 'o')
    assert.ok(Number.isFinite(channel?.time))
})

test('guild update events expose documented fields and a finite time', () => {
    const client = createClient()
    let guild: GuildChangeNoticeEvent | undefined
    client.on('notice.guild.update', e => { guild = e })
    dispatch(client, 'GUILD_UPDATE', { id: 'g', name: 'n', member_count: 10, max_members: 100, owner_id: 'o', op_user_id: 'op' })
    assert.equal(guild?.member_count, 10)
    assert.equal(guild?.max_members, 100)
    assert.ok(Number.isFinite(guild?.time))
})

test('INTERACTION_CREATE falls back to chat_type and tolerates non-button interactions', () => {
    const client = createClient()
    let action: ActionNoticeEvent | undefined
    client.on('notice.friend.action', e => { action = e })
    dispatch(client, 'INTERACTION_CREATE', {
        id: 'interaction-1',
        type: 18,
        chat_type: 2,
        user_openid: 'u',
        timestamp: '2026-07-20T21:53:54+08:00',
        version: 1,
        application_id: 'app',
        data: { type: 18, resolved: { authorize_data: { opt_scene: 'dialog', scope: 'c2c_push' } } },
    })
    assert.ok(action, 'interaction without scene should still be dispatched')
    assert.equal(action.scene, 'c2c')
    assert.equal(action.interaction_type, 18)
    assert.equal(action.application_id, 'app')
    assert.equal(action.data.resolved.authorize_data?.scope, 'c2c_push')
    assert.equal(action.time, Math.floor(new Date('2026-07-20T21:53:54+08:00').getTime() / 1000))
})

test('SUBSCRIBE_MESSAGE_STATUS emits friend and group subscribe notices', () => {
    const client = createClient()
    let personal: SubscribeStatusNoticeEvent | undefined
    let group: SubscribeStatusNoticeEvent | undefined
    client.on('notice.friend.subscribe', e => { personal = e })
    client.on('notice.group.subscribe', e => { group = e })

    dispatch(client, 'SUBSCRIBE_MESSAGE_STATUS', {
        openid: 'u',
        result: [
            { template_id: 1, op: 1, subscribe_id: 's1', update_ts: 1784276820 },
            { template_id: 2, op: 2, update_ts: 1784276830 },
        ],
    })
    dispatch(client, 'SUBSCRIBE_MESSAGE_STATUS', { group_openid: 'g', result: [{ template_id: 3, op: 1 }] })

    assert.equal(personal?.user_id, 'u')
    assert.equal(personal?.notice_type, 'friend')
    assert.deepEqual(personal?.allowed.map(r => r.subscribe_id), ['s1'])
    assert.equal(personal?.refused.length, 1)
    assert.equal(personal?.time, 1784276830)
    assert.equal(group?.group_id, 'g')
    assert.equal(group?.notice_type, 'group')
})

test('GROUP_MEMBER_EVENT is accepted as the documented intent name', () => {
    assert.equal(Intends.GROUP_MEMBER_EVENT, 1 << 24)
    assert.equal(Intends.GROUP_MEMBER_EVENT, Intends.GROUP_MEMBER)
})

// ---------------- 消息事件 ----------------

test('group message events use group_openid and parse member mentions', () => {
    const client = createClient()
    let event: GroupMessageEvent | undefined
    client.on('message.group', e => { event = e })
    dispatch(client, 'GROUP_MESSAGE_CREATE', {
        id: 'mid',
        group_openid: 'group-openid',
        content: '<@MEMBER1> 你好 <@all>',
        timestamp: '2026-07-21T08:00:00+08:00',
        author: { id: 'a', member_openid: 'a' },
        mentions: [{ id: 'MEMBER1', member_openid: 'MEMBER1', username: '小明', bot: false, is_you: false, scope: 'single' }],
    })
    assert.ok(event)
    assert.equal(event.group_id, 'group-openid')
    const ats = (event.message as { type: string; data: Record<string, unknown> }[]).filter(e => e.type === 'at')
    assert.deepEqual(ats.map(at => at.data.user_id), ['MEMBER1', 'all'])
    assert.ok(event.raw_message.includes('小明') || event.raw_message.includes('MEMBER1'))
})

test('removeAt only strips the bot mention and keeps other members', () => {
    const client = createClient()
    let event: GroupMessageEvent | undefined
    client.on('message.guild', e => { event = e as unknown as GroupMessageEvent })
    dispatch(client, 'AT_MESSAGE_CREATE', {
        id: 'mid',
        channel_id: 'c',
        guild_id: 'g',
        content: '<@!bot-1> 叫 <@!user-2> 来',
        timestamp: '2026-07-21T08:00:00+08:00',
        author: { id: 'a' },
        mentions: [
            { id: 'bot-1', bot: true },
            { id: 'user-2', bot: false },
        ],
    })
    assert.ok(event)
    const ats = (event.message as { type: string; data: Record<string, unknown> }[]).filter(e => e.type === 'at')
    assert.deepEqual(ats.map(at => at.data.user_id), ['user-2'])
})

test('quote messages expose content_type, msg_idx and the quoted reference', () => {
    const client = createClient()
    let event: PrivateMessageEvent | undefined
    client.on('message.private.friend', e => { event = e })
    dispatch(client, 'C2C_MESSAGE_CREATE', {
        id: 'mid',
        content: '谢谢',
        message_type: 103,
        timestamp: '2026-07-21T10:02:00+08:00',
        author: { id: 'u', user_openid: 'u' },
        msg_elements: [{ msg_idx: 'REFIDX_a', message_type: 103, content: '原消息' }],
        message_scene: { source: 'default', ext: ['ref_msg_idx=REFIDX_a', 'msg_idx=REFIDX_z'] },
    })
    assert.ok(event)
    assert.equal(event.message_type, 'private')
    assert.equal(event.content_type, 103)
    assert.equal(event.msg_idx, 'REFIDX_z')
    assert.equal(event.ref_msg_idx, 'REFIDX_a')
    assert.equal(event.source?.id, 'REFIDX_a')
    assert.equal(event.msg_elements?.[0].content, '原消息')
    const first = (event.message as { type: string; data: Record<string, unknown> }[])[0]
    assert.equal(first.type, 'reply')
})

test('voice attachments are exposed as audio elements with ASR fields', () => {
    const client = createClient()
    let event: PrivateMessageEvent | undefined
    client.on('message.private.friend', e => { event = e })
    dispatch(client, 'C2C_MESSAGE_CREATE', {
        id: 'mid',
        content: '',
        timestamp: '2026-07-21T10:02:00+08:00',
        author: { id: 'u', user_openid: 'u' },
        attachments: [{ content_type: 'voice', url: 'https://example.com/a.silk', voice_wav_url: 'https://example.com/a.wav', asr_refer_text: '你好' }],
    })
    const audio = (event?.message as { type: string; data: Record<string, unknown> }[]).find(e => e.type === 'audio')
    assert.equal(audio?.data.voice_wav_url, 'https://example.com/a.wav')
    assert.equal(audio?.data.asr_refer_text, '你好')
})

// ---------------- 发送消息 ----------------

test('v2 sends exactly one of msg_id / event_id', async () => {
    const { messages, calls } = createMessages()
    await messages.sendGroupMessage('g', 'hi', { id: 'mid', event_id: 'eid' })
    await messages.sendGroupMessage('g', 'hi', { event_id: 'eid' })
    assert.equal(calls[0].data.msg_id, 'mid')
    assert.equal(calls[0].data.event_id, undefined)
    assert.equal(calls[1].data.msg_id, undefined)
    assert.equal(calls[1].data.event_id, 'eid')
})

test('segment.reply(event) quotes with the REFIDX index in v2', async () => {
    const { messages, calls } = createMessages()
    const source = { id: 'ROBOT1.0_mid', event_id: 'eid', msg_idx: 'REFIDX_z' }
    await messages.sendPrivateMessage('u', [segment.reply(source), '收到'])
    await messages.sendPrivateMessage('u', [segment.reply('REFIDX_bot'), '引用自己'])
    assert.deepEqual(calls[0].data.message_reference, { message_id: 'REFIDX_z' })
    assert.equal(calls[0].data.msg_id, 'ROBOT1.0_mid')
    assert.equal(calls[0].data.event_id, undefined)
    assert.deepEqual(calls[1].data.message_reference, { message_id: 'REFIDX_bot' })
    assert.equal(calls[1].data.msg_id, undefined)
})

test('isWakeup sends an interaction recall message without passive reply ids', async () => {
    const { messages, calls } = createMessages()
    await messages.sendPrivateMessage('u', '好久不见', { id: 'mid', event_id: 'eid' }, { isWakeup: true })
    assert.equal(calls[0].data.is_wakeup, true)
    assert.equal(calls[0].data.msg_id, undefined)
    assert.equal(calls[0].data.event_id, undefined)
    await assert.rejects(messages.sendGroupMessage('g', 'x', undefined, { isWakeup: true }), /仅支持单聊/)
})

test('send results keep the server timestamp and ext_info.ref_idx', async () => {
    const { messages } = createMessages({ id: 'sent', timestamp: '2026-11-17T10:00:00+08:00', ext_info: { ref_idx: 'REFIDX_self' } })
    const result = await messages.sendPrivateMessage('u', 'hi')
    assert.equal(result.ref_idx, 'REFIDX_self')
    assert.equal(result.timestamp, new Date('2026-11-17T10:00:00+08:00').getTime() / 1000)
})

test('sendPrivateInputNotify posts msg_type 6 with input_notify', async () => {
    const { messages, calls } = createMessages()
    await messages.sendPrivateInputNotify('u', 30, { id: 'mid' }, { msgSeq: 2 })
    assert.equal(calls[0].url, '/v2/users/u/messages')
    assert.deepEqual(calls[0].data, {
        msg_seq: 2,
        content: '',
        msg_type: 6,
        input_notify: { input_type: 1, input_second: 30 },
        msg_id: 'mid',
    })
    await assert.rejects(messages.sendPrivateInputNotify('u', 61), RangeError)
})
