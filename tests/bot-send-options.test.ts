import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { Bot, ReceiverFactory, ReceiverMode, type SendOptions } from '@/index'
import { createFakeRequest } from './fake-http'

afterEach(() => ReceiverFactory.clearAll())

for (const mode of [ReceiverMode.WEBSOCKET, ReceiverMode.WEBHOOK]) {
    test(`${mode} Bot forwards send options through all four session entities`, async () => {
        const config = {
            appid: `send-options-${mode}`,
            secret: 'test-secret',
            logLevel: 'off' as const,
            handleProcessErrors: false,
        }
        const bot = mode === ReceiverMode.WEBSOCKET
            ? new Bot({ ...config, mode: ReceiverMode.WEBSOCKET })
            : new Bot({ ...config, mode: ReceiverMode.WEBHOOK, port: 18080, path: '/webhook' })
        const fake = createFakeRequest(() => ({ data: { id: 'sent' } }))
        bot.request.defaults.adapter = fake.request.defaults.adapter
        const timeouts: number[] = []
        bot.request.interceptors.request.use(config => {
            timeouts.push(config.timeout)
            return config
        })
        const source = { id: 'source-id', event_id: 'source-event' }
        const options: SendOptions = { msgSeq: 23, timeout: 3456 }

        await bot.sendPrivateMessage('user', 'private', source, options)
        await bot.sendGroupMessage('group', 'group', source, options)
        await bot.sendGuildMessage('channel', 'guild', source, options)
        await bot.sendDirectMessage('guild', 'direct', source, options)

        assert.deepEqual(fake.calls.map(call => call.url), [
            '/v2/users/user/messages', '/v2/groups/group/messages',
            '/channels/channel/messages', '/dms/guild/messages',
        ])
        for (const call of fake.calls) {
            const payload = call.data as { msg_seq: number; msg_id: string; event_id: string }
            assert.equal(payload.msg_seq, 23)
            assert.equal(payload.msg_id, 'source-id')
            assert.equal(payload.event_id, 'source-event')
        }
        assert.deepEqual(timeouts, [3456, 3456, 3456, 3456])

        // Existing three-argument calls remain valid and keep the random default.
        await bot.sendGroupMessage('group', 'legacy', source)
        const seq = (fake.calls[4].data as { msg_seq: number }).msg_seq
        assert.ok(Number.isInteger(seq) && seq >= 1 && seq < 1_000_000)
    })
}
