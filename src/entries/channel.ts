import {ChannelSubType, ChannelType, PrivateType, SpeakPermission} from "@/constants";
import type { Bot } from "@/bot"
import type { Sendable, Quotable } from "@/elements"
import type { SendOptions } from "@/services/message"
import type {
    AudioControl,
    ChannelUpdateInfo,
    EmojiType,
    ScheduleInfo,
    ThreadInfo,
    UpdatePermissionParams,
} from "@/types"
import type { CommandPanel, PageOptions } from "@/services"

export class Channel {
    constructor(private bot: Bot, public readonly id: string) {}

    send(message: Sendable, source?: Quotable, options?: SendOptions) {
        return this.bot.messageService.sendGuildMessage(this.id, message, source, options)
    }

    recall(messageId: string, hideWarning?: boolean) {
        return this.bot.messageService.recallGuildMessage(this.id, messageId, hideWarning)
    }

    async getMessage(messageId: string) {
        const payload = await this.bot.messageService.getGuildMessage(this.id, messageId)
        return this.bot.processPayload(payload.id, 'message.guild', payload)
    }

    info() {
        return this.bot.channelService.getInfo(this.id)
    }

    update(updateInfo: ChannelUpdateInfo) {
        return this.bot.channelService.update(this.id, updateInfo)
    }

    delete() {
        return this.bot.channelService.delete(this.id)
    }

    pins() {
        return this.bot.channelService.getPins(this.id)
    }

    pin(messageId: string) {
        return this.bot.channelService.pinMessage(this.id, messageId)
    }

    unpin(messageId: string) {
        return this.bot.channelService.unpinMessage(this.id, messageId)
    }

    rolePermission(roleId: string) {
        return this.bot.permissionService.getChannelRolePermission(this.id, roleId)
    }

    updateRolePermission(roleId: string, permission: UpdatePermissionParams) {
        return this.bot.permissionService.updateChannelRolePermission(this.id, roleId, permission)
    }

    memberPermission(memberId: string) {
        return this.bot.permissionService.getChannelMemberPermission(this.id, memberId)
    }

    updateMemberPermission(memberId: string, permission: UpdatePermissionParams) {
        return this.bot.permissionService.updateChannelMemberPermission(this.id, memberId, permission)
    }

    react(messageId: string, type: EmojiType, id: `${number}`) {
        return this.bot.reactionService.addGuildMessageReaction(this.id, messageId, type, id)
    }

    deleteReaction(messageId: string, type: EmojiType, id: `${number}`) {
        return this.bot.reactionService.deleteGuildMessageReaction(this.id, messageId, type, id)
    }

    async reactionMembers(messageId: string, type: EmojiType, id: `${number}`) {
        const users = await this.bot.reactionService.getGuildMessageReactionMembers(this.id, messageId, type, id)
        return users.map(user => ({
            user_id: user.id,
            user_name: user.username,
            avatar: user.avatar,
        }))
    }

    schedules(since?: number) {
        return this.bot.scheduleService.getChannelSchedules(this.id, since)
    }

    schedule(scheduleId: string) {
        return this.bot.scheduleService.getChannelSchedule(this.id, scheduleId)
    }

    createSchedule(schedule: Exclude<ScheduleInfo, 'id'>) {
        return this.bot.scheduleService.createChannelSchedule(this.id, schedule)
    }

    updateSchedule(scheduleId: string, schedule: Exclude<ScheduleInfo, 'id'>) {
        return this.bot.scheduleService.updateChannelSchedule(this.id, scheduleId, schedule)
    }

    deleteSchedule(scheduleId: string) {
        return this.bot.scheduleService.deleteChannelSchedule(this.id, scheduleId)
    }

    controlAudio(audioControl: AudioControl) {
        return this.bot.audioService.controlChannelAudio(this.id, audioControl)
    }

    onlineMic() {
        return this.bot.audioService.setOnlineMic(this.id)
    }

    offlineMic() {
        return this.bot.audioService.setOfflineMic(this.id)
    }

    threads() {
        return this.bot.threadService.getChannelThreads(this.id)
    }

    thread(threadId: string) {
        return this.bot.threadService.getChannelThreadInfo(this.id, threadId)
    }

    publishThread(title: string, content: string, format: 1 | 2 | 3 | 4 = 3): Promise<ThreadInfo> {
        return this.bot.threadService.publishThread(this.id, title, content, format)
    }

    deleteThread(threadId: string) {
        return this.bot.threadService.deleteThread(this.id, threadId)
    }

    panels(options: Omit<PageOptions, 'limit'> & { limit?: number; cursor?: string } = {}) {
        return this.bot.menuPanelService.getCommandPanels({ scope: 'channel', ...options })
    }

    createPanel(panel: CommandPanel) {
        return this.bot.menuPanelService.createCommandPanel({
            scope: 'channel',
            panel,
            target_type: 'all',
        })
    }
}

export namespace Channel {
    export interface Info {
        id: string
        guild_id: string
        name: string,
        type: ChannelType
        sub_type: ChannelSubType
        position: number
        parent_id?: string
        owner_id: string
        private_type: PrivateType
        speak_permission: SpeakPermission
        application_id?: string
        permissions?: string
    }

    /** 创建子频道的请求参数（POST /guilds/{guild_id}/channels），字段均可选。 */
    export type CreateParam = Partial<Pick<Info,
        'name' | 'type' | 'sub_type' | 'position' | 'parent_id' | 'private_type' | 'speak_permission' | 'application_id'
    >> & {
        /** 子频道私密类型为指定成员时的成员 ID 列表 */
        private_user_ids?: string[]
    }

    export type ApiInfo = Omit<Info, 'id' | 'name'> & {
        channel_id: string
        channel_name: string
    }
}
