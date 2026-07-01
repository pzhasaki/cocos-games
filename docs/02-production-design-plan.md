# 《光之小英雄：摇摇打怪》制作与设计规划

版本：0.1  
日期：2026-06-25

## 1. 制作目标

先做一个能在 Cocos Creator 中跑起来的竖屏 MVP，验证三件事：
- 小孩能不能很快理解拖动躲避和自动攻击。
- 摇一摇释放大招是否足够好玩。
- 每关一个怪兽机制是否能支撑继续玩下去。

MVP 不是堆内容，而是先把核心战斗、关卡配置、升级、广告接口和存档打通。

## 2. 版本规划

### V0.1 原型版

目标：
- 做出可玩的单关战斗。
- 验证触摸移动、自动攻击、怪兽攻击预警、受击、胜负结算。

内容：
- 1 个英雄。
- 1 个怪兽。
- 1 个技能按钮。
- 1 个摇一摇大招。
- 简单结算页。

验收：
- 从首页进入战斗。
- 60 秒内可以击败怪兽。
- 被攻击会扣爱心。
- 光能满后可以摇手机释放大招。

### V0.2 MVP 版

目标：
- 完成完整轻度关卡循环。

内容：
- 5 个怪兽关卡。
- 关卡选择。
- 星级结算。
- 光币奖励。
- 技能升级。
- 本地存档。
- 广告服务模拟层。

验收：
- 玩家可以从第 1 关打到第 5 关。
- 每关怪兽机制不同。
- 技能升级后战斗数值变化明显。
- 关闭游戏后进度还在。

### V0.3 TikTok Mini Game 接入版

目标：
- 接入 TikTok Mini Game Native runtime 构建、广告、设备能力和基础审核材料。

内容：
- TikTok Mini Game 导出和 `ttmg dev` 调试配置。
- 激励视频广告接入。
- 加速度计权限与兼容处理。
- 震动反馈。
- 平台存储或本地存储适配。
- 隐私与合规文案。

验收：
- 能在 TikTok Mini Game DevTool 中运行。
- 广告成功、失败、关闭三种状态都有处理。
- 不支持摇一摇的设备可以长按大招按钮释放。

### V1.0 首发版

目标：
- 达到可上线内容量和完成度。

内容：
- 20-30 个关卡。
- 4 个章节 Boss。
- 怪兽图鉴。
- 8-12 个皮肤或光效。
- 新手引导。
- 音乐音效。
- 运营活动入口预留。

验收：
- 首日体验完整。
- 低端机性能稳定。
- 审核材料齐全。
- 广告策略不阻断主流程。

## 3. Cocos 工程结构

建议目录：

```text
assets/
  scenes/
    Loading.scene
    Home.scene
    LevelSelect.scene
    Battle.scene
    Upgrade.scene
  scripts/
    core/
      GameManager.ts
      EventBus.ts
      SaveManager.ts
      AudioManager.ts
      ResourceManager.ts
    battle/
      BattleController.ts
      HeroController.ts
      MonsterController.ts
      ProjectileController.ts
      SkillController.ts
      ShakeController.ts
      DamageSystem.ts
    level/
      LevelManager.ts
      LevelConfig.ts
      MonsterConfig.ts
      UpgradeConfig.ts
    platform/
      PlatformAdapter.ts
      MiniGameAdapter.ts
      MockPlatformAdapter.ts
      AdService.ts
    ui/
      HomeUI.ts
      BattleHUD.ts
      ResultUI.ts
      UpgradeUI.ts
      ToastUI.ts
  prefabs/
    hero/
    monsters/
    projectile/
    ui/
    vfx/
  data/
    levels.json
    monsters.json
    upgrades.json
  art/
  audio/
```

## 4. 场景结构

### Loading.scene

职责：
- 加载基础配置。
- 初始化存档。
- 预加载首页资源。
- 跳转首页。

节点建议：

```text
Canvas
  SafeArea
    Logo
    ProgressBar
    LoadingText
```

### Home.scene

职责：
- 进入游戏。
- 进入升级页。
- 进入图鉴。
- 设置音效。

节点建议：

```text
Canvas
  Background
  HeroShowcase
  MainButtons
    StartButton
    UpgradeButton
    CollectionButton
    SettingButton
```

### LevelSelect.scene

职责：
- 展示关卡进度。
- 选择可玩关卡。
- 显示每关星级。

节点建议：

```text
Canvas
  ScrollView
    LevelGrid
      LevelButtonPrefab
  BackButton
```

### Battle.scene

职责：
- 承载核心战斗。

节点建议：

```text
Canvas
  World
    Background
    WarningLayer
    MonsterLayer
    HeroLayer
    ProjectileLayer
    VFXLayer
  UI
    BattleHUD
    PausePanel
    GuideTip
    ResultPanel
```

### Upgrade.scene

职责：
- 技能升级。
- 展示当前资源。

节点建议：

```text
Canvas
  CoinBar
  SkillList
    SkillItemPrefab
  BackButton
```

## 5. 核心脚本职责

GameManager：
- 管理全局状态。
- 场景跳转。
- 持有当前关卡、金币、技能等级等基础状态。

SaveManager：
- 读取和写入本地存档。
- 提供默认存档。
- 做版本兼容。

BattleController：
- 战斗总控。
- 初始化英雄和怪兽。
- 管理胜利、失败、暂停、结算。

HeroController：
- 处理英雄移动。
- 管理爱心、无敌时间、受击表现。
- 提供攻击发射点。

MonsterController：
- 管理怪兽生命、阶段、攻击行为。
- 执行当前怪兽 AI。

SkillController：
- 管理技能冷却。
- 处理技能升级后的数值。
- 触发普通技能和大招。

ShakeController：
- 监听加速度计。
- 判断摇一摇阈值。
- 提供不支持设备的降级方案。

LevelManager：
- 读取关卡配置。
- 提供怪兽、时间、奖励、背景和难度参数。

PlatformAdapter：
- 抽象平台能力。
- Web/编辑器下使用 MockPlatformAdapter。
- TikTok Mini Game 环境下使用 MiniGameAdapter，国内抖音/字节小游戏可通过 `tt` 命名空间兼容。

AdService：
- 统一处理激励视频广告。
- 对外只暴露 showRewardAd 方法。
- 隐藏平台差异和失败处理。

## 6. 数据配置

### levels.json

```json
[
  {
    "id": 1,
    "name": "果冻草地",
    "monsterId": "slime",
    "timeLimit": 60,
    "rewardCoins": 80,
    "threeStarTime": 35,
    "background": "bg_grass"
  }
]
```

### monsters.json

```json
[
  {
    "id": "slime",
    "name": "果冻小怪",
    "hp": 300,
    "attackPattern": "jump",
    "attackInterval": 2.4,
    "damage": 1,
    "weakness": "light",
    "prefab": "MonsterSlime"
  }
]
```

### upgrades.json

```json
[
  {
    "id": "lightBullet",
    "name": "光弹",
    "maxLevel": 10,
    "baseValue": 20,
    "valuePerLevel": 4,
    "costs": [0, 50, 80, 120, 170, 230, 300, 390, 500, 650]
  }
]
```

## 7. 战斗数值初版

英雄：
- 爱心：3。
- 普攻间隔：0.6 秒。
- 普攻基础伤害：20。
- 受击无敌：1.2 秒。
- 移动速度：跟随手指，最大速度限制防止瞬移。

技能：
- 光能护盾：冷却 10 秒，持续 2 秒。
- 超级光线：光能满后可释放，基础伤害 120。
- 摇一摇触发窗口：光能满后一直有效。

怪兽：
- 第 1 关 HP：300。
- 第 2 关 HP：420。
- 第 3 关 HP：520。
- 第 4 关 HP：650。
- 第 5 关 HP：850。

奖励：
- 通关基础光币：80。
- 2 星额外：20。
- 3 星额外：40。
- 看广告双倍：只翻倍基础和星级奖励，不翻倍首通特殊奖励。

## 8. 怪兽 AI 规划

怪兽 AI 使用状态机：
- Idle：待机。
- Telegraph：攻击预警。
- Attack：执行攻击。
- Recover：攻击后硬直。
- Stunned：被大招打断。
- Defeated：净化。

攻击模式：
- jump：跳跃落点攻击。
- charge：横向冲撞。
- bubble：发射慢速泡泡。
- magnet：吸引英雄。
- summon：召唤小怪或障碍。

每个攻击都必须包含：
- 预警区域。
- 起手动画。
- 命中判定。
- 结束恢复。
- 可调参数。

## 9. 摇一摇设计

触发条件：
- 光能条达到 100%。
- 玩家在 1 秒内产生明显加速度变化。

体验要求：
- 摇动成功后立即给出震动、光效和音效。
- 不要求儿童持续疯狂摇动。
- 触发后进入 8-12 秒重新蓄能。

兼容方案：
- 编辑器和 Web 环境用键盘 Space 模拟。
- 不支持加速度计的设备显示“长按释放”。
- 家长可在设置里关闭摇一摇，改成长按。

## 10. 广告接入设计

接口设计：

```ts
export interface PlatformAdapter {
  showRewardAd(scene: RewardAdScene): Promise<RewardAdResult>;
  startAccelerometer(): Promise<boolean>;
  stopAccelerometer(): void;
  vibrateShort(): void;
  saveData(key: string, value: string): void;
  loadData(key: string): string | null;
}
```

广告场景：
- revive：复活。
- double_reward：双倍奖励。
- trial_skin：试用皮肤。
- fill_energy：补满光能。

处理规则：
- 广告完整看完才发奖励。
- 主动关闭不给奖励，但文案保持温和。
- 加载失败不惩罚玩家。
- 编辑器下 MockAdapter 直接返回成功，方便测试。

## 11. UI 设计规划

首页：
- 中央展示英雄。
- 最大按钮是“开始”。
- 次级入口放底部。

关卡页：
- 大圆形关卡按钮。
- 已通关显示星星。
- 未解锁显示锁图标。

战斗页：
- 怪兽血条始终在顶部。
- 光能条靠近底部，和摇一摇提示联动。
- 技能按钮固定右下角。
- 提示只在第一次出现，不长期遮挡战斗。

结算页：
- 星级动画。
- 光币奖励。
- “下一关”作为主按钮。
- “双倍领取”作为次按钮，明确是看广告。

升级页：
- 每个技能一个横向条目。
- 显示当前等级、效果和升级按钮。
- 金币不足时按钮置灰。

## 12. 美术资产清单

MVP 需要：
- 英雄待机、移动、攻击、受击、大招、胜利动画。
- 5 只怪兽的待机、攻击、受击、净化动画。
- 3 张背景：草地、海边、云层。
- 光弹、泡泡、冲撞预警、光线大招特效。
- UI 图标：爱心、光币、星星、暂停、技能、音效。
- 按钮九宫格或通用 UI 皮肤。

资源规范：
- 角色命名使用英文 id。
- 图片按功能分文件夹。
- 大图尽量合图或图集。
- 动效优先使用骨骼或少量序列帧，控制包体。

## 13. 音频资产清单

MVP 需要：
- 首页 BGM。
- 战斗 BGM。
- 普攻音效。
- 命中音效。
- 受击音效。
- 光能满音效。
- 大招音效。
- 星级结算音效。
- 按钮点击音效。

音频规范：
- BGM 循环自然。
- 音量默认不要过大。
- 设置页提供音乐和音效开关。

## 14. 任务拆分

### 第一阶段：设计确认

产出：
- GDD。
- 制作规划。
- 5 关 MVP 关卡表。
- 美术风格参考。

预计：1-2 天。

### 第二阶段：Cocos 原型

任务：
- 搭建工程。
- 创建 Loading/Home/Battle 场景。
- 实现拖动移动。
- 实现自动普攻。
- 实现一个怪兽 AI。
- 实现胜负结算。

预计：3-5 天。

### 第三阶段：MVP 内容

任务：
- 完成 5 只怪兽。
- 完成关卡选择。
- 完成升级和存档。
- 完成摇一摇和降级方案。
- 完成广告模拟接口。

预计：5-8 天。

### 第四阶段：平台接入

任务：
- 导出 TikTok Mini Game 包并用 `ttmg dev` 调试。
- 接入激励视频广告。
- 接入设备震动和加速度计。
- 处理安全区。
- 准备审核材料。

预计：3-5 天。

### 第五阶段：打磨上线

任务：
- 低端机性能测试。
- 关卡难度调优。
- UI 动效补充。
- 音频接入。
- Bug 修复。

预计：5-7 天。

## 15. 测试计划

功能测试：
- 首页到战斗流程。
- 关卡解锁。
- 星级结算。
- 技能升级。
- 存档读写。
- 广告成功、失败、关闭。
- 加速度计支持和不支持两种情况。

体验测试：
- 低龄儿童能否看懂第一关。
- 摇一摇是否过累。
- 攻击预警是否足够明显。
- 失败后是否愿意再来一局。

性能测试：
- 低端安卓机帧率。
- 首屏加载时间。
- 战斗中特效峰值。
- 包体大小。

合规测试：
- 是否出现未授权 IP 元素。
- 是否有强迫广告文案。
- 是否有血腥或惊吓内容。
- 是否采集不必要个人信息。

## 16. TikTok Mini Game 发布检查项

上线前检查：
- 已创建 TikTok Mini Game 应用。
- 已配置 AppID。
- 已确认 Cocos 构建版本和 TikTok Mini Game DevTool / CLI 版本。
- 已配置游戏竖屏。
- 已处理安全区。
- 已替换测试广告位。
- 已准备隐私政策和用户协议。
- 已检查未成年人相关合规要求。
- 已确认所有素材版权。
- 已准备审核截图、介绍文案和图标。

技术检查：
- 首包资源控制在合理范围。
- 大资源延迟加载。
- 广告失败不影响游戏。
- 离线也能进入基础玩法。
- 错误日志可定位问题。

## 17. 关键决策建议

IP：
- 先用原创“光之小英雄”开发。
- 授权确认后再做 IP 替换。

玩法：
- 先做自动攻击和拖动躲避，不做复杂连招。
- 摇一摇只绑定大招，不绑定高频操作。

变现：
- 首版只接激励视频广告。
- 不做强制插屏。
- 不做儿童难以理解的付费礼包。

内容：
- 首版 5 关足够验证。
- 后续按章节扩展怪兽机制。

技术：
- 平台能力全部通过 Adapter 包一层。
- 编辑器下必须能完整模拟广告和摇一摇。

## 18. 下一步

建议下一步先补三份具体表：
- 5 关 MVP 关卡数值表。
- 5 只怪兽动作和攻击拆解表。
- 首页、战斗页、结算页的线框图。

这三份确认后，再进入 Cocos 工程搭建和原型实现。
