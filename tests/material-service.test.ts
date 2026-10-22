import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { MaterialService } from '@/services/material'
import { createFakeRequest } from './fake-http'

test('uploadImage completes the prepare, presigned PUT, and complete flow', async () => {
    const image = Buffer.from('fake png bytes')
    const digest = createHash('md5').update(image).digest('hex')
    const api = createFakeRequest((call) => {
        if (call.url === '/v2/media-images/prepare') {
            return { data: { upload_id: 'upload-1', presigned_url: 'https://cos.example/upload', expires_in: 3600 } }
        }
        return { data: { image_id: 'image-1', url: 'qqbot-media://image/v1/token', ttl: 7776000, preview_url: 'https://preview' } }
    })
    const upload = createFakeRequest(() => ({ data: {} }))
    upload.request.interceptors.response.use(response => {
        response.headers.etag = `"${digest}"`
        return response
    })
    const materials = new MaterialService(api.request, upload.request)

    const result = await materials.uploadImage(image, { fileName: 'chart.png' })

    assert.equal(result.url, 'qqbot-media://image/v1/token')
    assert.deepEqual(api.calls.map(call => [call.method, call.url]), [
        ['post', '/v2/media-images/prepare'],
        ['post', '/v2/media-images/complete'],
    ])
    assert.deepEqual(api.calls[0].data, {
        file_name: 'chart.png',
        file_size: image.length,
        content_type: 'image/png',
        md5: digest,
        sha1: createHash('sha1').update(image).digest('hex'),
    })
    assert.deepEqual(api.calls[1].data, { upload_id: 'upload-1', md5: digest })
    assert.equal(upload.calls[0].method, 'put')
    assert.equal(upload.calls[0].url, 'https://cos.example/upload')
})

test('getImages follows pagination and deleteImage uses the official path', async () => {
    const api = createFakeRequest((call) => {
        if (call.method === 'delete') return { data: {} }
        const cursor = (call.params as { cursor?: string } | undefined)?.cursor
        return cursor
            ? { data: { images: [{ image_id: 'image-2' }], next_cursor: '', total: 2 } }
            : { data: { images: [{ image_id: 'image-1' }], next_cursor: 'page-2', total: 2 } }
    })
    const materials = new MaterialService(api.request)

    assert.deepEqual((await materials.getImages()).map(image => image.image_id), ['image-1', 'image-2'])
    await materials.deleteImage('image/2')

    assert.deepEqual(api.calls.slice(0, 2).map(call => call.params), [undefined, { cursor: 'page-2' }])
    assert.equal(api.calls[2].url, '/v2/media-images/image%2F2/delete')
})

test('imageMarkdown formats optional dimensions and validates paired size', () => {
    const materials = new MaterialService(createFakeRequest().request)
    assert.equal(
        materials.imageMarkdown('qqbot-media://image/v1/token', '分时K线', 800, 400),
        '![分时K线 #800px #400px](qqbot-media://image/v1/token)'
    )
    assert.throws(() => materials.imageMarkdown('qqbot-media://image/v1/token', '', 800))
})
