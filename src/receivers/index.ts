import { BaseReceiver, ReceiverMode } from "./base";
import { WebSocketReceiver, WebSocketReceiverConfig } from "./websocket";
import { WebhookReceiver, WebhookReceiverConfig } from "./webhook";
import { MiddlewareReceiver, MiddlewareReceiverConfig, ApplicationPlatform } from "./middleware";
export {ApplicationPlatform,Middleware} from './middleware'
export {ReceiverMode} from './base'
export type ResolveReceiver<T extends ReceiverMode, M extends ApplicationPlatform = never> =
    T extends ReceiverMode.WEBSOCKET ? WebSocketReceiver :
        T extends ReceiverMode.MIDDLEWARE ? MiddlewareReceiver<M> :
            WebhookReceiver;
export type ResolveConfig<T extends ReceiverMode,M extends ApplicationPlatform=never>=
    T extends ReceiverMode.WEBSOCKET ? ReceiveModeConfig<M>['websocket'] :
        T extends ReceiverMode.MIDDLEWARE ? ReceiveModeConfig<M>['middleware'] :
            ReceiveModeConfig<M>['webhook']
export interface ReceiveModeConfig<M extends ApplicationPlatform> {
    websocket: {
        heartbeatInterval?: number;
        maxRetries?: number;
        reconnectDelay?: number;
        socketFactory?: (url: string) => import("ws").WebSocket;
        agent?: import("node:http").Agent;
        autoReconnect?: boolean;
        /** 获取 access token 的完整 URL */
        accessTokenUrl?: string;
        /** 获取网关信息的 URL 或路径，响应 url 为 WebSocket 地址 */
        gatewayUrl?: string;
    };
    middleware: {
        application: M;
    };
    webhook: {
        port: number;
        path: string;
    };
}
/**
 * 接收器工厂类
 * 统一管理不同类型接收器的创建和配置
 */
export class ReceiverFactory {
    /**
     * 注册的接收器实例
     */
    private static receivers: Map<string, BaseReceiver> = new Map();

    /**
     * 创建WebSocket接收器
     */
    public static createWebSocketReceiver(appid:string,config?: WebSocketReceiverConfig): WebSocketReceiver {
        const receiver = new WebSocketReceiver(config);
        this.registerReceiver(appid,ReceiverMode.WEBSOCKET, receiver);
        return receiver;
    }

    /**
     * 创建Webhook接收器
     */
    public static createWebhookReceiver(appid:string,config: WebhookReceiverConfig): WebhookReceiver {
        const receiver = new WebhookReceiver(config);
        this.registerReceiver(appid,ReceiverMode.WEBHOOK, receiver);
        return receiver;
    }

    /**
     * 创建Middleware接收器
     */
    public static createMiddlewareReceiver<T extends ApplicationPlatform>(
        appid:string,
        config: MiddlewareReceiverConfig
    ): MiddlewareReceiver<T> {
        const receiver = new MiddlewareReceiver<T>(config);
        this.registerReceiver(appid,ReceiverMode.MIDDLEWARE, receiver);
        return receiver;
    }

    /**
     * 根据模式和配置创建接收器
     */
    public static createReceiver<T extends ReceiverMode=ReceiverMode,M extends ApplicationPlatform=ApplicationPlatform>(
        appid:string,
        mode: T,
        config: ResolveConfig<T,M>
    ): ResolveReceiver<T,M> {
        switch (mode) {
            case ReceiverMode.WEBSOCKET:
                return this.createWebSocketReceiver(appid,config as WebSocketReceiverConfig) as ResolveReceiver<T,M>;

            case ReceiverMode.WEBHOOK:
                return this.createWebhookReceiver(appid,config as WebhookReceiverConfig) as ResolveReceiver<T,M>;

            case ReceiverMode.MIDDLEWARE:
                return this.createMiddlewareReceiver(appid,config as MiddlewareReceiverConfig) as ResolveReceiver<T,M>;

            default:
                throw new Error(`Unknown receiver mode: ${mode}`);
        }
    }

    /**
     * 注册接收器实例
     */
    public static registerReceiver(appid:string,mode: ReceiverMode, receiver: BaseReceiver): void {
        const key=`${appid}:${mode}`
        if (this.receivers.has(key)) {
            throw new Error(`Receiver mode ${mode} for ${appid} already exists`);
        }
        this.receivers.set(mode, receiver);
    }

    /**
     * 获取注册的接收器实例
     */
    public static getReceiver(appid:string,mode: string): BaseReceiver | undefined {
        const key=`${appid}:${mode}`
        return this.receivers.get(key);
    }

    /**
     * 移除接收器实例
     */
    public static removeReceiver(appid:string,mode: string): boolean {
        const key=`${appid}:${mode}`
        return this.receivers.delete(key);
    }

    /**
     * 获取所有注册的接收器
     */
    public static getAllReceivers(): Map<string, BaseReceiver> {
        return new Map(this.receivers);
    }

    /**
     * 清空所有接收器
     */
    public static clearAll(): void {
        this.receivers.clear();
    }

    /**
     * 获取接收器健康状态
     */
    public static getHealthStatus(): Record<string, any> {
        const status: Record<string, any> = {};

        for (const [mode, receiver] of this.receivers) {
            status[mode] = receiver.healthCheck();
        }

        return status;
    }
}

/**
 * 接收器配置构建器
 */
export class ReceiverConfigBuilder {
    /**
     * 构建WebSocket接收器配置
     */
    public static websocket(options: {
        heartbeatInterval?: number;
        maxRetries?: number;
        reconnectDelay?: number;
        socketFactory?: (url: string) => import("ws").WebSocket;
        agent?: import("node:http").Agent;
        autoReconnect?: boolean;
        accessTokenUrl?: string;
        gatewayUrl?: string;
    } = {}): WebSocketReceiverConfig {
        return new WebSocketReceiverConfig(options);
    }

    /**
     * 构建Webhook接收器配置
     */
    public static webhook(options: {
        port: number;
        path: string;
        timeout?: number;
    }): WebhookReceiverConfig {
        return new WebhookReceiverConfig(options);
    }

    /**
     * 构建Middleware接收器配置
     */
    public static middleware(options: {
        platform: ApplicationPlatform;
        timeout?: number;
    }): MiddlewareReceiverConfig {
        return new MiddlewareReceiverConfig(options);
    }
}

// 向后兼容的工厂函数导出
export { createWebsocketReceiver } from "./websocket";
export { createWebhookReceiver } from "./webhook";
export { createMiddlewareReceiver } from "./middleware";
