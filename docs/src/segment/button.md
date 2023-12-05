---
layout: doc
---

# 按钮消息段
- 不可单独发送
- 只能和markdown一起发送
- 必须和markdown一起发送
- 发送格式

按钮有两种发送格式

1. 发送按钮组
   该格式下，一组按钮即为一行，用户可自行控制每行按钮数量

| 属性名     | 属性值          |
|---------|--------------|
| type    | button       |
| buttons | [Button](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/trans/msg-btn.html#%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%E4%B8%8E%E5%8D%8F%E8%AE%AE)[] |

2. 发送按钮
   该格式下，用户发送的按钮将以一行5个按钮自动排列

| 属性名  | 属性值      |
|------|----------|
| type | button   |
| ...  | [Button](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/trans/msg-btn.html#%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%E4%B8%8E%E5%8D%8F%E8%AE%AE) |
