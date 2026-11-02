import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { Bot, ReceiverFactory, ReceiverMode, FileProcessor, MessageService, segment, type CardElem, type MessageCard } from '@/index'
import { createFakeRequest } from './fake-http'

function createMessages(handler: Parameters<typeof createFakeRequest>[0] = () => ({ data: { id: 'sent' } })) {
    const fake = createFakeRequest(handler)
    const messages = new MessageService(fake.request, 'app-id', new FileProcessor(fake.request))
    return { messages, ...fake }
}

afterEach(() => ReceiverFactory.clearAll())

const cardContent: MessageCard['content'] = {
    title: '最新公告',
    description: '点击查看公告详情',
    url: 'https://example.com/news',
    pic_url: 'https://example.com/cover.png',
}

for (const method of ['sendGroupMessage', 'sendPrivateMessage'] as const) {
    test(`${method} sends the official card payload without a media upload`, async () => {
        const { messages, calls } = createMessages()
        const card: CardElem = segment.card(cardContent)
        await messages[method]('target', [segment.reply('source'), card], undefined, { msgSeq: 3 })

        assert.equal(calls.length, 1)
        assert.equal(calls[0].url, method === 'sendGroupMessage' ? '/v2/groups/target/messages' : '/v2/users/target/messages')
        assert.deepEqual(calls[0].data, {
            msg_seq: 3,
            content: '',
            msg_type: 8,
            msg_id: 'source',
            message_reference: { message_id: 'source' },
            card: { type: 'tuwen', content: cardContent },
        })
    })
}

for (const method of ['sendGuildMessage', 'sendDirectMessage'] as const) {
    test(`${method} rejects the unsupported new card type before HTTP`, async () => {
        const { messages, calls } = createMessages()
        await assert.rejects(messages[method]('target', segment.card(cardContent)), /图文卡片仅支持群聊和单聊/)
        assert.equal(calls.length, 0)
    })
}

for (const mode of [ReceiverMode.WEBSOCKET, ReceiverMode.WEBHOOK]) {
    test(`${mode} Bot sends cards and group everyone messages through public entry points`, async () => {
        const config = { appid: `new-messages-${mode}`, secret: 'test-secret', handleProcessErrors: false, logLevel: 'off' as const }
        const bot = mode === ReceiverMode.WEBSOCKET
            ? new Bot({ ...config, mode: ReceiverMode.WEBSOCKET })
            : new Bot({ ...config, mode: ReceiverMode.WEBHOOK, port: 18080, path: '/webhook' })
        const fake = createFakeRequest(() => ({ data: { id: 'sent' } }))
        bot.request.defaults.adapter = fake.request.defaults.adapter

        await bot.sendGroupMessage('group', segment.card(cardContent), { event_id: 'event' }, { msgSeq: 4 })
        await bot.sendPrivateMessage('user', segment.card(cardContent))
        await bot.sendGroupMessage('group', [segment.at('all'), segment.text(' 通知')])
        await bot.sendGroupMessage('group', segment.markdown('<qqbot-at-everyone />\n公告'))

        assert.deepEqual(fake.calls.map(call => call.url), [
            '/v2/groups/group/messages', '/v2/users/user/messages',
            '/v2/groups/group/messages', '/v2/groups/group/messages',
        ])
        const groupCard = fake.calls[0].data as { card: MessageCard; msg_type: number; event_id: string; msg_seq: number }
        assert.deepEqual(groupCard.card, { type: 'tuwen', content: cardContent })
        assert.equal(groupCard.msg_type, 8)
        assert.equal(groupCard.event_id, 'event')
        assert.equal(groupCard.msg_seq, 4)
        assert.equal((fake.calls[1].data as { msg_type: number }).msg_type, 8)
        assert.equal((fake.calls[2].data as { content: string }).content, '<qqbot-at-everyone /> 通知')
        assert.equal((fake.calls[3].data as { markdown: { content: string } }).markdown.content, '<qqbot-at-everyone />\n公告')
    })
}

test('provider rejection is propagated once for card and everyone messages', async () => {
    const rejection = new Error('provider rejected: permission or quota')
    for (const message of [segment.card(cardContent), segment.at('all')]) {
        const { messages, calls } = createMessages(() => { throw rejection })
        await assert.rejects(messages.sendGroupMessage('group', message), error => error === rejection)
        assert.equal(calls.length, 1)
    }
})

test('group native everyone tag survives string template parsing', async () => {
    const { messages, calls } = createMessages()
    await messages.sendGroupMessage('group', '通知 <qqbot-at-everyone /> 请查看公告')
    assert.equal((calls[0].data as { content: string }).content, '通知 <qqbot-at-everyone /> 请查看公告')
})

test('group everyone segment keeps the native tag and surrounding text', async () => {
    const { messages, calls } = createMessages()
    await messages.sendGroupMessage('group', [segment.at('all'), segment.text(' 请查看公告')])
    assert.equal((calls[0].data as { content: string }).content, '<qqbot-at-everyone /> 请查看公告')
})

test('group markdown preserves the everyone tag without adding text content', async () => {
    const { messages, calls } = createMessages()
    const content = '<qqbot-at-everyone />\n## 公告\n请查看公告'
    await messages.sendGroupMessage('group', segment.markdown(content), { id: 'source' }, { msgSeq: 2 })
    const payload = calls[0].data as { msg_type: number; content: string; markdown: { content: string }; msg_id: string; msg_seq: number }
    assert.equal(payload.msg_type, 2)
    assert.equal(payload.content, '')
    assert.equal(payload.markdown.content, content)
    assert.equal(payload.msg_id, 'source')
    assert.equal(payload.msg_seq, 2)
})
