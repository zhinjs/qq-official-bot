import type { MessageElem, Sendable } from "@/elements";
import type { Bot } from "@/bot";
import type { Dict } from "@/types";
import { trimQuote } from "@/utils/string";
import type { User } from "@/entries/user";
import type { ApplicationPlatform } from "@/receivers/middleware";
import { ReceiverMode } from "@/receivers/base";

/** QQ 结构化卡片消息类型。 */
export type MessageArkType =
    | 'tuwen'
    | 'feed'
    | 'miniapp'
    | 'map'
    | 'contact_card'
    | 'video_share'
    | 'music_together'
    | 'picture'

/** 消息事件携带的结构化卡片数据。 */
export interface MessageArkData {
    prompt: string;
    ark_type: MessageArkType;
    ark_name: string;
    fields: Dict;
}

/**
 * v2 消息内容类型（事件中的 message_type 数值）：
 * 0 普通文本，3 结构化卡片，101 并行消息，102 聊天记录，103 引用消息。
 */
export type MessageContentType = 0 | 3 | 101 | 102 | 103 | number

/** 消息场景上下文。ext 为 key=value 列表：msg_idx、ref_msg_idx、auth_token 等。 */
export interface MessageScene {
    source?: string;
    ext?: string[];
}

/** 消息附件。 */
export interface MessageAttachment {
    url: string;
    filename?: string;
    width?: number;
    height?: number;
    size?: number;
    /** voice / image/jpeg / image/png / image/gif / video/mp4 / file */
    content_type: string;
    /** 语音转换后的 WAV 文件 URL */
    voice_wav_url?: string;
    /** 语音 ASR 参考结果 */
    asr_refer_text?: string;
}

/** 消息元素（引用消息的被引用内容、聊天记录等），可递归嵌套。 */
export interface MessageElement {
    msg_idx?: string;
    message_type?: MessageContentType;
    content?: string;
    attachments?: MessageAttachment[];
    ark_data?: MessageArkData;
    msg_elements?: MessageElement[];
}

/** 解析 message_scene.ext 中的 key=value 项。 */
export function parseMessageSceneExt(scene?: MessageScene): Record<string, string> {
    const result: Record<string, string> = {}
    for (const item of scene?.ext ?? []) {
        if (typeof item !== 'string') continue
        const index = item.indexOf('=')
        if (index > 0) result[item.slice(0, index)] = item.slice(index + 1)
    }
    return result
}

export class Message {
    message_type: Message.Type
    sub_type: Message.SubType = 'normal'

    get self_id() {
        return this.bot.self_id
    }

    guild_id?: string
    channel_id?: string
    group_id?: string
    id: string
    message_id: string
    sender: Message.Sender
    user_id: string

    constructor(public readonly bot: Bot<ReceiverMode, ApplicationPlatform>, attrs: Dict) {
        const { message_reference, ...otherAttrs } = attrs;
        Object.assign(this, otherAttrs);
        if (message_reference) {
            this.source = {
                id: message_reference.message_id,
                message_id: message_reference.message_id,
            };
        }
    }

    readonly raw_message: string;
    /** 被回复/引用的消息。v2 引用消息时 id 为 REFIDX 引用索引，可直接用于 segment.reply。 */
    readonly source?: { message_id: string; id: string; ref_idx?: string };
    readonly message: Sendable;
    readonly ark_data?: MessageArkData;
    /** v2 消息内容类型：0 文本，3 卡片，101 并行消息，102 聊天记录，103 引用消息。 */
    readonly content_type?: MessageContentType;
    /** 消息场景上下文 */
    readonly message_scene?: MessageScene;
    /** 本条消息的引用索引（REFIDX_…），用于引用回复与去重 */
    readonly msg_idx?: string;
    /** 被引用消息的引用索引（仅引用消息） */
    readonly ref_msg_idx?: string;
    /** 消息元素列表（引用消息时包含被引用内容） */
    readonly msg_elements?: MessageElement[];


    get [Symbol.unscopables]() {
        return {
            bot: true
        }
    }


    toJSON() {
        return Object.fromEntries(Object.keys(this)
            .filter(key => key !== 'bot' && typeof this[key] !== "function")
            .map(key => [key, this[key]])
        )
    }
}

export namespace Message {
    export interface Sender {
        user_id: string
        user_name: string
        permissions: User.Permission[]
        /** 单聊为 user_openid，群聊为 member_openid。 */
        user_openid?: string
        /** 发送者头像 URL（2026-11-16 起单聊/群聊事件下发）。 */
        avatar?: string
        /** 群内昵称，仅群聊事件携带。 */
        member_nickname?: string
        /** 跨应用关联用户 openid，绑定了第三方应用时有效。 */
        union_openid?: string
    }
    export type Ret = MessageRet | FileInfo
    export type MessageRet = {
        id: string
        /** 单聊/群聊为 RFC3339 字符串，频道为数字或字符串 */
        timestamp: number | string
        /** 单聊/群聊返回：ref_idx 为本条消息的引用索引 */
        ext_info?: { ref_idx?: string }
    }
    export type Audit = {
        message_audit: {
            audit_id: string
        }
    }
    export type FileInfo = {
        file_uuid: string
        file_info: string
        ttl: number
        id?: string
        raw_url?: string
    }
    export type Type = 'private' | 'group' | 'guild'
    export type SubType = 'direct' | 'friend' | 'temp' | 'normal' | 'at'

    export function parse(this: Bot<ReceiverMode>, payload: Dict) {
        let template = (payload.content || '').trimStart();
        let result: MessageElem[] = []
        let brief: string = ''
        // 1. 处理文字表情混排
        const regex = /("[^"]*?"|'[^']*?'|`[^`]*?`|“[^”]*?”|‘[^’]*?’|<[^>]+?>)/;
        if (payload.message_reference) {
            result.push({
                type: 'reply',
                data: {
                    id: payload.message_reference.message_id
                }
            })
            brief += `<reply,id=${payload.message_reference.message_id}>`
        } else {
            // v2 单聊/群聊的引用消息没有 message_reference，引用索引在 message_scene.ext 的 ref_msg_idx 中
            const refIdx = parseMessageSceneExt(payload.message_scene).ref_msg_idx
            if (refIdx) {
                result.push({
                    type: 'reply',
                    data: { id: refIdx, ref_idx: refIdx }
                })
                brief += `<reply,ref_idx=${refIdx}>`
            }
        }
        while (template.length) {
            const [match] = template.match(regex) || [];
            if (!match) break;
            const index = template.indexOf(match);
            const prevText = template.slice(0, index);
            if (prevText) {
                result.push({
                    type: 'text',
                    data: { text: prevText }
                })
                brief += prevText
            }
            template = template.slice(index + match.length);
            if (match.startsWith('<')) {
                let [type, ...attrs] = match.slice(1, -1).split(',');
                if (type.startsWith('faceType')) {
                    type = 'face'
                    attrs = attrs.map((attr: string) => attr.replace('faceId', 'id'))
                } else if (type.startsWith('@')) {
                    // 频道：<@!user_id> / <@everyone>；群聊：<@member_openid> / <@all>
                    const id = type.replace(/^@!?/, '')
                    type = 'at'
                    if (id === 'everyone' || id === 'all') {
                        attrs = ['user_id=all']
                    } else {
                        const mention = (payload.mentions || []).find((u: Dict) => u.id === id || u.member_openid === id)
                        attrs = mention
                            ? Object.entries(mention).map(([key, value]) => `${key === 'id' ? 'user_id' : key}=${value}`)
                            : [`user_id=${id}`]
                    }
                } else if (/^[a-z]+:[0-9]+$/.test(type)) {
                    attrs = ['id=' + type.split(':')[1]]
                    type = 'face'
                }
                if ([
                    'text',
                    'face',
                    'at',
                    'image',
                    'video',
                    'audio',
                    'markdown',
                    'button',
                    'link',
                    'reply',
                    'ark',
                    'embed'
                ].includes(type)) {
                    result.push({
                        type,
                        data:Object.fromEntries(attrs.map((attr: string) => {
                            const [key, ...values] = attr.split('=')
                            return [key.toLowerCase(), trimQuote(values.join('='))]
                        })
                    )
                    })
                    brief += `<${type},${attrs.join(',')}>`
                } else {
                    result.push({
                        type: 'text',
                        data: { text: match }
                    })
                    brief += match
                }
            } else {
                result.push({
                    type: "text",
                    data: { text: match }
                });
                brief += match;
            }
        }
        if (template) {
            result.push({
                type: 'text',
                data: { text: template }
            })
            brief += template
        }
        // 2. 将附件添加到消息中
        if (payload.attachments) {
            for (const attachment of payload.attachments) {
                let { content_type, ...data } = attachment
                const [mime] = String(content_type || 'file').split('/')
                // 语音附件的 content_type 为 voice，对应 SDK 的 audio 消息段；群文件为 file
                const type = (mime === 'voice' ? 'audio' : mime) as MessageElem['type']
                if (!data.url.startsWith('http'))
                    data.url = `https://${data.url}`
                if (data.filename) {
                    data.name = data.filename
                    delete data.filename
                }
                result.push({
                    type,
                    data,
                })
                brief += `<${type},${Object.entries(data).map(([key, value]) => `${key}=${value}`).join(',')}>`
            }
        }
        delete payload.attachments
        return [result, brief]
    }
}
