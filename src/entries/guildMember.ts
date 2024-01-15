import {User} from "./user";

export namespace GuildMember {
    export interface Info {
        user: User.Info
        nick: string
        roles: string[]
        join_time: number
    }

    export interface ApiInfo {
        member_id: string
        username: string
        avatar: string
        card: string
        bot?: boolean
        roles: string[]
        join_time: number
        union_openid?: string
        union_user_account?: string
    }
}
