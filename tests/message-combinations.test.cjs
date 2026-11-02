const assert = require('node:assert/strict')
const { test } = require('node:test')
const axios = require('axios')
const { MessageService, FileProcessor, segment } = require('../lib')

// JavaScript callers can pass combinations excluded by the Sendable tuple type.
function createService() {
    const calls = []
    const request = axios.create({ adapter: async config => {
        calls.push({ url: config.url, data: JSON.parse(config.data) })
        return {
            status: 200, statusText: 'OK', headers: {}, config,
            data: config.url.endsWith('/files')
                ? { file_info: 'fixture-info', file_uuid: 'fixture-uuid', ttl: 60 }
                : { id: 'sent' },
        }
    } })
    return { calls, messages: new MessageService(request, 'app-id', new FileProcessor(request)) }
}

const bodies = [
    [segment.markdown('md'), 2],
    [segment.ark(23, []), 3],
    [segment.image('https://example.com/image.png'), 7],
    [segment.video('https://example.com/video.mp4'), 7],
    [segment.audio('https://example.com/audio.mp3'), 7],
    [segment.card({
        title: 'card', description: 'details',
        url: 'https://example.com/details', pic_url: 'https://example.com/cover.png',
    }), 8],
]

for (const method of ['sendGroupMessage', 'sendPrivateMessage']) {
    test(`${method} rejects conflicting and repeated body slots before any HTTP`, async () => {
        for (const [left] of bodies) {
            for (const [right] of bodies) {
                const { messages, calls } = createService()
                await assert.rejects(messages[method]('target', [left, right]), {
                    name: 'TypeError', message: `消息正文片段冲突: ${left.type} 与 ${right.type}，请分别发送`,
                })
                assert.deepEqual(calls, [])
            }
        }
    })

    test(`${method} validates expanded template strings before file processing`, async () => {
        for (const message of [
            '<markdown,content=md><video,file=https://example.com/video.mp4>',
            '<video,file=https://example.com/video.mp4><markdown,content=md>',
            [segment.video('/nonexistent/fixture.mp4'), segment.markdown('md')],
            [segment.markdown('md'), segment.video('/nonexistent/fixture.mp4')],
        ]) {
            const { messages, calls } = createService()
            await assert.rejects(messages[method]('target', message), /消息正文片段冲突/)
            assert.deepEqual(calls, [])
        }
    })

    test(`${method} preserves body type and modifiers in either order`, async () => {
        for (const [body, msgType] of bodies) {
            for (const modifier of [segment.keyboard('keyboard-id'), segment.at('member-id'), segment.button({ id: 'button-id' })]) {
                for (const parts of [[body, modifier], [modifier, body]]) {
                    const { messages, calls } = createService()
                    await messages[method]('target', [segment.reply('source'), 'caption', ...parts], undefined, { msgSeq: 17 })
                    const payload = calls.at(-1).data
                    assert.equal(payload.msg_type, msgType)
                    assert.equal(payload.msg_id, 'source')
                    assert.equal(payload.msg_seq, 17)
                    assert.ok(payload.content.startsWith('caption'))
                    if (modifier.type === 'at') assert.ok(payload.content.includes('member-id'))
                    else assert.ok(payload.keyboard)
                    if (msgType === 7) {
                        assert.equal(calls.length, 2)
                        assert.deepEqual(payload.media, { file_info: 'fixture-info' })
                    } else {
                        assert.equal(calls.length, 1)
                        assert.deepEqual(payload[body.type], body.data)
                    }
                }
            }
        }
    })

    test(`${method} keeps existing type selection without a body`, async () => {
        for (const [message, msgType] of [
            [segment.at('member-id'), 2],
            [segment.keyboard('keyboard-id'), 2],
            [segment.at('all'), undefined],
            [segment.button({ id: 'button-id' }), undefined],
            ['text', undefined],
        ]) {
            const { messages, calls } = createService()
            await messages[method]('target', message)
            assert.equal(calls.length, 1)
            assert.equal(calls[0].data.msg_type, msgType)
        }
    })
}

for (const method of ['sendGuildMessage', 'sendDirectMessage']) {
    test(`${method} retains channel content plus image and ARK combinations`, async () => {
        for (const body of [segment.image('https://example.com/image.png'), segment.ark(23, [])]) {
            for (const parts of [['caption', body], [body, 'caption']]) {
                const { messages, calls } = createService()
                await messages[method]('target', parts)
                assert.equal(calls.length, 1)
                assert.equal(calls[0].data.content, 'caption')
                if (body.type === 'image') assert.equal(calls[0].data.image, 'https://example.com/image.png')
                else assert.deepEqual(calls[0].data.ark, body.data)
            }
        }
    })
}
