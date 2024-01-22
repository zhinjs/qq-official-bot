---
layout: doc
---

# 配置项

| 属性名      | 类型                  | 描述                                    | 默认值   |
|----------|---------------------|---------------------------------------|-------|
| appid    | string              | qq机器人的appid 必填                        | -     |
| secret   | string              | qq机器人的secret 必填                       | -     |
| sandbox  | boolean             | 是否使用沙箱环境                              | false |
| intents  | [Intent](#intent)[] | 监听哪些官方事件 必填   | -     |
| logLevel | string              | 输出日志等级                                | info  |
| removeAt | boolean             | 是否移除频道/群聊消息@机器人的消息段                   | false |
| maxRetry | number              | 机器人与qq官方的通信端口时的最大重连次数                 | 10    |
| timeout  | number              | 机器人与请求官方接口的超时时间，单位毫秒                  | 5000  |

# intent

| 值                             | 描述        |
|-------------------------------|-----------|
| GUILDS                        | 频道操作事件    |
| GUILD_MEMBERS                 | 频道成员变更事件  |
| GUILD_MESSAGES                | 私域频道消息事件  |
| GUILD_MESSAGE_REACTIONS       | 频道消息表态事件  |
| DIRECT_MESSAGE                | 频道私信事件    |
| AUDIO_OR_LIVE_CHANNEL_MEMBERS | 音频或直播频道成员 |
| C2C_MESSAGE_CREATE            | 私聊消息事件    |
| GROUP_AT_MESSAGE_CREATE       | 群聊@消息事件   |
| INTERACTION                   | 互动事件      |
| MESSAGE_AUDIT                 | 消息审核事件    |
| FORUMS_EVENTS                 | 论坛事件(仅私域) |
| AUDIO_ACTIONS                 | 音频操作事件    |


