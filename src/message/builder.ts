/**
 * 消息构建器 - 专门负责构建消息内容
 */

import { Sendable, MessageElem, ImageElem, VideoElem, AudioElem, ReplyElem, AtElem, LinkElem, TextElem, FaceElem, MDElem, KeyboardElem, ButtonElem, EmbedElem, ArkElem, CardElem, MessageCard } from "@/elements";
import { md5 } from "@/utils";
import { randomInt } from "crypto";

export interface MessagePayload {
  msg_seq: number;
  content: string;
  msg_type?: number;
  msg_id?: string;
  event_id?: string;
  message_reference?: {
    message_id: string;
  };
  image?: string;
  file_image?: any;
  media?: {
    file_info: any;
  };
  markdown?: any;
  keyboard?: any;
  bot_appid?: string;
  ark?: any;
  card?: MessageCard;
  embed?: any;
  /** 互动召回消息（仅单聊），与 msg_id / event_id 互斥 */
  is_wakeup?: boolean;
  /** 输入中状态（仅单聊，msg_type=6） */
  input_notify?: {
    input_type: 1;
    input_second: number;
  };
}

export interface FilePayload {
  file_type?: number;
  url?: string;
  file_name?: string;
  file_buffer?: Buffer;
  /** v2 本地/Buffer 原始输入，由 FileProcessor 解析，避免 Builder 读盘 */
  file?: string | Buffer;
}

export interface BuildResult {
  messagePayload: MessagePayload;
  filePayload: FilePayload;
  isFile: boolean;
  contentType: string;
  brief: string;
}

/**
 * 消息构建器
 * 专门负责将Sendable类型的消息转换为API所需的格式
 */
export class MessageBuilder {
  private messagePayload: MessagePayload;
  private filePayload: FilePayload;
  private buttons: any[] = [];
  private isFile = false;
  private contentType = 'application/json';
  private brief = '';

  constructor(
    private appid: string,
    private isGuild?: boolean,
    private source?: { id?: string; event_id?: string },
    msgSeq?: number
  ) {
    this.messagePayload = {
      msg_seq: msgSeq ?? randomInt(1, 1000000),
      content: ''
    };

    this.filePayload = {};

    if (source?.id) {
      this.messagePayload.msg_id = source.id;
    }
    // 单聊/群聊（v2）要求 msg_id 与 event_id 二选一，有消息 ID 时优先被动回复消息；频道保持原有行为
    if (source?.event_id && (isGuild || !source.id)) {
      this.messagePayload.event_id = source.event_id;
    }
  }

  /**
   * 构建消息
   */
  async build(message: Sendable): Promise<BuildResult> {
    await this.processMessage(message);
    await this.processButtons();

    return {
      messagePayload: this.messagePayload,
      filePayload: this.filePayload,
      isFile: this.isFile,
      contentType: this.contentType,
      brief: this.brief
    };
  }

  /**
   * 处理消息内容
   */
  private async processMessage(message: Sendable): Promise<void> {
    const elements: MessageElem[] = [];
    for (const elem of Array.isArray(message) ? message : [message]) {
      elements.push(...(typeof elem === 'string' ? this.parseFromTemplate(elem) : [elem]));
    }

    // v2 正文只有一个槽位。在任何文件处理前检查，并一次确定类型。
    // 频道使用独立字段，保留其现有的组合规则。
    if (!this.isGuild) {
      this.messagePayload.msg_type = this.resolveV2MessageType(elements);
    }
    for (const elem of elements) {
      await this.processElement(elem);
    }
  }

  private resolveV2MessageType(elements: MessageElem[]): number | undefined {
    let body: MessageElem | undefined;
    let msgType: number | undefined;
    let markdownModifier = false;
    for (const elem of elements) {
      let type: number | undefined;
      switch (elem.type) {
        case 'markdown': type = 2; break;
        case 'ark': type = 3; break;
        case 'image':
        case 'video':
        case 'audio': type = 7; break;
        case 'card': type = 8; break;
        case 'keyboard': markdownModifier = true; break;
        case 'at':
          if ((elem as AtElem).data.user_id !== 'all') markdownModifier = true;
          break;
      }
      if (type === undefined) continue;
      if (body) {
        throw new TypeError(`消息正文片段冲突: ${body.type} 与 ${elem.type}，请分别发送`);
      }
      body = elem;
      msgType = type;
    }
    return msgType ?? (markdownModifier ? 2 : undefined);
  }

  /**
   * 处理单个消息元素
   */
  private async processElement(elem: MessageElem): Promise<void> {
    switch (elem.type) {
      case 'reply':
        this.handleReply(elem as ReplyElem);
        break;
      case 'at':
        this.handleAt(elem as AtElem);
        break;
      case 'link':
        this.handleLink(elem as LinkElem);
        break;
      case 'text':
        this.handleText(elem as TextElem);
        break;
      case 'face':
        this.handleFace(elem as FaceElem);
        break;
      case 'image':
      case 'audio':
      case 'video':
        await this.handleMedia(elem as ImageElem | VideoElem | AudioElem);
        break;
      case 'markdown':
        this.handleMarkdown(elem as MDElem);
        break;
      case 'keyboard':
        this.handleKeyboard(elem as KeyboardElem);
        break;
      case 'button':
        this.handleButton(elem as ButtonElem);
        break;
      case 'embed':
        this.handleEmbed(elem as EmbedElem);
        break;
      case 'ark':
        this.handleArk(elem as any);
        break;
      case 'card':
        this.handleCard(elem as CardElem);
        break;
      default:
        console.warn(`未知的消息元素类型: ${elem.type}`);
        break;
    }
  }

  /**
   * 处理回复元素
   */
  private handleReply(elem: ReplyElem): void {
    const { id, event_id } = elem.data;
    if (this.isGuild) {
      if (event_id) {
        this.messagePayload.event_id = event_id;
        this.brief += `<reply,event_id=${event_id}>`;
      } else if (id) {
        this.messagePayload.msg_id = id;
        this.messagePayload.message_reference = {
          message_id: id
        };
        this.brief += `<reply,msg_id=${id}>`;
      }
      return;
    }

    // 单聊/群聊：引用展示用 REFIDX 引用索引（message_reference），被动回复用 msg_id 或 event_id（二选一）
    const refIdx = elem.data.ref_idx ?? (isRefIdx(id) ? id : undefined);
    if (refIdx) {
      this.messagePayload.message_reference = { message_id: refIdx };
      this.brief += `<reply,ref_idx=${refIdx}>`;
    }
    if (id && !isRefIdx(id)) {
      this.messagePayload.msg_id = id;
      delete this.messagePayload.event_id;
      if (!refIdx) this.brief += `<reply,msg_id=${id}>`;
    } else if (event_id && !this.messagePayload.msg_id) {
      this.messagePayload.event_id = event_id;
      if (!refIdx) this.brief += `<reply,event_id=${event_id}>`;
    }
  }

  /**
   * 处理@元素
   */
  private handleAt(elem: AtElem): void {
    if (elem.data.user_id === "all") {
      this.messagePayload.content += `<qqbot-at-everyone />`;
      this.brief += `<at,user=everyone>`;
    } else {
      // v2 类型在预检时选择；单独 @成员仍沿用 Markdown 类型。
      if (this.isGuild) this.messagePayload.msg_type = 2;
      this.messagePayload.content += `<qqbot-at-user id="${elem.data.user_id}" />`;
      this.brief += `<at,user=${elem.data.user_id}>`;
    }
  }

  /**
   * 处理链接元素
   */
  private handleLink(elem: LinkElem): void {
    this.messagePayload.content += `<#${elem.data.channel_id}>`;
    this.brief += `<link,channel=${elem.data.channel_id}>`;
  }

  /**
   * 处理文本元素
   */
  private handleText(elem: TextElem): void {
    this.messagePayload.content += elem.data.text;
    this.brief += elem.data.text;
  }

  /**
   * 处理表情元素
   */
  private handleFace(elem: FaceElem): void {
    this.messagePayload.content += `<emoji:${elem.data.id}>`;
    this.brief += `<face,id=${elem.data.id}>`;
  }

  /**
   * 处理媒体元素（图片、视频、音频）
   */
  private async handleMedia(elem: ImageElem | VideoElem | AudioElem): Promise<void> {
    const mediaType = this.getMediaType(elem.type);

    if (this.isGuild) {
      const media = await this.formatMediaData(elem);
      if (this.messagePayload.msg_id || this.messagePayload.event_id) {
        this.contentType = 'multipart/form-data';
      }
      if (media.blob) {
        this.messagePayload.file_image = media.blob;
      } else {
        this.messagePayload.image = media.url;
      }
      this.brief += `<${elem.type}:${this.getFileHash(elem.data.file)}>`;
      return;
    }

    this.isFile = true;
    this.filePayload.file_type = mediaType;
    this.filePayload.file_name = elem.data.name;
    if ('url' in elem.data && elem.data.url) {
      this.filePayload.url = elem.data.url;
    } else if (typeof elem.data.file === 'string' && elem.data.file.startsWith('http')) {
      this.filePayload.url = elem.data.file;
    } else {
      this.filePayload.file = elem.data.file;
    }

    this.brief += `<${elem.type}:${this.getFileHash(elem.data.file)}>`;
  }

  /**
   * 处理Markdown元素
   */
  private handleMarkdown(elem: MDElem): void {
    // 平台会校验字段，原生 markdown 中携带 null 的 custom_template_id/params 会被判为参数错误。
    const markdown = Object.fromEntries(
      Object.entries(elem.data).filter(([, value]) => value !== null && value !== undefined)
    ) as MDElem['data'];
    const { force_verify_image_resource: _, ...guildMarkdown } = markdown;
    this.messagePayload.markdown = this.isGuild ? guildMarkdown : markdown;
    if (this.isGuild) this.messagePayload.msg_type = 2;
    const content = elem.data.content ? `content=${elem.data.content}` : `template_id=${elem.data.custom_template_id}`;
    this.brief += `<markdown,${content}>`;
  }

  /**
   * 处理键盘元素
   */
  private handleKeyboard(elem: KeyboardElem): void {
    if (this.isGuild) this.messagePayload.msg_type = 2;
    this.messagePayload.keyboard = elem.data;
    this.messagePayload.bot_appid = this.appid;
    this.brief += `<keyboard>`;
  }

  /**
   * 处理按钮元素
   */
  private handleButton(elem: ButtonElem): void {
    this.buttons.push(elem.data);
    this.brief += `<button,data=${JSON.stringify(elem.data)}>`;
  }

  /**
   * 处理嵌入元素
   */
  private handleEmbed(elem: EmbedElem): void {
    if (!this.isGuild) return;
    this.messagePayload.msg_type = 4;
    this.messagePayload.embed = elem.data;
    this.brief += `<embed>`;
  }

  /**
   * 处理ARK元素
   */
  private handleArk(elem: ArkElem): void {
    if (this.isGuild) this.messagePayload.msg_type = 3;
    this.messagePayload.ark = elem.data;
    this.brief += `<ark>`;
  }

  /** 图文卡片使用群聊/单聊的 card 字段，不走富媒体上传。 */
  private handleCard(elem: CardElem): void {
    if (this.isGuild) throw new Error('图文卡片仅支持群聊和单聊');
    this.messagePayload.card = elem.data;
    this.brief += `<card,type=${elem.data.type}>`;
  }

  /**
   * 处理按钮组
   */
  private async processButtons(): Promise<void> {
    if (this.buttons.length === 0) return;

    const rows = [];
    let row = [];

    for (let i = 0; i < this.buttons.length; i++) {
      if (row.length >= 5) {
        rows.push(row);
        row = [];
      }
      // 支持按钮模板发送：仅当只给出 id 而没有按钮定义时视为模板 id，
      // 普通按钮自身也有 id 字段（按钮 ID），不能据此判断。
      if (isKeyboardTemplateButton(this.buttons[i])) {
        this.messagePayload.keyboard = {
          id: this.buttons[i].id,
          bot_appid: this.appid
        };
        return;
      }
      // 如果是按钮组，则直接添加到行中
      if (Array.isArray(this.buttons[i].buttons)) {
        rows.push(this.buttons[i].buttons);
      }else{
        row.push(this.buttons[i]);  
      }
    }

    if (row.length > 0) {
      rows.push(row);
    }

    this.messagePayload.keyboard = {
      content: {
        rows: rows.map(row => ({
          buttons: row
        }))
      },
      bot_appid: this.appid
    };
  }

  /**
   * 从模板字符串解析消息元素
   */
  private parseFromTemplate(template: string): MessageElem[] {
    const result: MessageElem[] = [];
    let cursor = 0;

    while (cursor < template.length) {
      const tagStart = template.indexOf('<', cursor);
      if (tagStart === -1) {
        const text = template.slice(cursor);
        if (text) {
          result.push({
            type: 'text',
            data: { text }
          });
        }
        break;
      }

      if (tagStart > cursor) {
        result.push({
          type: 'text',
          data: { text: template.slice(cursor, tagStart) }
        });
      }

      const tagEnd = template.indexOf('>', tagStart + 1);
      if (tagEnd === -1) {
        const text = template.slice(tagStart);
        if (text) {
          result.push({
            type: 'text',
            data: { text }
          });
        }
        break;
      }

      const match = template.slice(tagStart, tagEnd + 1);
      cursor = tagEnd + 1;

      if (/^<qqbot-at-everyone\s*\/>$/.test(match)) {
        result.push({ type: 'at', data: { user_id: 'all' } });
        continue;
      }

      const [type, ...attrArr] = match.slice(1, -1).split(',');
      const attrs = Object.fromEntries(attrArr.map((attr: string) => {
        const [key, value] = attr.split('=');
        try {
          return [key, JSON.parse(value)];
        } catch {
          return [key, value];
        }
      }));

      result.push({
        type,
        data: attrs
      } as MessageElem);
    }

    return result;
  }


  /**
   * 准备频道媒体数据
   */
  private async formatMediaData(elem: ImageElem | VideoElem | AudioElem): Promise<{
    url: string;
    blob?: Blob;
    buffer?: Buffer;
    fileName?: string;
  }> {
    if ('url' in elem.data && elem.data.url) return { url: elem.data.url };

    if (typeof elem.data.file === "string" && elem.data.file.startsWith('http')) {
      return { url: elem.data.file };
    }


    if (Buffer.isBuffer(elem.data.file)) {
      return { 
        url: '',
        blob: this.toBlob(Buffer.from(elem.data.file)),
        buffer: elem.data.file,
        fileName: elem.data.name,
       };
    } else if (typeof elem.data.file !== "string") {
      throw new Error("无效的文件参数: " + elem.data.file);
    } else if (elem.data.file.startsWith("base64://")) {
      const buffer = Buffer.from(elem.data.file.slice(9), 'base64');
      return { 
        url: '',
        blob: this.toBlob(buffer),
        buffer,
        fileName: elem.data.name,
      };
    } else if (/^data:[^/]+\/[^;]+;base64,/.test(elem.data.file)) {
      const buffer = Buffer.from(elem.data.file.replace(/^data:[^/]+\/[^;]+;base64,/, ''), 'base64');
      return { 
        url: '',
        blob: this.toBlob(buffer),
        buffer,
        fileName: elem.data.name,
      };
    } else {
      try {
        const fs = require('node:fs/promises');
        const path = require('node:path');
        const filePath = elem.data.file.replace("file://", "");
        const buffer: Buffer = await fs.readFile(filePath);
        return { 
          url: '',
          blob: this.toBlob(buffer),
          buffer,
          fileName: elem.data.name || path.basename(filePath),
        };
      } catch {
        throw new Error("无效的文件路径: " + elem.data.file);
      }
    }
  }

  private toBlob(buffer: Buffer): Blob {
    return new Blob([new Uint8Array(buffer)]);
  }

  /**
   * 获取媒体类型编号
   */
  private getMediaType(type: string): 1 | 2 | 3 {
    return (['image', 'video', 'audio'].indexOf(type) + 1) as 1 | 2 | 3;
  }

  /**
   * 获取文件哈希值
   */
  private getFileHash(file: string | Buffer): string {
    try {
      return md5(file);
    } catch {
      return 'unknown';
    }
  }
}

function isKeyboardTemplateButton(button: any): boolean {
  return Boolean(button?.id)
    && button.render_data === undefined
    && button.action === undefined
    && !Array.isArray(button.buttons);
}

/** v2 引用索引形如 REFIDX_xxx，与 ROBOT1.0_ 开头的消息 ID 不同。 */
function isRefIdx(id: unknown): id is string {
  return typeof id === 'string' && id.startsWith('REFIDX_');
}
