import { defineConfig } from 'vitepress'
export default defineConfig({
    themeConfig: {
        nav: [
            { text: '开始', link: '/guide/start', activeMatch: '/guide/' },
            { text: '配置', link: '/config', activeMatch: '/config' },
            { text: 'Changelog', link: 'https://github.com/lc-cn/qq-group-bot/blob/master/CHANGELOG.md', target: '_blank', }
        ],
        sidebar: [
            {
                text: '开始',
                items: [
                    { text: '简介', link: '/guide/instruction' },
                    { text: '快速开始', link: '/guide/start' },
                    { text: '配置', link: '/config' },
                ]
            },
            {
                text: '消息段',
                items: [
                    { text: '文本', link: '/segment/text' },
                    { text: '表情', link: '/segment/face' },
                    { text: '图片', link: '/segment/image' },
                    { text: '语音', link: '/segment/audio' },
                    { text: '视频', link: '/segment/video' },
                    { text: '链接', link: '/segment/link' },
                    { text: 'Markdown', link: '/segment/markdown' },
                    { text: 'button', link: '/segment/button' },
                    { text: 'Ark', link: '/segment/ark' },
                    { text: 'embed', link: '/segment/embed' },
                ]
            },
            {
                text: '公共方法',
                items: [
                    { text: '获取频道列表', link: '/api/getGuildList' },
                    { text: '获取子频道列表', link: '/api/getChannelList' },
                    { text: '获取频道成员列表', link: '/api/getMemberList' },
                    { text: '发送消息到子频道', link: '/api/sendGuildMessage' },
                    { text: '发送频道私信', link: '/api/sendDirectMessage' },
                    { text: '发送群聊消息', link: '/api/sendGroupMessage' },
                    { text: '发送私聊消息', link: '/api/sendPrivateMessage' },
                    { text: '创建频道私信会话', link: '/api/createDirectSession' },
                ]
            }
        ]
    },
    title: 'qq-group-bot',
    srcDir: './src',
    outDir: "./dist",
    lastUpdated: true,
    ignoreDeadLinks: true,
    description: '基于NodeJS的qq官方机器人SDK'
})