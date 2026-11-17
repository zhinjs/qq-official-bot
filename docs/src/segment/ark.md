---
layout: doc
---

# ARK 消息段 🎨

ARK（Application Resource Kit）消息段是QQ官方提供的富文本模板消息，支持创建具有丰富视觉效果的结构化消息内容。

::: tip 平台支持
- ✅ 频道（Guild）
- ✅ 频道私信（Direct Message）
- ❌ 群聊（Group）
- ❌ 私聊（Private）
:::

## 接口定义

```typescript
interface ArkSegment {
  type: 'ark'
  template_id: number
  kv: Array<{
    key: string
    value: string
  }>
}
```

## 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | `string` | ✅ | 固定值：`ark` |
| `template_id` | `number` | ✅ | ARK模板ID |
| `kv` | `Array<{key: string, value: string}>` | ✅ | 键值对数据数组 |

### 键值对参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `key` | `string` | ✅ | 字段名称 |
| `value` | `string` | ✅ | 字段值 |
| `value` | `string` | ✅ | 字段值 |

## 基础用法

### 发送简单ARK消息

```typescript
import { Bot } from 'qq-official-bot'

const bot = new Bot({
  appId: 'your-app-id',
  token: 'your-bot-token'
})

// 发送基础ARK消息
await bot.sendGuildMessage(channelId, [{
  type: 'ark',
  template_id: 23,
  kv: [
    { key: '#TITLE#', value: '消息标题' },
    { key: '#METADESC#', value: '消息描述' },
    { key: '#IMG#', value: 'https://example.com/image.jpg' },
    { key: '#LINK#', value: 'https://example.com' }
  ]
}])
```

### 使用 segment.ark

```typescript
import { segment } from 'qq-official-bot'

// ARK 消息段：模板 ID + kv 列表（key 为模板定义的字段名）
const arkMessage = segment.ark(23, [
  { key: '#DESC#', value: '新闻摘要内容' },
  { key: '#PROMPT#', value: '新闻标题' },
])

await bot.sendGuildMessage(channelId, arkMessage)
```

## 常用模板示例

### 文本类模板（ID: 1）

```typescript
const textArk = {
  type: 'ark' as const,
  template_id: 1,
  kv: [
    { key: '#DESC#', value: '这是一条文本消息' },
    { key: '#PROMPT#', value: '提示文本' }
  ]
}
```

### 链接类模板（ID: 23）

```typescript
const linkArk = {
  type: 'ark' as const,
  template_id: 23,
  kv: [
    { key: '#TITLE#', value: '链接标题' },
    { key: '#METADESC#', value: '链接描述' },
    { key: '#IMG#', value: 'https://example.com/thumb.jpg' },
    { key: '#LINK#', value: 'https://example.com' }
  ]
}
```

### 音乐类模板（ID: 24）

```typescript
const musicArk = {
  type: 'ark' as const,
  template_id: 24,
  kv: [
    { key: '#MUSIC.TITLE#', value: '歌曲名称' },
    { key: '#MUSIC.SINGER#', value: '歌手名称' },
    { key: '#MUSIC.URL#', value: 'https://music.example.com/song.mp3' },
    { key: '#MUSIC.COVER#', value: 'https://music.example.com/cover.jpg' }
  ]
}
```

## 高级功能

### ARK模板管理器

```typescript
class ArkTemplateManager {
  private templates: Map<number, ArkTemplate> = new Map()
  
  constructor(private bot: Bot) {
    this.initializeTemplates()
  }
  
  private initializeTemplates() {
    // 注册常用模板
    this.registerTemplate({
      id: 23,
      name: 'link',
      description: '链接分享模板',
      supportedFields: ['#TITLE#', '#METADESC#', '#IMG#', '#LINK#'],
      requiredFields: ['#TITLE#', '#LINK#']
    })
    
    this.registerTemplate({
      id: 24,
      name: 'music',
      description: '音乐分享模板',
      supportedFields: ['#MUSIC.TITLE#', '#MUSIC.SINGER#', '#MUSIC.URL#', '#MUSIC.COVER#'],
      requiredFields: ['#MUSIC.TITLE#', '#MUSIC.URL#']
    })
  }
  
  registerTemplate(template: ArkTemplate) {
    this.templates.set(template.id, template)
  }
  
  validateArk(arkData: Partial<ArkSegment>): string[] {
    const template = this.templates.get(arkData.template_id!)
    if (!template) {
      return ['未知的模板ID']
    }
    
    const errors: string[] = []
    const providedKeys = arkData.kv?.map(kv => kv.key) || []
    
    // 检查必填字段
    for (const required of template.requiredFields) {
      if (!providedKeys.includes(required)) {
        errors.push(`缺少必填字段: ${required}`)
      }
    }
    
    // 检查不支持的字段
    for (const key of providedKeys) {
      if (!template.supportedFields.includes(key)) {
        errors.push(`不支持的字段: ${key}`)
      }
    }
    
    return errors
  }
  
  async sendValidatedArk(channelId: string, arkData: Partial<ArkSegment>) {
    const errors = this.validateArk(arkData)
    if (errors.length > 0) {
      throw new Error(`ARK验证失败: ${errors.join(', ')}`)
    }
    
    return this.bot.sendGuildMessage(channelId, [arkData as ArkSegment])
  }
}

// 使用模板管理器
const arkManager = new ArkTemplateManager(bot)

await arkManager.sendValidatedArk(channelId, {
  type: 'ark',
  template_id: 23,
  kv: [
    { key: '#TITLE#', value: '验证过的链接' },
    { key: '#LINK#', value: 'https://example.com' }
  ]
})
```

### 动态ARK构建器

```typescript
class ArkBuilder {
  private templateId: number
  private kvPairs: ArkKeyValue[] = []
  
  constructor(templateId: number) {
    this.templateId = templateId
  }
  
  addField(key: string, value: string): this {
    this.kvPairs.push({ key, value })
    return this
  }
  
  setTitle(title: string): this {
    return this.addField('#TITLE#', title)
  }
  
  setDescription(desc: string): this {
    return this.addField('#METADESC#', desc)
  }
  
  setImage(imageUrl: string): this {
    return this.addField('#IMG#', imageUrl)
  }
  
  setLink(url: string): this {
    return this.addField('#LINK#', url)
  }
  
  build(): ArkSegment {
    return {
      type: 'ark',
      template_id: this.templateId,
      kv: [...this.kvPairs]
    }
  }
  
  clear(): this {
    this.kvPairs = []
    return this
  }
}

// 使用构建器
const arkMessage = new ArkBuilder(23)
  .setTitle('新产品发布')
  .setDescription('我们很兴奋地宣布新产品的发布！')
  .setImage('https://example.com/product.jpg')
  .setLink('https://example.com/products/new')
  .build()

await bot.sendGuildMessage(channelId, [arkMessage])
```

## 错误处理

### 模板验证

```typescript
async function sendArkWithValidation(channelId: string, arkData: ArkSegment) {
  try {
    // 验证模板ID
    if (!arkData.template_id || arkData.template_id <= 0) {
      throw new Error('无效的模板ID')
    }
    
    // 验证键值对
    if (!arkData.kv || arkData.kv.length === 0) {
      throw new Error('ARK消息必须包含至少一个键值对')
    }
    
    // 验证字段格式
    for (const kv of arkData.kv) {
      if (!kv.key || !kv.value) {
        throw new Error('键值对的key和value都不能为空')
      }
      
      if (kv.key.length > 32) {
        throw new Error(`字段名称过长: ${kv.key}`)
      }
      
      if (kv.value.length > 1000) {
        throw new Error(`字段值过长: ${kv.key}`)
      }
    }
    
    // 发送消息
    const result = await bot.sendGuildMessage(channelId, [arkData])
    console.log('ARK消息发送成功:', result.id)
    return result
    
  } catch (error) {
    console.error('ARK消息发送失败:', error.message)
    throw error
  }
}
```

### 重试机制

```typescript
async function sendArkWithRetry(
  channelId: string, 
  arkData: ArkSegment, 
  maxRetries: number = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await bot.sendGuildMessage(channelId, [arkData])
    } catch (error) {
      console.warn(`ARK消息发送失败 (尝试 ${attempt}/${maxRetries}):`, error.message)
      
      if (attempt === maxRetries) {
        throw new Error(`ARK消息发送失败，已重试${maxRetries}次`)
      }
      
      // 指数退避
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
}
```

## 与其他消息段组合

ARK消息段可以与特定的消息段组合使用：

### 与回复消息组合

```typescript
const combinedMessage = [
  {
    type: 'reply',
    message_id: originalMessageId
  },
  {
    type: 'ark',
    template_id: 23,
    kv: [
      { key: '#TITLE#', value: '回复的ARK消息' },
      { key: '#METADESC#', value: '这是对上条消息的回复' },
      { key: '#LINK#', value: 'https://example.com' }
    ]
  }
] as const

await bot.sendGuildMessage(channelId, combinedMessage)
```

## 最佳实践

### 1. 模板选择

```typescript
// 根据内容类型选择合适的模板
function selectArkTemplate(contentType: string): number {
  const templateMap = {
    'news': 23,      // 新闻链接
    'music': 24,     // 音乐分享
    'video': 25,     // 视频分享
    'product': 26,   // 产品介绍
    'text': 1        // 纯文本
  }
  
  return templateMap[contentType] || 1
}
```

### 2. 内容优化

```typescript
function optimizeArkContent(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) {
    return content
  }
  
  return content.substring(0, maxLength - 3) + '...'
}

const arkMessage = {
  type: 'ark' as const,
  template_id: 23,
  kv: [
    { 
      key: '#TITLE#', 
      value: optimizeArkContent(title, 32) 
    },
    { 
      key: '#METADESC#', 
      value: optimizeArkContent(description, 100) 
    }
  ]
}
```

### 3. 性能优化

```typescript
// 缓存常用ARK模板
class ArkCache {
  private cache = new Map<string, ArkSegment>()
  
  getCachedArk(key: string): ArkSegment | undefined {
    return this.cache.get(key)
  }
  
  setCachedArk(key: string, ark: ArkSegment): void {
    this.cache.set(key, ark)
  }
  
  createNewsArk(title: string, url: string): ArkSegment {
    const cacheKey = `news:${title}:${url}`
    const cached = this.getCachedArk(cacheKey)
    
    if (cached) {
      return cached
    }
    
    const ark = {
      type: 'ark' as const,
      template_id: 23,
      kv: [
        { key: '#TITLE#', value: title },
        { key: '#LINK#', value: url }
      ]
    }
    
    this.setCachedArk(cacheKey, ark)
    return ark
  }
}
```

## 使用限制

1. **平台限制**：仅支持频道和频道私信
2. **模板限制**：每个模板有特定的字段要求
3. **内容限制**：字段值长度有限制
4. **频率限制**：受消息发送频率限制
5. **组合限制**：只能与回复消息段组合

## 相关文档

- [消息段概览](./index.md)
- [回复消息段](./reply.md)
- [QQ官方ARK文档](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/type/ark.html)
