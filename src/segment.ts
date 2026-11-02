/**
 * 消息段工厂函数集合
 * 提供便捷的消息段创建方法
 */

import type {
    MessageElem,
    MessageElemMap,
    TextElem,
    AtElem,
    FaceElem,
    ImageElem,
    VideoElem,
    AudioElem,
    MDElem,
    ArkElem,
    CardElem,
    MessageCard,
    EmbedElem,
    ButtonElem,
    LinkElem,
    ReplyElem,
    KeyboardElem,
    Quotable,
    MarkdownOptions
} from './elements'
import type { Dict } from './types'

/**
 * 消息段工厂函数
 */
export const segment = {
    /**
     * 创建文本消息段
     * @param text 文本内容
     */
    text(text: string): TextElem {
        return {
            type: 'text',
            data: {
                text
            }
        }
    },

    /**
     * 创建@消息段
     * @param userId 用户ID，传入 'all' 表示@全体成员
     */
    at(userId: string | 'all'): AtElem {
        return {
            type: 'at',
            data: {
                user_id: userId
            }
        }
    },

    /**
     * 创建表情消息段
     * @param id 表情ID（0~348）
     * @param text 表情说明文字（可选，接收消息时有效）
     */
    face(id: number, text?: string): FaceElem {
        return {
            type: 'face',
            data: {
                id,
                text,
            }
        }
    },

    /**
     * 创建图片消息段
     * @param file 图片文件路径、Buffer数据、base64数据或网络地址
     * @param options 可选参数
     */
    image(file: string | Buffer, options?: {
        url?: string
        name?: string
    }): ImageElem {
        return {
            type: 'image',
            data: {
                file,
                ...options
            }
        }
    },

    /**
     * 创建视频消息段
     * @param file 视频文件路径或网络地址
     * @param options 可选参数
     */
    video(file: string, options?: {
        url?: string
        name?: string
    }): VideoElem {
        return {
            type: 'video',
            data: {
                file,
                ...options
            }
        }
    },

    /**
     * 创建音频消息段
     * @param file 音频文件路径或网络地址
     * @param options 可选参数
     */
    audio(file: string, options?: {
        url?: string
        name?: string
    }): AudioElem {
        return {
            type: 'audio',
            data: {
                file,
                ...options
            }
        }
    },

    /**
     * 创建Markdown消息段
     * @param content Markdown内容或自定义模板ID
     * @param params 模板参数（当第一个参数是模板ID时使用）
     */
    markdown(
        contentOrTemplateId: string,
        paramsOrOptions?: { key: string, values: string }[] | MarkdownOptions,
        options: MarkdownOptions = {}
    ): MDElem {
        if (Array.isArray(paramsOrOptions)) {
            // 使用自定义模板
            return {
                type: 'markdown',
                data: {
                    content: null as never,
                    custom_template_id: contentOrTemplateId,
                    params: paramsOrOptions,
                    ...options
                }
            }
        } else {
            // 使用直接内容
            return {
                type: 'markdown',
                data: {
                    content: contentOrTemplateId,
                    custom_template_id: null as never,
                    params: null as never,
                    ...paramsOrOptions
                }
            }
        }
    },

    /** 创建群聊/单聊图文卡片，链接必须为 HTTPS。 */
    card(content: MessageCard['content']): CardElem {
        return {
            type: 'card',
            data: { type: 'tuwen', content }
        }
    },

    /**
     * 创建ARK消息段
     * @param templateId 模板ID
     * @param kv 键值对数据
     */
    ark(templateId: number, kv: Dict<string, 'key' | 'value'>[]): ArkElem {
        return {
            type: 'ark',
            data: {
                template_id: templateId,
                kv
            }
        }
    },

    /**
     * 创建Embed消息段
     * @param title 标题
     * @param prompt 描述
     * @param thumbnail 缩略图
     * @param fields 字段列表
     */
    embed(
        title: string,
        prompt: string,
        thumbnail: Dict<string>,
        fields: Dict<string, 'name'>[]
    ): EmbedElem {
        return {
            type: 'embed',
            data: {
                title,
                prompt,
                thumbnail: thumbnail,
                fields
            }
        }
    },

    /**
     * 创建按钮消息段
     * @param data 按钮数据
     */
    button(data: Dict): ButtonElem {
        return {
            type: 'button',
            data
        }
    },

    /**
     * 创建链接消息段
     * @param channelId 频道ID
     */
    link(channelId: string): LinkElem {
        return {
            type: 'link',
            data: {
                channel_id: channelId
            }
        }
    },

    /**
     * 创建回复消息段
     * @param idOrQuotable 消息ID、事件ID或Quotable对象
     */
    reply(idOrQuotable: string | Quotable): ReplyElem {
        if (typeof idOrQuotable === 'string') {
            return {
                type: 'reply',
                data: {
                    id: idOrQuotable
                }
            }
        } else {
            return {
                type: 'reply',
                data: {
                    id: idOrQuotable.id,
                    event_id: idOrQuotable.event_id
                }
            }
        }
    },

    /**
     * 创建键盘按钮组消息段
     * @param id 按钮组ID
     */
    keyboard(id: string): KeyboardElem {
        return {
            type: 'keyboard',
            data: {
                id
            }
        }
    }
}

// 为了兼容性，也导出一个默认的segment对象
export default segment

// 导出类型定义以便外部使用
export type { MessageElem, MessageElemMap }
export type SegmentFactory = typeof segment
