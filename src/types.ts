import {ChannelSubType, ChannelType, PrivateType, SpeakPermission} from "./constans";
import {Channel} from "@/entries/channel";
import {Guild} from "@/entries/guild";

export type Dict<T = any, K extends string | symbol = string> = Record<K, T>
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "mark" | "off";

// websocket建立成功回包
export interface wsResData {
    op: number; // opcode ws的类型
    d?: {
        // 事件内容
        heartbeat_interval?: number; // 心跳时间间隔
        session_id?: string;
        user?: {
            id?: string;
            username?: string
            bot?: boolean
            status?: number
        }
    };
    s: number; // 心跳的唯一标识
    t: string; // 事件类型
    id?: string; // 事件ID
}

export enum AnnounceType {
    Member,
    WelCome
}

export type Announce = {
    guild_id: string
    channel_id: string
    message_id: string
    announces_type: AnnounceType
    recommend_channels: { channel_id: string, introduce: string }[]
}
export type ChannelPermissions = {
    channel_id: string
    permissions: string
}
export type ChannelMemberPermissions = {
    user_id: string
} & ChannelPermissions
export type ChannelRolePermissions = {
    role_id: string
} & ChannelPermissions
export type UpdatePermissionParams = {
    add?: string
    remove?: string
}
export type FaceType=1|2
export type ChannelUpdateInfo = Partial<Pick<Channel.Info, 'name' | 'position' | 'parent_id' | 'private_type' | 'speak_permission'>>
export type RoleCreateParam = {
    name?: string
    color: number
    hoist: 0 | 1
}
export type RoleUpdateParam = Partial<Pick<Guild.Role, 'id' | 'name' | 'color' | 'hoist'>>

export type PinsMessage = {
    guild_id: string
    channel_id: string
    message_ids: string[]
}

export interface DMS {
    guild_id: string
    channel_id: string
    create_time: number
}

export type ApiPermissionDemand = {
    guild_id: string
    channel_id: string
    api_identify: ApiBaseInfo
    title: string
    desc: string
}

export type ApiBaseInfo = {
    path: string
    method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT"
}
export type RecommendInfo = {
    channel_id: string
    introduce: string
}

