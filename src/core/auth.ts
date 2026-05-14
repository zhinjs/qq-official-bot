/**
 * 认证管理器 - 负责处理QQ Bot的认证相关功能
 * 从SessionManager中提取认证相关功能
 */

import {AxiosInstance, AxiosResponse} from "axios";
import { Client } from "@/client";
import {GatewayInfo} from "@/types";

export interface AuthConfig {
  appid: string;
  secret: string;
  tokenRefreshBuffer?: number; // 提前刷新token的时间缓冲（秒）
  maxRetries?: number;
  retryDelay?: number;
}

export interface TokenInfo {
  access_token: string;
  expires_in: number;
  token_type?: string;
  expires_at?: number; // 计算出的过期时间戳
}

/**
 * 认证管理器
 * 专门负责处理token获取、刷新和网关信息获取
 */
export class Auth {
  private config: AuthConfig;
  private currentToken?: TokenInfo;
  private refreshTimer?: NodeJS.Timeout;
  private gatewayInfo?: GatewayInfo;

  constructor(config: AuthConfig,public bot: Client) {
    this.config = {
      tokenRefreshBuffer: 60, // 提前60秒刷新
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * 获取访问令牌
   * 如果当前token有效则返回，否则重新获取
   */
  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.currentToken!.access_token;
    }

    const tokenInfo = await this.fetchNewToken();
    this.setToken(tokenInfo);
    return tokenInfo.access_token;
  }

  /**
   * 强制刷新访问令牌
   */
  async refreshAccessToken(): Promise<TokenInfo> {
    this.bot.logger.debug("[AUTH] 强制刷新访问令牌");
    const tokenInfo = await this.fetchNewToken();
    this.setToken(tokenInfo);
    return tokenInfo;
  }

  /**
   * 获取网关连接地址
   */
  async getGatewayUrl(): Promise<string> {
    if (this.gatewayInfo?.url) {
      return this.gatewayInfo.url;
    }

    const gatewayInfo = await this.fetchGatewayInfo();
    this.gatewayInfo = gatewayInfo;
    return gatewayInfo.url;
  }

  /**
   * 获取完整的网关信息
   */
  async getGatewayInfo(): Promise<GatewayInfo> {
    if (!this.gatewayInfo) {
      this.gatewayInfo = await this.fetchGatewayInfo();
    }
    return this.gatewayInfo;
  }

  /**
   * 从API获取新的访问令牌
   */
  private async fetchNewToken(): Promise<TokenInfo> {
    const { appid, secret } = this.config;

    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        this.bot.logger.debug(`[AUTH] 获取访问令牌，尝试次数: ${attempt}`);

        const response: AxiosResponse<Client.Token> = await this.bot.request.post(
          "https://bots.qq.com/app/getAppAccessToken",
          {
            appId: appid,
            clientSecret: secret
          },
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'QQBot/1.0'
            }
          }
        );

        if (response.status === 200 && response.data?.access_token) {
          const tokenInfo: TokenInfo = {
            access_token: response.data.access_token,
            expires_in: response.data.expires_in,
            expires_at: Date.now() + (response.data.expires_in * 1000)
          };

          this.bot.logger.debug("[AUTH] 访问令牌获取成功", {
            expires_in: tokenInfo.expires_in,
            expires_at: new Date(tokenInfo.expires_at).toISOString()
          });

          return tokenInfo;
        } else {
          throw new Error(`无效的响应: ${response.status} ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        this.bot.logger.error(`[AUTH] 获取访问令牌失败 (尝试 ${attempt}/${this.config.maxRetries}):`, error);

        if (attempt === this.config.maxRetries) {
          throw new Error(`获取访问令牌失败，已重试 ${this.config.maxRetries} 次: ${error}`);
        }

        // 等待后重试
        await this.delay(this.config.retryDelay! * attempt);
      }
    }

    throw new Error("获取访问令牌失败");
  }

  /**
   * 从API获取网关信息
   */
  private async fetchGatewayInfo(): Promise<GatewayInfo> {
    const token = await this.getAccessToken();

    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        this.bot.logger.debug(`[AUTH] 获取网关信息，尝试次数: ${attempt}`);

        const response = await this.bot.request.get("/gateway/bot", {
          headers: {
            Accept: "*/*",
            "Accept-Encoding": "utf-8",
            "Accept-Language": "zh-CN,zh;q=0.8",
            Connection: "keep-alive",
            "User-Agent": "v1",
            Authorization: `QQBot ${token}`
          },
          timeout: 10000
        });

        if (response.data?.url) {
          const gatewayInfo: GatewayInfo = {
            url: response.data.url,
            shards: response.data.shards,
            session_start_limit: response.data.session_start_limit
          };

          this.bot.logger.debug("[AUTH] 网关信息获取成功", gatewayInfo);
          return gatewayInfo;
        } else {
          throw new Error(`无效的网关响应: ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        this.bot.logger.error(`[AUTH] 获取网关信息失败 (尝试 ${attempt}/${this.config.maxRetries}):`, error);

        if (attempt === this.config.maxRetries) {
          throw new Error(`获取网关信息失败，已重试 ${this.config.maxRetries} 次: ${error}`);
        }

        await this.delay(this.config.retryDelay! * attempt);
      }
    }

    throw new Error("获取网关信息失败");
  }

  /**
   * 设置令牌并启动自动刷新
   */
  private setToken(tokenInfo: TokenInfo): void {
    this.currentToken = tokenInfo;
    this.scheduleTokenRefresh();

    this.bot.logger.info("[AUTH] 访问令牌已设置", {
      expires_in: tokenInfo.expires_in,
      expires_at: tokenInfo.expires_at ? new Date(tokenInfo.expires_at).toISOString() : 'unknown'
    });
  }

  /**
   * 计划令牌刷新
   */
  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.currentToken) {
      return;
    }

    // 计算刷新时间（提前缓冲时间刷新）
    const refreshTime = (this.currentToken.expires_in - this.config.tokenRefreshBuffer!) * 1000;

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          this.bot.logger.debug("[AUTH] 自动刷新访问令牌");
          await this.refreshAccessToken();
        } catch (error) {
          this.bot.logger.error("[AUTH] 自动刷新令牌失败:", error);
          // 如果自动刷新失败，可以设置一个较短的重试时间
          setTimeout(() => this.scheduleTokenRefresh(), 10000);
        }
      }, refreshTime);

      this.bot.logger.debug(`[AUTH] 令牌刷新已计划，将在 ${refreshTime / 1000} 秒后执行`);
    }
  }

  /**
   * 检查当前令牌是否有效
   */
  private isTokenValid(): boolean {
    if (!this.currentToken || !this.currentToken.expires_at) {
      return false;
    }

    // 检查是否在缓冲时间内即将过期
    const bufferTime = this.config.tokenRefreshBuffer! * 1000;
    return Date.now() < (this.currentToken.expires_at - bufferTime);
  }

  /**
   * 获取当前令牌信息
   */
  getCurrentTokenInfo(): TokenInfo | null {
    return this.currentToken ? { ...this.currentToken } : null;
  }

  /**
   * 检查认证状态
   */
  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  /**
   * 清除认证信息
   */
  clearAuth(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    this.currentToken = undefined;
    this.gatewayInfo = undefined;

    this.bot.logger.debug("[AUTH] 认证信息已清除");
  }

  /**
   * 工具方法：延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 销毁认证管理器
   */
  destroy(): void {
    this.clearAuth();
    this.bot.logger.debug("[AUTH] 认证管理器已销毁");
  }
}
