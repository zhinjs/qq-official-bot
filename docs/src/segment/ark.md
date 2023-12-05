---
layout: doc
---
::: tip
仅频道和频道私信支持
:::
# Ark消息段
- 可单独发送
- 可与 [回复(ReplyElem)](./reply.md)一起发送
- 发送格式

| 属性名         | 属性值                         |
|-------------|-----------------------------|
| type        | ark                         |
| template_id | number                      |
| kv          | {key:string,value:string}[] |

more: 见官方 [Ark](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/type/ark.html#%E5%8F%91%E9%80%81%E6%96%B9%E5%BC%8F)
