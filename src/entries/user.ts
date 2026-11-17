import type { Bot } from "@/bot"
import type { Sendable, Quotable } from "@/elements"
import type { SendOptions } from "@/services/message"
import type { FileProcessor } from "@/message"
import type { CreatePrivateStreamOptions, StreamMessagePayload } from "@/message/stream"
import type { CommandPanel, PageOptions } from "@/services"

export class User {
    constructor(private bot: Bot, public readonly id: string) {}

    /** 获取用户基本信息（昵称、头像、是否接收主动推送）。 */
    info() {
        return this.bot.botService.getUserInfo(this.id)
    }

    send(message: Sendable, source?: Quotable, options?: SendOptions) {
        return this.bot.messageService.sendPrivateMessage(this.id, message, source, options)
    }

    recall(messageId: string) {
        return this.bot.messageService.recallPrivateMessage(this.id, messageId)
    }

    upload(
        fileData: string | Buffer,
        options: Omit<Parameters<FileProcessor['uploadMedia']>[1], 'targetId' | 'targetType'> = {}
    ) {
        return this.bot.fileProcessor.uploadMedia(fileData, {
            ...options,
            targetId: this.id,
            targetType: 'user',
        })
    }

    createStream(options: CreatePrivateStreamOptions = {}) {
        return this.bot.messageService.createPrivateStream(this.id, options)
    }

    sendStream(
        chunks: AsyncIterable<string> | Iterable<string>,
        options: CreatePrivateStreamOptions = {}
    ) {
        return this.bot.messageService.sendPrivateStream(this.id, chunks, options)
    }

    sendStreamMessage(payload: StreamMessagePayload) {
        return this.bot.messageService.sendPrivateStreamMessage(this.id, payload)
    }

    panels(options: Omit<PageOptions, 'limit'> & { limit?: number; cursor?: string } = {}) {
        return this.bot.menuPanelService.getCommandPanels({ scope: 'c2c', ...options })
    }

    createPanel(panel: CommandPanel, targetType: 'all' | 'specific' = 'specific') {
        return this.bot.menuPanelService.createCommandPanel({
            scope: 'c2c',
            panel,
            target_type: targetType,
            user_openids: targetType === 'specific' ? [this.id] : undefined,
        })
    }

    bindPanel(panelId: string) {
        return this.bot.menuPanelService.updateCommandPanelTargets(panelId, {
            op: 'add',
            user_openids: [this.id],
        })
    }

    unbindPanel(panelId: string) {
        return this.bot.menuPanelService.updateCommandPanelTargets(panelId, {
            op: 'del',
            user_openids: [this.id],
        })
    }
}

export namespace User {
    export interface Info {
        id: string
        username: string
        avatar: string
        bot: boolean
        public_flag: number
    }

    export enum Permission {
        normal = 1,
        admin = 2,
        owner = 4,
        channelAdmin = 5,
    }
}
