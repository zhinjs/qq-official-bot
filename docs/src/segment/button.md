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
| style | number | ❌ | 按钮样式（0=灰色，1=蓝色，2=红色，3=绿色，4=紫色） |

### ButtonAction 参数

| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| type | number | ✅ | 操作类型（0=回调，1=跳转链接，2=指令） |
| permission | ButtonPermission | ❌ | 权限设置 |
| data | string | ❌ | 操作数据 |
| enter | boolean | ❌ | 是否直接发送 |
| reply | boolean | ❌ | 是否回复 |
| anchor | string | ❌ | 指令锚点 |
| unsupport_tips | string | ❌ | 不支持时的提示 |

## 按钮样式

| 样式值 | 颜色 | 用途建议 |
|-------|------|----------|
| 0 | 灰色 | 次要操作、取消操作 |
| 1 | 蓝色 | 主要操作、确认操作 |
| 2 | 红色 | 危险操作、删除操作 |
| 3 | 绿色 | 成功操作、确认操作 |
| 4 | 紫色 | 特殊操作、高级功能 |

## 按钮类型

### 回调按钮 (type: 0)

点击后触发回调事件，不跳转页面。

```typescript
import { segment } from 'qq-official-bot'

// 单个回调按钮
const callbackButton = segment.button({
  id: 'callback_btn_1',
  render_data: {
    label: '点击我',
    visited_label: '已点击',
    style: 1 // 蓝色
  },
  action: {
    type: 0, // 回调类型
    data: 'callback_data_1'
  }
})
```

### 链接按钮 (type: 1)

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
    type: 1, // 链接类型
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
    style: 3 // 绿色
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
      type: 0,
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
    render_data: { label: '是', style: 3 },
    action: { type: 0, data: 'yes' }
  },
  {
    id: 'no_btn', 
    render_data: { label: '否', style: 2 },
    action: { type: 0, data: 'no' }
  },
  {
    id: 'cancel_btn',
    render_data: { label: '取消', style: 0 },
    action: { type: 0, data: 'cancel' }
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
    action: { type: 0, data: 'option1' }
  },
  {
    id: 'option2',
    render_data: { label: '选项2', style: 1 },
    action: { type: 0, data: 'option2' }
  }
]

// 第二行按钮
const secondRow = [
  {
    id: 'back',
    render_data: { label: '返回', style: 0 },
    action: { type: 0, data: 'back' }
  },
  {
    id: 'exit',
    render_data: { label: '退出', style: 2 },
    action: { type: 0, data: 'exit' }
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
    style: 4 // 紫色
  },
  action: {
    type: 0,
    data: 'admin_action',
    permission: {
      type: 2, // 指定用户
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
    style: 4
  },
  action: {
    type: 0,
    data: 'role_action',
    permission: {
      type: 1, // 指定角色
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

// 监听按钮点击事件
bot.on('interaction.button', async (event) => {
  const { data } = event
  
  switch (data) {
    case 'confirm_action':
      await bot.client.sendMessage(event.channel_id, [
        segment.text('操作已确认！')
      ])
      break
      
    case 'cancel_action':
      await bot.client.sendMessage(event.channel_id, [
        segment.text('操作已取消。')
      ])
      break
      
    default:
      console.log('未知按钮点击:', data)
  }
})
```

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
      render_data: { label: '开始游戏', style: 3 },
      action: { type: 0, data: 'start_game' }
    },
    {
      id: 'game_score',
      render_data: { label: '查看分数', style: 1 },
      action: { type: 0, data: 'view_score' }
    },
    {
      id: 'game_reset',
      render_data: { label: '重置游戏', style: 2 },
      action: { type: 0, data: 'reset_game' }
    }
  ]
  
  await bot.client.sendMessage(channelId, [
    segment.markdown(`## 🎮 游戏中心\n当前等级: ${gameState.level}\n分数: ${gameState.score}`),
    segment.button({ buttons })
  ])
}

// 处理游戏按钮
bot.on('interaction.button', async (event) => {
  const userId = event.user_id
  const channelId = event.channel_id
  
  switch (event.data) {
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
    render_data: { label: '确认', style: 3 }, // 绿色
    action: { type: 0, data: 'confirm' }
  },
  {
    id: 'cancel', 
    render_data: { label: '取消', style: 0 }, // 灰色
    action: { type: 0, data: 'cancel' }
  }
]

// 是/否组合
const yesNoButtons = [
  {
    id: 'yes',
    render_data: { label: '是', style: 1 }, // 蓝色
    action: { type: 0, data: 'yes' }
  },
  {
    id: 'no',
    render_data: { label: '否', style: 2 }, // 红色
    action: { type: 0, data: 'no' }
  }
]

// 数字选择组合
const numberButtons = Array.from({ length: 5 }, (_, i) => ({
  id: `num_${i + 1}`,
  render_data: { label: (i + 1).toString(), style: 1 },
  action: { type: 0, data: `number_${i + 1}` }
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
          render_data: { label: '批准', style: 3 },
          action: { type: 0, data: 'approve' }
        },
        {
          id: 'reject',
          render_data: { label: '拒绝', style: 2 },
          action: { type: 0, data: 'reject' }
        }
      ]
      
    case 'approved':
      return [
        {
          id: 'view_details',
          render_data: { label: '查看详情', style: 1 },
          action: { type: 0, data: 'view_details' }
        }
      ]
      
    case 'rejected':
      return [
        {
          id: 'resubmit',
          render_data: { label: '重新提交', style: 4 },
          action: { type: 0, data: 'resubmit' }
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
  { label: '确认删除', style: 2 },
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
bot.on('interaction.button', async (event) => {
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
