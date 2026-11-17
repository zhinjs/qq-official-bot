---
layout: doc
---

# 按钮消息段

按钮消息段用于创建可交互的按钮，让用户通过点击完成特定操作。

## 类型定义

```typescript
interface ButtonElement {
  type: 'button'
  data: Record<string, any>  // 按钮数据配置
}
```

## 参数说明

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | string | ✅ | 消息段类型，固定为 `button` |
| data | Record<string, any> | ✅ | 按钮配置数据对象 |

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| id | string | ✅ | 按钮唯一标识符 |
| render_data | ButtonRenderData | ✅ | 按钮渲染数据 |
| action | ButtonAction | ✅ | 按钮点击行为 |

::: tip 自定义按钮与按钮模板
带 `render_data` / `action` 的按钮会组装成自定义键盘（`keyboard.content.rows`），其中 `id` 是按钮自身的 ID。
只传 `{ id }`（没有 `render_data` / `action`）时，`id` 会被视为平台申请的**按钮模板 ID**，等价于 `segment.keyboard(id)`。
:::

### ButtonRenderData 参数

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| label | string | ✅ | 按钮显示文字 |
| visited_label | string | ❌ | 点击后显示文字 |
| style | number | ❌ | 按钮样式（0=灰色线框，1=蓝色线框，3=白底红字，4=蓝底白字） |

### ButtonAction 参数

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | number | ✅ | 操作类型（0=跳转：http 链接或小程序，1=回调：data 传给机器人后台，2=指令：在输入框插入 @bot data） |
| permission | ButtonPermission | ❌ | 权限设置 |
| data | string | ❌ | 操作数据；跳转按钮为链接，type=1/2 时必填 |
| enter | boolean | ❌ | 是否直接发送 |
| reply | boolean | ❌ | 是否回复 |
| anchor | number | ❌ | 仅指令按钮有效，设为 1 时点击唤起手 Q 选图器（仅手机端 8983+ 单聊） |
| unsupport_tips | string | ❌ | 不支持时的提示 |
| modal | ButtonModal | ❌ | 点击后的二次确认（content ≤40 字且不能含 URL，confirm_text / cancel_text ≤4 字） |

### ButtonPermission 参数

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | number | ✅ | 0=指定用户，1=仅管理员，2=所有人，3=指定身份组（仅频道） |
| specify_user_ids | string[] | ❌ | 有权限的用户 ID 列表（type=0） |
| specify_role_ids | string[] | ❌ | 有权限的身份组 ID 列表（type=3，仅频道） |

## 按钮样式

| 样式值 | 外观 | 用途建议 |
|-------|------|----------|
| 0 | 灰色线框 | 次要操作、取消操作 |
| 1 | 蓝色线框 | 常规操作 |
| 3 | 白色背景 + 红色字体 | 危险操作、删除操作 |
| 4 | 蓝色背景 + 白色字体 | 主要操作、确认操作 |

::: warning 取值以官方文档为准
官方[发送消息文档](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_users_user_openid_messages.post.html)中 `action.type` 为 **0=跳转、1=回调、2=指令**，`style` 没有 2。旧版本文档写反过，请按本页取值。
:::

## 按钮类型

### 回调按钮 (type: 1)

点击后触发回调事件，不跳转页面。

```typescript
import { segment } from 'qq-official-bot'

// 单个回调按钮
const callbackButton = segment.button({
  id: 'callback_btn_1',
  render_data: {
    label: '点击我',
    visited_label: '已点击',
    style: 1 // 蓝色线框
  },
  action: {
    type: 1, // 回调类型
    data: 'callback_data_1'
  }
})
```

### 跳转按钮 (type: 0)

点击后跳转到指定链接。

```typescript
import { segment } from 'qq-official-bot'

// 链接按钮
const linkButton = segment.button({
  id: 'link_btn_1',
  render_data: {
    label: '访问官网',
    style: 1
  },
  action: {
    type: 0, // 跳转类型（http 链接或小程序）
    data: 'https://example.com'
  }
})
```

### 指令按钮 (type: 2)

点击后发送指定指令。

```typescript
import { segment } from 'qq-official-bot'

// 指令按钮
const commandButton = segment.button({
  id: 'cmd_btn_1',
  render_data: {
    label: '帮助',
    style: 4 // 蓝底白字
  },
  action: {
    type: 2, // 指令类型
    data: '/help',
    enter: true, // 直接发送
    reply: false // 不回复
  }
})
```

## 使用示例

### 发送单个按钮

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 必须与 markdown 一起发送
await bot.client.sendMessage(channelId, [
  segment.markdown('请选择操作：'),
  segment.button({
    id: 'confirm_btn',
    render_data: {
      label: '确认',
      visited_label: '已确认',
      style: 1
    },
    action: {
      type: 1,
      data: 'confirm_action'
    }
  })
])
```

### 发送按钮组

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 发送按钮组
const buttons = [
  {
    id: 'yes_btn',
    render_data: { label: '是', style: 4 },
    action: { type: 1, data: 'yes' }
  },
  {
    id: 'no_btn', 
    render_data: { label: '否', style: 3 },
    action: { type: 1, data: 'no' }
  },
  {
    id: 'cancel_btn',
    render_data: { label: '取消', style: 0 },
    action: { type: 1, data: 'cancel' }
  }
]

await bot.client.sendMessage(channelId, [
  segment.markdown('你确定要执行此操作吗？'),
  segment.button({ buttons })
])
```

### 多行按钮布局

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 第一行按钮
const firstRow = [
  {
    id: 'option1',
    render_data: { label: '选项1', style: 1 },
    action: { type: 1, data: 'option1' }
  },
  {
    id: 'option2',
    render_data: { label: '选项2', style: 1 },
    action: { type: 1, data: 'option2' }
  }
]

// 第二行按钮
const secondRow = [
  {
    id: 'back',
    render_data: { label: '返回', style: 0 },
    action: { type: 1, data: 'back' }
  },
  {
    id: 'exit',
    render_data: { label: '退出', style: 3 },
    action: { type: 1, data: 'exit' }
  }
]

await bot.client.sendMessage(channelId, [
  segment.markdown('请选择操作：'),
  segment.button({ buttons: firstRow }),
  segment.button({ buttons: secondRow })
])
```

## 权限控制

### 指定用户权限

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 只有特定用户能点击的按钮
const adminButton = segment.button({
  id: 'admin_btn',
  render_data: {
    label: '管理操作',
    style: 1 // 蓝色线框
  },
  action: {
    type: 1,
    data: 'admin_action',
    permission: {
      type: 0, // 指定用户
      specify_user_ids: ['admin_user_id_1', 'admin_user_id_2']
    }
  }
})

await bot.client.sendMessage(channelId, [
  segment.markdown('管理面板'),
  adminButton
])
```

### 指定角色权限

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 只有特定角色能点击的按钮
const roleButton = segment.button({
  id: 'role_btn',
  render_data: {
    label: '角色专用',
    style: 1
  },
  action: {
    type: 1,
    data: 'role_action',
    permission: {
      type: 3, // 指定身份组（仅频道）
      specify_role_ids: ['role_id_1', 'role_id_2']
    }
  }
})
```

## 处理按钮点击事件

### 监听按钮回调

```typescript
import { Bot } from 'qq-official-bot'

const bot = new Bot(config)

// 回调按钮（action.type = 1）被点击时触发 INTERACTION_CREATE：
// 单聊 notice.friend.action，群聊 notice.group.action，频道 notice.guild.action
bot.on('notice.group.action', async (event) => {
  const { button_id, button_data } = event.data.resolved

  // 先回应互动，避免客户端显示加载中（0 = 成功）
  await event.reply(0)

  switch (button_data) {
    case 'confirm_action':
      await bot.sendGroupMessage(event.group_id, '操作已确认！', { event_id: event.notice_id })
      break
    case 'cancel_action':
      await bot.sendGroupMessage(event.group_id, '操作已取消。', { event_id: event.notice_id })
      break
    default:
      console.log('未知按钮点击:', button_id, button_data)
  }
})
```

::: tip 互动事件字段
`event.interaction_type` 为互动类型（11 按钮、12 快捷菜单、13 消息反馈 …），`event.operator_id` 为点击者，`event.notice_id` 为事件 ID，可作为 `event_id` 被动回复。
:::

### 复杂交互处理

```typescript
import { Bot, segment } from 'qq-official-bot'

const bot = new Bot(config)

// 游戏状态管理
const gameStates = new Map<string, any>()

// 发送游戏界面
async function sendGameInterface(channelId: string, userId: string) {
  const gameState = gameStates.get(userId) || { score: 0, level: 1 }
  
  const buttons = [
    {
      id: 'game_start',
      render_data: { label: '开始游戏', style: 4 },
      action: { type: 1, data: 'start_game' }
    },
    {
      id: 'game_score',
      render_data: { label: '查看分数', style: 1 },
      action: { type: 1, data: 'view_score' }
    },
    {
      id: 'game_reset',
      render_data: { label: '重置游戏', style: 3 },
      action: { type: 1, data: 'reset_game' }
    }
  ]
  
  await bot.client.sendMessage(channelId, [
    segment.markdown(`## 🎮 游戏中心\n当前等级: ${gameState.level}\n分数: ${gameState.score}`),
    segment.button({ buttons })
  ])
}

// 处理游戏按钮（频道场景）
bot.on('notice.guild.action', async (event) => {
  await event.reply(0)
  const userId = event.operator_id
  const channelId = event.channel_id
  
  switch (event.data.resolved.button_data) {
    case 'start_game':
      const gameState = gameStates.get(userId) || { score: 0, level: 1 }
      gameState.score += 10
      gameStates.set(userId, gameState)
      
      await sendGameInterface(channelId, userId)
      break
      
    case 'view_score':
      const currentState = gameStates.get(userId) || { score: 0, level: 1 }
      await bot.client.sendMessage(channelId, [
        segment.text(`你的当前分数：${currentState.score}`)
      ])
      break
      
    case 'reset_game':
      gameStates.set(userId, { score: 0, level: 1 })
      await sendGameInterface(channelId, userId)
      break
  }
})
```

## 按钮样式设计

### 常用按钮组合

```typescript
// 确认/取消组合
const confirmCancelButtons = [
  {
    id: 'confirm',
    render_data: { label: '确认', style: 4 }, // 蓝底白字
    action: { type: 1, data: 'confirm' }
  },
  {
    id: 'cancel', 
    render_data: { label: '取消', style: 0 }, // 灰色线框
    action: { type: 1, data: 'cancel' }
  }
]

// 是/否组合
const yesNoButtons = [
  {
    id: 'yes',
    render_data: { label: '是', style: 1 }, // 蓝色线框
    action: { type: 1, data: 'yes' }
  },
  {
    id: 'no',
    render_data: { label: '否', style: 3 }, // 白底红字
    action: { type: 1, data: 'no' }
  }
]

// 数字选择组合
const numberButtons = Array.from({ length: 5 }, (_, i) => ({
  id: `num_${i + 1}`,
  render_data: { label: (i + 1).toString(), style: 1 },
  action: { type: 1, data: `number_${i + 1}` }
}))
```

### 动态按钮状态

```typescript
// 根据状态显示不同按钮
function getStatusButtons(status: string) {
  switch (status) {
    case 'pending':
      return [
        {
          id: 'approve',
          render_data: { label: '批准', style: 4 },
          action: { type: 1, data: 'approve' }
        },
        {
          id: 'reject',
          render_data: { label: '拒绝', style: 3 },
          action: { type: 1, data: 'reject' }
        }
      ]
      
    case 'approved':
      return [
        {
          id: 'view_details',
          render_data: { label: '查看详情', style: 1 },
          action: { type: 1, data: 'view_details' }
        }
      ]
      
    case 'rejected':
      return [
        {
          id: 'resubmit',
          render_data: { label: '重新提交', style: 1 },
          action: { type: 1, data: 'resubmit' }
        }
      ]
      
    default:
      return []
  }
}
```

## 最佳实践

### 按钮文字规范

```typescript
// ✅ 好的做法 - 清晰明确的按钮文字
const goodButtons = [
  { label: '确认删除', style: 3 },
  { label: '取消操作', style: 0 },
  { label: '查看详情', style: 1 }
]

// ❌ 避免的做法 - 模糊不清的按钮文字
const badButtons = [
  { label: '确定', style: 1 },
  { label: '取消', style: 0 },
  { label: '点击', style: 1 }
]
```

### 按钮数量控制

```typescript
// ✅ 合理的按钮数量（每行不超过5个）
const reasonableButtons = [
  { id: 'btn1', render_data: { label: '选项1' } },
  { id: 'btn2', render_data: { label: '选项2' } },
  { id: 'btn3', render_data: { label: '选项3' } }
]

// ❌ 过多的按钮（影响用户体验）
const tooManyButtons = Array.from({ length: 10 }, (_, i) => ({
  id: `btn${i}`,
  render_data: { label: `选项${i + 1}` }
}))
```

### 错误处理

```typescript
bot.on('notice.guild.action', async (event) => {
  try {
    // 处理按钮点击逻辑
    await handleButtonClick(event)
  } catch (error) {
    console.error('按钮处理错误:', error)
    
    // 发送错误提示
    await bot.client.sendMessage(event.channel_id, [
      segment.text('操作失败，请稍后重试。')
    ])
  }
})
```

## 组合规则

按钮消息段的组合规则：

- ✅ **Markdown 消息段** - 必须组合，提供按钮说明
- ❌ **不能与其他消息段组合** - 除 Markdown 外
- ✅ **多个按钮消息段** - 可以发送多行按钮

## 限制说明

1. **必须与 Markdown 组合**：按钮不能单独发送
2. **数量限制**：建议每行不超过5个按钮
3. **权限要求**：需要发送按钮消息的权限
4. **交互限制**：需要处理按钮点击事件
5. **样式限制**：只支持预定义的5种颜色样式
6. **文字长度**：按钮文字不宜过长，建议控制在8字以内
