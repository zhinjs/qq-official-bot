import {AudioElem, Dict, getFileBase64, ImageElem, md5, QQBot, Quotable, Sendable, VideoElem} from "@";
import {randomInt} from "crypto";
import fs from "node:fs/promises";
import {Blob} from "formdata-node"
import axios from "axios";
import path from "node:path";

export class Sender {
    brief: string = ''
    private isFile = false
    private messagePayload: Dict = {
        msg_seq: randomInt(1, 1000000),
        content: ''
    }
    private buttons: Dict[] = []
    private filePayload: Dict = {
        srv_send_msg: true
    }
    contentType = 'application/json'

    constructor(private bot: QQBot, private baseUrl: string, private message: Sendable, private source: Quotable = {}) {
        this.messagePayload.msg_id = source.id
    }

    private getType(type: string): 1 | 2 | 3 {
        return ['image', 'video', 'audio'].indexOf(type) + 1 as any
    }

    private parseFromTemplate(template: string) {
        const result = []
        const reg = /(<[^>]+>)/
        while (template.length) {
            const [match] = template.match(reg) || [];
            if (!match) break;
            const index = template.indexOf(match);
            const prevText = template.slice(0, index);
            if (prevText) result.push({
                type: 'text',
                text: prevText
            })
            template = template.slice(index + match.length);
            const [type, ...attrArr] = match.slice(1, -1).split(',')
            const attrs = Object.fromEntries(attrArr.map((attr: string) => {
                const [key, value] = attr.split('=')
                try {
                    return [key, JSON.parse(value)]
                } catch {
                    return [key, value]
                }
            }))
            result.push({
                type,
                ...attrs
            })
        }
        if (template.length) {
            result.push({
                type: 'text',
                text: template
            })
        }
        return result
    }
    private async fixGuildMediaData(elem: ImageElem | VideoElem | AudioElem) {
        if (elem.url) return elem.url
        if (typeof elem.file === "string" && elem.file.startsWith('http')) {
            return elem.file
        }
        this.contentType = 'multipart/form-data'
        if (Buffer.isBuffer(elem.file)) {
            return new Blob([elem.file])
        } else if (typeof elem.file !== "string") {
            throw new Error("bad file param: " + elem.file)
        } else if (elem.file.startsWith("base64://")) {
            return new Blob([Buffer.from(elem.file.slice(9), 'base64')])
        } else if (/^data:[^/]+\/[^;]+;base64,/.test(elem.file)) {
            return new Blob([Buffer.from(elem.file.replace(/^data:[^/]+\/[^;]+;base64,/, ''), 'base64')])
        } else try {
            return new Blob([await fs.readFile(elem.file.replace("file://", ""))])
        } catch {
        }
        throw new Error("bad file param: " + elem.file)
    }

    async processMessage() {
        if (!Array.isArray(this.message))
            this.message = [this.message as any]
        const message = [...this.message]
        while (message.length) {
            const elem = message.shift()
            if (typeof elem === 'string') {
                const index = message.findIndex((item) => item === elem)
                message.splice(index, 0, ...this.parseFromTemplate(elem))
                continue
            }
            const {type, ...data} = elem
            switch (elem.type) {
                case 'reply':
                    if (elem.event_id) {
                        this.messagePayload.event_id = elem.event_id
                        this.brief += `<reply,event_id=${elem.event_id}>`
                    } else {
                        this.messagePayload.msg_id = elem.id
                        this.messagePayload.message_reference = {
                            message_id: elem.id
                        }
                        this.brief += `<reply,msg_id=${elem.id}>`
                    }
                    break;
                case "at":
                    this.messagePayload.content += `<@${elem.user_id === 'all' ? 'everyone' : elem.user_id}>`
                    this.brief += `<at,user=${elem.user_id === 'all' ? 'everyone' : elem.user_id}>`
                    break;
                case 'link':
                    this.messagePayload.content += `<#${elem.channel_id}>`
                    this.brief += `<link,channel=${elem.channel_id}>`
                    break;
                case 'text':
                    this.messagePayload.content += elem.text
                    this.brief += elem.text
                    break;
                case 'face':
                    this.messagePayload.content += `<emoji:${elem.id}>`
                    this.brief += `<face,id=${elem.id}>`
                    break;
                case 'image':
                case 'audio':
                case 'video':
                    if (this.messagePayload.msg_id) {
                        if (!this.baseUrl.startsWith('/v2')) {
                            const fileData = await this.fixGuildMediaData(elem)
                            if (typeof fileData !== 'string') {
                                this.messagePayload.file_image = fileData
                            } else {
                                this.messagePayload.image = elem.file
                            }
                        } else {
                            this.messagePayload.msg_type = 7
                            const [_,_version,target_type,target_id]=this.baseUrl.split('/')
                            const result = await this.bot.uploadMedia(target_id,target_type.slice(0,-1) as 'user'|'group',elem.file,this.getType(elem.type))
                            this.messagePayload.media = {file_info: result.file_info}
                        }
                    } else {
                        if (!this.baseUrl.startsWith('/v2')) {
                            const fileData = await this.fixGuildMediaData(elem)
                            if (typeof fileData !== 'string') {
                                this.messagePayload.file_image = fileData
                            } else {
                                this.messagePayload.image = elem.file
                            }
                        } else {
                            this.filePayload.file_type = this.getType(elem.type)
                            const [_,_version,target_type,target_id]=this.baseUrl.split('/')
                            this.filePayload.file_data=await this.bot.uploadMedia(target_id,target_type.slice(0,-1) as 'user'|'group',elem.file,this.getType(elem.type))
                            this.isFile = true
                        }
                    }
                    this.brief += `<${elem.type}:${md5(elem.file)}>`;
                    break;
                case 'markdown':
                    this.messagePayload.markdown = data
                    this.messagePayload.msg_type = 2
                    this.brief += `<markdown,${elem.content ? `content=${elem.content}` : `template_id=${elem.custom_template_id}`}>`
                    break;
                case 'keyboard':
                    this.messagePayload.msg_type = 2
                    this.messagePayload.keyboard = data
                    this.messagePayload.bot_appid = this.bot.config.appid
                    break;
                case 'button':
                    this.buttons.push(data)
                    this.brief += `<button,data=${JSON.stringify(data)}>`
                    break;
                case "embed":
                    if (this.baseUrl.startsWith('/v2')) break
                case "ark":
                    this.messagePayload.msg_type = type === 'ark' ? 3 : 4
                    this.messagePayload[type] = data
                    this.brief += `<${type}>`
                    break;
            }
        }
        if (this.buttons.length) {
            const rows = [];
            let row = [];
            for (let i = 0; i < this.buttons.length; i++) {
                if (row.length > 5) {
                    rows.push(row)
                    row = []
                }
                if (Array.isArray(this.buttons[i].buttons)) {
                    rows.push(this.buttons[i].buttons)
                    continue;
                }
                row.push(this.buttons[i])
            }
            this.messagePayload.keyboard = {
                content: {
                    rows: rows.map(row => {
                        return {
                            buttons: row
                        }
                    })
                },
                bot_appid: this.bot.config.appid
            }
        }
    }

    async sendMsg() {
        await this.processMessage()
        if (this.isFile) {
            const {data: result} = await this.bot.request.post<{
                file_uuid: string
                file_info: string
                ttl: number
            }>(this.baseUrl + '/files', this.filePayload)
            return result
        }
        const {data: result} = await this.bot.request.post(this.baseUrl + '/messages', this.messagePayload, {
            headers: {
                'Content-Type': this.contentType
            }
        })
        return result
    }
}
