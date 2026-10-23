import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MessageService } from '@/services/message'
import { FileProcessor } from '@/message'
import { segment } from '@/segment'
import { createFakeRequest } from './fake-http'

function createMessageService(handler?: Parameters<typeof createFakeRequest>[0]) {
    const fake = createFakeRequest(handler)
    const fileProcessor = new FileProcessor(fake.request)
    const messages = new MessageService(fake.request, 'app-id', fileProcessor)
    return { messages, ...fake }
}

test('sendGroupMessage posts text to the group messages path', async () => {
    const { messages, calls } = createMessageService(() => ({ data: { id: 'mid-1' } }))
    const result = await messages.sendGroupMessage('group-openid', 'hello')
    assert.equal(result.id, 'mid-1')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].method, 'post')
    assert.equal(calls[0].url, '/v2/groups/group-openid/messages')
    assert.equal((calls[0].data as { content: string }).content, 'hello')
    const seq = (calls[0].data as { msg_seq: number }).msg_seq
    assert.ok(Number.isInteger(seq) && seq >= 1 && seq < 1_000_000)
})

test('sendPrivateMessage posts text to the user messages path', async () => {
    const { messages, calls } = createMessageService(() => ({ data: { id: 'mid-2' } }))
    await messages.sendPrivateMessage('user-openid', 'hi')
    assert.equal(calls[0].url, '/v2/users/user-openid/messages')
})

test('sendGuildMessage posts text to the channel messages path', async () => {
    const { messages, calls } = createMessageService(() => ({ data: { id: 'mid-3' } }))
    await messages.sendGuildMessage('channel-id', 'guild hi')
    assert.equal(calls[0].url, '/channels/channel-id/messages')
})

test('group image URL uploads file_info then sends media.file_info', async () => {
    const { messages, calls } = createMessageService((call) => {
        if (call.url.endsWith('/files')) {
            return { data: { file_uuid: 'uuid', file_info: 'info-token', ttl: 60 } }
        }
        return { data: { id: 'mid-img' } }
    })
    const result = await messages.sendGroupMessage('group-openid', segment.image('https://example.com/a.png'), { id: 'source' }, { msgSeq: 9 })
    assert.equal(result.id, 'mid-img')
    assert.equal(calls[0].url, '/v2/groups/group-openid/files')
    assert.equal(calls[1].url, '/v2/groups/group-openid/messages')
    assert.equal((calls[1].data as { media: { file_info: string } }).media.file_info, 'info-token')
    assert.equal((calls[1].data as { msg_seq: number }).msg_seq, 9)
    assert.equal((calls[1].data as { msg_id: string }).msg_id, 'source')
})

for (const method of ['sendPrivateMessage', 'sendGroupMessage', 'sendGuildMessage', 'sendDirectMessage'] as const) {
    test(`${method} preserves explicit msgSeq, source and timeout`, async () => {
        const { messages, request, calls } = createMessageService(() => ({ data: { id: 'sent' } }))
        request.interceptors.request.use(config => {
            assert.equal(config.timeout, 2345)
            return config
        })
        const options = { msgSeq: 17, timeout: 2345 }

        await messages[method]('target', 'hello', { id: 'source', event_id: 'event' }, options)

        const payload = calls[0].data as { msg_seq: number; msg_id: string; event_id: string }
        assert.equal(payload.msg_seq, 17)
        assert.equal(payload.msg_id, 'source')
        assert.equal(payload.event_id, 'event')
        assert.deepEqual(options, { msgSeq: 17, timeout: 2345 })
    })
}

test('sendGroupMessage can reuse the same source and sequence after a timeout', async () => {
    let attempts = 0
    const { messages, calls } = createMessageService(() => {
        if (++attempts === 1) throw new Error('request timed out')
        return { data: { id: 'sent' } }
    })
    const source = { id: 'original' }
    const options = { msgSeq: 2 }

    await assert.rejects(messages.sendGroupMessage('target', 'reply', source, options), /timed out/)
    assert.equal(calls.length, 1)
    await messages.sendGroupMessage('target', 'reply', source, options)

    assert.deepEqual(calls.map(call => {
        const payload = call.data as { msg_id: string; msg_seq: number }
        return [payload.msg_id, payload.msg_seq]
    }), [['original', 2], ['original', 2]])
})

test('explicit zero msgSeq is preserved rather than replaced by a random value', async () => {
    const { messages, calls } = createMessageService(() => ({ data: { id: 'sent' } }))
    await messages.sendPrivateMessage('target', 'hello', undefined, { msgSeq: 0 })
    assert.equal((calls[0].data as { msg_seq: number }).msg_seq, 0)
})

test('recallGroupMessage deletes the group message path', async () => {
    const { messages, calls } = createMessageService()
    const ok = await messages.recallGroupMessage('group-openid', 'mid-1')
    assert.equal(ok, true)
    assert.equal(calls[0].method, 'delete')
    assert.equal(calls[0].url, '/v2/groups/group-openid/messages/mid-1')
})

test('sendPrivateStreamMessage posts stream_messages', async () => {
    const { messages, calls } = createMessageService(() => ({
        data: { id: 'stream-1', timestamp: '1' },
    }))
    const result = await messages.sendPrivateStreamMessage('user-openid', { content_raw: 'chunk' })
    assert.equal(result.id, 'stream-1')
    assert.equal(calls[0].url, '/v2/users/user-openid/stream_messages')
    assert.equal((calls[0].data as { content_raw: string }).content_raw, 'chunk')
})
