import axios, { type AxiosAdapter, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

export type FakeCall = {
    method: string
    url: string
    data?: unknown
    params?: unknown
}

function parseRequestData(data: unknown): unknown {
    if (typeof data !== 'string') return data
    try {
        return JSON.parse(data)
    } catch {
        return data
    }
}

export function createFakeRequest(
    handler: (call: FakeCall) => { status?: number; data?: unknown } | Promise<{ status?: number; data?: unknown }> = () => ({ data: {} })
): { request: AxiosInstance; calls: FakeCall[] } {
    const calls: FakeCall[] = []
    const adapter: AxiosAdapter = async (config) => {
        const call: FakeCall = {
            method: (config.method || 'get').toLowerCase(),
            url: String(config.url || '').split('?')[0],
            data: parseRequestData(config.data),
            params: config.params,
        }
        calls.push(call)
        const result = await handler(call)
        const response: AxiosResponse = {
            data: result.data ?? {},
            status: result.status ?? 200,
            statusText: 'OK',
            headers: {},
            config: config as InternalAxiosRequestConfig,
        }
        return response
    }
    return { request: axios.create({ adapter }), calls }
}
