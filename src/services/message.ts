/**
 * 消息服务类 - 负责所有消息相关的API操作
 */
import { AxiosInstance } from 'axios'
import { PrivateMessageEvent } from '@/events'
import { Sendable, Quotable } from '@/elements'
import { MessageBuilder, BuildResult, FileProcessor, PrivateMessageStream } from '@/message'
import type { FileUploadResult } from '@/message'
import type { CreatePrivateStreamOptions, StreamMessagePayload, StreamMessageResult } from '@/message/stream'
import { randomInt } from 'crypto'
import { Message } from '@/message/parser'
import { DMS, Dict } from '@/types'

export interface SendOptions {
    timeout?: number;
    /** 本次发送的 msg_seq；不传则随机生成。重试同一次发送时应复用原值。 */
    msgSeq?: number;
}

export interface SendResult {
    id: string;
    timestamp: number;
    [key: string]: any;
}

export type SendTarget =
    | { kind: 'guild'; channelId: string }
    | { kind: 'dm'; guildId: string }
    | { kind: 'private'; userId: string }
    | { kind: 'group'; groupId: string }

function sendPath(target: SendTarget): string {
    switch (target.kind) {
        case 'guild': return `/channels/${target.channelId}`
        case 'dm': return `/dms/${target.guildId}`
        case 'private': return `/v2/users/${target.userId}`
        case 'group': return `/v2/groups/${target.groupId}`
    }
}

function isGuildSend(target: SendTarget): boolean {
    return target.kind === 'guild' || target.kind === 'dm'
}

function uploadTarget(target: SendTarget): { targetType: 'user' | 'group'; targetId: string } | undefined {
    if (target.kind === 'private') return { targetType: 'user', targetId: target.userId }
    if (target.kind === 'group') return { targetType: 'group', targetId: target.groupId }
    return undefined
}

export class MessageService {

    constructor(
        private request: AxiosInstance,
        private appid: string,
        private fileProcessor: FileProcessor
    ) {}

    /**
     * 获取子频道消息
     */
    async getGuildMessage(channelId: string, messageId: string): Promise<Dict> {
        const { data: result } = await this.request.get(`/channels/${channelId}/messages/${messageId}`)
        return result
    }

    /**
     * 发送频道消息
     */
    async sendGuildMessage(channelId: string, message: Sendable, source?: Quotable, options: SendOptions = {}): Promise<SendResult> {
        return await this.sendMessage({ kind: 'guild', channelId }, message, source, options);
    }

    /**
     * 撤回频道消息
     */
    async recallGuildMessage(channelId: string, messageId: string, hideWarning?: boolean): Promise<boolean> {
        const result = await this.request.delete(`/channels/${channelId}/messages/${messageId}?hidetip=${!!hideWarning}`)
        return result.status === 200
    }

    /**
     * 创建频道私信会话
     */
    async createDirectSession(guildId: string, userId: string): Promise<DMS> {
        const { data: result } = await this.request.post(`/users/@me/dms`, {
            recipient_id: userId,
            source_guild_id: guildId
        })
        return result
    }

    /**
     * 发送频道私信
     */
    async sendDirectMessage(guildId: string, message: Sendable, source?: Quotable, options: SendOptions = {}): Promise<SendResult> {
        return await this.sendMessage({ kind: 'dm', guildId }, message, source, options);
    }

    /**
     * 获取频道私信消息
     */
    async getDirectMessage(guildId: string, messageId: string): Promise<PrivateMessageEvent> {
        const { data: result } = await this.request.get(`/dms/${guildId}/messages/${messageId}`)
        return result
    }

    /**
     * 撤回频道私信
     */
    async recallDirectMessage(guildId: string, messageId: string, hidetip?: boolean): Promise<boolean> {
        const result = await this.request.delete(`/dms/${guildId}/messages/${messageId}?hidetip=${!!hidetip}`)
        return result.status === 200
    }

    /**
     * 发送私聊消息
     */
    async sendPrivateMessage(userId: string, message: Sendable, source?: Quotable, options: SendOptions = {}): Promise<SendResult> {
        return await this.sendMessage({ kind: 'private', userId }, message, source, options);
    }

    /**
     * 发送一截单聊流式消息。后续分片需带上上一分片返回的 `id` 作为 `stream_msg_id`。
     * 群聊不支持流式参数。
     */
    async sendPrivateStreamMessage(userId: string, payload: StreamMessagePayload): Promise<StreamMessageResult> {
        const { data } = await this.request.post<StreamMessageResult>(
            `/v2/users/${userId}/stream_messages`,
            payload
        )
        return data
    }

    /**
     * 创建单聊流式会话。`write` 发送生成中分片，`end` 发送结束分片。
     */
    createPrivateStream(userId: string, options: CreatePrivateStreamOptions = {}): PrivateMessageStream {
        return new PrivateMessageStream(
            payload => this.sendPrivateStreamMessage(userId, payload),
            {
                ...options,
                msgSeq: options.msgSeq ?? randomInt(1, 1_000_000),
            }
        )
    }

    /**
     * 把异步文本流写成单聊流式消息，结束后自动 `end`。
     */
    async sendPrivateStream(
        userId: string,
        chunks: AsyncIterable<string> | Iterable<string>,
        options: CreatePrivateStreamOptions = {}
    ): Promise<StreamMessageResult> {
        const stream = this.createPrivateStream(userId, options)
        for await (const chunk of chunks) {
            if (chunk) await stream.write(chunk)
        }
        return stream.end()
    }

    /**
     * 撤回私聊消息
     */
    async recallPrivateMessage(userId: string, messageId: string): Promise<boolean> {
        const result = await this.request.delete(`/v2/users/${userId}/messages/${messageId}`)
        return result.status === 200
    }

    /**
     * 发送群消息
     */
    async sendGroupMessage(groupId: string, message: Sendable, source?: Quotable, options: SendOptions = {}): Promise<SendResult> {
        return await this.sendMessage({ kind: 'group', groupId }, message, source, options);
    }

    /**
     * 撤回群消息
     */
    async recallGroupMessage(groupId: string, messageId: string): Promise<boolean> {
        const result = await this.request.delete(`/v2/groups/${groupId}/messages/${messageId}`)
        return result.status === 200
    }

    /**
     * 核心发送消息方法
     */
    private async sendMessage(target: SendTarget, message: Sendable, source?: Quotable, options: SendOptions = {}): Promise<SendResult> {
        const endpointPath = sendPath(target)
        const messageBuilder = new MessageBuilder(this.appid, isGuildSend(target), source, options.msgSeq);
        const buildResult = await messageBuilder.build(message);

        if (buildResult.isFile) {
            const uploaded = await this.uploadFile(target, buildResult);
            buildResult.messagePayload.media = { file_info: uploaded.file_info };
        }

        return await this.sendRegularMessage(endpointPath, buildResult, options);
    }
    /**
     * 上传文件。公网 URL 走平台转存，本地文件走官方分片上传。
     */
    private async uploadFile(target: SendTarget, buildResult: BuildResult): Promise<FileUploadResult> {
        const dest = uploadTarget(target)
        if (!dest) {
            throw new Error('当前会话不支持 v2 富媒体上传')
        }
        return this.fileProcessor.uploadForMessage(buildResult.filePayload, {
            ...dest,
            sendMessage: false,
        })
    }

    /**
     * 发送普通消息
     */
    private async sendRegularMessage(endpointPath: string, buildResult: BuildResult, options: SendOptions): Promise<SendResult> {
        const { data: result } = await this.request.post<Message.MessageRet | Message.Audit>(
            endpointPath + '/messages',
            buildResult.messagePayload,
            {
                headers: {
                    'Content-Type': buildResult.contentType
                },
                timeout: options.timeout || 10000
            }
        );
        if (this.isAuditResult(result)) {
            // 如果是审核结果，返回审核信息
            return {
                id: result.message_audit.audit_id,
                timestamp: Date.now() / 1000,
                audit_status: 'pending',
                reason: '',
                brief: buildResult.brief,
            };
        }
        return {
            id: result.id,
            timestamp: Date.now() / 1000,
            brief: buildResult.brief,
        };
    }

    /**
     * 检查是否为审核结果
     */
    private isAuditResult(result: any): result is Message.Audit {
        return result && typeof result === 'object' && 'message_audit' in result;
    }

    /**
     * 批量发送消息
     */
    async sendBatch(target: SendTarget, messages: Sendable[], options: SendOptions = {}): Promise<SendResult[]> {
        const results = [];

        for (const message of messages) {
            const result = await this.sendMessage(target, message, undefined, options);
            results.push(result);

            // 添加发送间隔以避免频率限制
            await this.delay(100);
        }

        return results;
    }

    /**
     * 工具方法：延迟
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
