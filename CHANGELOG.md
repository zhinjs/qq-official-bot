# Changelog

## [1.3.1](https://github.com/zhinjs/qq-official-bot/compare/v1.3.0...v1.3.1) (2026-09-04)


### Features

* add group APIs and optional list caches ([c4a133e](https://github.com/zhinjs/qq-official-bot/commit/c4a133eafdad64b3764c5919df5328f9990a5de2))


### Bug Fixes

* 修复官方弃用的 @ 能力格式 ([c559649](https://github.com/zhinjs/qq-official-bot/commit/c559649109ebae3e18c2c4f5ea37e17cc5a873a0))
* 修复官方弃用的 @ 能力格式 ([5cb415d](https://github.com/zhinjs/qq-official-bot/commit/5cb415d7c81b19e808a2867ce7568ae471ca360f))

## [1.3.0](https://github.com/zhinjs/qq-official-bot/compare/v1.2.4...v1.3.0) (2026-08-19)


### Features

* add MenuPanelService and update documentation ([bae451b](https://github.com/zhinjs/qq-official-bot/commit/bae451bb6948b8edecaa547c63dd9c32223e7e75))


### Bug Fixes

* enhance message sending methods and update documentation ([82002bb](https://github.com/zhinjs/qq-official-bot/commit/82002bbc8f1f2a4632ebf2c0f9b883e57a2dd8c4))
* update method names and improve documentation in README ([6b31047](https://github.com/zhinjs/qq-official-bot/commit/6b31047f1f041905f0561f7271d79558ed34c974))
* update README and documentation for group management features ([b44e357](https://github.com/zhinjs/qq-official-bot/commit/b44e357d1f512d8976561bc316d9288ab2881a11))

## [1.2.4](https://github.com/zhinjs/qq-official-bot/compare/v1.2.3...v1.2.4) (2026-08-07)


### Bug Fixes

* distinguish GROUP_MESSAGE_CREATE and GROUP_AT_MESSAGE_CREATE events ([43362f4](https://github.com/zhinjs/qq-official-bot/commit/43362f46de9828f762b2ab7e6e80b09df6a60ac4))
* distinguish GROUP_MESSAGE_CREATE and GROUP_AT_MESSAGE_CREATE events ([084745b](https://github.com/zhinjs/qq-official-bot/commit/084745bdab584b3683f73baacc3a38546f5a7214))
* 修复群相关事件内无法获取发送者的权限(群成员(member)/群管理(admin)/群主(owner))的问题 ([c4a5445](https://github.com/zhinjs/qq-official-bot/commit/c4a54454bbcdc9079472eeba5799cf36be73267b))
* 修复群相关事件内无法获取发送者的权限(群成员(member)/群管理(admin)/群主(owner))的问题 ([2fcf3a9](https://github.com/zhinjs/qq-official-bot/commit/2fcf3a9780cf2696d4c55a9081f2fe03c445abe2))

## [1.2.3](https://github.com/zhinjs/qq-official-bot/compare/v1.2.2...v1.2.3) (2026-06-18)


### Bug Fixes

* add GROUP_MEMBER intent and implement group member change event handling ([ecbdcc1](https://github.com/zhinjs/qq-official-bot/commit/ecbdcc189ef02a4fe31a2a9dda6c608f8724f986))

## [1.2.2](https://github.com/zhinjs/qq-official-bot/compare/v1.2.1...v1.2.2) (2026-06-09)


### Bug Fixes

* 更新文档 ([d8da9dc](https://github.com/zhinjs/qq-official-bot/commit/d8da9dcddfc18e64d6cff40dcc853bb4b3d5702a))

## [1.2.1](https://github.com/zhinjs/qq-official-bot/compare/v1.2.0...v1.2.1) (2026-05-23)


### Bug Fixes

* set msg_type for non-reply private/group media messages ([78323b4](https://github.com/zhinjs/qq-official-bot/commit/78323b45c9ad95acb2381dfc28b9397246ea663f))

## [1.2.0](https://github.com/zhinjs/qq-official-bot/compare/v1.1.3...v1.2.0) (2026-05-19)


### Features

* add event GROUP_MESSAGE_CREATE ([77211a4](https://github.com/zhinjs/qq-official-bot/commit/77211a49acb4bc92d9c0f57de07aefd7a2bd1751))
* reply event_id ([e3d02cc](https://github.com/zhinjs/qq-official-bot/commit/e3d02cc0d4314b51b54e655c2c7f3a1f09629719))


### Bug Fixes

* actions/checkout@v4,actions/setup-node@v4,add package-lock.json ([646493b](https://github.com/zhinjs/qq-official-bot/commit/646493b68ee33a544c93fce4901d8f9ca2fa8733))
* add group/user recall msg method ([73663b9](https://github.com/zhinjs/qq-official-bot/commit/73663b9297571f72efcf3c3d57c7eff03c630c16))
* address timer and typing review feedback ([2bfcaf3](https://github.com/zhinjs/qq-official-bot/commit/2bfcaf3b5609f7dcf86b391f2142eb1c4ea12ff3))
* auth use bot ([1b86295](https://github.com/zhinjs/qq-official-bot/commit/1b862954d7aeb7eb31a98327ccc6df6d2a993a8c))
* avoid duplicate reconnect path on websocket close ([84aedff](https://github.com/zhinjs/qq-official-bot/commit/84aedffd6310be237849d0501b03ae6545f985e2))
* cap auth auto-refresh retry attempts ([bb38832](https://github.com/zhinjs/qq-official-bot/commit/bb38832ee1a641c18ddd77b064f06d5eeaa0e683))
* change error method name ([b613ab4](https://github.com/zhinjs/qq-official-bot/commit/b613ab473e6b6ae8285541cede7d1edc433dd365))
* change reactionGuildMessage to addGuildMessageReaction ([8ffbdc4](https://github.com/zhinjs/qq-official-bot/commit/8ffbdc41ade6fdb309c569df494a82c824f5fa31))
* code error ([25ad7ee](https://github.com/zhinjs/qq-official-bot/commit/25ad7ee330c283da3c3ee3daa4741545defd55d0))
* event_id不能发送media富媒体 ([1d45ae3](https://github.com/zhinjs/qq-official-bot/commit/1d45ae31817b89813c98f7574be446a837cac927))
* file:// 开头无法发送，同时带 reply file 无法发送 ([831fbb8](https://github.com/zhinjs/qq-official-bot/commit/831fbb8a796b4939b0dbc3029dd12c756ee86948))
* for build ([2472b31](https://github.com/zhinjs/qq-official-bot/commit/2472b311c4d853d8f18c15c93dd80f67bf9a5655))
* for build ([c262a2d](https://github.com/zhinjs/qq-official-bot/commit/c262a2de2521242717c814c0cb336864c15363e9))
* friendly error ([2bc6360](https://github.com/zhinjs/qq-official-bot/commit/2bc63601110a12e85e4b3f8c0ea4351ca020cfbb))
* friendly img brief ([e8d6d65](https://github.com/zhinjs/qq-official-bot/commit/e8d6d65346f6908d4d5d8c91c7a5f32052be6ba4))
* friendly img brief ([706b572](https://github.com/zhinjs/qq-official-bot/commit/706b5728ed9b390d87c8b686c1b2d0e401abaeed))
* friendly media brief ([6993156](https://github.com/zhinjs/qq-official-bot/commit/6993156e066a9d16335b9730c93939ada985d4d0))
* friendly media brief ([ca003a8](https://github.com/zhinjs/qq-official-bot/commit/ca003a8a0ec23ec963ec5c97a0de85a9b8ec9661))
* harden websocket reconnect and token refresh scheduling ([e8a8cf3](https://github.com/zhinjs/qq-official-bot/commit/e8a8cf30159aee06479a477e5075b34023dbec02))
* improve token refresh retry timing and preserve websocket zero values ([c8e6684](https://github.com/zhinjs/qq-official-bot/commit/c8e66840410a8d4a497dc0be7459bde15b9492c2))
* local file ([c97014a](https://github.com/zhinjs/qq-official-bot/commit/c97014ac78a017bca6436635bed3dec23a1b5509))
* message_id错误 ([5c393d7](https://github.com/zhinjs/qq-official-bot/commit/5c393d7b3f2c451aaee62efeade17cdfe853f2f0))
* normalize token expiry and retry limit check ([aa86d71](https://github.com/zhinjs/qq-official-bot/commit/aa86d716fb4b236974d3b49c6b68c3b1b94cc1ca))
* optimize the return value of active message audit ([deb57d1](https://github.com/zhinjs/qq-official-bot/commit/deb57d1c31a35d04d474891017233c5dd5add231))
* package-lock ([fccdba3](https://github.com/zhinjs/qq-official-bot/commit/fccdba34f8b9e9aa0b3ead5957e715cbaf64ab3e))
* pub error ([27f7179](https://github.com/zhinjs/qq-official-bot/commit/27f7179bb88cfd0e3df7305e2f885b6af3678466))
* remove chagne log ([00cfdd5](https://github.com/zhinjs/qq-official-bot/commit/00cfdd5b56193053ea41d44c29b652f217eaef57))
* remove version specification for pnpm setup in workflows ([c7fbd38](https://github.com/zhinjs/qq-official-bot/commit/c7fbd38afa67d38ee707dd64177c891f7fc4cc15))
* removeAt配置无效问题 ([b20fee8](https://github.com/zhinjs/qq-official-bot/commit/b20fee8b41ad2082bfb3d22802f6d8ead6cd0044))
* rename and transfer ([98c2f95](https://github.com/zhinjs/qq-official-bot/commit/98c2f95e089c1aade271456359ef74b329d4590f))
* replyAction ([2d6a4ff](https://github.com/zhinjs/qq-official-bot/commit/2d6a4ff03207c744444a12b4c84c00fe65288d67))
* replyAction ([0fe0831](https://github.com/zhinjs/qq-official-bot/commit/0fe0831284176eb4a4ac22b12569f9056e885c36))
* replyAction ([decec4b](https://github.com/zhinjs/qq-official-bot/commit/decec4bf4261f96fdf883657a1fd6be7559a0cda))
* string msg ([4395f28](https://github.com/zhinjs/qq-official-bot/commit/4395f28eed5395c4f74790ec80d455a12ebab93f))
* trim whitespace from payload content in message parser ([63239ee](https://github.com/zhinjs/qq-official-bot/commit/63239eecc0b665702c126451281fc43905e9fc57))
* update .gitignore and package dependencies, add pnpm overrides for esbuild and vite ([b10dda9](https://github.com/zhinjs/qq-official-bot/commit/b10dda9b874be2a749a5acdf23652292e82a479b))
* update axios and ws dependencies to latest versions ([e603a2f](https://github.com/zhinjs/qq-official-bot/commit/e603a2f1fcd45657bbf3964abf8864e6a471df49))
* Update Build Docs Action ([99fcfe7](https://github.com/zhinjs/qq-official-bot/commit/99fcfe7dab8c68ae3bf4345c4aa724f414837405))
* Update Build Docs Action ([5bcf0e2](https://github.com/zhinjs/qq-official-bot/commit/5bcf0e2a2671935015ca90b8ad4ba20ad36f8a80))
* Update Build Docs Action ([df6cf2b](https://github.com/zhinjs/qq-official-bot/commit/df6cf2b5bf3e6759b9b065c33ef69eba00e56ed8))
* Update Release Action ([e691408](https://github.com/zhinjs/qq-official-bot/commit/e691408c0aa6df71c430f70e5c9189e7e5eb2c47))
* update type casting for receiver creation in session manager ([4247397](https://github.com/zhinjs/qq-official-bot/commit/4247397eb48f4596736f168e0893ff21636b4ef0))
* uploadMedia接口对base64://的支持 ([5d8945f](https://github.com/zhinjs/qq-official-bot/commit/5d8945fb5ed5bd0a84ebc0cec2d2b6fcf55356f3))
* uploadMedia接口暴露 ([5de0523](https://github.com/zhinjs/qq-official-bot/commit/5de0523371cf5bd6bad163bfb72a75b0ebc38505))
* use ali mirror ([2fc7690](https://github.com/zhinjs/qq-official-bot/commit/2fc7690016c53c7a8c91750951670192c9c24063))
* 事件未触发 ([7a0a371](https://github.com/zhinjs/qq-official-bot/commit/7a0a3717f96feed995c3642d5e3e3fbd2b24ee2f))
* 事件错误 ([15f103d](https://github.com/zhinjs/qq-official-bot/commit/15f103ded1eef539a382df16fb1f9ac984e213f2))
* 仅对支持的内容进行解码 ([bdbe0b9](https://github.com/zhinjs/qq-official-bot/commit/bdbe0b9657d8ec6d8cf0f85bbda5f2194e6d81eb))
* 使用 formdata-node ([5ad543c](https://github.com/zhinjs/qq-official-bot/commit/5ad543c68a8170890e69a03262e4941cf964181f))
* 使用ReadStream替代blob ([d6b35b5](https://github.com/zhinjs/qq-official-bot/commit/d6b35b579bc0440f02750ce46ccd933edcab228e))
* 修复removeAt ([14ac67d](https://github.com/zhinjs/qq-official-bot/commit/14ac67db3a39abff67ea23530583210e2f3f2720))
* 修复webhook未正确响应事件 ([1f877ea](https://github.com/zhinjs/qq-official-bot/commit/1f877eaba1cd61a05bf172d40e6b68497a691345))
* 修复webhook未正确响应事件 ([3bdc38c](https://github.com/zhinjs/qq-official-bot/commit/3bdc38ce257d5495a3188ebc516b4ad1f192d5f9))
* 修复获取表态用户列表错误 ([0030d98](https://github.com/zhinjs/qq-official-bot/commit/0030d98c49435cbe97409f1001cf1b7b9ac37a21))
* 允许关闭 ([10005e8](https://github.com/zhinjs/qq-official-bot/commit/10005e816f081dbf625d709c8ee39f563662e8f8))
* 允许多例 ([c9b2268](https://github.com/zhinjs/qq-official-bot/commit/c9b2268c0a9aac030b33ddde385cf756580e7b27))
* 关闭失败 ([103fab2](https://github.com/zhinjs/qq-official-bot/commit/103fab250a85870dbf915c407754ef48caba3281))
* 发送完消息，消息数组没了 ([2865945](https://github.com/zhinjs/qq-official-bot/commit/2865945ebbd63f8258321327bc3a549a2c40206b))
* 图片/语音/视频发送修复 ([1cf39c3](https://github.com/zhinjs/qq-official-bot/commit/1cf39c3f1588a5e564592fb2645b7938bf7b58e7))
* 图片发送不存本地 ([efa0b48](https://github.com/zhinjs/qq-official-bot/commit/efa0b48fec7c61dd261ba3893a6e366598ae744f))
* 图片发送修复 ([66f24d1](https://github.com/zhinjs/qq-official-bot/commit/66f24d185ceae5a4df34cee150e13d9c96aac5e5))
* 图片发送修复 ([029b578](https://github.com/zhinjs/qq-official-bot/commit/029b578dffc65dd7133031f4b1e5d46ba463cebc))
* 图片接收修复 ([ad50b4c](https://github.com/zhinjs/qq-official-bot/commit/ad50b4ce8e89ad151d83ee3c7ab210511122527f))
* 增加KeyboardElem 用于发送按钮模板； ([857edaf](https://github.com/zhinjs/qq-official-bot/commit/857edaf9ec5d9305a5b94a662d029a2d46dfdb13))
* 增加KeyboardElem 用于发送按钮模板； ([77414c3](https://github.com/zhinjs/qq-official-bot/commit/77414c3afc96c38bb004b78d69c69a4f7fba322c))
* 增加主动消息开启/拒绝事件 ([6470a14](https://github.com/zhinjs/qq-official-bot/commit/6470a1457f899e6a7b60ee29030bbab3b4504581))
* 增加操作回应能力 ([3bc4548](https://github.com/zhinjs/qq-official-bot/commit/3bc45485f73f842c3c3cb360b799fd7a1488db65))
* 增加连接方式选择 ([45358b0](https://github.com/zhinjs/qq-official-bot/commit/45358b0fc70d42f282b0666b3a2a45ae8c910a35))
* 增加连接方式选择 ([e662ee5](https://github.com/zhinjs/qq-official-bot/commit/e662ee517fab3bbace99022e117bcde8dd72f3ff))
* 增加连接方式选择 ([3400d44](https://github.com/zhinjs/qq-official-bot/commit/3400d44c8f852ddf81874239b24f102d0da2a1cd))
* 增加连接方式选择 ([8ef3f47](https://github.com/zhinjs/qq-official-bot/commit/8ef3f47a2c4650a61cea8c0730224ac7e27d4e4e))
* 增加音频/直播/论坛子频道事件 ([37b6ce2](https://github.com/zhinjs/qq-official-bot/commit/37b6ce2770b20152ea4b532d3c507871732f4540))
* 增加频道上下麦接口 ([7778073](https://github.com/zhinjs/qq-official-bot/commit/7778073bee0c7e3f99f54b059308e9f64e9eb026))
* 增加频道帖子相关接口 ([7778073](https://github.com/zhinjs/qq-official-bot/commit/7778073bee0c7e3f99f54b059308e9f64e9eb026))
* 增加频道日程相关接口 ([7778073](https://github.com/zhinjs/qq-official-bot/commit/7778073bee0c7e3f99f54b059308e9f64e9eb026))
* 增加频道音频控制接口 ([7778073](https://github.com/zhinjs/qq-official-bot/commit/7778073bee0c7e3f99f54b059308e9f64e9eb026))
* 增强代码健壮性 ([6f112c5](https://github.com/zhinjs/qq-official-bot/commit/6f112c57b8ef7a64c9b28b496e676e50254c0ca1))
* 处理空包 ([4bf36eb](https://github.com/zhinjs/qq-official-bot/commit/4bf36eb3914e958564c430ecf501897434de68e9))
* 完善类型约束 ([b437359](https://github.com/zhinjs/qq-official-bot/commit/b437359a909c96cac1d0406c06cd9e24d25e4ffe))
* 将direct事件移动至private事件 ([37b6ce2](https://github.com/zhinjs/qq-official-bot/commit/37b6ce2770b20152ea4b532d3c507871732f4540))
* 将报错信息输出到debug ([bc4aabf](https://github.com/zhinjs/qq-official-bot/commit/bc4aabfcfe6e6df0c1c4b3381e7ce9a21d2459bc))
* 按钮操作格式化 ([7af8bd7](https://github.com/zhinjs/qq-official-bot/commit/7af8bd7eafbc758b07977d402cfcb8d47cc908d1))
* 接收频道消息表态后无法响应消息 ([9ed7cb9](https://github.com/zhinjs/qq-official-bot/commit/9ed7cb942c6cafc745807ebce579d080ca298648))
* 支持发送ark/embed （仅频道和频道私信支持） ([fe4dacd](https://github.com/zhinjs/qq-official-bot/commit/fe4dacdc376f6ba3fa60c34e17f70b012965912a))
* 支持频道消息表态添加删除事件 ([0d8aabd](https://github.com/zhinjs/qq-official-bot/commit/0d8aabdf12c5b161fa7b7f4b3a1fafb6d7b0fbf8))
* 文档错误，类型错误 ([f00b11a](https://github.com/zhinjs/qq-official-bot/commit/f00b11a9c78910ffa9951bf3d2851f78e9c2300c))
* 更新axios版本 ([fd63426](https://github.com/zhinjs/qq-official-bot/commit/fd63426136e2459551390aaf8e3189b2429884a0))
* 消息模板字符串不解析Bug ([2d98fec](https://github.com/zhinjs/qq-official-bot/commit/2d98fec8006e16f275bad5495c3c4fc4e1e78e7b))
* 添加加群链接 ([5a02297](https://github.com/zhinjs/qq-official-bot/commit/5a02297a282657d1b631ad9cde182cc0c681a8a0))
* 添加接口 getGuildInfo ([fc14a4a](https://github.com/zhinjs/qq-official-bot/commit/fc14a4ad58ee5a52b3f56654e47a085b0e5267ca))
* 添加接口类型声明 ([ebf3383](https://github.com/zhinjs/qq-official-bot/commit/ebf338343ad9df9591372bc857bc6037d398742b))
* 添加撤回消息接口（仅频道私信和子频道消息可用） ([852d100](https://github.com/zhinjs/qq-official-bot/commit/852d100a9554314228721db76eaab1601c3f9eb2))
* 添加部分文档 ([a577036](https://github.com/zhinjs/qq-official-bot/commit/a577036557cf4c601cfef91403a92f11d8122898))
* 移除无用依赖 ([677beb9](https://github.com/zhinjs/qq-official-bot/commit/677beb969951bf53fc9df76a1c185c6d121d0a3e))
* 移除无用依赖 ([4721390](https://github.com/zhinjs/qq-official-bot/commit/47213908dcf87e7ad77aa816069c4a1ded6e3d84))
* 移除无用依赖 ([fdbf6b6](https://github.com/zhinjs/qq-official-bot/commit/fdbf6b6a0ee0e8fc1658d93ebe84446bcf6e1f0a))
* 类型提示优化 ([388a985](https://github.com/zhinjs/qq-official-bot/commit/388a9851b600c027f585a7732f9c6ae910c850cd))
* 编译类型错误 ([8259f7d](https://github.com/zhinjs/qq-official-bot/commit/8259f7df6da1004557c72b762b78c5ef70d3cf2a))
* 群聊、私信支持本地文件/base64/Buffer/网络url发送 ([a12b24e](https://github.com/zhinjs/qq-official-bot/commit/a12b24ef41521d999e6bfdadb581604bc3e90da3))
* 群聊支持发送Ark ([c2d5e7d](https://github.com/zhinjs/qq-official-bot/commit/c2d5e7df05df73162370d060a0617636e14108b2))
* 获取频道消息 ([2525399](https://github.com/zhinjs/qq-official-bot/commit/252539952c7ce5d9970b1a45ec868b4c79782e21))
* 被动回复失败 ([7273ed8](https://github.com/zhinjs/qq-official-bot/commit/7273ed83cd63b552b23029d86a413728c1f235c3))
* 请求支持配置超时时间(config.timeout) 默认为5秒 ([ce8e70f](https://github.com/zhinjs/qq-official-bot/commit/ce8e70f82e442b6a548f951868ebc3029f137a67))
* 返回引用消息的信息，reply类型的message_id改为id ([a11bfc2](https://github.com/zhinjs/qq-official-bot/commit/a11bfc249c5bcb5d819cd86519e630c9367932a8))
* 连接出错标明原因，事件解析失败增加debug日志 ([c2b77f2](https://github.com/zhinjs/qq-official-bot/commit/c2b77f2256f03d0fc74b10f6c25444a0ae3cf121))
* 通知事件格式化 ([cd3b5a7](https://github.com/zhinjs/qq-official-bot/commit/cd3b5a7f95ed23fecf43d3aa9953a147df455273))
* 重复监听ws事件问题 ([0107e2c](https://github.com/zhinjs/qq-official-bot/commit/0107e2ca140b52c99687b3199ed6d161c607f5b9))
* 重构结构，增加文档细节 ([6a9c7ab](https://github.com/zhinjs/qq-official-bot/commit/6a9c7ab2ad06078b2c7572677aa2a4bf7d352458))
* 重连错误 ([412f681](https://github.com/zhinjs/qq-official-bot/commit/412f681bf56209b54e73d453aa802082b4631fe0))
* 附件增加 name 字段 ([fd5b519](https://github.com/zhinjs/qq-official-bot/commit/fd5b5190a5e9e410d3ec848e87276b3a76d55e07))
* 频道接口支持上传本地图片或Buffer或base64 ([6fa63eb](https://github.com/zhinjs/qq-official-bot/commit/6fa63ebe3a64f78d7f7e59da43cc0cad4e748dc0))
* 频道接口支持上传本地图片或Buffer或base64 ([256746d](https://github.com/zhinjs/qq-official-bot/commit/256746dcb482e234ed7e2482e7a8126f07367efd))
* 频道消息增加消息表态能力 ([3bc4548](https://github.com/zhinjs/qq-official-bot/commit/3bc45485f73f842c3c3cb360b799fd7a1488db65))

## [1.1.3](https://github.com/zhinjs/qq-official-bot/compare/v1.1.2...v1.1.3) (2026-05-19)


### Bug Fixes

* remove version specification for pnpm setup in workflows ([c7fbd38](https://github.com/zhinjs/qq-official-bot/commit/c7fbd38afa67d38ee707dd64177c891f7fc4cc15))
* update .gitignore and package dependencies, add pnpm overrides for esbuild and vite ([b10dda9](https://github.com/zhinjs/qq-official-bot/commit/b10dda9b874be2a749a5acdf23652292e82a479b))
* update axios and ws dependencies to latest versions ([e603a2f](https://github.com/zhinjs/qq-official-bot/commit/e603a2f1fcd45657bbf3964abf8864e6a471df49))
* 修复removeAt ([14ac67d](https://github.com/zhinjs/qq-official-bot/commit/14ac67db3a39abff67ea23530583210e2f3f2720))

## [1.1.2](https://github.com/zhinjs/qq-official-bot/compare/v1.1.1...v1.1.2) (2026-05-16)


### Bug Fixes

* update type casting for receiver creation in session manager ([4247397](https://github.com/zhinjs/qq-official-bot/commit/4247397eb48f4596736f168e0893ff21636b4ef0))

## [1.1.1](https://github.com/zhinjs/qq-official-bot/compare/v1.1.0...v1.1.1) (2026-05-16)


### Bug Fixes

* address timer and typing review feedback ([2bfcaf3](https://github.com/zhinjs/qq-official-bot/commit/2bfcaf3b5609f7dcf86b391f2142eb1c4ea12ff3))
* avoid duplicate reconnect path on websocket close ([84aedff](https://github.com/zhinjs/qq-official-bot/commit/84aedffd6310be237849d0501b03ae6545f985e2))
* cap auth auto-refresh retry attempts ([bb38832](https://github.com/zhinjs/qq-official-bot/commit/bb38832ee1a641c18ddd77b064f06d5eeaa0e683))
* harden websocket reconnect and token refresh scheduling ([e8a8cf3](https://github.com/zhinjs/qq-official-bot/commit/e8a8cf30159aee06479a477e5075b34023dbec02))
* improve token refresh retry timing and preserve websocket zero values ([c8e6684](https://github.com/zhinjs/qq-official-bot/commit/c8e66840410a8d4a497dc0be7459bde15b9492c2))
* normalize token expiry and retry limit check ([aa86d71](https://github.com/zhinjs/qq-official-bot/commit/aa86d716fb4b236974d3b49c6b68c3b1b94cc1ca))

## [1.1.0](https://github.com/zhinjs/qq-official-bot/compare/v1.0.13...v1.1.0) (2026-05-14)


### Features

* add event GROUP_MESSAGE_CREATE ([77211a4](https://github.com/zhinjs/qq-official-bot/commit/77211a49acb4bc92d9c0f57de07aefd7a2bd1751))


### Bug Fixes

* auth use bot ([1b86295](https://github.com/zhinjs/qq-official-bot/commit/1b862954d7aeb7eb31a98327ccc6df6d2a993a8c))

## [1.0.13](https://github.com/zhinjs/qq-official-bot/compare/v1.0.12...v1.0.13) (2026-04-30)


### Bug Fixes

* for build ([c262a2d](https://github.com/zhinjs/qq-official-bot/commit/c262a2de2521242717c814c0cb336864c15363e9))

## [1.0.12](https://github.com/zhinjs/qq-official-bot/compare/v1.0.11...v1.0.12) (2026-01-21)


### Bug Fixes

* trim whitespace from payload content in message parser ([63239ee](https://github.com/zhinjs/qq-official-bot/commit/63239eecc0b665702c126451281fc43905e9fc57))

## [1.0.11](https://github.com/zhinjs/qq-official-bot/compare/v1.0.10...v1.0.11) (2025-09-09)


### Bug Fixes

* pub error ([27f7179](https://github.com/zhinjs/qq-official-bot/commit/27f7179bb88cfd0e3df7305e2f885b6af3678466))
* 允许多例 ([c9b2268](https://github.com/zhinjs/qq-official-bot/commit/c9b2268c0a9aac030b33ddde385cf756580e7b27))

## [1.0.10](https://github.com/zhinjs/qq-official-bot/compare/v1.0.9...v1.0.10) (2025-07-20)


### Bug Fixes

* 移除无用依赖 ([677beb9](https://github.com/zhinjs/qq-official-bot/commit/677beb969951bf53fc9df76a1c185c6d121d0a3e))

## [1.0.9](https://github.com/zhinjs/qq-official-bot/compare/v1.0.8...v1.0.9) (2025-07-20)


### Bug Fixes

* 移除无用依赖 ([4721390](https://github.com/zhinjs/qq-official-bot/commit/47213908dcf87e7ad77aa816069c4a1ded6e3d84))
* 移除无用依赖 ([fdbf6b6](https://github.com/zhinjs/qq-official-bot/commit/fdbf6b6a0ee0e8fc1658d93ebe84446bcf6e1f0a))

## [1.0.8](https://github.com/zhinjs/qq-official-bot/compare/v1.0.7...v1.0.8) (2025-07-20)


### Bug Fixes

* 事件未触发 ([7a0a371](https://github.com/zhinjs/qq-official-bot/commit/7a0a3717f96feed995c3642d5e3e3fbd2b24ee2f))

## [1.0.7](https://github.com/zhinjs/qq-official-bot/compare/v1.0.6...v1.0.7) (2025-06-02)


### Bug Fixes

* 更新axios版本 ([fd63426](https://github.com/zhinjs/qq-official-bot/commit/fd63426136e2459551390aaf8e3189b2429884a0))

## [1.0.6](https://github.com/zhinjs/qq-official-bot/compare/v1.0.5...v1.0.6) (2025-06-02)


### Bug Fixes

* 重构结构，增加文档细节 ([6a9c7ab](https://github.com/zhinjs/qq-official-bot/commit/6a9c7ab2ad06078b2c7572677aa2a4bf7d352458))

## [1.0.5](https://github.com/zhinjs/qq-official-bot/compare/v1.0.4...v1.0.5) (2025-05-16)


### Bug Fixes

* 修复webhook未正确响应事件 ([1f877ea](https://github.com/zhinjs/qq-official-bot/commit/1f877eaba1cd61a05bf172d40e6b68497a691345))
* 修复webhook未正确响应事件 ([3bdc38c](https://github.com/zhinjs/qq-official-bot/commit/3bdc38ce257d5495a3188ebc516b4ad1f192d5f9))
* 文档错误，类型错误 ([f00b11a](https://github.com/zhinjs/qq-official-bot/commit/f00b11a9c78910ffa9951bf3d2851f78e9c2300c))

## [1.0.4](https://github.com/zhinjs/qq-official-bot/compare/v1.0.3...v1.0.4) (2024-12-27)


### Bug Fixes

* 增加连接方式选择 ([45358b0](https://github.com/zhinjs/qq-official-bot/commit/45358b0fc70d42f282b0666b3a2a45ae8c910a35))
* 增加连接方式选择 ([e662ee5](https://github.com/zhinjs/qq-official-bot/commit/e662ee517fab3bbace99022e117bcde8dd72f3ff))
* 增加连接方式选择 ([3400d44](https://github.com/zhinjs/qq-official-bot/commit/3400d44c8f852ddf81874239b24f102d0da2a1cd))
* 增加连接方式选择 ([8ef3f47](https://github.com/zhinjs/qq-official-bot/commit/8ef3f47a2c4650a61cea8c0730224ac7e27d4e4e))

## [1.0.3](https://github.com/zhinjs/qq-official-bot/compare/v1.0.2...v1.0.3) (2024-09-27)


### Bug Fixes

* optimize the return value of active message audit ([deb57d1](https://github.com/zhinjs/qq-official-bot/commit/deb57d1c31a35d04d474891017233c5dd5add231))

## [1.0.2](https://github.com/zhinjs/qq-official-bot/compare/v1.0.1...v1.0.2) (2024-08-26)


### Bug Fixes

* 接收频道消息表态后无法响应消息 ([9ed7cb9](https://github.com/zhinjs/qq-official-bot/commit/9ed7cb942c6cafc745807ebce579d080ca298648))

## [1.0.1](https://github.com/zhinjs/qq-official-bot/compare/v1.0.0...v1.0.1) (2024-08-09)


### Bug Fixes

* event_id不能发送media富媒体 ([1d45ae3](https://github.com/zhinjs/qq-official-bot/commit/1d45ae31817b89813c98f7574be446a837cac927))

## 1.0.0 (2024-07-05)


### Features

* reply event_id ([e3d02cc](https://github.com/zhinjs/qq-official-bot/commit/e3d02cc0d4314b51b54e655c2c7f3a1f09629719))


### Bug Fixes

* actions/checkout@v4,actions/setup-node@v4,add package-lock.json ([646493b](https://github.com/zhinjs/qq-official-bot/commit/646493b68ee33a544c93fce4901d8f9ca2fa8733))
* add group/user recall msg method ([73663b9](https://github.com/zhinjs/qq-official-bot/commit/73663b9297571f72efcf3c3d57c7eff03c630c16))
* change error method name ([b613ab4](https://github.com/zhinjs/qq-official-bot/commit/b613ab473e6b6ae8285541cede7d1edc433dd365))
* change reactionGuildMessage to addGuildMessageReaction ([8ffbdc4](https://github.com/zhinjs/qq-official-bot/commit/8ffbdc41ade6fdb309c569df494a82c824f5fa31))
* code error ([25ad7ee](https://github.com/zhinjs/qq-official-bot/commit/25ad7ee330c283da3c3ee3daa4741545defd55d0))
* file:// 开头无法发送，同时带 reply file 无法发送 ([831fbb8](https://github.com/zhinjs/qq-official-bot/commit/831fbb8a796b4939b0dbc3029dd12c756ee86948))
* friendly error ([2bc6360](https://github.com/zhinjs/qq-official-bot/commit/2bc63601110a12e85e4b3f8c0ea4351ca020cfbb))
* friendly img brief ([e8d6d65](https://github.com/zhinjs/qq-official-bot/commit/e8d6d65346f6908d4d5d8c91c7a5f32052be6ba4))
* friendly img brief ([706b572](https://github.com/zhinjs/qq-official-bot/commit/706b5728ed9b390d87c8b686c1b2d0e401abaeed))
* friendly media brief ([6993156](https://github.com/zhinjs/qq-official-bot/commit/6993156e066a9d16335b9730c93939ada985d4d0))
* friendly media brief ([ca003a8](https://github.com/zhinjs/qq-official-bot/commit/ca003a8a0ec23ec963ec5c97a0de85a9b8ec9661))
* local file ([c97014a](https://github.com/zhinjs/qq-official-bot/commit/c97014ac78a017bca6436635bed3dec23a1b5509))
* message_id错误 ([5c393d7](https://github.com/zhinjs/qq-official-bot/commit/5c393d7b3f2c451aaee62efeade17cdfe853f2f0))
* package-lock ([fccdba3](https://github.com/zhinjs/qq-official-bot/commit/fccdba34f8b9e9aa0b3ead5957e715cbaf64ab3e))
* remove chagne log ([00cfdd5](https://github.com/zhinjs/qq-official-bot/commit/00cfdd5b56193053ea41d44c29b652f217eaef57))
* removeAt配置无效问题 ([b20fee8](https://github.com/zhinjs/qq-official-bot/commit/b20fee8b41ad2082bfb3d22802f6d8ead6cd0044))
* rename and transfer ([98c2f95](https://github.com/zhinjs/qq-official-bot/commit/98c2f95e089c1aade271456359ef74b329d4590f))
* replyAction ([0fe0831](https://github.com/zhinjs/qq-official-bot/commit/0fe0831284176eb4a4ac22b12569f9056e885c36))
* replyAction ([decec4b](https://github.com/zhinjs/qq-official-bot/commit/decec4bf4261f96fdf883657a1fd6be7559a0cda))
* string msg ([4395f28](https://github.com/zhinjs/qq-official-bot/commit/4395f28eed5395c4f74790ec80d455a12ebab93f))
* Update Build Docs Action ([99fcfe7](https://github.com/zhinjs/qq-official-bot/commit/99fcfe7dab8c68ae3bf4345c4aa724f414837405))
* Update Build Docs Action ([5bcf0e2](https://github.com/zhinjs/qq-official-bot/commit/5bcf0e2a2671935015ca90b8ad4ba20ad36f8a80))
* Update Build Docs Action ([df6cf2b](https://github.com/zhinjs/qq-official-bot/commit/df6cf2b5bf3e6759b9b065c33ef69eba00e56ed8))
* Update Release Action ([e691408](https://github.com/zhinjs/qq-official-bot/commit/e691408c0aa6df71c430f70e5c9189e7e5eb2c47))
* uploadMedia接口对base64://的支持 ([5d8945f](https://github.com/zhinjs/qq-official-bot/commit/5d8945fb5ed5bd0a84ebc0cec2d2b6fcf55356f3))
* uploadMedia接口暴露 ([5de0523](https://github.com/zhinjs/qq-official-bot/commit/5de0523371cf5bd6bad163bfb72a75b0ebc38505))
* use ali mirror ([2fc7690](https://github.com/zhinjs/qq-official-bot/commit/2fc7690016c53c7a8c91750951670192c9c24063))
* 事件错误 ([15f103d](https://github.com/zhinjs/qq-official-bot/commit/15f103ded1eef539a382df16fb1f9ac984e213f2))
* 仅对支持的内容进行解码 ([bdbe0b9](https://github.com/zhinjs/qq-official-bot/commit/bdbe0b9657d8ec6d8cf0f85bbda5f2194e6d81eb))
* 使用 formdata-node ([5ad543c](https://github.com/zhinjs/qq-official-bot/commit/5ad543c68a8170890e69a03262e4941cf964181f))
* 使用ReadStream替代blob ([d6b35b5](https://github.com/zhinjs/qq-official-bot/commit/d6b35b579bc0440f02750ce46ccd933edcab228e))
* 修复获取表态用户列表错误 ([0030d98](https://github.com/zhinjs/qq-official-bot/commit/0030d98c49435cbe97409f1001cf1b7b9ac37a21))
* 允许关闭 ([10005e8](https://github.com/zhinjs/qq-official-bot/commit/10005e816f081dbf625d709c8ee39f563662e8f8))
* 关闭失败 ([103fab2](https://github.com/zhinjs/qq-official-bot/commit/103fab250a85870dbf915c407754ef48caba3281))
* 发送完消息，消息数组没了 ([2865945](https://github.com/zhinjs/qq-official-bot/commit/2865945ebbd63f8258321327bc3a549a2c40206b))
* 图片/语音/视频发送修复 ([1cf39c3](https://github.com/zhinjs/qq-official-bot/commit/1cf39c3f1588a5e564592fb2645b7938bf7b58e7))
* 图片发送不存本地 ([efa0b48](https://github.com/zhinjs/qq-official-bot/commit/efa0b48fec7c61dd261ba3893a6e366598ae744f))
* 图片发送修复 ([66f24d1](https://github.com/zhinjs/qq-official-bot/commit/66f24d185ceae5a4df34cee150e13d9c96aac5e5))
* 图片发送修复 ([029b578](https://github.com/zhinjs/qq-official-bot/commit/029b578dffc65dd7133031f4b1e5d46ba463cebc))
* 图片接收修复 ([ad50b4c](https://github.com/zhinjs/qq-official-bot/commit/ad50b4ce8e89ad151d83ee3c7ab210511122527f))
* 增加KeyboardElem 用于发送按钮模板； ([77414c3](https://github.com/zhinjs/qq-official-bot/commit/77414c3afc96c38bb004b78d69c69a4f7fba322c))
* 增加主动消息开启/拒绝事件 ([6470a14](https://github.com/zhinjs/qq-official-bot/commit/6470a1457f899e6a7b60ee29030bbab3b4504581))
* 增加操作回应能力 ([3bc4548](https://github.com/zhinjs/qq-official-bot/commit/3bc45485f73f842c3c3cb360b799fd7a1488db65))
* 增加音频/直播/论坛子频道事件 ([37b6ce2](https://github.com/zhinjs/qq-official-bot/commit/37b6ce2770b20152ea4b532d3c507871732f4540))
* 增加频道上下麦接口 ([7778073](https://github.com/zhinjs/qq-official-bot/commit/7778073bee0c7e3f99f54b059308e9f64e9eb026))
* 增加频道帖子相关接口 ([7778073](https://github.com/zhinjs/qq-official-bot/commit/7778073bee0c7e3f99f54b059308e9f64e9eb026))
* 增加频道日程相关接口 ([7778073](https://github.com/zhinjs/qq-official-bot/commit/7778073bee0c7e3f99f54b059308e9f64e9eb026))
* 增加频道音频控制接口 ([7778073](https://github.com/zhinjs/qq-official-bot/commit/7778073bee0c7e3f99f54b059308e9f64e9eb026))
* 增强代码健壮性 ([6f112c5](https://github.com/zhinjs/qq-official-bot/commit/6f112c57b8ef7a64c9b28b496e676e50254c0ca1))
* 处理空包 ([4bf36eb](https://github.com/zhinjs/qq-official-bot/commit/4bf36eb3914e958564c430ecf501897434de68e9))
* 完善类型约束 ([b437359](https://github.com/zhinjs/qq-official-bot/commit/b437359a909c96cac1d0406c06cd9e24d25e4ffe))
* 将direct事件移动至private事件 ([37b6ce2](https://github.com/zhinjs/qq-official-bot/commit/37b6ce2770b20152ea4b532d3c507871732f4540))
* 将报错信息输出到debug ([bc4aabf](https://github.com/zhinjs/qq-official-bot/commit/bc4aabfcfe6e6df0c1c4b3381e7ce9a21d2459bc))
* 按钮操作格式化 ([7af8bd7](https://github.com/zhinjs/qq-official-bot/commit/7af8bd7eafbc758b07977d402cfcb8d47cc908d1))
* 支持发送ark/embed （仅频道和频道私信支持） ([fe4dacd](https://github.com/zhinjs/qq-official-bot/commit/fe4dacdc376f6ba3fa60c34e17f70b012965912a))
* 支持频道消息表态添加删除事件 ([0d8aabd](https://github.com/zhinjs/qq-official-bot/commit/0d8aabdf12c5b161fa7b7f4b3a1fafb6d7b0fbf8))
* 消息模板字符串不解析Bug ([2d98fec](https://github.com/zhinjs/qq-official-bot/commit/2d98fec8006e16f275bad5495c3c4fc4e1e78e7b))
* 添加加群链接 ([5a02297](https://github.com/zhinjs/qq-official-bot/commit/5a02297a282657d1b631ad9cde182cc0c681a8a0))
* 添加接口 getGuildInfo ([fc14a4a](https://github.com/zhinjs/qq-official-bot/commit/fc14a4ad58ee5a52b3f56654e47a085b0e5267ca))
* 添加接口类型声明 ([ebf3383](https://github.com/zhinjs/qq-official-bot/commit/ebf338343ad9df9591372bc857bc6037d398742b))
* 添加撤回消息接口（仅频道私信和子频道消息可用） ([852d100](https://github.com/zhinjs/qq-official-bot/commit/852d100a9554314228721db76eaab1601c3f9eb2))
* 添加部分文档 ([a577036](https://github.com/zhinjs/qq-official-bot/commit/a577036557cf4c601cfef91403a92f11d8122898))
* 类型提示优化 ([388a985](https://github.com/zhinjs/qq-official-bot/commit/388a9851b600c027f585a7732f9c6ae910c850cd))
* 编译类型错误 ([8259f7d](https://github.com/zhinjs/qq-official-bot/commit/8259f7df6da1004557c72b762b78c5ef70d3cf2a))
* 群聊、私信支持本地文件/base64/Buffer/网络url发送 ([a12b24e](https://github.com/zhinjs/qq-official-bot/commit/a12b24ef41521d999e6bfdadb581604bc3e90da3))
* 群聊支持发送Ark ([c2d5e7d](https://github.com/zhinjs/qq-official-bot/commit/c2d5e7df05df73162370d060a0617636e14108b2))
* 获取频道消息 ([2525399](https://github.com/zhinjs/qq-official-bot/commit/252539952c7ce5d9970b1a45ec868b4c79782e21))
* 被动回复失败 ([7273ed8](https://github.com/zhinjs/qq-official-bot/commit/7273ed83cd63b552b23029d86a413728c1f235c3))
* 请求支持配置超时时间(config.timeout) 默认为5秒 ([ce8e70f](https://github.com/zhinjs/qq-official-bot/commit/ce8e70f82e442b6a548f951868ebc3029f137a67))
* 返回引用消息的信息，reply类型的message_id改为id ([a11bfc2](https://github.com/zhinjs/qq-official-bot/commit/a11bfc249c5bcb5d819cd86519e630c9367932a8))
* 连接出错标明原因，事件解析失败增加debug日志 ([c2b77f2](https://github.com/zhinjs/qq-official-bot/commit/c2b77f2256f03d0fc74b10f6c25444a0ae3cf121))
* 通知事件格式化 ([cd3b5a7](https://github.com/zhinjs/qq-official-bot/commit/cd3b5a7f95ed23fecf43d3aa9953a147df455273))
* 重复监听ws事件问题 ([0107e2c](https://github.com/zhinjs/qq-official-bot/commit/0107e2ca140b52c99687b3199ed6d161c607f5b9))
* 重连错误 ([412f681](https://github.com/zhinjs/qq-official-bot/commit/412f681bf56209b54e73d453aa802082b4631fe0))
* 附件增加 name 字段 ([fd5b519](https://github.com/zhinjs/qq-official-bot/commit/fd5b5190a5e9e410d3ec848e87276b3a76d55e07))
* 频道接口支持上传本地图片或Buffer或base64 ([6fa63eb](https://github.com/zhinjs/qq-official-bot/commit/6fa63ebe3a64f78d7f7e59da43cc0cad4e748dc0))
* 频道接口支持上传本地图片或Buffer或base64 ([256746d](https://github.com/zhinjs/qq-official-bot/commit/256746dcb482e234ed7e2482e7a8126f07367efd))
* 频道消息增加消息表态能力 ([3bc4548](https://github.com/zhinjs/qq-official-bot/commit/3bc45485f73f842c3c3cb360b799fd7a1488db65))
