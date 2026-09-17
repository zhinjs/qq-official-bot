import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BotService } from '@/services/bot'
import { createFakeRequest } from './fake-http'

test('generateUrlLink sends callback_data and preserves the nested response shape', async () => {
    const fake = createFakeRequest(() => ({
        data: {
            data: {
                url: 'https://qun.qq.com/qunpro/robot/qunshare?data=example',
            },
        },
    }))
    const service = new BotService(fake.request)

    const result = await service.generateUrlLink({ callback_data: 'custom_data_123' })

    assert.deepEqual(fake.calls, [{
        method: 'post',
        url: '/v2/generate_url_link',
        data: { callback_data: 'custom_data_123' },
        params: undefined,
    }])
    assert.equal(result.data.url, 'https://qun.qq.com/qunpro/robot/qunshare?data=example')
})

test('generateUrlLink supports an empty request body', async () => {
    const fake = createFakeRequest(() => ({ data: { data: { url: 'https://example.com/share' } } }))
    const service = new BotService(fake.request)

    await service.generateUrlLink()

    assert.deepEqual(fake.calls[0].data, {})
})
