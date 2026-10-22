import axios, { type AxiosInstance } from 'axios'
import { extname } from 'node:path'
import { md5, sha1 } from '@/utils/crypto'
import { getFileBuffer } from '@/utils/file'

export type MaterialImageContentType =
    | 'image/png'
    | 'image/jpeg'
    | 'image/gif'
    | 'image/webp'

export interface PrepareMaterialImageParams {
    file_name: string;
    file_size: number;
    content_type: MaterialImageContentType;
    md5: string;
    sha1: string;
}

export interface PrepareMaterialImageResult {
    upload_id: string;
    presigned_url: string;
    expires_in: number;
}

export interface CompleteMaterialImageParams {
    upload_id: string;
    md5: string;
}

export interface MaterialImageUploadResult {
    image_id: string;
    /** 可直接写入 Markdown 图片语法的 qqbot-media:// 引用。 */
    url: string;
    ttl: number;
    /** 短时效预览地址，请勿持久化。 */
    preview_url: string;
}

export interface MaterialImage {
    image_id: string;
    url: string;
    file_name: string;
    /** 短时效预览地址，请勿持久化。 */
    preview_url: string;
    created_at: number;
    expires_at: number;
}

export interface MaterialImageList {
    images: MaterialImage[];
    next_cursor: string;
    total: number;
}

export interface UploadMaterialImageOptions {
    /** Buffer 或 Base64 没有文件名时必填；扩展名必须与 contentType 一致。 */
    fileName?: string;
    /** 不传时根据文件名扩展名推断。 */
    contentType?: MaterialImageContentType;
}

const CONTENT_TYPE_BY_EXTENSION: Record<string, MaterialImageContentType> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
}

const MATERIAL_UPLOAD_CLIENT = axios.create({
    timeout: 120_000,
    maxBodyLength: Infinity,
    maxContentLength: 10 * 1024 * 1024,
})

function inferContentType(fileName: string): MaterialImageContentType | undefined {
    return CONTENT_TYPE_BY_EXTENSION[extname(fileName).toLowerCase()]
}

function normalizeEtag(etag: unknown): string | undefined {
    if (typeof etag !== 'string') return undefined
    const match = /^(?:"([a-f0-9]{32})"|([a-f0-9]{32}))$/i.exec(etag.trim())
    return match ? (match[1] || match[2]).toLowerCase() : undefined
}

/**
 * Markdown 图片素材管理。
 * @see https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/material-management.html
 */
export class MaterialService {
    constructor(
        private request: AxiosInstance,
        private uploadRequest: AxiosInstance = MATERIAL_UPLOAD_CLIENT
    ) {}

    /** 申请图片上传，获得预签名 URL。 */
    async prepareImageUpload(params: PrepareMaterialImageParams): Promise<PrepareMaterialImageResult> {
        const { data } = await this.request.post<PrepareMaterialImageResult>('/v2/media-images/prepare', params)
        return data
    }

    /** 完成图片上传，获得 qqbot-media:// 引用。 */
    async completeImageUpload(params: CompleteMaterialImageParams): Promise<MaterialImageUploadResult> {
        const { data } = await this.request.post<MaterialImageUploadResult>('/v2/media-images/complete', params)
        return data
    }

    /**
     * 一键上传 Markdown 图片素材：读取文件、计算摘要、直传预签名 URL 并完成登记。
     */
    async uploadImage(
        file: string | Buffer,
        options: UploadMaterialImageOptions = {}
    ): Promise<MaterialImageUploadResult> {
        // 调用者可能在 prepare 等待期间复用 Buffer；上传始终使用调用时的快照。
        const resolved = Buffer.isBuffer(file)
            ? { buffer: Buffer.from(file), fileName: undefined }
            : await getFileBuffer(file)
        const fileName = options.fileName || resolved.fileName
        if (!fileName) throw new Error('上传 Markdown 图片素材时必须提供 fileName')

        const inferredContentType = inferContentType(fileName)
        const contentType = options.contentType || inferredContentType
        if (!contentType) throw new Error('仅支持 png、jpeg、gif、webp 图片素材')
        if (inferredContentType !== contentType) {
            throw new Error('图片文件扩展名必须与 contentType 一致')
        }
        if (!resolved.buffer.length) throw new Error('图片素材不能为空')
        if (resolved.buffer.length > 10 * 1024 * 1024) {
            throw new Error('图片素材不能超过 10MB')
        }

        const digest = md5(resolved.buffer)
        const prepared = await this.prepareImageUpload({
            file_name: fileName,
            file_size: resolved.buffer.length,
            content_type: contentType,
            md5: digest,
            sha1: sha1(resolved.buffer),
        })
        const uploaded = await this.uploadRequest.put(prepared.presigned_url, resolved.buffer, {
            headers: { 'Content-Type': contentType },
            transformRequest: [(data) => data],
        })

        const etag = normalizeEtag(uploaded.headers.etag)
        if (!etag || etag !== digest) {
            throw new Error(`图片上传 ETag 缺失、无效或与文件 MD5 不一致（upload_id: ${prepared.upload_id}）`)
        }

        return this.completeImageUpload({
            upload_id: prepared.upload_id,
            md5: etag,
        })
    }

    /** 查询单页有效图片。 */
    async getImagesPage(cursor?: string): Promise<MaterialImageList> {
        const { data } = await this.request.get<MaterialImageList>('/v2/media-images', {
            params: cursor ? { cursor } : undefined,
        })
        return data
    }

    /** 自动遍历 next_cursor，返回全部有效图片。 */
    async getImages(): Promise<MaterialImage[]> {
        const images: MaterialImage[] = []
        const seenCursors = new Set<string>()
        let cursor: string | undefined
        do {
            const page = await this.getImagesPage(cursor)
            images.push(...page.images)
            cursor = page.next_cursor || undefined
            if (cursor && seenCursors.has(cursor)) {
                throw new Error(`QQ material pagination returned repeated cursor: ${cursor}`)
            }
            if (cursor) seenCursors.add(cursor)
        } while (cursor)
        return images
    }

    /** 删除图片并立即使其引用失效。 */
    async deleteImage(imageId: string): Promise<void> {
        await this.request.delete(`/v2/media-images/${encodeURIComponent(imageId)}/delete`)
    }

    /** 生成 Markdown 图片语法，宽高需同时传入。 */
    imageMarkdown(url: string, alt = '', width?: number, height?: number): string {
        if ((width == null) !== (height == null)) {
            throw new Error('Markdown 图片宽度和高度必须同时提供')
        }
        if (width != null && (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0)) {
            throw new Error('Markdown 图片宽度和高度必须为正整数')
        }
        const caption = alt.replace(/\r\n?|\n/g, ' ').replace(/[\\\[\]]/g, '\\$&')
        const size = width == null ? '' : ` #${width}px #${height}px`
        return `![${caption}${size}](${url})`
    }
}
