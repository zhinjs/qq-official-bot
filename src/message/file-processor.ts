/**
 * 文件处理器 - URL 上传与官方分片上传
 * @see https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/rich-media.html
 */
import axios, { AxiosInstance } from 'axios';
import { md5, md5_10m, sha1 } from '@/utils/crypto';
import { getFileBuffer, isHttpUrl } from '@/utils/file';
import type { FilePayload } from './builder';

export type MediaFileType = 1 | 2 | 3 | 4;
export type UploadTargetType = 'user' | 'group';

export interface FileUploadResult {
  file_uuid: string;
  file_info: string;
  ttl: number;
  id?: string;
  raw_url?: string;
}

export interface UploadOptions {
  targetId: string;
  targetType: UploadTargetType;
  fileType?: MediaFileType;
  fileName?: string;
  sendMessage?: boolean;
  /** 即使传入 http(s) URL 也先下载再走分片上传 */
  forceChunked?: boolean;
}

export interface UploadPrepareParams {
  file_type: MediaFileType;
  file_size: string;
  file_name: string;
  md5: string;
  sha1: string;
  md5_10m: string;
}

export interface UploadPart {
  index: number;
  presigned_url: string;
  block_size: string;
}

export interface UploadConfig {
  concurrency: number;
  retry_timeout: number;
  retry_delay: number;
}

export interface UploadPrepareResult {
  upload_id: string;
  block_size: string;
  parts: UploadPart[];
  upload_config?: UploadConfig;
}

export interface FinishUploadPartParams {
  upload_id: string;
  part_index: number;
  block_size: string;
  md5: string;
}

const DEFAULT_FILE_NAMES: Record<MediaFileType, string> = {
  1: 'image.png',
  2: 'video.mp4',
  3: 'audio.silk',
  4: 'file.bin',
};

const FILE_TYPE_BY_EXT: Record<string, MediaFileType> = {
  png: 1, jpg: 1, jpeg: 1, gif: 1, webp: 1, bmp: 1,
  mp4: 2,
  silk: 3, mp3: 3, wav: 3, ogg: 3,
};

const PUT_CLIENT = axios.create({
  timeout: 120_000,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toNumber(value: string | number | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function inferMediaFileType(fileName?: string): MediaFileType | undefined {
  if (!fileName) return undefined;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? FILE_TYPE_BY_EXT[ext] : undefined;
}

async function withRetry<T>(
  task: () => Promise<T>,
  config: UploadConfig
): Promise<T> {
  const deadline = Date.now() + config.retry_timeout * 1000;
  let lastError: unknown;
  while (Date.now() <= deadline) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (Date.now() + config.retry_delay * 1000 > deadline) break;
      await sleep(config.retry_delay * 1000);
    }
  }
  throw lastError;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;
  const limit = Math.max(1, concurrency);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const current = items[cursor++];
      await worker(current);
    }
  });
  await Promise.all(runners);
}

/**
 * 文件处理器
 * 群聊/单聊本地文件走官方分片上传，公网 URL 走平台转存。
 */
export class FileProcessor {
  constructor(private request: AxiosInstance) {}

  /**
   * 上传媒体文件。本地 / Buffer / Base64 走分片上传，http(s) 走 URL 转存。
   */
  async uploadMedia(
    fileData: string | Buffer,
    options: UploadOptions
  ): Promise<FileUploadResult> {
    options = this.withFileType(options);
    if (typeof fileData === 'string' && isHttpUrl(fileData) && !options.forceChunked) {
      return this.uploadByUrl(fileData, options);
    }

    const resolved = await getFileBuffer(fileData);
    return this.uploadByChunks(resolved.buffer, {
      ...options,
      fileName: options.fileName || resolved.fileName,
    });
  }

  /**
   * 供发消息链路使用：已有 URL 则 URL 上传，否则分片上传。
   */
  async uploadForMessage(payload: FilePayload, options: Omit<UploadOptions, 'fileType'>): Promise<FileUploadResult> {
    const fileType = (payload.file_type ?? 1) as MediaFileType;
    if (payload.url && isHttpUrl(payload.url)) {
      return this.uploadByUrl(payload.url, { ...options, fileType, fileName: payload.file_name });
    }

    const resolved = payload.file != null ? await getFileBuffer(payload.file) : undefined;
    const buffer = payload.file_buffer ?? resolved?.buffer;
    if (!buffer?.length) {
      throw new Error('缺少可上传的文件数据');
    }

    return this.uploadByChunks(buffer, {
      ...options,
      fileType,
      fileName: payload.file_name || resolved?.fileName,
    });
  }

  /**
   * 批量上传文件
   */
  async uploadMultipleFiles(
    files: Array<{
      data: string | Buffer;
      type: MediaFileType;
      fileName?: string;
    }>,
    options: Omit<UploadOptions, 'fileType' | 'fileName'>
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];
    for (const file of files) {
      results.push(await this.uploadMedia(file.data, {
        ...options,
        fileType: file.type,
        fileName: file.fileName,
      }));
    }
    return results;
  }

  /** URL 转存上传 */
  async uploadByUrl(url: string, options: UploadOptions): Promise<FileUploadResult> {
    options = this.withFileType(options);
    const { data } = await this.request.post<FileUploadResult>(
      this.filesPath(options),
      {
        file_type: options.fileType,
        url,
        srv_send_msg: options.sendMessage || false,
        file_name: options.fileName,
      },
      { timeout: 30_000 }
    );
    return data;
  }

  /**
   * 官方分片上传：预上传 → PUT 分片 → part_finish → 合并拿到 file_info。
   */
  async uploadByChunks(buffer: Buffer, options: UploadOptions): Promise<FileUploadResult> {
    options = this.withFileType(options);
    const fileName = options.fileName || DEFAULT_FILE_NAMES[options.fileType!];
    const prepared = await this.prepareUpload(options.targetType, options.targetId, {
      file_type: options.fileType!,
      file_size: String(buffer.length),
      file_name: fileName,
      md5: md5(buffer),
      sha1: sha1(buffer),
      md5_10m: md5_10m(buffer),
    });

    const uploadConfig: UploadConfig = {
      concurrency: Math.max(1, prepared.upload_config?.concurrency ?? 1),
      retry_timeout: toNumber(prepared.upload_config?.retry_timeout, 300),
      retry_delay: toNumber(prepared.upload_config?.retry_delay, 1),
    };
    const blockSize = Number(prepared.block_size);
    const parts = prepared.parts;
    const count = Math.ceil(buffer.length / blockSize);
    if (!Number.isSafeInteger(blockSize) || blockSize <= 0 || !buffer.length || !Array.isArray(parts) || parts.length !== count || !parts.length || parts.some(part => !part || typeof part !== 'object')) {
      throw new Error('QQ upload protocol invalid: incomplete parts');
    }
    const indices = parts.map(part => part.index);
    const base = indices.reduce((minimum, index) => Math.min(minimum, index), Infinity);
    if (![0, 1].includes(base) || indices.some(index => !Number.isSafeInteger(index)) || new Set(indices).size !== count || indices.some(index => index < base || index >= base + count)) {
      throw new Error('QQ upload protocol invalid: inconsistent indices');
    }
    if (parts.some(part => Number(part.block_size) !== Math.min(blockSize, buffer.length - (part.index - base) * blockSize))) {
      throw new Error('QQ upload protocol invalid: inconsistent part sizes');
    }
    await runWithConcurrency(parts, uploadConfig.concurrency, async (part) => {
      const partSize = Number(part.block_size);
      const start = (part.index - base) * blockSize;
      const chunk = buffer.subarray(start, start + partSize);
      await withRetry(async () => {
        await PUT_CLIENT.put(part.presigned_url, chunk, {
          headers: { 'Content-Type': 'application/octet-stream' },
          transformRequest: [(data) => data],
        });
        await this.finishUploadPart(options.targetType, options.targetId, {
          upload_id: prepared.upload_id,
          part_index: part.index,
          block_size: String(chunk.length),
          md5: md5(chunk),
        });
      }, uploadConfig);
    });

    return this.completeUpload(options, prepared.upload_id, fileName);
  }

  /** 预上传，获取 upload_id 与各分片预签名 URL */
  async prepareUpload(
    targetType: UploadTargetType,
    targetId: string,
    params: UploadPrepareParams
  ): Promise<UploadPrepareResult> {
    const { data } = await this.request.post<UploadPrepareResult>(
      `/v2/${targetType}s/${targetId}/upload_prepare`,
      params,
      { timeout: 30_000 }
    );
    return data;
  }

  /** 单个分片 PUT 成功后通知服务端 */
  async finishUploadPart(
    targetType: UploadTargetType,
    targetId: string,
    params: FinishUploadPartParams
  ): Promise<void> {
    await this.request.post(
      `/v2/${targetType}s/${targetId}/upload_part_finish`,
      params,
      { timeout: 30_000 }
    );
  }

  /** 携带 upload_id 调用上传接口完成合并 */
  async completeUpload(
    options: UploadOptions,
    uploadId: string,
    fileName?: string
  ): Promise<FileUploadResult> {
    const { data } = await this.request.post<FileUploadResult>(
      this.filesPath(options),
      {
        file_type: options.fileType!,
        srv_send_msg: options.sendMessage || false,
        file_name: fileName || options.fileName,
        upload_id: uploadId,
      },
      { timeout: 30_000 }
    );
    return data;
  }

  private filesPath(options: Pick<UploadOptions, 'targetType' | 'targetId'>): string {
    return `/v2/${options.targetType}s/${options.targetId}/files`;
  }

  private withFileType(options: UploadOptions): UploadOptions & { fileType: MediaFileType } {
    return {
      ...options,
      fileType: options.fileType ?? inferMediaFileType(options.fileName) ?? 1,
    };
  }
}
