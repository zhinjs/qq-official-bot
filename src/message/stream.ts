import type { Quotable } from '@/elements'

export type StreamInputMode = 'append' | 'replace'
export type StreamContentType = 'text' | 'markdown'
/** 1=生成中，10=生成结束 */
export type StreamInputState = 1 | 10

/**
 * 单聊流式消息请求体。
 * @see https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_stream_messages.post.html
 */
export interface StreamMessagePayload {
    input_mode?: StreamInputMode;
    input_state?: StreamInputState;
    index?: number;
    content_type?: StreamContentType;
    content_raw?: string;
    event_id?: string;
    msg_id?: string;
    stream_msg_id?: string;
    msg_seq?: number;
    is_wakeup?: boolean;
}

export interface StreamMessageExtInfo {
    ref_idx?: string;
}

export interface StreamMessageResult {
    id: string;
    timestamp: string;
    ext_info?: StreamMessageExtInfo;
    remain_msg_len?: number;
}

export interface CreatePrivateStreamOptions {
    source?: Quotable;
    msgId?: string;
    eventId?: string;
    contentType?: StreamContentType;
    /** 默认 append。replace 时每次下发当前全文，且必须以上游已下发前缀开头 */
    inputMode?: StreamInputMode;
    msgSeq?: number;
    isWakeup?: boolean;
}

type StreamSender = (payload: StreamMessagePayload) => Promise<StreamMessageResult>

function compactPayload(payload: StreamMessagePayload): StreamMessagePayload {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
    ) as StreamMessagePayload
}

/**
 * 单聊流式消息会话。同一会话共用 stream_msg_id，index 从 0 递增。
 */
export class PrivateMessageStream {
    streamMsgId?: string
    index = 0
    private sentContent = ''
    private finished = false

    constructor(
        private sendChunk: StreamSender,
        private options: CreatePrivateStreamOptions
    ) {}

    /** 写入一截内容（input_state=1） */
    async write(chunk: string): Promise<StreamMessageResult> {
        return this.dispatch(chunk, 1)
    }

    /** 结束流式输出（input_state=10）。replace 模式下可只传最终全文的新增后缀 */
    async end(chunk = ''): Promise<StreamMessageResult> {
        return this.dispatch(chunk, 10)
    }

    private async dispatch(chunk: string, inputState: StreamInputState): Promise<StreamMessageResult> {
        if (this.finished) {
            throw new Error('流式消息已结束')
        }

        const inputMode = this.options.inputMode ?? 'append'
        const contentRaw = inputMode === 'replace' ? `${this.sentContent}${chunk}` : chunk
        // is_wakeup（互动召回）与 msg_id / event_id 互斥
        const wakeup = this.options.isWakeup === true
        const msgId = wakeup ? undefined : this.options.msgId ?? this.options.source?.id
        const eventId = wakeup || msgId ? undefined : this.options.eventId ?? this.options.source?.event_id
        const result = await this.sendChunk(compactPayload({
            input_mode: inputMode,
            input_state: inputState,
            index: this.index,
            content_type: this.options.contentType ?? 'text',
            content_raw: contentRaw,
            // msg_id 与 event_id 二选一，优先使用消息 ID
            msg_id: msgId,
            event_id: eventId,
            stream_msg_id: this.streamMsgId,
            msg_seq: this.options.msgSeq,
            is_wakeup: this.options.isWakeup,
        }))

        this.streamMsgId = result.id
        this.index += 1
        this.sentContent = inputMode === 'replace' ? contentRaw : `${this.sentContent}${chunk}`
        if (inputState === 10) this.finished = true
        return result
    }
}
