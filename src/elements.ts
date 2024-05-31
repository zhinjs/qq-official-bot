import {Dict} from '@/types'

export enum MusicPlatform {
    qq = "qq",
    netease = "163",
}

export interface Quotable {
    id?: string
    event_id?: string
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
        /** 仅接收有效 */
        name?: string
    };
    video: {
        file: string
        url?: string
        /** 仅接收有效 */
        name?: string
    };
    audio: {
        file: string
        url?: string
        /** 仅接收有效 */
        name?: string
    };
    markdown: {
        content: string
        custom_template_id: never
        params: never
    } | {
        custom_template_id: string
        content: never
        params: { key: string, values: string }[]
    }
    keyboard: {
        id: string
    }
    reply: Quotable;
    link: {
        channel_id: string
    };
    button: {
        data: Dict
    };
    ark: {
        template_id: number
        kv: Dict<string, 'key' | 'value'>[]
    };
    embed: {
        title: string
        prompt: string
        htumbnail: Dict<string>
        fields: Dict<string, 'name'>[]
    }
}

export type MessageElemType = keyof MessageElemMap;
// 消息元素
export type MessageElem<T extends MessageElemType = MessageElemType> = {
    type: T;
} & MessageElemMap[T];
// 可以发送的消息类型
export type TextElem = MessageElem<"text">;
export type AtElem = MessageElem<"at">;
export type FaceElem = MessageElem<"face">;
export type ArkElem = MessageElem<'ark'>
export type EmbedElem = MessageElem<'embed'>
export type ImageElem = MessageElem<"image">;
export type VideoElem = MessageElem<"video">;
export type AudioElem = MessageElem<"audio">;
export type LinkElem = MessageElem<'link'>
export type MDElem = MessageElem<'markdown'>
export type KeyboardElem = MessageElem<'keyboard'>
export type ButtonElem = MessageElem<'button'>
export type ReplyElem = MessageElem<"reply">;

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
    | EmbedElem // Embed元素 仅频道和频道私信支持
    | VideoElem // 视频消息元素
    | AudioElem // 语音消息元素
>; // 带回复的消息元素
