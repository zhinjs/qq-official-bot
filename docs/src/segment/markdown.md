---
layout: doc
---

# Markdown消息段

Markdown 消息段用于发送格式化的富文本内容，支持丰富的文本样式和布局。

## 类型定义

```typescript
// 普通 Markdown 内容
interface MarkdownContentElement {
  type: 'markdown'
  content: string
  custom_template_id?: never
  params?: never
  force_verify_image_resource?: boolean
}

// 模板 Markdown 内容
interface MarkdownTemplateElement {
  type: 'markdown'
  custom_template_id: string
  content?: never
  params: Array<{key: string, values: string}>
  force_verify_image_resource?: boolean
}

type MarkdownElement = MarkdownContentElement | MarkdownTemplateElement
```

## 参数说明

### 普通 Markdown 模式

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | string | ✅ | 消息段类型，固定为 `markdown` |
| content | string | ✅ | Markdown 内容文本 |

### 模板 Markdown 模式

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | string | ✅ | 消息段类型，固定为 `markdown` |
| custom_template_id | string | ✅ | 自定义模板 ID |
| params | Array | ✅ | 模板参数列表，包含键值对 |

> **注意**: 两种模式是互斥的，不能同时使用 `content` 和 `custom_template_id`。

### 图片转存强校验

群聊和单聊 Markdown 可开启 `force_verify_image_resource`。开启后，图片转存失败会中断消息发送并返回错误；默认关闭。

```typescript
await bot.sendGroupMessage(group_openid, segment.markdown(
  '## 海报\n![活动海报](https://example.com/poster.png)',
  { force_verify_image_resource: true },
))

// 模板模式的选项使用第三个参数
segment.markdown(template_id, params, {
  force_verify_image_resource: true,
})
```

### 群聊 @全体成员

把官方标记直接写入 Markdown 内容。机器人需为群管理员，每群每天仅可发送 1 次。

```typescript
await bot.sendGroupMessage(group_id, segment.markdown(
  '<qqbot-at-everyone />\n## 公告\n请查看最新通知',
))
```

详见 [@消息段](./at.md#全体成员)。

## 支持的 Markdown 语法

### 标题

```typescript
import { segment } from 'qq-official-bot'

// 不同级别的标题
const titleMarkdown = segment.markdown(`
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
`)
```

### 文本样式

```typescript
import { segment } from 'qq-official-bot'

// 文本样式
const styleMarkdown = segment.markdown(`
**粗体文本**
*斜体文本*
***粗斜体文本***
~~删除线文本~~
\`行内代码\`
`)
```

### 列表

```typescript
import { segment } from 'qq-official-bot'

// 无序列表
const unorderedList = segment.markdown(`
- 项目1
- 项目2
  - 子项目2.1
  - 子项目2.2
- 项目3
`)

// 有序列表
const orderedList = segment.markdown(`
1. 第一步
2. 第二步
   1. 子步骤2.1
   2. 子步骤2.2
3. 第三步
`)
```

### 代码块

```typescript
import { segment } from 'qq-official-bot'

// 代码块
const codeMarkdown = segment.markdown(`
\`\`\`javascript
function hello() {
    console.log("Hello, World!");
}
\`\`\`

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`
`)
```

### 链接和图片

```typescript
import { segment } from 'qq-official-bot'

// 链接和图片
const linkImageMarkdown = segment.markdown(`
[GitHub](https://github.com)

![示例图片](https://example.com/image.jpg)

[带标题的链接](https://example.com "链接标题")
`)
```

### 表格

```typescript
import { segment } from 'qq-official-bot'

// 表格
const tableMarkdown = segment.markdown(`
| 姓名 | 年龄 | 职业 |
|------|------|------|
| 张三 | 25   | 程序员 |
| 李四 | 30   | 设计师 |
| 王五 | 28   | 产品经理 |
`)
```

### 引用

```typescript
import { segment } from 'qq-official-bot'

// 引用
const quoteMarkdown = segment.markdown(`
> 这是一级引用
> 
> > 这是二级引用
> > 
> > > 这是三级引用

> **重要提示**
> 
> 这是一个重要的提示信息。
`)
```

### 分割线

```typescript
import { segment } from 'qq-official-bot'

// 分割线
const dividerMarkdown = segment.markdown(`
内容区域一

---

内容区域二

***

内容区域三
`)
```

## 使用示例

### 基础 Markdown 消息

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 发送基础 Markdown
await bot.client.sendMessage(channelId, [
  segment.markdown(`
# 欢迎使用 QQ 机器人

**功能特色：**
- 智能对话
- 定时提醒
- 数据查询

> 如需帮助，请输入 \`/help\`
  `)
])
```

### 公告模板

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 公告格式
async function sendAnnouncement(channelId: string, title: string, content: string, author: string) {
  const markdown = segment.markdown(`
# 📢 ${title}

${content}

---

**发布者：** ${author}  
**发布时间：** ${new Date().toLocaleString()}
  `)
  
  await bot.client.sendMessage(channelId, [markdown])
}

// 使用示例
await sendAnnouncement(
  channelId,
  '系统维护通知',
  '系统将在今晚 22:00 - 02:00 进行维护，期间可能影响部分功能使用。',
  '管理员'
)
```

### 数据报告

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 数据报告模板
async function sendDataReport(channelId: string, data: any) {
  const markdown = segment.markdown(`
# 📊 数据统计报告

## 用户活跃度
- **在线用户：** ${data.onlineUsers}
- **今日新增：** ${data.newUsers}
- **总用户数：** ${data.totalUsers}

## 消息统计
| 类型 | 数量 | 占比 |
|------|------|------|
| 文本消息 | ${data.textMessages} | ${data.textPercentage}% |
| 图片消息 | ${data.imageMessages} | ${data.imagePercentage}% |
| 其他消息 | ${data.otherMessages} | ${data.otherPercentage}% |

> 数据更新时间：${new Date().toLocaleString()}
  `)
  
  await bot.client.sendMessage(channelId, [markdown])
}
```

### 帮助文档

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 帮助文档
const helpMarkdown = segment.markdown(`
# 🤖 机器人使用指南

## 基础指令

### 查询类
- \`/weather [城市]\` - 查询天气
- \`/time\` - 获取当前时间
- \`/help\` - 显示帮助信息

### 管理类
- \`/mute @用户\` - 禁言用户
- \`/unmute @用户\` - 解除禁言
- \`/clean [数量]\` - 清理消息

## 使用示例

\`\`\`
/weather 北京
/time
/clean 10
\`\`\`

## 注意事项

> ⚠️ **重要**
> - 管理类指令需要相应权限
> - 指令不区分大小写
> - 参数用空格分隔

---

如有问题，请联系管理员。
`)

await bot.client.sendMessage(channelId, [helpMarkdown])
```

## 模板系统

### 自定义模板

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 使用自定义模板
const templateMarkdown = segment.markdown({
  custom_template_id: 'user_profile_template',
  params: [
    { key: 'username', value: '张三' },
    { key: 'level', value: '10' },
    { key: 'points', value: '1500' },
    { key: 'joinDate', value: '2023-01-15' }
  ]
})

await bot.client.sendMessage(channelId, [templateMarkdown])
```

### 动态模板生成

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 动态生成模板内容
function generateUserCard(user: any): string {
  return `
# 👤 用户资料卡

**用户名：** ${user.name}  
**等级：** ${user.level}  
**积分：** ${user.points}  
**加入时间：** ${user.joinDate}

## 成就徽章
${user.badges.map((badge: string) => `🏆 ${badge}`).join('\n')}

## 最近活动
${user.recentActivities.map((activity: string, index: number) => 
  `${index + 1}. ${activity}`
).join('\n')}

---
*最后更新：${new Date().toLocaleString()}*
  `
}

// 使用示例
const userData = {
  name: '张三',
  level: 15,
  points: 2500,
  joinDate: '2023-01-15',
  badges: ['活跃用户', '热心助手', '技术达人'],
  recentActivities: ['发布了新帖子', '回答了问题', '获得了点赞']
}

await bot.client.sendMessage(channelId, [
  segment.markdown(generateUserCard(userData))
])
```

## 与按钮组合使用

### Markdown + 按钮

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// Markdown 内容配按钮
const contentMarkdown = segment.markdown(`
# 🎮 游戏中心

选择你想要的操作：

- **开始游戏** - 立即开始新游戏
- **查看排行榜** - 查看玩家排名
- **个人统计** - 查看游戏数据
`)

const gameButtons = segment.button({
  buttons: [
    {
      id: 'start_game',
      render_data: { label: '开始游戏', style: 3 },
      action: { type: 0, data: 'start' }
    },
    {
      id: 'leaderboard',
      render_data: { label: '排行榜', style: 1 },
      action: { type: 0, data: 'leaderboard' }
    },
    {
      id: 'stats',
      render_data: { label: '个人统计', style: 4 },
      action: { type: 0, data: 'stats' }
    }
  ]
})

await bot.client.sendMessage(channelId, [contentMarkdown, gameButtons])
```

### 交互式问卷

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 问卷调查
const surveyMarkdown = segment.markdown(`
# 📝 用户体验调查

请帮助我们改进服务质量：

## 问题1：您对当前功能的满意度如何？

请选择最符合您感受的选项。
`)

const ratingButtons = segment.button({
  buttons: [
    {
      id: 'very_satisfied',
      render_data: { label: '非常满意', style: 3 },
      action: { type: 0, data: 'rating_5' }
    },
    {
      id: 'satisfied',
      render_data: { label: '满意', style: 1 },
      action: { type: 0, data: 'rating_4' }
    },
    {
      id: 'neutral',
      render_data: { label: '一般', style: 0 },
      action: { type: 0, data: 'rating_3' }
    },
    {
      id: 'dissatisfied',
      render_data: { label: '不满意', style: 2 },
      action: { type: 0, data: 'rating_2' }
    }
  ]
})

await bot.client.sendMessage(channelId, [surveyMarkdown, ratingButtons])
```

## 高级功能

### 动态内容更新

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 实时数据显示
let serverStatus = {
  cpu: 45,
  memory: 68,
  disk: 32,
  uptime: '5天12小时',
  lastUpdate: new Date()
}

function generateStatusMarkdown(): string {
  return `
# 🖥️ 服务器状态监控

## 系统资源使用情况

| 资源类型 | 使用率 | 状态 |
|----------|--------|------|
| CPU | ${serverStatus.cpu}% | ${serverStatus.cpu < 80 ? '🟢 正常' : '🔴 警告'} |
| 内存 | ${serverStatus.memory}% | ${serverStatus.memory < 80 ? '🟢 正常' : '🔴 警告'} |
| 磁盘 | ${serverStatus.disk}% | ${serverStatus.disk < 80 ? '🟢 正常' : '🔴 警告'} |

## 运行信息
- **运行时间：** ${serverStatus.uptime}
- **最后更新：** ${serverStatus.lastUpdate.toLocaleString()}

> 自动更新间隔：30秒
  `
}

// 定时更新状态
setInterval(async () => {
  // 模拟数据更新
  serverStatus.cpu = Math.floor(Math.random() * 100)
  serverStatus.memory = Math.floor(Math.random() * 100)
  serverStatus.disk = Math.floor(Math.random() * 100)
  serverStatus.lastUpdate = new Date()
  
  await bot.client.sendMessage(channelId, [
    segment.markdown(generateStatusMarkdown())
  ])
}, 30000)
```

### Markdown 预处理

```typescript
// Markdown 内容预处理器
class MarkdownProcessor {
  
  // 转义特殊字符
  static escape(text: string): string {
    return text
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/`/g, '\\`')
      .replace(/~/g, '\\~')
  }
  
  // 添加语法高亮
  static addSyntaxHighlight(code: string, language: string): string {
    return `\`\`\`${language}\n${code}\n\`\`\``
  }
  
  // 生成表格
  static createTable(headers: string[], rows: string[][]): string {
    const headerRow = `| ${headers.join(' | ')} |`
    const separatorRow = `|${headers.map(() => '---').join('|')}|`
    const dataRows = rows.map(row => `| ${row.join(' | ')} |`)
    
    return [headerRow, separatorRow, ...dataRows].join('\n')
  }
  
  // 格式化用户提及
  static formatMention(userId: string, username: string): string {
    return `**@${this.escape(username)}**`
  }
  
  // 格式化时间
  static formatTime(date: Date): string {
    return `*${date.toLocaleString()}*`
  }
}

// 使用示例
const processedMarkdown = `
# 用户消息

${MarkdownProcessor.formatMention('123456', '张三')} 在 ${MarkdownProcessor.formatTime(new Date())} 说：

${MarkdownProcessor.addSyntaxHighlight('console.log("Hello World")', 'javascript')}

${MarkdownProcessor.createTable(
  ['姓名', '分数', '排名'],
  [['张三', '95', '1'], ['李四', '87', '2'], ['王五', '82', '3']]
)}
`

await bot.client.sendMessage(channelId, [
  segment.markdown(processedMarkdown)
])
```

## 最佳实践

### 内容结构化

```typescript
// ✅ 好的做法 - 结构清晰
const goodMarkdown = segment.markdown(`
# 主标题

## 子标题1
内容1

## 子标题2  
内容2

---

**总结**
`)

// ❌ 避免的做法 - 结构混乱
const badMarkdown = segment.markdown(`
# 标题
内容content更多内容
## 子标题
# 另一个主标题???
`)
```

### 适当使用样式

```typescript
// ✅ 合理使用样式强调重点
const goodStyle = segment.markdown(`
**重要通知：**系统将于今晚维护

*维护时间：*22:00-02:00

> 维护期间部分功能不可用
`)

// ❌ 过度使用样式
const badStyle = segment.markdown(`
***超级重要的***~~不重要~~**通知**：***系统***将于**今晚**维护
`)
```

### 错误处理

```typescript
try {
  await bot.client.sendMessage(channelId, [
    segment.markdown(markdownContent)
  ])
} catch (error) {
  console.error('发送 Markdown 失败:', error)
  
  // 发送纯文本备用方案
  await bot.client.sendMessage(channelId, [
    segment.text('消息发送失败，以下是纯文本版本：\n' + 
                 markdownContent.replace(/[*_`~#]/g, ''))
  ])
}
```

## 组合规则

Markdown 消息段可以与以下消息段组合使用：

- ✅ **按钮消息段** - 最常见的组合，创建交互界面
- ✅ **回复消息段** - 回复时发送格式化内容
- ❌ **不建议与其他消息段组合** - Markdown 通常作为主要内容

## 限制说明

1. **语法支持**：支持标准 Markdown 语法的子集
2. **长度限制**：单条 Markdown 消息建议不超过 4000 字符
3. **嵌套限制**：部分嵌套语法可能不被支持
4. **样式限制**：某些高级样式可能显示异常
5. **模板限制**：自定义模板需要预先注册
6. **按钮依赖**：按钮功能需要与 Markdown 配合使用
