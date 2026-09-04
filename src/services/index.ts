/**
 * 服务模块导出
 * 集中导出所有API服务类
 */

export * from './guild'
export { ChannelService } from './channel'
export { MessageService } from './message'
export type { SendTarget, SendOptions, SendResult } from './message'
export * from './member'
export { PermissionService } from './permission'
export { ReactionService } from './reaction'
export { ScheduleService } from './schedule'
export { ThreadService } from './thread'
export { AudioService } from './audio'
export { BotService } from './bot'
export * from './group'
export * from './menu-panel'

// 定义通用API响应类型
export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}
