---
layout: doc
---

# 素材管理

素材管理用于预先上传 Markdown 图片，获得可重复引用的 `qqbot-media://` 地址，避免依赖公网图片资源。

官方文档：[素材管理](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/material-management.html)

## 一键上传

`uploadImage` 会自动读取文件、计算 MD5/SHA1、申请预签名 URL、上传二进制并完成登记。

```typescript
const image = await bot.materialService.uploadImage('./kline.png')

const content = bot.materialService.imageMarkdown(
    image.url,
    '分时K线',
    800,
    400,
)

await bot.sendGroupMessage(group_openid, segment.markdown(content))
```

也可用 Bot 便捷方法：

```typescript
const image = await bot.uploadMaterialImage(buffer, {
    fileName: 'kline.png',
})
```

支持 `png`、`jpeg`、`gif`、`webp`，单张不超过 10MB。Buffer 和 Base64 输入必须通过 `fileName` 提供带扩展名的文件名。

## 分步上传

```typescript
const prepared = await bot.materialService.prepareImageUpload({
    file_name: 'kline.png',
    file_size: buffer.length,
    content_type: 'image/png',
    md5: fileMd5,
    sha1: fileSha1,
})

// 使用 prepared.presigned_url PUT 原始图片，Content-Type 必须为 image/png。

const image = await bot.materialService.completeImageUpload({
    upload_id: prepared.upload_id,
    md5: uploadEtagWithoutQuotes,
})
```

`upload_id` 有效期为 4 小时。预签名 URL 的有效期以 `expires_in` 为准。

## 查询与删除

```typescript
// 单页查询；next_cursor 为空表示末页
const page = await bot.materialService.getImagesPage()
const nextPage = await bot.materialService.getImagesPage(page.next_cursor)

// 自动遍历全部分页
const images = await bot.getMaterialImages()

// 删除后引用立即失效，但不影响已经发送的消息
await bot.deleteMaterialImage(images[0].image_id)
```

每个机器人最多保留 100 张有效图片。图片自最后一次被消息引用起 90 天内未使用会失效；`preview_url` 是短时效预览地址，不应持久化。
