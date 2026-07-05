# Rollvive 角色 / 武器 / 怪物长期内容设计

> 范围：本文只归档长期内容设计，不要求本轮修改运行时代码。
> 关联文档：`RollviveDesignBible.md`、`ContentPlan.md`、`GameArchitecture.md`。
> 设计目标：让 Rollvive 从“可玩原型”逐步发展成角色有记忆点、武器有表现差异、怪物有战斗职责、波次有节奏起伏、移动端性能可控的精致生存 Roguelite。

## 1. 总体方向

Rollvive 的内容扩展不应先追求数量，而应先建立可复用的设计模板：

1. 角色负责开局规则和构筑倾向。
2. 武器必须和角色绑定成初始套装，负责攻击形态、视觉辨识和成长上限。
3. 怪物负责不同压力来源，而不是只换皮和调数值。
4. 波次负责教学、组合、峰值和喘息。
5. 精致化表现必须服务可读性，不能遮挡移动和威胁判断。
6. 每个新增内容都必须先过性能预算和对象池检查。

首个可落地版本建议保持“小而准”：

- 3 个初始职业。
- 4 类核心武器。
- 6 类基础怪物。
- 前 10 波完整节奏模板。
- 1 个首领和 2 个精英变体。

### 1.1 角色和武器的关系

角色和武器不是两个完全独立的选择。Rollvive 的首批版本应采用“角色绑定初始武器”的设计：

- 角色决定开局血量、防御容错、起始武器、推荐 Hex 家族、刷新 / 稀有度倾向和失败原因。
- 武器决定攻击范围、攻击距离、攻击形状、目标选择权重、命中表现和升级上限。
- 计算逻辑使用同一套攻击参数模型，不能为每个角色硬写一套特殊战斗算法。
- UI 和表现可以差异很大：剑是弧形斩击，枪是直线穿透，法球是连锁跳转，环刃是围绕玩家旋转。
- 后续允许通过高稀有 Hex 或局外解锁获得副武器，但首屏选择必须先让玩家理解“选这个角色，就是选了这套初始打法”。

这样做的原因是：玩家在移动端小屏幕上不应该先理解一堆抽象数值。职业头像、武器轮廓、攻击轨迹和推荐流派应当形成一个清晰套装。

### 1.2 统一攻击参数模型

角色、武器、Hex 最终都应写入同一份运行时攻击参数，而不是各自写分叉逻辑。推荐模型如下：

| 参数 | 作用 | 例子 |
| --- | --- | --- |
| `shape` | 攻击形状 | `arc`、`line`、`chain`、`orbit`、`area` |
| `range` | 可选目标距离 | 剑 180，枪 420，法球 360 |
| `hitRadius` | 命中宽度 / 半径 | 枪较窄，环刃较宽 |
| `cooldown` | 攻击间隔 | 0.35 到 1.2 秒 |
| `damage` | 单次基础伤害 | 由角色、武器、Hex 叠加 |
| `projectileSpeed` | 弹道速度 | 近战刀光可为瞬时，枪弹需要速度 |
| `pierce` | 穿透数量 | 枪和强化后的剑气使用 |
| `chainCount` | 连锁次数 | 法球核心成长参数 |
| `orbitCount` | 常驻环绕数量 | 环刃核心成长参数 |
| `targetPolicy` | 目标选择 | 最近、最危险、血量最低、Boss 优先 |
| `vfxBudgetCost` | 表现预算消耗 | 用于控制同屏特效上限 |

示例：

- Blade Adept + 剑：`shape=arc`，中距离，短冷却，多段弧形命中。
- Hex Gambler + 枪：`shape=line`，远距离，较长冷却，穿透和暴击成长。
- Storm Mage + 法球：`shape=chain`，中远距离，连锁次数和跳转距离成长。
- Blade Adept + 环刃：`shape=orbit`，常驻近身防线，持续碰撞但数量严格受限。

实现上应把角色看成“初始参数包 + 成长权重”，把武器看成“攻击形状模板”，把 Hex 看成“参数修饰器”。这样未来做剑、枪、法球、模型和特效替换时，不需要推翻核心战斗计算。

## 2. 初始 3 个角色职业

角色不是皮肤，而是不同构筑入口。每个角色都必须有“强项、代价、绑定初始武器、推荐 Hex、失败原因”。首批角色不做完全自由配武器，优先让玩家通过角色直接理解初始战斗形态。

| 职业 | 定位 | 起始规则 | 绑定初始武器 | 可扩展副武器 | 擅长 Hex | 明显弱点 |
| --- | --- | --- | --- | --- | --- |
| Blade Adept | 新手稳定型 | 血量和护甲较高，初始双刀，攻击范围中等 | 剑 | 环刃 | Blade、Stat | 后期爆发和稀有构筑上限普通 |
| Hex Gambler | 随机高收益型 | 血量低，Draft 刷新和稀有度收益更好 | 枪 | 法球 | Utility、Risk | 容错低，被围住时容易暴毙 |
| Storm Mage | 连锁清场型 | 攻击距离较远，连锁成长收益高 | 法球 | 枪 | Blade、Mobility | 前 2 波清怪慢，怕贴脸 |

### 2.1 Blade Adept

核心体验：稳定、多刀、容易读懂。

设计要点：

- 开局给双刀或短弧形剑气，让玩家立即理解自动攻击。
- 血量、护甲、攻速都不极端，作为默认推荐角色。
- 强化方向以刀数、角度、环绕、伤害、护甲为主。
- 视觉上使用清晰的近中距离刀光，颜色不宜过亮，避免遮挡怪物轮廓。

验收标准：

- 不依赖高稀有 Hex，也能稳定打到第 5 波。
- 新手能看懂自己为什么命中、为什么受伤。
- 选择“刀数 +1”或“攻击范围 +20%”后，下一波差异明显。

### 2.2 Hex Gambler

核心体验：刷新、赌稀有、用风险换上限。

设计要点：

- 初始血量低，不能直接站撸。
- 每次 Draft 的免费刷新、稀有度权重或额外选项可有职业加成。
- 推荐配合 Risk / Utility Hex，形成“高收益但更危险”的构筑。
- 表现上可以在 Draft 卡牌、选择音效和稀有度边框上强化期待感。

验收标准：

- 玩家能感到它的 Draft 比其他职业更刺激。
- 高收益选择必须有代价，不能变成纯数值更强。
- 死亡原因通常来自贪输出、贪刷新后容错不足，而不是随机失败。

### 2.3 Storm Mage

核心体验：远距、连锁、清场成长。

设计要点：

- 开局攻击距离更远，但单体输出和防御较弱。
- 适合连锁、弹射、范围、减速、移动类强化。
- 前期需要保持距离；中后期通过连锁和范围形成清屏爽感。
- 视觉上使用短暂电弧、法球脉冲或链式命中特效，避免全屏常亮。

验收标准：

- 第 1 到 2 波压力略高，但不应劝退。
- 拿到连锁或范围强化后，清场能力有明显跃迁。
- 贴脸怪、冲刺怪能形成真实威胁。

## 3. 至少 4 类核心武器

武器必须区分攻击形态，而不只是伤害数字不同。每类武器都需要一套“模型 / 轮廓、攻击表现、成长词条、性能约束”。

| 武器 | 战斗定位 | 基础表现 | 主要成长 | 性能风险 |
| --- | --- | --- | --- | --- |
| 剑 | 近中距离稳定清怪 | 弧形斩击、扇形刀光、环绕剑影 | 刀数、角度、范围、连击、环绕 | 刀光数量过多遮挡敌人 |
| 枪 | 远距离穿透点杀 | 直线弹道、穿刺、蓄力贯通 | 射程、穿透、弹速、暴击、回弹 | 弹道数量和碰撞检测压力 |
| 法球 | 中远距离连锁控场 | 自动寻敌、链式跳转、脉冲爆开 | 连锁次数、跳转距离、爆炸半径、减速 | 链式命中和 VFX 峰值 |
| 环刃 | 贴身防线和区域控制 | 围绕玩家旋转，周期性切割 | 环绕半径、转速、数量、击退 | 常驻节点和持续碰撞检测 |

### 3.1 剑

模型 / 轮廓：

- 初期可以使用简洁剑刃 Sprite 或发光刀光。
- 角色身边必须能看出攻击方向，不能只出现无方向圆形特效。
- 高级形态可加入双剑、扇形剑阵、环绕剑影。

表现规则：

- 每次攻击出现 0.12 到 0.2 秒的短弧线。
- 命中时给敌人短促闪白或压缩反馈。
- 多刀构筑优先改变角度和节奏，不要让屏幕同时铺满刀光。

### 3.2 枪

模型 / 轮廓：

- 使用清晰的长枪、矛或能量枪轮廓。
- 弹道以细长直线为主，强调穿透和方向感。
- 枪类适合 Hex Gambler 或 Storm Mage 的高风险远程打法。

表现规则：

- 攻击前可有极短瞄准线或枪尖亮光，帮助玩家理解目标。
- 命中多个敌人时，用轻量穿透火花或数字反馈，不做大爆炸。
- 穿透上限必须明确，例如基础 1 个，强化后 2 到 5 个。

### 3.3 法球

模型 / 轮廓：

- 使用悬浮球、能量核心或符文球。
- 法球本体可以跟随玩家附近，攻击时释放短链或脉冲。
- 颜色和亮度要与敌人、掉血反馈区分。

表现规则：

- 链式攻击每次跳转要有方向线，但每段持续时间很短。
- 同一时刻连锁段数应设上限，避免 VFX 叠成光幕。
- 法球适合承担减速、范围、连锁，但不应同时成为最高单体输出。

### 3.4 环刃

模型 / 轮廓：

- 使用小型飞刃、齿轮刃或符文环。
- 常驻围绕玩家旋转，负责近身防线。
- 半径变化要可读，让玩家知道安全距离。

表现规则：

- 环刃击中时只给轻量火花，避免每次碰撞都生成大特效。
- 环绕数量建议初期 1 到 3 个，中后期最多 6 个。
- 每个环刃应复用节点和碰撞体，不随每次命中新建对象。

## 4. 至少 6 类怪物

怪物按战斗职责设计。每类怪物必须给玩家一种不同问题：追、堵、冲、射、挤、控。

| 怪物 | 职责 | 行为 | 首次出现 | 玩家应对 | 表现重点 |
| --- | --- | --- | --- | --- | --- |
| Chaser 追击者 | 基础移动压力 | 持续追玩家，接触伤害 | 第 1 波 | 保持移动，不被围住 | 轮廓简单，数量可多 |
| Tank 厚壳者 | 空间压缩 | 慢速高血，挡路 | 第 2 波 | 拉扯、优先提升输出 | 大体型，受击反馈明显 |
| Swarm 群蜂 | 密度压力 | 低血高速，成群出现 | 第 3 波 | 范围攻击、环刃、走位 | 小体型，死亡反馈轻 |
| Dasher 冲锋者 | 爆发威胁 | 短预警后直线冲刺 | 第 4 波 | 横向躲避，读预警 | 冲刺前必须有清晰红线 |
| Spitter 吐弹者 | 远程压迫 | 停顿后发射慢速弹 | 第 6 波 | 靠近、绕弹、清弹道 | 弹道不能和玩家攻击混淆 |
| Binder 缚影者 | 控制威胁 | 投放减速区或短暂牵引 | 第 8 波 | 离开危险区，优先击杀 | 地面警示清楚，持续时间短 |

### 4.1 精英和 Boss 规则

精英不是简单放大普通怪。精英可以继承普通怪职责，但必须增加一个可读机制：

- 精英 Chaser：周期性加速 1 秒，前摇有红色脉冲。
- 精英 Tank：低血量时短暂硬化，逼玩家处理小怪。
- 精英 Dasher：连续两段冲刺，但每段都有预警线。

首个 Boss 建议：

- 名称：裂刃守卫。
- 波次：第 5 波。
- 阶段 1：慢速追击 + 扇形近战。
- 阶段 2：召唤少量 Chaser + 短距离冲击。
- 验收点：检查玩家是否理解移动、清杂、持续输出和预警躲避。

Boss 表现规则：

- 出场前给 1 秒警示，不突然贴脸出现。
- 必须有独立血条。
- 技能预警要比普通怪更明确。
- Boss VFX 优先级高，但不能遮挡玩家位置。

## 5. 波次节奏

波次节奏应遵循“教学、组合、峰值、喘息”的循环，不要每波只线性加数量。

| 波次 | 时长 | 内容目标 | 怪物组合 | 节奏说明 |
| --- | --- | --- | --- | --- |
| 1 | 20-25 秒 | 学移动和自动攻击 | Chaser | 低压，只教基础 |
| 2 | 25-30 秒 | 学拉扯高血目标 | Chaser + Tank | Tank 数量只放 1 个 |
| 3 | 30-35 秒 | 感受范围和清怪收益 | Chaser + Swarm | 第一次密度压力 |
| 4 | 35-40 秒 | 学预警躲避 | Chaser + Dasher | Dasher 数量少，预警明显 |
| 5 | 60-75 秒 | 小 Boss 验收 | Boss + Chaser | 形成第一个高潮 |
| 6 | 35-45 秒 | 引入远程弹道 | Chaser + Spitter | 给玩家读弹道空间 |
| 7 | 40-50 秒 | 组合压力 | Tank + Swarm + Chaser | 检查清场能力 |
| 8 | 40-50 秒 | 引入区域控制 | Binder + Chaser | 危险区数量少 |
| 9 | 50-60 秒 | 高压混合 | Dasher + Spitter + Swarm | 需要走位和目标优先级 |
| 10 | 75-90 秒 | 第二个阶段验收 | 精英 / Boss + 杂兵 | 检查构筑完成度 |

节奏约束：

- 新怪首次出现时，数量必须少，读懂机制优先于压死玩家。
- 每 4 到 5 波应有一个峰值波，随后给一波相对可控的调整波。
- 每波结束进入 Draft 前要有短暂停顿，让玩家感受到清场完成。
- 如果一波已经有复杂机制，不要同时把数量、速度、弹道都拉满。

## 6. 精致化方向

精致化不是堆特效，而是让玩家“看得懂、打得爽、愿意再来一局”。

### 6.1 角色精致化

- 每个职业需要不同待机轮廓、主色、起手攻击动作。
- 角色受击反馈短促，优先使用闪白、轻微击退、屏幕轻震。
- 职业选择界面要一眼看出难度、推荐流派、核心风险。
- 不用长段说明解释职业，核心差异应能通过图标、数值和短标签表达。

### 6.2 角色模型和资产路线

当前原型里的圆点 / 简单 Graphics 只适合验证碰撞、移动和战斗循环，不能作为长期美术方向。正式产品需要逐步替换为可识别的角色轮廓和武器轮廓。

推荐分 4 个阶段推进：

| 阶段 | 表现方式 | 目标 | 约束 |
| --- | --- | --- | --- |
| Prototype | `Graphics` 圆点、线条、简单血条 | 验证移动、攻击、怪物 AI、波次 | 只服务调试，不追求美术 |
| Silhouette | 2D 剪影 Sprite、武器轮廓 Sprite | 让职业和武器一眼可辨认 | 使用少量图集，避免散图过多 |
| Prefab | 角色 Prefab、武器挂点、受击 / 攻击动画 | 建立正式表现结构 | Prefab 必须可池化，动画不产生额外节点 |
| Polished Asset | Spine / 序列帧 / 轻量 3D 模型 | 提升商业化质感 | 只在关键角色、Boss、武器上使用高成本资产 |

角色不是通过 Canvas 临时画出来的长期对象。Cocos 中可以用 Graphics 画调试形状，但正式角色应使用 Sprite / Prefab：

- 玩家主体：`PlayerView` Prefab，包含角色 Sprite、阴影、受击闪白、武器挂点。
- 武器表现：`WeaponView` 或独立武器 Prefab，按剑 / 枪 / 法球 / 环刃切换轮廓和攻击特效。
- 怪物主体：`EnemyView` Prefab，按怪物职责提供不同体型、颜色、预警挂点和血条。
- Boss：独立 Prefab，允许更复杂动画、血条和技能预警，但数量少、预算高。

临时 Graphics 的保留范围：

- 调试 hitbox。
- 调试攻击范围。
- 临时预警线。
- 性能面板和开发期可视化。

禁止把正式角色继续做成纯圆点，因为圆点无法表达职业、武器、朝向、受击、攻击起手和稀有皮肤价值。

### 6.3 武器精致化

- 剑强调弧线和切割感。
- 枪强调方向、穿透和命中节奏。
- 法球强调跳转、脉冲和连锁。
- 环刃强调安全半径和贴身防线。
- 所有攻击轨迹都要短生命周期、清晰边缘、低透明叠加。

### 6.4 怪物精致化

- 普通怪轮廓要能在小屏幕上快速区分。
- 特殊怪首次出现可给短提示，但不要遮挡战斗。
- 冲锋、远程、区域控制必须有预警。
- 死亡反馈按怪物体型分级：小怪轻粒子，中型怪破碎，Boss 阶段爆发。

### 6.5 UI 和音效

- HUD 不随文字长短跳动。
- Draft 卡牌用稀有度边框、家族图标、收益 / 代价结构表达。
- 攻击、命中、受击、死亡、刷新、选择都需要短音效。
- 同屏音效要限流，Swarm 大量死亡时合并播放。

## 7. 性能预算和对象池提示

性能是内容设计约束。新增角色、武器、怪物、VFX 前必须先写预算。

### 7.1 移动端预算

| 项目 | 初期预算 | 说明 |
| --- | --- | --- |
| 目标帧率 | 60 FPS | 低端机可降到 30 FPS，但不能卡死 |
| 同屏敌人 | 36 个以内 | 前 5 波建议 12 个以内 |
| 同屏弹道 | 80 个以内 | 枪、吐弹怪、法球链都要计入 |
| 同屏伤害数字 | 18 个以内 | 超出后合并或跳过低优先级数字 |
| 同屏 VFX | 24 个以内 | 命中火花、死亡粒子、预警都要计入 |
| HUD 刷新 | 约 10Hz | 血量变化可即时，普通文本节流 |
| AI 决策 | 约 100ms 一次 | 追击移动可每帧，选目标不必每帧 |
| 角色贴图 | 单角色 1 到 2 张图集内 | 不为每个动作散加载独立大图 |
| 常驻武器节点 | 玩家侧 8 个以内 | 环刃、法球、挂点武器都计入 |
| 高成本动画 | 同屏 3 个以内 | Boss、精英和玩家大招优先 |

### 7.2 对象池必须覆盖

必须使用对象池：

- 敌人节点。
- 玩家弹道。
- 怪物弹道。
- 伤害数字。
- 命中火花。
- 死亡特效。
- 临时 hitbox。
- Boss 技能预警区域。
- 角色受击闪白 / 残影。
- 武器轨迹段。
- 可复用 Sprite 特效节点。

禁止设计：

- 每次攻击创建新节点后等待自动销毁。
- 每帧生成临时数组做全量目标排序。
- 每帧拼接 UI 字符串。
- 大量透明特效长时间叠加。
- 没有上限的连锁、分裂、环绕、召唤。
- 每次换武器或换皮肤都动态加载未预热资源。
- 为小怪使用高骨骼数、高帧率、长生命周期动画。

### 7.3 新内容检查清单

新增一个武器前必须回答：

- 最坏情况下同屏有多少个弹道或攻击段？
- 单次攻击会产生多少个 VFX？
- 命中判定是否需要每帧扫全部敌人？
- 是否能复用对象池？
- 超过预算时如何降级？

新增一个怪物前必须回答：

- 它的战斗职责是否和现有怪物重复？
- 首次出现波次和教学方式是什么？
- 同屏最大数量是多少？
- 是否产生弹道、预警区或召唤物？
- 死亡时是否会触发额外对象创建？

新增一个角色前必须回答：

- 它改变了什么开局规则？
- 它绑定的初始武器是什么，玩家能否从外观一眼看懂？
- 它是否复用统一攻击参数模型，而不是写角色专属战斗分支？
- 它偏好的 Hex 家族是什么？
- 它的失败原因是否清晰？
- 它是否会放大某类对象数量到失控？
- 它的正式 Sprite / Prefab 预算是多少，是否能在低端机降级？

## 8. 落地顺序建议

1. 先固定 3 个职业的数值差异和职业选择入口。
2. 明确每个职业绑定的初始武器，并用统一攻击参数模型承载差异。
3. 再把剑、枪、法球、环刃做成 4 个可复用武器模板。
4. 用 Graphics / 简单 Sprite 只验证玩法，不把圆点形态当作正式目标。
5. 接着实现 Chaser、Tank、Swarm、Dasher、Spitter、Binder 的职责差异。
6. 用前 10 波表验证教学、组合、峰值和 Draft 构筑反馈。
7. 分批替换正式 Sprite / Prefab / 音效 / VFX，每替换一批都做性能预算回归。
8. 最后接入性能监控、对象池统计和低端机降级策略。

每一步都要优先验证“玩家是否看懂压力来源”和“新增内容是否守住性能预算”。在这两个条件未满足前，不继续扩充更多角色和怪物数量。

## 9. 可执行内容规格

本节作为后续实现者的落地约束。新增角色、武器、怪物、表现资源时，必须先补齐字段，再进入代码实现。不要直接在运行时脚本里临时拼规则。

### 9.1 角色与武器绑定规格

首批版本采用“角色绑定初始武器，后续构筑扩展副武器”的规则。角色选择界面、运行时数据、表现资源都以 `characterId -> starterWeaponId` 为唯一入口。

角色配置建议字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 稳定 ID，例如 `blade_adept`。 |
| `displayName` | string | 是 | 展示名称，可本地化。 |
| `roleTag` | string | 是 | 新手稳定型、随机高收益型、连锁清场型等。 |
| `starterWeaponId` | string | 是 | 绑定初始武器，首批不允许为空。 |
| `secondaryWeaponPool` | string[] | 是 | 后续可通过 Hex 或解锁获得的副武器候选。 |
| `baseStats` | object | 是 | HP、护甲、移动速度、攻击倍率、容错属性。 |
| `hexAffinity` | object | 是 | 推荐 Hex 家族和权重，例如 `{ Blade: 1.2, Stat: 1.1 }`。 |
| `draftRules` | object | 是 | 免费刷新、稀有度修正、风险牌权重等。 |
| `weakness` | string | 是 | 玩家可理解的失败原因。 |
| `visualProfileId` | string | 是 | 指向 Sprite / Prefab 表现配置，不再长期使用 Graphics 圆点。 |

武器绑定验收：

- 进入战斗时只从角色读取 1 把初始武器，不从 UI 临时推断。
- 更换角色后，初始攻击形态、攻击轨迹、推荐 Hex 提示同步变化。
- 角色可以影响初始数值和成长权重，但不能新增角色专属攻击分支。
- 副武器只能通过明确的 Hex、局外解锁或调试入口加入，不应在首屏自由混搭。

### 9.2 统一武器攻击参数规格

所有武器、角色加成、Hex 加成都合并到同一份 `AttackProfile`。实现时先计算配置，再由统一攻击系统执行，不为剑、枪、法球、环刃分别写四套战斗主循环。

建议运行时字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `weaponId` | string | 当前攻击来源。 |
| `ownerCharacterId` | string | 来源角色，用于表现和统计。 |
| `shape` | `arc` / `line` / `chain` / `orbit` / `area` | 决定命中几何和表现模板。 |
| `targetPolicy` | `nearest` / `dangerous` / `lowestHp` / `bossFirst` | 目标选择策略。 |
| `range` | number | 寻敌距离。 |
| `hitRadius` | number | 命中宽度或半径。 |
| `cooldownMs` | number | 攻击冷却。 |
| `damage` | number | 单次基础伤害。 |
| `projectileSpeed` | number | 弹道速度；瞬时攻击可为 0。 |
| `pierce` | number | 穿透数量。 |
| `chainCount` | number | 连锁跳转次数。 |
| `chainRange` | number | 连锁跳转距离。 |
| `orbitCount` | number | 环绕体数量。 |
| `orbitRadius` | number | 环绕半径。 |
| `knockback` | number | 击退强度。 |
| `critChance` | number | 暴击率。 |
| `critMultiplier` | number | 暴击倍率。 |
| `vfxBudgetCost` | number | 单次攻击占用的表现预算。 |
| `poolKey` | string | 弹道 / hitbox / VFX 对象池键。 |

参数合并顺序：

1. 读取 `WeaponConfig.baseAttackProfile`。
2. 应用 `CharacterConfig.baseStats` 和 `hexAffinity` 带来的开局修正。
3. 按已选 Hex 顺序应用 `AttackModifier`。
4. 按 `PerformanceBudget` 截断弹道、连锁、环绕、特效数量。
5. 输出只读 `ResolvedAttackProfile` 给攻击系统。

禁止事项：

- 禁止在角色组件里直接创建弹道或遍历怪物。
- 禁止 Hex 直接改节点表现；Hex 只能改参数或挂载清晰的 modifier。
- 禁止让 `chainCount`、`orbitCount`、`pierce` 无上限叠加。
- 禁止用 `shape` 以外的隐藏字段决定命中几何。

### 9.3 Sprite / Prefab 迁移规格

Graphics 圆点和简单线条只用于验证移动、碰撞、攻击范围。正式路线必须迁移到 Sprite / Prefab，并保留低端机降级策略。

资产分层：

| 层级 | 内容 | 要求 |
| --- | --- | --- |
| `CharacterVisualProfile` | 角色头像、战斗 Sprite、受击帧、死亡帧 | 每个角色至少有待机、移动、受击 3 类表现。 |
| `WeaponVisualProfile` | 武器轮廓、攻击轨迹、命中特效 | 与 `AttackProfile.shape` 一一对应。 |
| `MonsterVisualProfile` | 小怪 Sprite、精英描边、Boss 预警 | 小怪优先使用低帧率 Sprite，不做高骨骼成本。 |
| `VfxProfile` | 命中、死亡、连锁、刷新、稀有度反馈 | 必须声明 `priority` 和 `budgetCost`。 |

迁移步骤：

1. 先保留 Graphics 原型作为 fallback，新增 Sprite / Prefab 配置字段。
2. 将玩家、怪物、弹道、VFX 的创建入口统一改为对象池申请。
3. 每批替换只替换一种资源类型，例如先角色，再怪物，再武器轨迹。
4. 每批替换后记录同屏敌人 36、弹道 80、VFX 24 时的帧率和节点数量。
5. 低端模式下降级为低帧率 Sprite、缩短 VFX 生命周期、关闭非关键残影。

验收标准：

- 玩家、怪物、攻击轨迹不再依赖圆点才能读懂身份。
- 攻击特效不遮挡敌人轮廓、Boss 预警和玩家血量。
- 新增 Prefab 不在战斗中临时 `instantiate` 后直接销毁，必须走对象池。
- 同一资源的普通、精英、Boss 变体通过配置差异表达，不复制三套逻辑。

### 9.4 怪物类型扩展规格

怪物按战斗职责扩展，不按外观或数值膨胀扩展。每个新怪必须能回答“它迫使玩家做了什么不同动作”。

怪物配置建议字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 稳定 ID，例如 `dasher_basic`。 |
| `role` | string | `chaser`、`tank`、`swarm`、`dasher`、`spitter`、`binder`、`elite`、`boss`。 |
| `introWave` | number | 首次出现波次。 |
| `teachCount` | number | 首次出现数量上限。 |
| `maxConcurrent` | number | 同屏上限。 |
| `baseStats` | object | HP、速度、伤害、接触半径。 |
| `behaviorProfile` | object | 追击、蓄力、冲刺、吐弹、束缚、召唤等参数。 |
| `attackProfileId` | string | 如有远程或技能攻击，指向统一攻击参数。 |
| `counterplay` | string | 玩家应对方式，例如横向躲避、优先击杀、拉扯。 |
| `spawnWeightByWave` | object | 各波次权重，不在代码里硬写。 |
| `poolKey` | string | 对象池键。 |
| `budgetCost` | number | AI、碰撞、VFX 综合预算。 |

首批 6 类基础怪物落地边界：

| 类型 | 核心职责 | 首次出现 | 同屏建议上限 | 设计红线 |
| --- | --- | --- | --- | --- |
| Chaser | 基础追击，建立移动压力 | Wave 1 | 24 | 不要速度过快导致无解包围。 |
| Tank | 慢速高血，压缩空间 | Wave 2 | 6 | 不要只靠血量拖时间，必须配合小怪形成压力。 |
| Swarm | 低血高数量，制造拥挤 | Wave 3 | 30 | 必须受全局敌人上限控制。 |
| Dasher | 蓄力冲刺，训练预警读取 | Wave 4 | 5 | 冲刺前必须有清楚预警。 |
| Spitter | 远程吐弹，迫使换位 | Wave 4-6 | 6 | 弹道必须慢且可读。 |
| Binder | 减速 / 区域限制，打断舒适走位 | Wave 6-8 | 4 | 控制效果不能连续锁死玩家。 |

### 9.5 性能预算与对象池规则

性能预算是内容设计输入，不是最后优化项。任何能被批量创建、短生命周期或高频刷新影响的对象，都必须进入对象池。

硬预算：

| 项目 | 默认上限 | 降级策略 |
| --- | --- | --- |
| 活跃敌人 | 36 | 延迟刷怪，降低 Swarm 权重。 |
| 活跃弹道 | 80 | 丢弃低优先级弹道或合并多段攻击。 |
| 活跃 VFX | 24 | 只保留 Boss、玩家受击、关键命中特效。 |
| 伤害数字 | 18 | 合并同帧伤害，降低刷新频率。 |
| HUD 刷新 | 10Hz | 数值变化可立即刷新，普通轮询节流。 |
| AI 决策 | 100ms | 只每帧移动，不每帧重算策略。 |
| 临时分配 | 0 / frame 为目标 | 预分配数组，复用查询结果容器。 |

对象池必须覆盖：

- 怪物节点。
- 弹道节点。
- 伤害数字。
- 命中 / 死亡 / 连锁 / 预警 VFX。
- 临时 hitbox。
- Boss 技能区域。
- 武器轨迹段。

对象池接口建议：

```ts
interface Poolable {
    resetForSpawn(payload: unknown): void;
    recycle(): void;
}

interface PoolBudgetRule {
    poolKey: string;
    preloadCount: number;
    maxActive: number;
    overflowPolicy: 'drop' | 'reuseOldest' | 'delaySpawn';
}
```

里程碑验收：

- Milestone 1 允许少量原型对象池，但必须能统计活跃敌人、弹道、VFX。
- Milestone 2 所有怪物、弹道、伤害数字必须走对象池。
- Milestone 3 所有 Sprite / Prefab VFX 必须声明 `budgetCost` 和 `overflowPolicy`。
- Milestone 4 接平台前必须完成低端模式降级开关。
## 2026-07-03 Playable Character Roster Update

The next playable-character batch is defined as four weapon-bound heroes. This
does not change the rule that a selected character owns the starter weapon and
combat identity. It replaces the old placeholder mental model with clearer
online-game-style character archetypes for the art-production pass.

| Character | Bound starter weapon | Attack shape | Combat role | Core visual read |
| --- | --- | --- | --- | --- |
| Pirate | Shotgun | `cone` / short area burst | close-mid burst, heavy rhythm, knockback | armored sea-raider coat, broad shotgun, shell belt, brass/cyan glow |
| Sharpshooter | Dual Pistols | `twin-line` projectiles | precise ranged DPS, fast cadence | slim gunfighter, two pistols, sharp visor, long scarf/coat tails |
| Knife Duelist | Short Blades | `arc` melee sweep | close 180-degree slashes, mobility | paired knives, low attack stance, split cloak fins, bright blade edges |
| Arcane Mage | Area Magic | `area` burst / delayed rune zone | medium-range area control | floating armored robe, spell core, compact rune circle, orbiting crystals |

Design constraints:

- The weapon must be visible on the character sprite and not treated as an
  interchangeable UI item.
- The attack VFX must reinforce the weapon identity: shotgun cone, twin pistol
  lanes, short-blade arc, compact rune area.
- Each battle sprite must still read at mobile landscape combat size. Complex
  costume details are welcome, but the silhouette and weapon are more important
  than tiny ornament.
- Runtime implementation should still flow through the unified attack-profile
  model instead of one-off character combat branches.
