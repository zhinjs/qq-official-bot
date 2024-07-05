import {Channel} from "@/entries/channel";
import {Guild} from "@/entries/guild";
import {GuildMember} from "@/entries/guildMember";

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
export interface ScheduleInfo{
    id?:string
    name:string
    description?:string
    start_timestamp:string
    end_timestamp:string
    creator?:GuildMember.ApiInfo
    jump_channel_id:string
    remind_type:RemindType
}
export type RemindType=0|1|2|3|4|5|6
export type AudioStatus=0|1|2|3
export interface AudioControl{
    audio_url?:string
    text?:string
    status:AudioStatus
}
export interface AudioAction{
    guild_id:string
    channel_id:string
    audio_url:string
    text:string
}
export interface Thread{
    guild_id:string
    channel_id:string
    author_id:string
    thread_info:ThreadInfo
}
export interface ThreadInfo{
    thread_id:string
    title:string
    content:string
    date_time:number
}
export interface Post{
    guild_id:string
    channel_id:string
    author_id:string
    post_info:PostInfo
}
export interface PostInfo{
    thread_id:string
    post_id:string
    content:string
    date_time:number
}
export interface Reply{
    guild_id:string
    channel_id:string
    author_id:string
    reply_info:ReplyInfo
}
export interface ReplyInfo{
    thread_id:string
    post_id:string
    reply_id:string
    content:string
    date_time:number
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
export enum AuditType{
    Thread=1,
    Post,
    Reply
}
export type ReactionTarget={
    id:string
    type:ReactionTargetType
}
export type Emoji={
    id:string
    type:EmojiType
}
export enum EmojiType{
    System=1,
    Emoji
}
export enum ReactionTargetType{
    Message,
    Thread,
    Comment,
    Reply
}

