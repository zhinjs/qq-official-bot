import type { Bot } from "@/bot"
import type { ApiBaseInfo, RoleCreateParam, RoleUpdateParam } from "@/types"
import type { Channel } from "@/entries/channel"

export class Guild {
    constructor(private bot: Bot, public readonly id: string) {}

    info() {
        return this.bot.guildService.getInfo(this.id)
    }

    channels() {
        return this.bot.channelService.getList(this.id)
    }

    createChannel(channelInfo: Omit<Channel.Info, 'id'>) {
        return this.bot.channelService.create(this.id, channelInfo)
    }

    roles() {
        return this.bot.guildService.getRoles(this.id)
    }

    createRole(role: RoleCreateParam) {
        return this.bot.guildService.createRole(this.id, role)
    }

    updateRole(roleId: string, updateInfo: RoleUpdateParam) {
        return this.bot.guildService.updateRole(this.id, roleId, updateInfo)
    }

    deleteRole(roleId: string) {
        return this.bot.guildService.deleteRole(this.id, roleId)
    }

    accessApis() {
        return this.bot.guildService.getAccessApis(this.id)
    }

    applyAccess(channelId: string, apiInfo: ApiBaseInfo, desc?: string) {
        return this.bot.guildService.applyAccess(this.id, channelId, apiInfo, desc)
    }

    announce(channelId: string, messageId: string) {
        return this.bot.permissionService.setChannelAnnounce(this.id, channelId, messageId)
    }

    mute(seconds: number, endTime?: number) {
        return this.bot.guildService.mute(this.id, seconds, endTime)
    }

    unmute() {
        return this.mute(0, 0)
    }

    muteMembers(memberIds: string[], seconds: number, endTime?: number) {
        return this.bot.memberService.muteMembers(this.id, memberIds, seconds, endTime)
    }

    unmuteMembers(memberIds: string[]) {
        return this.muteMembers(memberIds, 0, 0)
    }

    muteMember(memberId: string, seconds: number, endTime?: number) {
        return this.bot.memberService.muteGuildMember(this.id, memberId, seconds, endTime)
    }

    unmuteMember(memberId: string) {
        return this.muteMember(memberId, 0, 0)
    }

    kick(memberId: string, clean: -1 | 0 | 3 | 7 | 15 | 30 = 0, blacklist?: boolean) {
        return this.bot.memberService.kickMember(this.id, memberId, clean, blacklist)
    }

    addMemberRole(channelId: string, memberId: string, roleId: string) {
        return this.bot.memberService.addMemberRole(this.id, channelId, memberId, roleId)
    }

    removeMemberRole(channelId: string, memberId: string, roleId: string) {
        return this.bot.memberService.removeMemberRole(this.id, channelId, memberId, roleId)
    }

    members(force = false) {
        return this.bot.memberService.getGuildMemberList(this.id, force)
    }

    refreshMembers() {
        return this.members(true)
    }

    clearMemberCache() {
        return this.bot.memberService.clearMemberCache(this.id)
    }

    member(memberId: string) {
        return this.bot.memberService.getGuildMemberInfo(this.id, memberId)
    }
}

export namespace Guild {
    export interface Info {
        id: string
        name: string
        icon: string
        owner_id: string
        owner: boolean
        join_time: number
        member_count: number
        max_members: number
        description: string
    }

    export type ApiInfo = Omit<Info, 'id' | 'name'> & {
        guild_id: string
        guild_name: string
    }

    export interface Role {
        id: string
        name: string
        color: string
        hoist: boolean
        number: number
        member_limit: number
    }
}
