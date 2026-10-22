import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { test } from 'node:test'
import { MaterialService } from '@/services/material'
import { createFakeRequest } from './fake-http'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64')

test('uploadImage completes the prepare, presigned PUT, and complete flow', async () => {
    const image = Buffer.from(png)
    const digest = createHash('md5').update(image).digest('hex')
    const api = createFakeRequest((call) => {
        if (call.url === '/v2/media-images/prepare') {
            return { data: { upload_id: 'upload-1', presigned_url: 'https://cos.example/upload', expires_in: 3600 } }
        }
        return { data: { image_id: 'image-1', url: 'qqbot-media://image/v1/token', ttl: 7776000, preview_url: 'https://preview' } }
    })
    const upload = createFakeRequest(() => ({ data: {} }))
    upload.request.interceptors.request.use(config => {
        assert.equal(config.headers.get('Content-Type'), 'image/png')
        assert.equal(config.headers.get('Authorization'), undefined)
        assert.deepEqual(config.data, image)
        return config
    })
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

test('uploadImage snapshots the caller Buffer before awaiting prepare', async () => {
    const image = Buffer.from(png)
    const expected = Buffer.from(image)
    const digest = createHash('md5').update(expected).digest('hex')
    const api = createFakeRequest(call => {
        if (call.url.endsWith('/prepare')) {
            image.fill(0)
            return { data: { upload_id: 'upload-1', presigned_url: 'https://cos.example/upload', expires_in: 3600 } }
        }
        return { data: { image_id: 'image-1' } }
    })
    const upload = createFakeRequest(call => {
        assert.deepEqual(call.data, expected)
        return { data: {} }
    })
    upload.request.interceptors.response.use(response => {
        response.headers.etag = digest
        return response
    })

    await new MaterialService(api.request, upload.request).uploadImage(image, { fileName: 'chart.png' })
    assert.deepEqual(api.calls[1].data, { upload_id: 'upload-1', md5: digest })
})

for (const etag of [undefined, 'invalid', '0'.repeat(32), `W/"${'0'.repeat(32)}"`]) {
    test(`uploadImage rejects invalid or mismatched ETag ${String(etag)} before complete`, async () => {
        const api = createFakeRequest(() => ({
            data: { upload_id: 'upload-1', presigned_url: 'https://cos.example/upload', expires_in: 3600 },
        }))
        const upload = createFakeRequest()
        upload.request.interceptors.response.use(response => {
            if (etag !== undefined) response.headers.etag = etag
            return response
        })

        await assert.rejects(
            new MaterialService(api.request, upload.request).uploadImage(png, { fileName: 'chart.png' }),
            /ETag/
        )
        assert.equal(api.calls.length, 1)
        assert.equal(upload.calls.length, 1)
    })
}

for (const stage of ['prepare', 'put', 'complete']) {
    test(`uploadImage propagates ${stage} failure without continuing or retrying`, async () => {
        const failure = new Error(`${stage} failed`)
        const api = createFakeRequest(call => {
            if (call.url.endsWith(`/${stage}`)) throw failure
            return { data: { upload_id: 'upload-1', presigned_url: 'https://cos.example/upload', expires_in: 3600 } }
        })
        const upload = createFakeRequest(() => {
            if (stage === 'put') throw failure
            return { data: {} }
        })
        upload.request.interceptors.response.use(response => {
            response.headers.etag = createHash('md5').update(png).digest('hex')
            return response
        })

        await assert.rejects(
            new MaterialService(api.request, upload.request).uploadImage(png, { fileName: 'chart.png' }),
            error => error === failure
        )
        assert.equal(api.calls.length, stage === 'complete' ? 2 : 1)
        assert.equal(upload.calls.length, stage === 'prepare' ? 0 : 1)
    })
}

test('uploadImage rejects invalid inputs before requesting an upload task', async () => {
    const api = createFakeRequest()
    const service = new MaterialService(api.request)
    await assert.rejects(service.uploadImage(png), /fileName/)
    await assert.rejects(service.uploadImage(png, { fileName: 'image.bmp' }), /png/)
    await assert.rejects(service.uploadImage(png, { fileName: 'image.png', contentType: 'image/jpeg' }), /contentType/)
    await assert.rejects(service.uploadImage(Buffer.alloc(0), { fileName: 'image.png' }), /空/)
    await assert.rejects(service.uploadImage(Buffer.alloc(10 * 1024 * 1024 + 1), { fileName: 'image.png' }), /10MB/)
    assert.equal(api.calls.length, 0)
})

test('default upload transport sends exact binary and MIME without OpenAPI credentials', async () => {
    const digest = createHash('md5').update(png).digest('hex')
    const received: { body?: Buffer; mime?: string; authorization?: string; appid?: string | string[] } = {}
    const server = createServer(async (request, response) => {
        const chunks: Buffer[] = []
        for await (const chunk of request) chunks.push(Buffer.from(chunk))
        received.body = Buffer.concat(chunks)
        received.mime = request.headers['content-type']
        received.authorization = request.headers.authorization
        received.appid = request.headers['x-union-appid']
        response.setHeader('ETag', `"${digest.toUpperCase()}"`)
        response.end()
    })
    try {
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        const address = server.address() as AddressInfo
        const api = createFakeRequest(call => ({ data: call.url.endsWith('/prepare')
            ? { upload_id: 'upload-1', presigned_url: `http://127.0.0.1:${address.port}/upload?signature=test`, expires_in: 3600 }
            : { image_id: 'image-1' },
        }))
        api.request.defaults.headers.common.Authorization = 'QQBot test-secret'
        api.request.defaults.headers.common['X-Union-Appid'] = 'test-app'

        await new MaterialService(api.request).uploadImage(png, { fileName: 'chart.png' })

        assert.deepEqual(received, { body: png, mime: 'image/png', authorization: undefined, appid: undefined })
        assert.deepEqual(api.calls[1].data, { upload_id: 'upload-1', md5: digest })
    } finally {
        if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    }
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

test('imageMarkdown escapes caption delimiters and rejects invalid dimensions', () => {
    const materials = new MaterialService(createFakeRequest().request)
    assert.equal(
        materials.imageMarkdown('qqbot-media://image/v1/token', 'chart] [path\\name]\ncaption'),
        '![chart\\] \\[path\\\\name\\] caption](qqbot-media://image/v1/token)'
    )
    for (const size of [0, -1, 1.5, NaN, Infinity]) {
        assert.throws(() => materials.imageMarkdown('qqbot-media://image/v1/token', '', size, 100), /正整数/)
        assert.throws(() => materials.imageMarkdown('qqbot-media://image/v1/token', '', 100, size), /正整数/)
    }
})

test('getImages rejects repeated cursors instead of looping', async () => {
    const api = createFakeRequest(() => ({ data: { images: [], next_cursor: 'same', total: 0 } }))
    await assert.rejects(new MaterialService(api.request).getImages(), /repeated cursor/)
    assert.equal(api.calls.length, 2)
})
