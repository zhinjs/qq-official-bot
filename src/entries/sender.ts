import {AudioElem, Dict, ImageElem, QQBot, Quotable, Sendable, VideoElem} from "@";
import {randomInt} from "crypto";
import * as fs from "fs";
import {ReadStream} from "node:fs";

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
    contentType='application/json'
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
    private async fixMediaData(elem:ImageElem|VideoElem|AudioElem){
        if(typeof elem.file==="string" && elem.file.startsWith('http')){
            return elem.file
        }
        this.contentType='multipart/form-data'
        if(elem.file instanceof ReadStream) return elem.file
        if(Buffer.isBuffer(elem.file)){
            return fs.createReadStream(elem.file)
        }else if(typeof elem.file !== "string"){
            throw new Error("bad file param: " + elem.file)
        }else if(elem.file.startsWith("base64://")){
            return fs.createReadStream(Buffer.from(elem.file.slice(9),'base64'))
        }else if(/^data:[^/]+\/[^;]+;base64,/.test(elem.file)){
            return fs.createReadStream(Buffer.from(elem.file.replace(/^data:[^/]+\/[^;]+;base64,/,''),'base64'))
        }else if(fs.existsSync(elem.file)){
            return fs.createReadStream(elem.file)
        }
        throw new Error("bad file param: " + elem.file)
    }
    async processMessage() {
        if (!Array.isArray(this.message)) this.message = [this.message as any]
        while (this.message.length) {
            const elem = this.message.shift()
            if (typeof elem === 'string') {
                const index = this.message.findIndex((item) => item === elem)
                this.message.splice(index, 0, ...this.parseFromTemplate(elem))
                continue
            }
            const {type, ...data} = elem
            switch (elem.type) {
                case 'reply':
                    this.messagePayload.msg_id = elem.id
                    this.filePayload.msg_id = elem.id
                    this.messagePayload.message_reference={
                        message_id: elem.id
                    }
                    this.brief += `<reply,msg_id=${elem.id}>`
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
                            const fileData=await this.fixMediaData(elem)
                            if(typeof fileData!=='string'){
                                this.messagePayload.file_image = fileData
                            }else{
                                this.messagePayload.image = elem.file
                            }
                        } else {
                            if(typeof elem.file!=='string' || !elem.file.startsWith('http')){
                                throw new Error('暂不支持上传本地文件/Buffer/base64')
                            }
                            this.messagePayload.msg_type = 7
                            const result = await this.sendFile(elem.file, this.getType(elem.type))
                            this.messagePayload.media = {file_info: result.file_info}
                        }
                    } else {
                        if (!this.baseUrl.startsWith('/v2')) {
                            const fileData=await this.fixMediaData(elem)
                            if(typeof fileData!=='string'){
                                this.messagePayload.file_image = fileData
                            }else{
                                this.messagePayload.image = elem.file
                            }
                        } else {
                            this.filePayload.file_type = this.getType(elem.type)
                            if(typeof elem.file!=="string" || !elem.file.startsWith('http')){
                                throw new Error('暂不支持上传本地文件/Buffer/base64')
                            }
                            this.filePayload.url = !elem.file?.startsWith('http') ? `http://${elem.file}` : elem.file
                            this.isFile = true
                        }
                    }
                    this.brief += `<${elem.type},url=${elem.file}>`
                    break;
                case 'markdown':
                    this.messagePayload.markdown = data
                    this.messagePayload.msg_type = 2
                    this.brief += `<markdown,${elem.content?`content=${elem.content}`:`template_id=${elem.custom_template_id}`}>`
                    break;
                case 'keyboard':
                    this.messagePayload.msg_type = 2
                    this.messagePayload.keyboard = data
                    this.messagePayload.bot_appid=this.bot.config.appid
                    break;
                case 'button':
                    this.buttons.push(data)
                    this.brief += `<button,data=${JSON.stringify(data)}>`
                    break;
                case "ark":
                case "embed":
                    if (this.baseUrl.startsWith('/v2')) break
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

    private async sendFile(url: string, file_type: 1 | 2 | 3) {
        if (!url.startsWith('http')) url = `http://${url}`
        const {data: result} = await this.bot.request.post(this.baseUrl + '/files', {
            file_type,
            url,
            srv_send_msg: false,
        })
        return result
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
        const {data: result} = await this.bot.request.post(this.baseUrl + '/messages', this.messagePayload,{
            headers:{
                'Content-Type':this.contentType
            }
        })
        return result
    }
}
