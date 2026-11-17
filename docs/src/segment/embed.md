---
layout: doc
---

# Embed 消息段 🎯

Embed消息段是一种富文本消息格式，可以创建具有标题、描述、缩略图和字段的结构化消息，常用于展示详细信息、状态报告或格式化内容。

::: tip 平台支持
- ✅ 频道（Guild）
- ✅ 频道私信（Direct Message）
- ❌ 群聊（Group）
- ❌ 私聊（Private）
:::

## 接口定义

```typescript
interface EmbedSegment {
  type: 'embed'
  title: string
  prompt: string
  htumbnail: Record<string, any>  // 缩略图对象
  fields: Array<{
    name: string
    [key: string]: any
  }>
}
```

## 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | `string` | ✅ | 固定值：`embed` |
| `title` | `string` | ✅ | Embed 标题 |
| `prompt` | `string` | ✅ | 提示信息 |
| `htumbnail` | `Record<string, any>` | ✅ | 缩略图配置对象 |
| `fields` | `Array<{name: string}>` | ✅ | 字段数组，每个字段至少包含 name 属性 |
| `title` | `string` | ❌ | 消息标题 |
| `prompt` | `string` | ❌ | 提示文本 |
| `thumbnail` | `EmbedThumbnail` | ❌ | 缩略图信息 |
| `fields` | `EmbedField[]` | ❌ | 字段列表 |

### 缩略图参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `url` | `string` | ✅ | 图片URL |
| `width` | `number` | ❌ | 图片宽度 |
| `height` | `number` | ❌ | 图片高度 |

### 字段参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | ✅ | 字段名称 |
| `value` | `string` | ❌ | 字段值 |
| `inline` | `boolean` | ❌ | 是否内联显示 |

## 基础用法

### 发送简单Embed消息

```typescript
import { Bot } from 'qq-official-bot'

const bot = new Bot({
  appId: 'your-app-id',
  token: 'your-bot-token'
})

// 发送基础Embed消息
await bot.sendGuildMessage(channelId, [{
  type: 'embed',
  title: '服务器状态',
  prompt: '当前系统状态',
  thumbnail: {
    url: 'https://example.com/status-icon.png'
  },
  fields: [
    { name: 'CPU使用率', value: '15%' },
    { name: '内存使用率', value: '42%' },
    { name: '磁盘使用率', value: '68%' }
  ]
}])
```

### 使用 segment.embed

```typescript
import { segment } from 'qq-official-bot'

// segment.embed(title, prompt, thumbnail, fields)
const embedMessage = segment.embed(
  '用户信息',
  '用户信息卡片',
  { url: 'https://example.com/avatar.jpg' },
  [
    { name: '用户名：John Doe' },
    { name: '等级：VIP' },
    { name: '积分：1250' },
  ],
)

await bot.sendGuildMessage(channelId, embedMessage)
```

## 高级功能

### Embed构建器

```typescript
class EmbedBuilder {
  private embed: Partial<EmbedSegment> = { type: 'embed' }
  
  setTitle(title: string): this {
    this.embed.title = title
    return this
  }
  
  setPrompt(prompt: string): this {
    this.embed.prompt = prompt
    return this
  }
  
  setThumbnail(url: string, width?: number, height?: number): this {
    this.embed.thumbnail = { url, width, height }
    return this
  }
  
  addField(name: string, value?: string, inline: boolean = false): this {
    if (!this.embed.fields) {
      this.embed.fields = []
    }
    this.embed.fields.push({ name, value, inline })
    return this
  }
  
  addInlineField(name: string, value?: string): this {
    return this.addField(name, value, true)
  }
  
  addBlankField(inline: boolean = false): this {
    return this.addField('\u200B', '\u200B', inline)
  }
  
  setFields(fields: EmbedField[]): this {
    this.embed.fields = [...fields]
    return this
  }
  
  build(): EmbedSegment {
    return { ...this.embed } as EmbedSegment
  }
  
  clear(): this {
    this.embed = { type: 'embed' }
    return this
  }
  
  getFieldCount(): number {
    return this.embed.fields?.length || 0
  }
}

// 使用构建器
const statusEmbed = new EmbedBuilder()
  .setTitle('🔧 系统监控报告')
  .setPrompt('实时系统状态')
  .setThumbnail('https://example.com/server-icon.png')
  .addField('🖥️ CPU', '15% (正常)', true)
  .addField('💾 内存', '42% (正常)', true)
  .addField('💿 磁盘', '68% (注意)', true)
  .addBlankField()
  .addField('📊 总体状态', '系统运行正常')
  .build()

await bot.sendGuildMessage(channelId, [statusEmbed])
```

### 动态内容Embed

```typescript
class DynamicEmbedManager {
  constructor(private bot: Bot) {}
  
  async createUserProfileEmbed(userId: string): Promise<EmbedSegment> {
    const userInfo = await this.getUserInfo(userId)
    const stats = await this.getUserStats(userId)
    
    return new EmbedBuilder()
      .setTitle(`👤 ${userInfo.nickname}的个人资料`)
      .setThumbnail(userInfo.avatar)
      .addField('🏷️ 用户ID', userId, true)
      .addField('⭐ 等级', `${stats.level}`, true)
      .addField('🏆 积分', `${stats.points}`, true)
      .addField('📅 注册时间', userInfo.joinDate, true)
      .addField('🕐 最后活跃', userInfo.lastActive, true)
      .addField('💬 消息数', `${stats.messageCount}`, true)
      .build()
  }
  
  async createServerStatsEmbed(): Promise<EmbedSegment> {
    const stats = await this.getServerStats()
    
    const statusColor = this.getStatusColor(stats.overallStatus)
    
    return new EmbedBuilder()
      .setTitle('📊 服务器状态监控')
      .setPrompt(`状态: ${stats.overallStatus}`)
      .setThumbnail(`https://example.com/status-${statusColor}.png`)
      .addField('🖥️ CPU使用率', `${stats.cpu}%`, true)
      .addField('💾 内存使用率', `${stats.memory}%`, true)
      .addField('💿 磁盘使用率', `${stats.disk}%`, true)
      .addField('🌐 网络流量', `${stats.network}`, true)
      .addField('⏱️ 运行时间', stats.uptime, true)
      .addField('👥 在线用户', `${stats.onlineUsers}`, true)
      .build()
  }
  
  private getStatusColor(status: string): string {
    const colorMap = {
      '正常': 'green',
      '警告': 'yellow',
      '错误': 'red'
    }
    return colorMap[status] || 'gray'
  }
  
  private async getUserInfo(userId: string) {
    // 模拟获取用户信息
    return {
      nickname: 'John Doe',
      avatar: 'https://example.com/avatar.jpg',
      joinDate: '2023-01-15',
      lastActive: '2小时前'
    }
  }
  
  private async getUserStats(userId: string) {
    // 模拟获取用户统计
    return {
      level: 25,
      points: 1250,
      messageCount: 342
    }
  }
  
  private async getServerStats() {
    // 模拟获取服务器统计
    return {
      cpu: 15,
      memory: 42,
      disk: 68,
      network: '1.2MB/s',
      uptime: '15天 4小时',
      onlineUsers: 128,
      overallStatus: '正常'
    }
  }
}

// 使用动态内容管理器
const embedManager = new DynamicEmbedManager(bot)

// 发送用户资料
const userEmbed = await embedManager.createUserProfileEmbed(userId)
await bot.sendGuildMessage(channelId, [userEmbed])

// 发送服务器状态
const statsEmbed = await embedManager.createServerStatsEmbed()
await bot.sendGuildMessage(channelId, [statsEmbed])
```

### 分页Embed

```typescript
class PaginatedEmbedManager {
  constructor(private bot: Bot) {}
  
  async sendPaginatedList<T>(
    channelId: string,
    title: string,
    items: T[],
    formatter: (item: T, index: number) => EmbedField,
    itemsPerPage: number = 10
  ) {
    const totalPages = Math.ceil(items.length / itemsPerPage)
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * itemsPerPage
      const endIndex = Math.min(startIndex + itemsPerPage, items.length)
      const pageItems = items.slice(startIndex, endIndex)
      
      const embed = new EmbedBuilder()
        .setTitle(`${title} (${page + 1}/${totalPages})`)
        .setPrompt(`显示 ${startIndex + 1}-${endIndex} 项，共 ${items.length} 项`)
        
      pageItems.forEach((item, index) => {
        const field = formatter(item, startIndex + index)
        embed.addField(field.name, field.value, field.inline)
      })
      
      if (totalPages > 1) {
        embed.addBlankField()
        embed.addField('📄 页面信息', `第 ${page + 1} 页，共 ${totalPages} 页`)
      }
      
      await bot.sendGuildMessage(channelId, [embed.build()])
      
      // 分页间延迟，避免消息发送过快
      if (page < totalPages - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
}

// 使用分页功能
const paginatedManager = new PaginatedEmbedManager(bot)

const userList = [
  { name: 'Alice', level: 30, points: 1500 },
  { name: 'Bob', level: 25, points: 1200 },
  // ... 更多用户
]

await paginatedManager.sendPaginatedList(
  channelId,
  '🏆 用户排行榜',
  userList,
  (user, index) => ({
    name: `${index + 1}. ${user.name}`,
    value: `等级: ${user.level} | 积分: ${user.points}`,
    inline: false
  }),
  5 // 每页5个用户
)
```

## 错误处理

### 内容验证

```typescript
interface EmbedValidator {
  maxTitleLength: number
  maxPromptLength: number
  maxFields: number
  maxFieldNameLength: number
  maxFieldValueLength: number
}

class EmbedValidationService {
  private config: EmbedValidator = {
    maxTitleLength: 256,
    maxPromptLength: 512,
    maxFields: 25,
    maxFieldNameLength: 256,
    maxFieldValueLength: 1024
  }
  
  validateEmbed(embed: EmbedSegment): string[] {
    const errors: string[] = []
    
    // 验证标题
    if (embed.title && embed.title.length > this.config.maxTitleLength) {
      errors.push(`标题过长，最大长度: ${this.config.maxTitleLength}`)
    }
    
    // 验证提示文本
    if (embed.prompt && embed.prompt.length > this.config.maxPromptLength) {
      errors.push(`提示文本过长，最大长度: ${this.config.maxPromptLength}`)
    }
    
    // 验证字段数量
    if (embed.fields && embed.fields.length > this.config.maxFields) {
      errors.push(`字段数量过多，最大数量: ${this.config.maxFields}`)
    }
    
    // 验证字段内容
    if (embed.fields) {
      embed.fields.forEach((field, index) => {
        if (!field.name || field.name.trim() === '') {
          errors.push(`字段 ${index + 1} 缺少名称`)
        }
        
        if (field.name && field.name.length > this.config.maxFieldNameLength) {
          errors.push(`字段 ${index + 1} 名称过长`)
        }
        
        if (field.value && field.value.length > this.config.maxFieldValueLength) {
          errors.push(`字段 ${index + 1} 值过长`)
        }
      })
    }
    
    // 验证缩略图
    if (embed.thumbnail) {
      if (!this.isValidUrl(embed.thumbnail.url)) {
        errors.push('缩略图URL格式无效')
      }
    }
    
    return errors
  }
  
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
  
  async sendValidatedEmbed(channelId: string, embed: EmbedSegment) {
    const errors = this.validateEmbed(embed)
    if (errors.length > 0) {
      throw new Error(`Embed验证失败: ${errors.join(', ')}`)
    }
    
    return this.bot.sendGuildMessage(channelId, [embed])
  }
}
```

### 安全处理

```typescript
class SafeEmbedService {
  constructor(private bot: Bot) {}
  
  sanitizeContent(content: string): string {
    // 移除潜在的恶意内容
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .trim()
  }
  
  async createSafeEmbed(data: any): Promise<EmbedSegment> {
    const embed: EmbedSegment = { type: 'embed' }
    
    // 安全处理标题
    if (data.title) {
      embed.title = this.sanitizeContent(data.title).substring(0, 256)
    }
    
    // 安全处理提示
    if (data.prompt) {
      embed.prompt = this.sanitizeContent(data.prompt).substring(0, 512)
    }
    
    // 安全处理缩略图
    if (data.thumbnail && this.isValidImageUrl(data.thumbnail.url)) {
      embed.thumbnail = { url: data.thumbnail.url }
    }
    
    // 安全处理字段
    if (data.fields && Array.isArray(data.fields)) {
      embed.fields = data.fields
        .slice(0, 25) // 限制字段数量
        .map(field => ({
          name: this.sanitizeContent(field.name || '').substring(0, 256),
          value: field.value ? this.sanitizeContent(field.value).substring(0, 1024) : undefined,
          inline: Boolean(field.inline)
        }))
        .filter(field => field.name.length > 0) // 移除空字段
    }
    
    return embed
  }
  
  private isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return ['http:', 'https:'].includes(parsedUrl.protocol)
    } catch {
      return false
    }
  }
}
```

## 与其他消息段组合

Embed消息段可以与特定的消息段组合使用：

### 与回复消息组合

```typescript
const combinedMessage = [
  {
    type: 'reply',
    message_id: originalMessageId
  },
  {
    type: 'embed',
    title: '回复的详细信息',
    fields: [
      { name: '状态', value: '已处理' },
      { name: '处理时间', value: '2分钟' }
    ]
  }
] as const

await bot.sendGuildMessage(channelId, combinedMessage)
```

## 最佳实践

### 1. 内容组织

```typescript
// 使用逻辑分组组织字段
const helpEmbed = new EmbedBuilder()
  .setTitle('🤖 机器人帮助')
  .setPrompt('可用命令列表')
  
  // 基础命令组
  .addField('📝 基础命令', '\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_', false)
  .addField('/help', '显示帮助信息', true)
  .addField('/status', '查看状态', true)
  .addBlankField(true) // 填充空白保持对齐
  
  // 管理命令组
  .addField('⚙️ 管理命令', '\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_', false)
  .addField('/kick', '踢出用户', true)
  .addField('/ban', '封禁用户', true)
  .addField('/mute', '禁言用户', true)
  
  .build()
```

### 2. 响应式设计

```typescript
function createResponsiveEmbed(data: any, screenSize: 'mobile' | 'desktop' = 'desktop'): EmbedSegment {
  const builder = new EmbedBuilder()
    .setTitle(data.title)
  
  if (screenSize === 'mobile') {
    // 移动端：使用更少的内联字段
    data.fields.forEach(field => {
      builder.addField(field.name, field.value, false)
    })
  } else {
    // 桌面端：使用内联字段优化布局
    data.fields.forEach(field => {
      builder.addField(field.name, field.value, true)
    })
  }
  
  return builder.build()
}
```

### 3. 性能优化

```typescript
// 缓存常用Embed模板
class EmbedTemplateCache {
  private cache = new Map<string, EmbedSegment>()
  
  getTemplate(key: string): EmbedSegment | undefined {
    return this.cache.get(key)
  }
  
  setTemplate(key: string, embed: EmbedSegment): void {
    if (this.cache.size >= 100) { // 限制缓存大小
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, embed)
  }
  
  createFromTemplate(templateKey: string, data: any): EmbedSegment {
    const template = this.getTemplate(templateKey)
    if (template) {
      return {
        ...template,
        title: data.title || template.title,
        fields: data.fields || template.fields
      }
    }
    
    throw new Error(`模板不存在: ${templateKey}`)
  }
}
```

## 使用限制

1. **平台限制**：仅支持频道和频道私信
2. **字段限制**：最多25个字段
3. **长度限制**：标题、提示和字段值都有长度限制
4. **图片限制**：缩略图必须是有效的URL
5. **组合限制**：只能与回复消息段组合

## 相关文档

- [消息段概览](./index.md)
- [回复消息段](./reply.md)
- [ARK消息段](./ark.md)

