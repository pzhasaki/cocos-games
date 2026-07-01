# 光之小英雄：摇摇打怪

当前阶段：可试玩 Cocos 原型。

## 文档

- [游戏设计文档](docs/01-game-design-document.md)
- [制作与设计规划](docs/02-production-design-plan.md)

这是一个面向小朋友的 Cocos Creator 3.x 竖屏小游戏原型，目标平台优先是 TikTok Mini Game Native runtime。当前平台桥接层也保留 `tt` 命名空间兼容，方便后续按需验证国内抖音/字节小游戏。玩法参考“光之英雄打怪兽”的感觉，但角色、美术和命名都使用原创设定，避免直接使用现成影视 IP。

## 核心玩法

- 小朋友拖动屏幕下半区移动光之小英雄，躲开红色攻击预警。
- 小英雄会自动发射光弹；小朋友摇手机或点“光弹”可以加快攻击。
- 光能条满后，摇一摇或按“超级光线”释放大招。
- 每一关一只不同怪兽，怪兽有不同血量、攻击节奏和外观。
- 过关获得星级和星星，用星星升级光弹、护盾、光线。
- 支持广告激励奖励；“家长区”只做成家长门占位，不直接给儿童展示真实充值。

## 当前文件

- `assets/scripts/LightHeroGame.ts`：主玩法脚本，自动生成首页、战斗、结算、升级、UI、角色和特效。
- `assets/scripts/config/LevelConfig.ts`：关卡和升级数值配置。
- `assets/scripts/platform/DouyinBridge.ts`：小游戏能力桥接，优先使用 `TTMinis.game`，兼容 `tt`，包含登录、缓存、摇一摇、激励视频、震动、Toast。
- `docs/01-game-design-document.md`：更完整的玩法、用户、关卡、美术和商业化设计。
- `docs/02-production-design-plan.md`：版本规划、工程结构、场景结构和制作拆分。
- `project.json`：Cocos Creator 项目元信息。

## 在 Cocos Creator 里运行

1. 用 Cocos Creator 3.8 或更新版本打开 `cocos-games` 文件夹。
2. 新建一个 2D 场景，创建 `Canvas`。
3. 在 `Canvas` 下创建空节点 `GameRoot`，把 `assets/scripts/LightHeroGame.ts` 挂到 `GameRoot`。
4. 点击预览运行。电脑上可拖动英雄，`J` 发射光弹，`K` 开护盾，空格释放满能量大招；真机或小游戏环境可摇手机攻击和放大招。
5. 如果要测试激励视频，在 `LightHeroGame` 组件上填入 TikTok Developer Portal 配置的 `rewardedVideoAdUnitId`。

## TikTok Mini Game 适配要点

- 官方文档入口：https://developers.tiktok.com/doc/develop-your-mini-game
- 当前项目应走 Native runtime，不是普通 WebGL/H5 直接上传。
- Cocos/Laya 项目在源码里直接调用运行时 API；当前桥接层优先使用 `TTMinis.game`，并兼容 `tt`。
- 必接能力至少包括 silent login、rewarded ads、home screen shortcut、revisit from profile；当前代码已调用 silent login，并接了 rewarded ads，shortcut/revisit 还没做。
- 调试工具使用官方 CLI：导出小游戏目录后，在包目录运行 `ttmg dev`。
- 非 Unity 项目包体目标：总包不超过 30 MB，主包不超过 4 MB；正式美术和音频进来后要做分包或资源瘦身。
- TikTok 当前 Mini Games SDK 文档没有把加速度计列为稳定能力；当前代码会尝试兼容 `startAccelerometer`，不可用时降级到按钮/键盘触发大招。
- 正式上线前需要后端接收 `TTMinis.game.login` 返回的 code，并调用 TikTok OAuth 接口换取 OpenID/access token；当前原型只做了客户端 silent login 调用。
- 面向儿童时，广告频次、隐私政策、家长确认、素材版权都要按 TikTok 审核要求处理；当前代码里的“家长区”只是安全占位，不是支付实现。

## 国内抖音/字节小游戏备注

- 如果改投国内抖音小游戏，构建平台选择“字节跳动小游戏 / ByteDance Mini Game”。
- 方向建议竖屏，设计分辨率建议 `720 x 1280`。
- 激励视频广告需要替换为国内抖音小游戏后台广告位 ID。

## 下一步建议

- 用正式美术替换脚本绘制的临时角色和怪兽。
- 加入音效：“哒哒哒”、受击、过关、升级。
- 增加新手引导，但保持文案短、按钮大、节奏快。
- 把数值接入远程配置，方便上线后调关卡难度。
