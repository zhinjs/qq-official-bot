import { Dict } from '@/types'

export enum MusicPlatform {
    qq = "qq",
    netease = "163",
}

export interface Quotable {
    /** 被动回复的消息 ID（msg_id） */
    id?: string
    /** 被动回复的事件 ID（event_id），与 msg_id 二选一 */
    event_id?: string
    /** 单聊/群聊引用回复的引用索引（REFIDX_…），来自消息事件的 msg_idx 或发送结果的 ref_idx */
    ref_idx?: string
    /** 消息事件中本条消息的引用索引，segment.reply(event) 会据此生成引用 */
    msg_idx?: string
}

/** 接收到的媒体附件的附加信息（仅接收有效）。 */
export interface ReceivedMediaInfo {
    /** 仅接收有效 */
    name?: string
    width?: number
    height?: number
    size?: number
}

export interface MarkdownOptions {
    /** 图片转存失败时中断发送并返回错误，默认 false。 */
    force_verify_image_resource?: boolean;
}

/** 群聊/单聊图文卡片（msg_type=8）。 */
export interface MessageCard {
    type: 'tuwen';
    content: {
        /** 标题，1–50 字符。 */
        title: string;
        /** 描述，1–200 字符。 */
        description: string;
        /** 跳转链接，必须为 HTTPS，最长 1024 字符。 */
        url: string;
        /** 图片链接，必须为 HTTPS，最长 1024 字符。 */
        pic_url: string;
    };
}

export interface MessageElemMap {
    text: {
        text: string;
    };
    at: {
        user_id: 'all' | string
    };
    face: {
        /** face为0~348，sface不明 */
        id: number
        /** 表情说明，接收消息时有效 */
        text?: string
    };
    image: {
        /**
         * @type {string} 本地图片文件路径，例如"/tmp/1.jpg"
         * @type {string} base64协议数据，例如 "base64://*****" 或 "data:image/png;base64,iVBORw0KG
         * @type {string} 网络图片文件地址，例如"http://www.baidu.com/iconfont.png"
         * @type {Buffer} 图片Buffer数据
         */
        file: string | Buffer
        url?: string
    } & ReceivedMediaInfo;
    video: {
        file: string
        url?: string
    } & ReceivedMediaInfo;
    audio: {
        file: string
        url?: string
        /** 语音转换后的 WAV 文件 URL（仅接收有效） */
        voice_wav_url?: string
        /** 语音 ASR 参考结果（仅接收有效） */
        asr_refer_text?: string
    } & ReceivedMediaInfo;
    /** 群文件等文件附件（仅接收有效） */
    file: {
        url: string
    } & ReceivedMediaInfo;
    markdown: {
        content: string
        custom_template_id?: never
        params?: never
        force_verify_image_resource?: boolean
    } | {
        custom_template_id: string
        content?: never
        params: { key: string, values: string }[]
        force_verify_image_resource?: boolean
    }
    keyboard: {
        id: string
    }
    reply: Quotable;
    link: {
        channel_id: string
    };
    button: Dict;
    card: MessageCard;
    ark: {
        template_id: number
        kv: Dict<string, 'key' | 'value'>[]
    };
    embed: {
        title: string
        prompt: string
        thumbnail: Dict<string>
        fields: Dict<string, 'name'>[]
    }
}

export type MessageElemType = keyof MessageElemMap;
// 消息元素
export type MessageElem<T extends MessageElemType = MessageElemType> = {
    type: T;
    data: MessageElemMap[T];
};
// 可以发送的消息类型
export type TextElem = MessageElem<"text">;
export type AtElem = MessageElem<"at">;
export type FaceElem = MessageElem<"face">;
export type ArkElem = MessageElem<'ark'>
export type CardElem = MessageElem<'card'>
export type EmbedElem = MessageElem<'embed'>
export type ImageElem = MessageElem<"image">;
export type VideoElem = MessageElem<"video">;
export type AudioElem = MessageElem<"audio">;
export type LinkElem = MessageElem<'link'>
export type MDElem = MessageElem<'markdown'>
export type KeyboardElem = MessageElem<'keyboard'>
export type ButtonElem = MessageElem<'button'>
export type ReplyElem = MessageElem<"reply">;
export type FileElem = MessageElem<"file">;

// 重复组合的消息元素
type RepeatableCombineElem = string | TextElem | FaceElem | LinkElem | AtElem | ButtonElem;
type SingleWithRepeatEnd<T extends MessageElem> = [T, ...RepeatableCombineElem[]] // 单元素+组合元素
type SingleWithRepeat<T extends MessageElem> = [...RepeatableCombineElem[], T] | SingleWithRepeatEnd<T> // 组合元素+单元素

// 带回复的消息元素
type WithReply<T extends MessageElem> =
    | T
    | [T]
    | SingleWithRepeat<T>
    | [ReplyElem, ...SingleWithRepeat<T>]
    | [ReplyElem, ...RepeatableCombineElem[]];
// 可发送的消息元素
export type Sendable =
    | RepeatableCombineElem
    | (RepeatableCombineElem)[] // 可重复组合的消息元素
    | WithReply<
        | ImageElem // 图片元素
        | KeyboardElem // 按钮组，供按钮模板使用
        | MDElem // markdown元素
        | ArkElem // Ark 元素
        | CardElem // 群聊/单聊图文卡片
        | EmbedElem // Embed元素 仅频道和频道私信支持
        | VideoElem // 视频消息元素
        | AudioElem // 语音消息元素
    >; // 带回复的消息元素
