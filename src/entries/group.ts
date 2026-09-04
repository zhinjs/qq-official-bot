import type { Bot } from "@/bot"
import type { Sendable, Quotable } from "@/elements"
import type { SendOptions } from "@/services/message"
import type { FileProcessor } from "@/message"
import type {
    ApproveJoinRequestOptions,
    CommandPanel,
    GroupMemberListOptions,
    GetGroupMembersOptions,
    PageOptions,
    RemoveGroupMembersOptions,
    SetMemberMuteState,
    UpdateGroupMemberBlacklistOptions,
} from "@/services"

export class Group {
    constructor(private bot: Bot, public readonly id: string) {}

    send(message: Sendable, source?: Quotable, options?: SendOptions) {
        return this.bot.messageService.sendGroupMessage(this.id, message, source, options)
    }

    recall(messageId: string) {
        return this.bot.messageService.recallGroupMessage(this.id, messageId)
    }

    upload(
        fileData: string | Buffer,
        options: Omit<Parameters<FileProcessor['uploadMedia']>[1], 'targetId' | 'targetType'> = {}
    ) {
        return this.bot.fileProcessor.uploadMedia(fileData, {
            ...options,
            targetId: this.id,
            targetType: 'group',
        })
    }

    info() {
        return this.bot.groupService.getInfo(this.id)
    }

    botState() {
        return this.bot.groupService.getBotState(this.id)
    }

    members(options: GetGroupMembersOptions = {}) {
        return this.bot.groupService.getMembers(this.id, options)
    }

    membersPage(options: GroupMemberListOptions = {}) {
        return this.bot.groupService.getMembersPage(this.id, options)
    }

    refreshMembers() {
        return this.members({ forceRefresh: true })
    }

    clearMemberCache() {
        return this.bot.groupService.clearMemberCache(this.id)
    }

    member(memberOpenid: string) {
        return this.bot.groupService.getMemberInfo(this.id, memberOpenid)
    }

    removeMembers(options: RemoveGroupMembersOptions) {
        return this.bot.groupService.removeMembers(this.id, options)
    }

    blacklist(options: PageOptions = {}) {
        return this.bot.groupService.getMemberBlacklist(this.id, options)
    }

    updateBlacklist(options: UpdateGroupMemberBlacklistOptions) {
        return this.bot.groupService.updateMemberBlacklist(this.id, options)
    }

    blockMembers(memberOpenids: string[]) {
        return this.updateBlacklist({ op: 'add', member_openids: memberOpenids })
    }

    unblockMembers(memberOpenids: string[]) {
        return this.updateBlacklist({ op: 'del', member_openids: memberOpenids })
    }

    joinRequests(options: PageOptions = {}) {
        return this.bot.groupService.getJoinRequests(this.id, options)
    }

    approveJoin(memberOpenid: string, options: ApproveJoinRequestOptions) {
        return this.bot.groupService.approveJoinRequest(this.id, memberOpenid, options)
    }

    muteSetting() {
        return this.bot.groupService.getMuteSetting(this.id)
    }

    muteMembers(members: SetMemberMuteState[]) {
        return this.bot.groupService.setMemberMute(this.id, members)
    }

    mute(memberOpenid: string, muteExpireAt: string) {
        return this.muteMembers([{ op: 'add', member_openid: memberOpenid, mute_expire_at: muteExpireAt }])
    }

    unmute(memberOpenid: string) {
        return this.muteMembers([{ op: 'del', member_openid: memberOpenid }])
    }

    panels(options: Omit<PageOptions, 'limit'> & { limit?: number; cursor?: string } = {}) {
        return this.bot.menuPanelService.getCommandPanels({ scope: 'group', ...options })
    }

    createPanel(panel: CommandPanel, targetType: 'all' | 'specific' = 'specific') {
        return this.bot.menuPanelService.createCommandPanel({
            scope: 'group',
            panel,
            target_type: targetType,
            group_openids: targetType === 'specific' ? [this.id] : undefined,
        })
    }

    bindPanel(panelId: string) {
        return this.bot.menuPanelService.updateCommandPanelTargets(panelId, {
            op: 'add',
            group_openids: [this.id],
        })
    }

    unbindPanel(panelId: string) {
        return this.bot.menuPanelService.updateCommandPanelTargets(panelId, {
            op: 'del',
            group_openids: [this.id],
        })
    }
}

export namespace Group {
    export interface Info {
        id: string
        name: string
    }
}
