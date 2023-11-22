import {Dict, QQBot, Quotable, Sendable} from "@";

export class Sender {
    brief: string = ''
    private isFile=false
    private messagePayload:Dict={}
    private buttons:Dict[]=[]
    private filePayload:Dict={
        srv_send_msg:true
    }
    constructor(private bot: QQBot, private baseUrl: string,  private message: Sendable, private source: Quotable = {}) {
        this.messagePayload.msg_id=source.message_id
    }

    private getType(type: string):1|2|3 {
        return ['image', 'video', 'audio'].indexOf(type) + 1 as any
    }
    private parseFromTemplate(template:string){
        const result=[]
        const reg = /(<[^>]+>)/
        while (template.length) {
            const [match] = template.match(reg) || [];
            if (!match) break;
            const index = template.indexOf(match);
            const prevText = template.slice(0, index);
            if(prevText) result.push({
                type:'text',
                text:prevText
            })
            template = template.slice(index + match.length);
            const [type, ...attrArr] = match.slice(1, -1).split(',')
            const attrs = Object.fromEntries(attrArr.map((attr: string) => {
                const [key, value] = attr.split('=')
                return [key, value]
            }))
            result.push({
                type,
                ...attrs
            })
        }
        if(template.length){
            result.push({
                type:'text',
                text:template
            })
        }
        return result
    }
    async processMessage(){
        if (!Array.isArray(this.message)) this.message = [this.message as any]
        while (this.message.length){
            const elem=this.message.shift()
            if (typeof elem === 'string') {
                const index=this.message.findIndex((item)=>item===elem)
                this.message.splice(index,0,...this.parseFromTemplate(elem))
                continue
            }
            switch (elem.type) {
                case 'reply':
                    this.messagePayload.msg_id = elem.message_id
                    this.filePayload.msg_id = elem.message_id
                    this.brief += `<$reply,message_id=${elem.message_id}>`
                    break;
                case "at":
                    if (this.messagePayload.content) {
                        this.messagePayload.content += `<@${elem.id || 'everyone'}>`
                    } else {
                        this.messagePayload.content = `<@${elem.id || 'everyone'}>`
                    }
                    this.brief += `<$at,user=${elem.id || 'everyone'}>`
                    break;
                case 'link':
                    if (this.messagePayload.content) {
                        this.messagePayload.content += `<#${elem.channel_id}>`
                    } else {
                        this.messagePayload.content = `<#${elem.channel_id}>`
                    }
                    this.brief += `<$link,channel=${elem.channel_id}>`
                    break;
                case 'text':
                    if (this.messagePayload.content) {
                        this.messagePayload.content += elem.text
                    } else {
                        this.messagePayload.content = elem.text
                    }
                    this.brief += elem.text
                    break;
                case 'face':
                    if (this.messagePayload.content) {
                        this.messagePayload.content += `<emoji:${elem.id}>`
                    } else {
                        this.messagePayload.content = `<emoji:${elem.id}>`
                    }
                    this.brief += `<$face,id=${elem.id}>`
                    break;
                case 'image':
                    if(this.messagePayload.msg_id){
                        this.messagePayload.content=this.messagePayload.content||' '
                        if(!this.baseUrl.startsWith('/v2')){
                            this.messagePayload.image=!elem.url?.startsWith('http')?`http://${elem.url}`:elem.url
                        }else{
                            this.messagePayload.msg_type=7
                            const result= await this.sendFile(elem.url,this.getType(elem.type))
                            this.messagePayload.media.file_info=result.file_info
                        }
                    }else{
                        if(!this.baseUrl.startsWith('/v2')){
                            this.messagePayload.image=!elem.url?.startsWith('http')?`http://${elem.url}`:elem.url
                        }else{
                            this.filePayload.file_type = this.getType(elem.type)
                            this.filePayload.url = !elem.url?.startsWith('http')?`http://${elem.url}`:elem.url
                            this.isFile = true
                        }
                    }
                    this.brief += `<${elem.type},url=${elem.url}>`
                    break;
                case 'audio':
                case 'video':
                    if(this.baseUrl.startsWith('/v2')){
                        this.filePayload.file_type = this.getType(elem.type)
                        this.filePayload.url = elem.url
                        this.isFile = true
                    }
                    break;
                case 'markdown':
                    this.messagePayload.markdown = {
                        content: elem.content
                    }
                    this.messagePayload.msg_type = 2
                    this.brief += `<#markdown,content=${elem.content}>`
                    break;
                case 'button':
                    this.buttons.push(elem.data)
                    this.brief += `<$button,data=${JSON.stringify(elem.data)}>`
                    break;
            }
        }
        if (this.buttons.length) {
            const rows = []
            for (let i = 0; i < this.buttons.length; i += 4) {
                rows.push(this.buttons.slice(i, i + 4))
            }
            this.messagePayload.keyboard = {
                content: {
                    rows: rows.map(row => {
                        return {
                            buttons: row
                        }
                    })
                }
            }
        }
    }
    private async sendFile(url: string, file_type: 1 | 2 | 3) {
        if(!url.startsWith('http')) url=`http://${url}`
        const {data: result} = await this.bot.request.post(this.baseUrl + '/files', {
            file_type,
            url,
            srv_send_msg:false,
        })
        return result
    }

    async sendMsg() {
        await this.processMessage()
        if(this.isFile){
            const {data:result} = await this.bot.request.post(this.baseUrl+'/files',this.filePayload)
            return result
        }
        const {data:result} = await this.bot.request.post(this.baseUrl+'/messages',this.messagePayload)
        return result
    }
}
