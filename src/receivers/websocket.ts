import { WebSocket } from "ws";
import type { Agent } from "node:http";
import { BaseReceiver, BaseReceiverConfig, ReceiverMode } from "./base";
import { Session } from "@/core/session";
import { toObject } from "@/utils/object";
import { DataPacket } from "@/types";
import { OpCode, SessionEvents, WebsocketCloseReason } from "@/constants";

/**
 * WebSocket接收器配置
 */
export class WebSocketReceiverConfig extends BaseReceiverConfig {
    public readonly heartbeatInterval: number;
    public readonly maxRetries: number;
    public readonly reconnectDelay: number;
    public readonly socketFactory?: (url: string) => WebSocket;
    public readonly agent?: Agent;
    public readonly autoReconnect: boolean;

    constructor(options: {
        heartbeatInterval?: number;
        maxRetries?: number;
        reconnectDelay?: number;
        socketFactory?: (url: string) => WebSocket;
        agent?: Agent;
        autoReconnect?: boolean;
    } = {}) {
        super(ReceiverMode.WEBSOCKET);
        this.heartbeatInterval = options.heartbeatInterval ?? 45000;
        this.maxRetries = options.maxRetries ?? 10;
        this.reconnectDelay = options.reconnectDelay ?? 1000;
        this.socketFactory = options.socketFactory;
        this.agent = options.agent;
        this.autoReconnect = options.autoReconnect ?? true;
    }

    public validate(): boolean {
        return this.heartbeatInterval > 0 && this.maxRetries >= 0 && this.reconnectDelay >= 0;
    }

    public toJson(): Record<string, any> {
        return {
            mode: this.mode,
            heartbeatInterval: this.heartbeatInterval,
            maxRetries: this.maxRetries,
            reconnectDelay: this.reconnectDelay
        };
    }
}

/**
 * WebSocket接收器处理器
 */
interface WebSocketHandler {
    ws?: WebSocket;
}

/**
 * WebSocket接收器实现
 */
export class WebSocketReceiver extends BaseReceiver<WebSocketHandler> {
    private connectionEpoch = 0;
    private config: WebSocketReceiverConfig;
    private session: Session<ReceiverMode.WEBSOCKET> | null = null;

    // 连接状态管理
    private heartbeatInterval: number = 45000;
    private isReconnect: boolean = false;
    private retryCount: number = 0;
    private isClosed: boolean = true;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private heartbeatTimeoutTimer: NodeJS.Timeout | null = null;
    private lastHeartbeatAck: number = 0;

    constructor(config: WebSocketReceiverConfig = new WebSocketReceiverConfig()) {
        super({});
        this.config = config;
        this.setupWebSocketEventHandlers();
    }

    /**
     * 设置WebSocket特定的事件处理器
     */
    private setupWebSocketEventHandlers(): void {
        this.on('start', this.handleStart.bind(this));
        this.on('stop', this.handleStop.bind(this));
        this.on('restart', this.handleRestart.bind(this));
    }

    /**
     * 启动WebSocket连接
     */
    public async start(session: Session<ReceiverMode.WEBSOCKET>): Promise<void> {
        this.connectionEpoch += 1;
        this.session = session;
        this._isStarted = true;
        await this.connect();
    }

    /**
     * 停止WebSocket连接
     */
    public async stop(session?: Session<ReceiverMode.WEBSOCKET>): Promise<void> {
        this._isStarted = false;
        this.disconnect();
    }

    /**
     * 处理启动事件
     */
    private async handleStart(session: Session<ReceiverMode.WEBSOCKET>): Promise<void> {
        await this.start(session);
    }

    /**
     * 处理停止事件
     */
    private async handleStop(): Promise<void> {
        await this.stop();
    }

    /**
     * 处理重启事件
     */
    private async handleRestart(session: Session<ReceiverMode.WEBSOCKET>): Promise<void> {
        await this.restart(session);
    }

    /**
     * 建立WebSocket连接
     */
    private async connect(): Promise<void> {
        if (!this.session) {
            throw new Error('Session manager not initialized');
        }

        const epoch = this.connectionEpoch;
        try {
            const url = await this.session.getWsUrl();
            if (this.session.userClose || !this._isStarted || epoch !== this.connectionEpoch) return;
            const ws = this.handler.ws = this.config.socketFactory
                ? this.config.socketFactory(url)
                : new WebSocket(url, { agent: this.config.agent });

            this.setupWebSocketConnection(ws);

        } catch (error) {
            this.session.getBot().logger.error(`[WebSocketReceiver] 连接失败: ${error.message}`);
            this.emitError(error as Error);
            throw error;
        }
    }

    /**
     * 设置WebSocket连接的事件处理
     */
    private setupWebSocketConnection(ws: WebSocket): void {
        if (!this.session) return;

        ws.on('open', () => {
            this.session!.getBot().logger.debug('[WebSocketReceiver] WebSocket连接已建立');
        });

        ws.on('message', async (data) => {
            await this.handleMessage(data);
        });

        ws.on('error', (error) => {
            this.handleWebSocketError(error);
        });

        ws.on('close', (code, reason) => {
            this.handleWebSocketClose(code, reason);
        });
    }

    /**
     * 处理WebSocket消息
     */
    private async handleMessage(data: any): Promise<void> {
        if (!this.session) return;

        try {
            this.session.getBot().logger.debug(`[WebSocketReceiver] 收到消息: ${data}`);
            const packet = toObject<DataPacket>(data);

            switch (packet.op) {
                case OpCode.HELLO:
                    await this.handleHello(packet);
                    break;
                case OpCode.DISPATCH:
                    this.handleDispatch(packet);
                    break;
                case OpCode.HEARTBEAT_ACK:
                    this.handleHeartbeatAck(packet);
                    break;
                case OpCode.RECONNECT:
                    this.handleReconnectRequest();
                    break;
                case OpCode.INVALID_SESSION:
                    this.handleInvalidSession();
                    break;
                default:
                    this.session.getBot().logger.debug(`[WebSocketReceiver] 未处理的操作码: ${packet.op}`);
            }
        } catch (error) {
            this.session.getBot().logger.error(`[WebSocketReceiver] 处理消息失败: ${error.message}`);
            this.emitError(error as Error);
        }
    }

    /**
     * 处理HELLO消息
     */
    private async handleHello(packet: DataPacket): Promise<void> {
        if (!this.session) return;

        this.session.getBot().logger.debug('[WebSocketReceiver] 收到HELLO消息，连接到网关成功');
        this.heartbeatInterval = packet.d.heartbeat_interval || this.config.heartbeatInterval;
        this.session.getBot().logger.debug(`[WebSocketReceiver] 心跳间隔设置为: ${this.heartbeatInterval}ms`);

        if (this.isReconnect) {
            await this.resumeConnection();
        } else {
            await this.authenticate();
        }
    }

    /**
     * 处理DISPATCH事件
     */
    private handleDispatch(packet: DataPacket): void {
        if (!this.session) return;

        this.dispatchEvent(packet.t, packet);
    }

    /**
     * 处理心跳ACK
     */
    private handleHeartbeatAck(packet: DataPacket): void {
        if (!this.session) return;

        if (this.heartbeatTimeoutTimer) {
            clearTimeout(this.heartbeatTimeoutTimer);
        }
        this.lastHeartbeatAck = Date.now();
        this.session.getBot().logger.debug(`[WebSocketReceiver] 收到心跳ACK`);
    }

    /**
     * 处理重连请求
     */
    private handleReconnectRequest(): void {
        if (!this.session) return;

        this.session.getBot().logger.info(`[WebSocketReceiver] 服务端要求重连`);
        this.handler.ws?.close(4009);
    }

    /**
     * 处理无效会话
     */
    private handleInvalidSession(): void {
        if (!this.session) return;

        this.session.getBot().logger.error(`[WebSocketReceiver] 连接失败，无效的会话`);
        this.session.updateSessionRecord({ sessionID: "", seq: 0 });
        this.isReconnect = false;
        this.handler.ws?.close(4000, "Invalid Session");
    }

    /**
     * 事件分发
     */
    private dispatchEvent(event: string, packet: DataPacket): void {
        if (!this.session) return;

        switch (event) {
            case SessionEvents.READY:
                this.handleReadyEvent(packet);
                break;
            case SessionEvents.RESUMED:
                this.handleResumedEvent();
                break;
            default:
                // 更新心跳序列号
                if (packet.s) {
                    this.session.updateSessionRecord({ seq: packet.s });
                }
                this.emitPacket(packet);
        }
    }

    /**
     * 处理READY事件
     */
    private handleReadyEvent(packet: DataPacket): void {
        if (!this.session) return;

        const { user = {}, session_id } = packet.d;
        this.session.getBot().self_id = user.id;
        this.session.getBot().nickname = user.username;
        this.session.getBot().status = user.status || 0;

        this.session.updateSessionRecord({ sessionID: session_id });

        this.isClosed = false;
        this.retryCount = 0;
        this.startHeartbeat();
        this.emitReady();
        this.session.getBot().logger.info(`[WebSocketReceiver] 欢迎 ${user.username}`);
    }

    /**
     * 处理RESUMED事件
     */
    private handleResumedEvent(): void {
        if (!this.session) return;

        this.retryCount = 0;
        this.isReconnect = false;
        this.isClosed = false;
        this.startHeartbeat();
        this.session.getBot().logger.info(`[WebSocketReceiver] 重连成功`);
    }

    /**
     * 恢复连接
     */
    private async resumeConnection(): Promise<void> {
        if (!this.session) return;

        this.session.getBot().logger.debug('[WebSocketReceiver] 正在恢复连接...');

        await this.sendMessage({
            op: OpCode.RESUME,
            d: {
                token: `QQBot ${this.session.access_token}`,
                session_id: this.session.sessionRecord.sessionID,
                seq: this.session.sessionRecord.seq || 1
            }
        });
    }

    /**
     * 认证
     */
    private async authenticate(): Promise<void> {
        if (!this.session) return;

        this.session.getBot().logger.debug('[WebSocketReceiver] 正在鉴权...');

        await this.sendMessage({
            op: OpCode.IDENTIFY,
            d: {
                token: `QQBot ${this.session.access_token}`,
                intents: this.session.getValidIntends(),
                shard: [0, 1]
            }
        });
    }

    /**
     * 开始心跳
     */
    private startHeartbeat(): void {
        this.sendHeartbeat();
    }

    /**
     * 发送心跳
     */
    private sendHeartbeat(): void {
        if (!this.session || this.isClosed) return;

        if (this.heartbeatTimer) {
            clearTimeout(this.heartbeatTimer);
        }
        if (this.heartbeatTimeoutTimer) {
            clearTimeout(this.heartbeatTimeoutTimer);
        }

        this.session.getBot().logger.debug(`[WebSocketReceiver] 发送心跳`);

        this.sendMessage({
            op: OpCode.HEARTBEAT,
            d: this.session.sessionRecord?.seq || null
        });

        // 设置心跳超时检测
        this.heartbeatTimeoutTimer = setTimeout(() => {
            if (this.session) {
                this.session.getBot().logger.error('[WebSocketReceiver] 心跳超时，连接可能已断开');
                this.handler.ws?.close(4000, 'Heartbeat timeout');
            }
        }, 5000);

        if (!this.isClosed) {
            this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), this.heartbeatInterval);
        }
    }

    /**
     * 发送消息到WebSocket
     */
    private async sendMessage(data: Record<string, any> | string): Promise<void> {
        if (!this.handler.ws || this.handler.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket connection not available');
        }

        if (this.session) {
            this.session.getBot().logger.debug('[WebSocketReceiver] 发送消息', data);
        }

        const message = typeof data === "object" ? JSON.stringify(data) : data;
        this.handler.ws.send(message);
    }

    /**
     * 处理WebSocket错误
     */
    private handleWebSocketError(error: Error): void {
        if (!this.session) return;

        this.session.getBot().logger.error("[WebSocketReceiver] WebSocket连接错误", {
            error: error.message,
            stack: error.stack,
            retryCount: this.retryCount
        });

        this.clearTimers();
        this.emitError(error);

        // 根据错误类型决定是否重连
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
            this.session.getBot().logger.error('[WebSocketReceiver] 网络连接错误，可能是网络问题或服务器不可达');
        }

        this.handler.ws?.close(4000, error.message);
    }

    /**
     * 处理WebSocket关闭
     */
    private handleWebSocketClose(code: number, reason: Buffer): void {
        if (!this.session) return;

        this.isClosed = true;
        this.clearTimers();
        let hasInternalReconnect = false;

        if (this.session.userClose) {
            this.session.getBot().logger.info('[WebSocketReceiver] 用户主动关闭连接');
            this.emitClose(code, reason.toString());
            return;
        }

        // 处理机器人下架或封禁的情况
        if ([4914, 4915].includes(code)) {
            this.session.getBot().logger.error(`[WebSocketReceiver] 机器人状态异常，代码: ${code}`);
            this.emitClose(code, reason.toString());
            return;
        }

        if (!this.config.autoReconnect) {
            this.emitClose(code, reason.toString());
            return;
        }
        const reasonInfo = WebsocketCloseReason.find((v) => v.code === code);
        if (reasonInfo) {
            this.session.getBot().logger.info(`[WebSocketReceiver] 连接关闭：${reasonInfo.reason}`);
            if (reasonInfo.resume) {
                hasInternalReconnect = true;
                this.reconnect();
            }
        } else {
            this.session.getBot().logger.warn(`[WebSocketReceiver] 连接关闭，未知错误代码: ${code}, 原因: ${reason.toString() || 'unknown'}`);
            if (this.retryCount < this.config.maxRetries) {
                hasInternalReconnect = true;
                this.reconnect(false);
            } else {
                this.session.getBot().logger.error('[WebSocketReceiver] 重连次数过多，停止重连');
            }
        }

        if (!hasInternalReconnect) {
            this.emitClose(code, reason.toString());
        }
    }

    /**
     * 重连逻辑
     */
    private async reconnect(resume: boolean = true): Promise<void> {
        const epoch = this.connectionEpoch;
        if (!this.session || this.session.userClose || !this._isStarted) return;

        this.retryCount++;
        this.session.getBot().logger.error(`[WebSocketReceiver] 连接断开，第${this.retryCount}次重连...`);

        // 指数退避策略
        const reconnectDelay = this.config.reconnectDelay || 5000;
        const delay = Math.min(reconnectDelay * Math.pow(2, this.retryCount - 1), 30000);
        this.session.getBot().logger.debug(`[WebSocketReceiver] 等待 ${delay}ms 后重连`);

        await new Promise(resolve => setTimeout(resolve, delay));
        if (this.session.userClose || !this._isStarted || epoch !== this.connectionEpoch) return;

        this.isReconnect = resume;
        try {
            await this.connect();
        } catch (error) {
            this.session.getBot().logger.error(`[WebSocketReceiver] 重连失败: ${error.message}`);
            if (this.retryCount < this.config.maxRetries) {
                await this.reconnect(resume);
            } else {
                this.session.getBot().logger.error('[WebSocketReceiver] 重连次数达到上限，停止重连');
                this.session.emit('max_retry_reached');
            }
        }
    }

    /**
     * 断开连接
     */
    private disconnect(): void {
        this.connectionEpoch += 1;
        this.isClosed = true;
        this.clearTimers();
        this.handler.ws?.close();
    }

    /**
     * 清理定时器
     */
    private clearTimers(): void {
        if (this.heartbeatTimer) {
            clearTimeout(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.heartbeatTimeoutTimer) {
            clearTimeout(this.heartbeatTimeoutTimer);
            this.heartbeatTimeoutTimer = null;
        }
    }

    /**
     * 处理数据包（基类抽象方法实现）
     */
    protected handlePacket(packet: DataPacket): void {
        // WebSocket接收器的数据包处理在handleMessage中进行
        // 这里不需要额外处理
    }

    /**
     * 获取接收器类型
     */
    public getType(): string {
        return ReceiverMode.WEBSOCKET;
    }

    /**
     * 获取接收器配置
     */
    public getConfig(): Record<string, any> {
        return this.config.toJson();
    }

    /**
     * 健康检查
     */
    public healthCheck(): { status: 'healthy' | 'unhealthy'; details: any } {
        const baseHealth = super.healthCheck();
        return {
            ...baseHealth,
            details: {
                ...baseHealth.details,
                wsReadyState: this.handler.ws?.readyState || 'N/A',
                retryCount: this.retryCount,
                lastHeartbeatAck: this.lastHeartbeatAck,
                heartbeatInterval: this.heartbeatInterval
            }
        };
    }
}

/**
 * 创建WebSocket接收器的工厂函数（向后兼容）
 */
export function createWebsocketReceiver(config?: WebSocketReceiverConfig): WebSocketReceiver {
    return new WebSocketReceiver(config);
}
