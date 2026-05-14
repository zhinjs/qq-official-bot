import { EventEmitter } from "events";
import { Client } from "@/client";
import {ReceiverMode, ApplicationPlatform, ResolveConfig} from "@/receivers";
import { Intends, SessionEvents } from "@/constants";
import { DataPacket } from "@/types";

// 导入重构后的管理器
import { Connection } from "./connection";
import { Auth } from "@/core/auth";

import { ReceiverFactory,ResolveReceiver } from "@/receivers";

export const MAX_RETRY = 10;

/**
 * 重构后的会话管理器
 * 现在作为连接管理、认证管理和接收器管理的协调者
 */
export class Session<T extends ReceiverMode, M extends ApplicationPlatform = never> extends EventEmitter {
    // 保持向后兼容的公共属性
    public get access_token(): string {
        return this.authManager.getCurrentTokenInfo()?.access_token || "";
    }

    public get wsUrl(): string {
        return this._wsUrl || "";
    }

    public get retry(): number {
        return this.connectionManager.getConnectionState().retry;
    }

    public get alive(): boolean {
        return this.connectionManager.isAlive();
    }

    public get sessionRecord() {
        const state = this.connectionManager.getConnectionState();
        return {
            sessionID: state.sessionID,
            seq: state.seq
        };
    }

    public get heartbeatParam() {
        return this._heartbeatParam;
    }

    public readonly receiver: ResolveReceiver<T, M>;

    // 公共方法访问 bot 实例（用于 receiver）
    public getBot(): Client<T, M> {
        return this.bot;
    }

    // 私有属性
    private readonly bot: Client<T, M>;
    private readonly connectionManager: Connection;
    private readonly authManager: Auth;
    private _wsUrl: string = "";
    private _heartbeatParam = {
        op: 1, // OpCode.HEARTBEAT
        d: null
    };

    // 废弃属性
    public heartbeatInterval: number = 30000;
    public isReconnect: boolean = false;
    public userClose: boolean = false;

    constructor(bot: Client<T, M>) {
        super();
        this.bot = bot;
        // 初始化认证管理器
        this.authManager = new Auth({
            appid: bot.config.appid,
            secret: bot.config.secret,
            maxRetries: 3,
            tokenRefreshBuffer: 60
        },bot);

        // 初始化连接管理器
        this.connectionManager = new Connection(bot, {
            maxRetry: bot.config.maxRetry || MAX_RETRY,
            heartbeatInterval: 30000,
            reconnectDelay: 5000
        });

        // 创建接收器
        this.receiver = this.createReceiver();

        // 设置事件处理
        this.setupEventHandlers();
    }

    /**
     * 创建对应模式的接收器
     */
    private createReceiver(){
        return ReceiverFactory.createReceiver(this.bot.config.appid,this.bot.config.mode,this.bot.config as unknown as ResolveConfig<T, M>)
    }

    /**
     * 设置事件处理器
     */
    private setupEventHandlers(): void {
        // 接收器事件处理
        this.receiver.on("packet", (packet: DataPacket) => {
            this.bot.dispatchEvent(packet.t, packet);
        });

        // 连接管理器事件转发
        this.connectionManager.on(SessionEvents.EVENT_WS, (data) => {
            this.emit(SessionEvents.EVENT_WS, data);
        });

        this.connectionManager.on(SessionEvents.ERROR, (code, message) => {
            this.emit(SessionEvents.ERROR, code, message);
        });

        this.connectionManager.on(SessionEvents.DEAD, (data) => {
            this.emit(SessionEvents.DEAD, data);
        });

        // 连接事件处理
        this.connectionManager.on('connecting', () => {
            this.bot.logger.debug("[SESSION] 开始连接");
        });

        this.connectionManager.on('connect', async () => {
            try {
                // 获取网关地址
                this._wsUrl = await this.authManager.getGatewayUrl();

                // 启动接收器
                this.receiver.emit('start', this);
            } catch (error) {
                this.bot.logger.error("[SESSION] 连接准备失败:", error);
                this.connectionManager.emit(SessionEvents.ERROR, -1, `连接准备失败: ${error}`);
            }
        });

        this.connectionManager.on('disconnect', () => {
            this.receiver.emit('stop', this);
        });

        this.connectionManager.on('heartbeat', (heartbeatData) => {
            this._heartbeatParam = heartbeatData;
        });

        // 接收器事件处理
        this.receiver.on('ready', () => {
            this.connectionManager.emit(SessionEvents.EVENT_WS, {
                eventType: SessionEvents.READY
            });
        });

        this.receiver.on('error', (error) => {
            this.connectionManager.emit(SessionEvents.ERROR, -1, error.message || error);
        });

        this.receiver.on('close', (code, reason) => {
            this.connectionManager.emit(SessionEvents.EVENT_WS, {
                eventType: SessionEvents.DISCONNECT,
                code,
                eventMsg: this.sessionRecord
            });
        });
    }

    /**
     * 获取访问令牌
     */
    async getAccessToken(): Promise<Client.Token> {
        const tokenInfo = await this.authManager.refreshAccessToken();

        return {
            access_token: tokenInfo.access_token,
            expires_in: tokenInfo.expires_in,
        };
    }

    /**
     * 获取WebSocket连接地址
     */
    async getWsUrl(): Promise<string> {
        this._wsUrl = await this.authManager.getGatewayUrl();
        return this._wsUrl;
    }

    /**
     * 获取有效的意图值
     */
    getValidIntends(): number {
        return (this.bot.config.intents || []).reduce((result, item) => {
            const value = Intends[item as keyof typeof Intends];
            if (value === undefined) {
                this.bot.logger.warn(`无效的意图(${item})，已跳过...`);
                return result;
            }
            return value | result;
        }, 0);
    }

    async start() {
        return new Promise<void>(async (resolve) => {
            await this.getAccessToken()
            this.receiver.emit('start',this)
            this.receiver.on('ready',resolve)
        })
    }

    async stop() {
        this.userClose = true
        this.receiver.emit('stop',this)
    }

    /**
     * 更新会话记录（用于WebSocket接收器）
     */
    public updateSessionRecord(record: { sessionID?: string; seq?: number }): void {
        this.connectionManager.updateSessionRecord(record);
    }

}
