# Rollvive 游戏架构设计

> 引擎：Cocos Creator 3.8.8  
> 目标：移动端竖屏生存 Roguelite  
> 当前阶段：先建立清晰架构和可玩的垂直切片，再逐步精美化。

## 1. 产品方向

Rollvive 的核心循环：

1. 战斗：在一波敌人压力下生存、移动、攻击、读懂威胁。
2. 构筑：每波结束后进入 Hex draft，选择 1 个强化。
3. 推进：强化改变武器、属性、节奏和风险收益，形成每局不同流派。

当前 `RuntimeEntry` 只是临时预览入口，用来保证场景能打开、按钮能点、流程能跑。正式版本要逐步迁移到 `GameBootstrap + GameCtrl + UIRoot`。

## 2. 分层结构

### 启动层

- `GameBootstrap`：校验场景绑定，创建运行模型，进入标题状态。
- `SceneBinder`：统一绑定 Canvas、Camera、UIRoot、WorldRoot、各面板。
- `RuntimeEntry`：临时入口。正式面板和状态机稳定后删除。

### 领域逻辑层

纯 TypeScript，不依赖 Cocos 节点。

- `GameState`：唯一状态机定义。
- `RunModel`：保存当前 run 的职业、玩家属性、波次、敌人、draft 刷新状态、已选卡牌和统计。
- `CombatResolver`：只计算伤害、护甲、闪避、击杀、清波等战斗结果。
- `RollSystem`：生成 draft、刷新 draft、选择卡牌、计算稀有度权重。
- `PerformanceBudget`：集中定义移动端性能预算。

### 玩法组件层

- `GameCtrl`：正式流程编排，后续替换 `RuntimeEntry`。
- `Player`：玩家移动、受击、攻击触发。
- `MonsterAI`：敌人状态、移动、攻击、受击。
- `WaveManager`：刷怪、对象池、波次清理。
- `GyroManager`：移动端陀螺仪输入。

### UI 表现层

- `UIRoot`：统一面板切换和安全区域适配。
- `TitlePanel`：标题、开始、设置。
- `BattleHud`：HP、能量、波次、Boss 血条、暂停。
- `RollPanel`：卡牌选择、免费刷新、激励广告刷新入口。
- `ResultPanel`：结算、构筑回顾、重新开始。

UI 只发玩家意图，不直接修改 `RunModel`。

### 平台层

- `PlatformDef`：选择当前平台适配器。
- `DouyinAdapter` / `TTAdapter`：后续接入平台 API。
- Web Preview 需要兜底实现，保证本地预览不依赖真实 SDK。

## 3. 状态机

```ts
export enum GameState {
    Boot = 'Boot',
    Title = 'Title',
    ProfessionSelect = 'ProfessionSelect',
    BattleIntro = 'BattleIntro',
    Battle = 'Battle',
    WaveClear = 'WaveClear',
    RollDraft = 'RollDraft',
    Pause = 'Pause',
    Result = 'Result',
}
```

允许转换：

```text
Boot -> Title
Title -> ProfessionSelect
ProfessionSelect -> BattleIntro
BattleIntro -> Battle
Battle -> WaveClear
WaveClear -> RollDraft
RollDraft -> BattleIntro
Battle -> Result
Battle -> Pause
Pause -> Battle
Pause -> Title
Result -> Title
Result -> ProfessionSelect
```

规则：

- 战斗模拟只在 `Battle` 状态运行。
- 清波奖励只在进入 `WaveClear` 时结算一次。
- Draft 只在进入 `RollDraft` 时生成一次。
- 重新开始必须创建新的 `RunModel`。

## 4. Draft 和刷新规则

项目不做金币经济。

每次进入 draft：

1. 默认给 1 次免费刷新。
2. 职业或卡牌可以增加每次 draft 的免费刷新次数。
3. 免费刷新用完后，刷新按钮进入激励广告入口。
4. 当前 Web Preview 只保留模拟广告完成口子，后续接 SDK 后替换平台层实现。

事件建议：

```ts
export const GameEvent = {
    DraftChanged: 'roll:draft-changed',
    DraftRefreshRequested: 'roll:draft-refresh-requested',
    RewardedAdRefreshRequested: 'ad:rewarded-refresh-requested',
    HexPicked: 'roll:hex-picked',
} as const;
```

## 5. 真实流程

当前垂直切片先跑这个闭环：

```text
Title
-> Start
-> BattleIntro
-> Battle
-> WaveClear
-> RollDraft
-> Pick Hex / Refresh
-> BattleIntro(next wave)
-> Result(on death)
```

战斗数据由 `RunModel` 保存，伤害由 `CombatResolver` 计算，临时 UI 只负责渲染。

### 战斗输入

移动端目标交互是虚拟摇杆：

- 左下角摇杆控制玩家移动。
- 武器按冷却自动攻击范围内最近敌人。
- 右下角保留主动防御/技能按钮，当前临时版本是 `SHIELD`。
- 敌人持续追击玩家，进入接触范围后按冷却造成伤害。
- Cocos Web Preview 中可以用鼠标拖拽左下摇杆模拟触摸。
- 为了本地调试效率，Preview 也支持 WASD / 方向键移动。

正式化时，摇杆应拆成 `VirtualJoystick` 组件，自动攻击拆到 `WeaponController`，敌人追击拆到 `EnemyController` / `WaveManager`。

## 6. 性能架构

性能目标：

- 目标帧率：60 FPS。
- 低端机可降级到 30 FPS，但不能卡死或崩溃。
- 单局 10 分钟内不允许持续增长节点数量。

当前预算在 `assets/scripts/domain/PerformanceBudget.ts`：

```ts
targetFps: 60
maxActiveEnemies: 36
maxActiveProjectiles: 80
maxActiveDamageNumbers: 18
maxActiveVfx: 24
maxUiRefreshHz: 10
fixedSimulationStepMs: 33
enemyAiTickMs: 100
cleanupIntervalMs: 500
```

实现约束：

- 敌人、子弹、伤害数字、短生命周期 VFX 必须走对象池。
- `update(dt)` 只做必要移动和计时，不做频繁 `find`、字符串拼接、大数组分配。
- UI HUD 刷新节流到 10Hz，血量和波次变化可立即刷新。
- 敌人 AI 不需要每帧决策，默认 100ms 一次。
- 波次结束必须回收敌人、弹道、VFX、临时 hitbox。
- 动态生成节点只能放到指定 Root 下，便于统一清理。

监控指标：

- 当前 FPS。
- 活跃敌人数量。
- 活跃弹道数量。
- 活跃 VFX 数量。
- 单帧最长 update 耗时。
- 对象池命中率和临时实例化次数。

后续接入点：

- `WaveManager` 按 `PerformanceBudget.maxActiveEnemies` 限制刷怪。
- `WeaponController` 按 `maxActiveProjectiles` 限制弹道。
- `VfxController` 按 `maxActiveVfx` 丢弃低优先级特效。
- `BattleHud` 按 `maxUiRefreshHz` 节流刷新。

## 7. 场景目标结构

```text
GameScene
├── GameRoot
│   ├── GameBootstrap
│   ├── Systems
│   │   ├── GameCtrl
│   │   ├── WaveManager
│   │   └── AudioManager
│   ├── World
│   │   ├── BackgroundRoot
│   │   ├── PlayerRoot
│   │   ├── EnemyRoot
│   │   ├── ProjectileRoot
│   │   └── VfxRoot
│   └── Camera
└── Canvas
    ├── UIRoot
    ├── TitlePanel
    ├── ProfessionPanel
    ├── BattleHud
    ├── RollPanel
    ├── PausePanel
    ├── ResultPanel
    └── ToastLayer
```

## 8. 迁移路线

1. 保留 `RuntimeEntry`，确保 Preview 一直可见可玩。
2. 把临时流程迁入 `GameCtrl`。
3. 用正式 `UIRoot` 和面板替换代码生成 UI。
4. 增加玩家、敌人、弹道、VFX 的真实 prefab。
5. 接入对象池、帧率监控和平台广告适配。
6. 删除 `RuntimeEntry`。

## 9. 垂直切片验收

- Preview 打开后能看到 Rollvive 标题。
- 点击 Start 后进入战斗。
- 攻击和防御按钮有结果反馈。
- 清波后进入 Hex draft。
- 每次 draft 有免费刷新，免费用完后出现激励广告刷新入口。
- 选卡后属性变化，并进入下一波。
- 死亡后显示结算和 Restart。
- TypeScript 编译无错误。
- Cocos Console 无入口脚本缺失、空屏或 `System is not defined` 错误。

## 10. 内容系统模块规范

本节定义后续实现角色、武器、怪物时的模块边界。当前阶段不要求改动临时入口；后续迁移应以新增模块和配置为主，避免继续把内容规则散落到单个运行脚本。

### 10.1 配置数据边界

建议将内容数据拆为以下配置表或 TypeScript 常量模块：

| 模块 | 责任 | 不应包含 |
| --- | --- | --- |
| `CharacterConfig` | 角色基础属性、初始武器、Hex 权重、Draft 倾向 | 节点引用、Prefab 实例、攻击执行逻辑。 |
| `WeaponConfig` | 武器基础 `AttackProfile`、表现 profile、对象池键 | 角色判断、UI 文案拼接。 |
| `MonsterConfig` | 怪物职责、基础数值、行为参数、同屏上限 | 波次流程、运行时节点状态。 |
| `WaveConfig` | 波次时间、刷怪组合、精英 / Boss 权重 | 怪物 AI 细节。 |
| `VisualProfile` | Sprite / Prefab 路径、VFX 优先级、预算消耗 | 伤害计算、AI 决策。 |
| `PerformanceBudget` | 全局上限、池预热数量、溢出策略 | 具体业务逻辑。 |

配置读取规则：

- 运行时只通过稳定 `id` 引用配置。
- UI 展示文案可以读配置，但不能修改配置。
- 战斗流程只消费解析后的运行时模型，不直接拼接角色、武器、Hex 的临时分支。
- 所有配置必须可被本地预览兜底，不依赖平台 SDK。

### 10.2 角色与武器解析流程

角色选择后的数据流：

```text
ProfessionPanel selects characterId
-> GameCtrl starts new RunModel(characterId)
-> CharacterConfig resolves starterWeaponId
-> WeaponConfig resolves base AttackProfile
-> Hex modifiers update AttackProfile after each draft
-> WeaponController consumes ResolvedAttackProfile
```

关键约束：

- `RunModel` 保存 `characterId`、`weaponIds`、已选 Hex、派生属性和统计。
- 初始武器只能从 `CharacterConfig.starterWeaponId` 得到。
- `WeaponController` 不判断角色职业，只执行 `ResolvedAttackProfile`。
- `CombatResolver` 不关心表现资源，只处理命中、伤害、击退、击杀。
- `RollSystem` 只能产出 Hex modifier，不直接创建弹道、怪物或 VFX。

建议接口：

```ts
interface CharacterConfig {
    id: string;
    displayName: string;
    starterWeaponId: string;
    secondaryWeaponPool: string[];
    baseStats: PlayerBaseStats;
    hexAffinity: Record<string, number>;
    draftRules: DraftRuleSet;
    visualProfileId: string;
}

interface WeaponConfig {
    id: string;
    displayName: string;
    baseAttackProfile: AttackProfile;
    visualProfileId: string;
    poolKey: string;
}

interface AttackProfile {
    shape: 'arc' | 'line' | 'chain' | 'orbit' | 'area';
    targetPolicy: 'nearest' | 'dangerous' | 'lowestHp' | 'bossFirst';
    range: number;
    hitRadius: number;
    cooldownMs: number;
    damage: number;
    projectileSpeed: number;
    pierce: number;
    chainCount: number;
    orbitCount: number;
    vfxBudgetCost: number;
    poolKey: string;
}
```

### 10.3 怪物扩展流程

新增怪物时按“配置 -> 行为组件 -> 波次引用 -> 表现资源”顺序落地。

```text
MonsterConfig defines stats and behaviorProfile
-> MonsterAI chooses behavior strategy by role
-> WaveManager spawns by WaveConfig and budget
-> ObjectPool provides node
-> VisualProfile applies Sprite / Prefab / warning VFX
```

建议接口：

```ts
interface MonsterConfig {
    id: string;
    role: 'chaser' | 'tank' | 'swarm' | 'dasher' | 'spitter' | 'binder' | 'elite' | 'boss';
    introWave: number;
    teachCount: number;
    maxConcurrent: number;
    baseStats: MonsterBaseStats;
    behaviorProfile: MonsterBehaviorProfile;
    attackProfileId?: string;
    visualProfileId: string;
    poolKey: string;
    budgetCost: number;
}
```

行为边界：

- `MonsterAI` 可以按 `role` 选择行为策略，但不得硬编码波次。
- `WaveManager` 负责刷怪节奏和数量上限，不负责怪物内部 AI。
- 远程怪、Boss 技能、预警区都通过统一攻击或 VFX profile 申请对象池。
- 精英和 Boss 是 modifier，不复制一套完全独立的小怪逻辑。

### 10.4 表现资源迁移架构

Graphics 原型迁移到 Sprite / Prefab 时，表现层应从玩法层解耦。

| 模块 | 责任 |
| --- | --- |
| `VisualFactory` | 按 `visualProfileId` 获取或预热 Prefab / Sprite 配置。 |
| `VfxController` | 管理命中、死亡、连锁、预警等短生命周期表现。 |
| `ObjectPool` | 按 `poolKey` 预热、申请、回收节点。 |
| `LowSpecMode` | 统一控制低端降级：减少 VFX、关闭残影、降低动画频率。 |

迁移要求：

- 玩家、怪物、弹道、VFX 都从同一对象池体系申请。
- 表现组件只能订阅战斗结果或读取 profile，不反向修改伤害和 AI。
- 每个 visual profile 必须声明 `priority`、`budgetCost`、`fallbackProfileId`。
- Boss 预警、玩家受击、关键弹道优先级最高；普通命中火花可丢弃。

### 10.5 对象池与预算接入规则

对象池建议统一处理以下生命周期：

```text
preload(poolKey, count)
spawn(poolKey, payload)
resetForSpawn(payload)
recycle()
cleanupByRoot(root)
collectStats()
```

溢出策略：

| 类型 | 默认策略 | 原因 |
| --- | --- | --- |
| 怪物 | `delaySpawn` | 不应突然吞怪破坏波次节奏。 |
| 玩家关键弹道 | `reuseOldest` 或合并 | 保证攻击反馈存在。 |
| 普通 VFX | `drop` | 表现可降级，信息不能乱。 |
| 伤害数字 | `reuseOldest` 或合并 | 避免数字淹没画面。 |
| Boss 预警 | `reserve` | 预警不可丢。 |

每波结束必须执行：

- 回收所有非持久怪物。
- 回收弹道、hitbox、短生命周期 VFX。
- 清空延迟刷怪队列。
- 重置对象池统计快照。
- 输出活跃数量、峰值数量、溢出次数，供性能面板读取。

### 10.6 实现里程碑映射

| 里程碑 | 架构交付 | 内容交付 | 验收重点 |
| --- | --- | --- | --- |
| M1 | `RunModel`、基础 `WaveManager`、基础攻击解析 | Chaser / Tank / Dasher，前 5 波 | 能玩、能清波、能 Draft。 |
| M2 | `CharacterConfig`、`WeaponConfig`、`AttackProfile` 合并 | 3 角色绑定 3 初始武器，4 武器模板 | 换角色即换打法，不改攻击主循环。 |
| M3 | `MonsterConfig`、行为策略、对象池统计 | 6 类基础怪物、1 Boss、2 精英变体 | 怪物职责不同，性能不失控。 |
| M4 | `VisualProfile`、`VfxController`、低端降级 | Sprite / Prefab 替换 Graphics 原型 | 表现更清楚，节点数不持续增长。 |
| M5 | 平台适配和性能面板 | 10 波完整节奏、广告刷新兜底 | 平台接入前稳定回归。 |
