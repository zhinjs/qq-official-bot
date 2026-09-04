---
layout: doc
---

# 频道 API

频道相关的 API 操作，包括频道管理、成员管理、权限设置等功能。

## 🏢 频道管理

### 获取频道列表

获取机器人加入的频道列表。

**方法名**: `bot.guildService.getList(force?)` / `bot.getGuildList(force?)`

**返回类型**: `Promise<ApiResponse<Guild.ApiInfo[]>>`

```typescript
// 使用服务模块（推荐）
const result = await bot.guildService.getList()
if (result.success) {
    console.log('频道列表:', result.data)
}

// 使用传统方法（向后兼容）
const guilds = await bot.getGuildList()
const refreshed = await bot.getGuildList(true)
```

接口会按照 `after` 自动拉取全部分页。配置 `guildCache: true` 后，后续读取优先返回缓存；`force` 传 `true` 可强制刷新。缓存支持本地持久化，并由 `GUILD_CREATE / UPDATE / DELETE` 事件增量维护，完整配置参见[频道列表缓存](../config.md#频道列表缓存)。

**返回数据结构**:
```typescript
interface Guild.ApiInfo {
    guild_id: string        // 频道 ID
    guild_name: string      // 频道名称
    owner_id: string        // 频道主 ID
    joined_at: string       // 加入时间
    member_count: number    // 成员数量
    max_members: number     // 最大成员数
    description: string     // 频道描述
    icon: string           // 频道图标
}
```

### 获取频道信息

获取指定频道的详细信息。

**方法名**: `bot.guildService.getInfo(guildId)` / `bot.getGuildInfo(guildId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |

```typescript
// 使用服务模块
const result = await bot.guildService.getInfo(guild_id)
if (result.success) {
    console.log('频道信息:', result.data)
}

// 使用传统方法
const guildInfo = await bot.getGuildInfo(guild_id)
```

## 👥 成员管理

### 获取频道成员列表

获取频道的成员列表（仅私域机器人可用）。

**方法名**: `bot.memberService.getGuildMemberList(guildId, force?)` / `bot.getGuildMemberList(guildId, force?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `force` | `boolean` | ❌ | 是否忽略缓存并重新拉取，默认 `false` |

```typescript
// 使用服务模块
const result = await bot.memberService.getGuildMemberList(guild_id)
console.log('成员列表:', result)

// 使用传统方法
const members = await bot.getGuildMemberList(guild_id)
const refreshed = await bot.getGuildMemberList(guild_id, true)
```

接口会按照 `after` 自动拉取全部分页，每页最多 100 人。配置 `guildMemberCache: true` 后，后续读取优先返回缓存；也可以使用 `bot.guild(guild_id).refreshMembers()` 强制刷新，或使用 `clearMemberCache()` 清除缓存。持久化与事件同步配置参见[频道成员缓存](../config.md#频道成员缓存)。

**返回数据结构**:
```typescript
interface GuildMember.ApiInfo {
    member_id: string       // 成员 ID
    nickname: string        // 昵称
    avatar: string         // 头像
    joined_at: string      // 加入时间
    roles: string[]        // 角色列表
}
```

### 禁言频道成员

对指定成员进行禁言操作。

**方法名**: `bot.guild(guildId).muteMember(userId, seconds, endTime?)` / `bot.muteGuildMember(guildId, userId, seconds, endTime?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `userId` | `string` | ✅ | 用户 ID |
| `seconds` | `number` | ✅ | 禁言时长（秒），传 `0` 表示取消禁言 |
| `endTime` | `number` | ❌ | 禁言结束时间戳 |

```typescript
await bot.guild(guild_id).muteMember(user_id, 600)
await bot.guild(guild_id).unmuteMember(user_id)
```

### 移除频道成员

将指定成员移出频道。

**方法名**: `bot.guild(guildId).kick(userId, clean?, blacklist?)` / `bot.kickGuildMember(guildId, userId, clean?, blacklist?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `userId` | `string` | ✅ | 用户 ID |
| `addBlacklist` | `boolean` | ❌ | 是否同时加入黑名单 |
| `deleteHistoryMsgDays` | `number` | ❌ | 删除历史消息天数 |

```typescript
// 移除成员
await bot.memberService.kickGuildMember(guild_id, user_id)

// 移除成员并加入黑名单，删除7天内消息
await bot.memberService.kickGuildMember(guild_id, user_id, true, 7)
```

## 🔧 频道设置

### 频道禁言

对整个频道进行禁言设置。

**方法名**: `bot.guildService.mute(guildId, seconds, endTime?)` / `bot.muteGuild(guildId, seconds, endTime?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `seconds` | `number` | ✅ | 禁言时长（秒），传 0 表示取消禁言 |
| `endTime` | `number` | ❌ | 禁言结束时间戳 |

```typescript
// 频道禁言 1 小时
await bot.guildService.mute(guild_id, 3600)

// 取消频道禁言
await bot.guildService.unmute(guild_id)
```

## 👑 角色管理

### 获取频道角色列表

获取频道的角色列表。

**方法名**: `bot.guildService.getRoles(guildId)` / `bot.getGuildRoles(guildId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |

```typescript
const result = await bot.guildService.getRoles(guild_id)
if (result.success) {
    console.log('角色列表:', result.data)
}
```

### 创建频道角色

创建新的频道角色。

**方法名**: `bot.guildService.createRole(guildId, roleInfo)` / `bot.createGuildRole(guildId, roleInfo)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `roleInfo` | `RoleCreateParam` | ✅ | 角色信息 |

```typescript
interface RoleCreateParam {
    name: string            // 角色名称
    color?: number         // 角色颜色
    hoist?: boolean        // 是否在成员列表中单独展示
}

const result = await bot.guildService.createRole(guild_id, {
    name: '管理员',
    color: 0xFF0000,
    hoist: true
})
```

### 更新频道角色

更新指定角色的信息。

**方法名**: `bot.guildService.updateRole(guildId, roleId, updateInfo)` / `bot.updateGuildRole(guildId, roleId, updateInfo)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `roleId` | `string` | ✅ | 角色 ID |
| `updateInfo` | `RoleUpdateParam` | ✅ | 更新信息 |

```typescript
interface RoleUpdateParam {
    name?: string          // 角色名称
    color?: number         // 角色颜色
    hoist?: boolean        // 是否在成员列表中单独展示
}

await bot.guildService.updateRole(guild_id, role_id, {
    name: '超级管理员',
    color: 0x00FF00
})
```

### 删除频道角色

删除指定的频道角色。

**方法名**: `bot.guildService.deleteRole(guildId, roleId)` / `bot.deleteGuildRole(guildId, roleId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `roleId` | `string` | ✅ | 角色 ID |

```typescript
await bot.deleteGuildRole(guild_id, role_id)
```

## 🔑 API 权限管理

### 获取频道可访问 API 类别

获取频道可以访问的 API 权限列表。

**方法名**: `bot.guildService.getAccessApis(guildId)` / `bot.getGuildAccessApis(guildId)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |

```typescript
const result = await bot.guildService.getAccessApis(guild_id)
if (result.success) {
    console.log('可访问的 API:', result.data)
}
```

### 申请频道 API 权限

申请访问特定 API 的权限。

**方法名**: `bot.guildService.applyAccess(guildId, channelId, apiInfo, desc?)` / `bot.applyGuildAccess(guildId, channelId, apiInfo, desc?)`

**参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| `guildId` | `string` | ✅ | 频道 ID |
| `channelId` | `string` | ✅ | 子频道 ID |
| `apiInfo` | `ApiBaseInfo` | ✅ | API 信息 |
| `desc` | `string` | ❌ | 申请描述 |

```typescript
interface ApiBaseInfo {
    path: string           // API 路径
    method: string         // HTTP 方法
}

await bot.guildService.applyAccess(guild_id, channel_id, {
    path: '/guilds/{guild_id}/members/{user_id}',
    method: 'PATCH'
}, '需要禁言权限')
```

## ⚠️ 注意事项

1. **权限要求**: 部分 API 需要特定的机器人权限，请确保在 QQ 开放平台配置了相应权限
2. **私域限制**: 获取成员列表等敏感操作仅限私域机器人使用
3. **频率限制**: 请遵守 API 调用频率限制，避免被限流
4. **错误处理**: 建议使用服务模块的方法，因为它们提供了统一的错误处理和响应格式


