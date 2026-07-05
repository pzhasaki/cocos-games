# Rollvive 内容切片计划

> 范围：本文件只定义设计和数据切片，不要求本轮修改运行时代码。
> 参考：`RollviveDesignBible.md`、`assets/scripts/data/RollData.ts`、`assets/scripts/manager/WaveManager.ts`。

## 1. 切片目标

当前切片只解决四件事：

1. 明确前 5 波的敌人组合和教学目标。
2. 明确首批 3 个角色的真实差异。
3. 明确 Hex 家族从当前卡牌数据扩展到完整体系的方向。
4. 固化经济规则：不做金币；Draft 默认免费刷新；免费刷新用完后走激励广告入口。

本切片不做：

- 不改 `RuntimeEntry.ts`。
- 不引入金币掉落、金币商店、金币刷新或局内金币奖励。
- 不把“广告刷新”伪装成金币消耗。
- 不在前 5 波堆复杂怪物数量，先保证玩家读得懂压力来源。

## 2. 前 5 波敌人组合

`WaveManager.ts` 当前运行时只有 `NORMAL / ELITE / BOSS` 三档生成，并按基础数量线性增长。内容设计上，前 5 波应先映射成下面的战斗职责；后续可再由数据层把 Chaser、Tank、Swarm、Dasher、Boss 绑定到具体 prefab 或 AI 参数。

| 波次 | 建议时长 | 敌人组合 | 数量目标 | 设计目标 | Draft 后验证点 |
| --- | --- | --- | --- | --- | --- |
| 1 | 20-25 秒 | Chaser | 4 | 学会移动和自动攻击；低压追逐 | 玩家知道清波后会进入 Hex 选择 |
| 2 | 25-30 秒 | Chaser + Tank | 4 Chaser + 1 Tank | 学会拉扯高血目标，不站桩 | 伤害、范围或刀数强化能更快处理 Tank |
| 3 | 30-35 秒 | Chaser + Swarm | 4 Chaser + 6 Swarm | 感受密度压力和构筑反馈 | 多刀、范围、连锁类强化有明显收益 |
| 4 | 35-40 秒 | Chaser + Dasher | 5 Chaser + 2 Dasher | 第一次引入特殊威胁和预警躲避 | 移动、防御或爆发强化能改变应对方式 |
| 5 | 60-75 秒 | Boss + Chaser | 1 Boss + 6 Chaser | 第一个阶段验收：持续输出、躲避、清杂 | 玩家能说出当前构筑强在哪、弱在哪 |

### 敌人职责

| 类型 | 低保行为 | 数据倾向 | 首次出现规则 |
| --- | --- | --- | --- |
| Chaser | 持续追玩家并造成接触压力 | 中速、低血、低伤 | 第 1 波只出现它 |
| Tank | 慢速压缩走位空间 | 慢速、高血、中伤 | 第 2 波只放 1 个，避免玩家误以为是 Boss |
| Swarm | 用数量制造拥挤和清场需求 | 快速、极低血、低伤 | 第 3 波出现，数量多但单体弱 |
| Dasher | 短预警后直线冲刺 | 快速、中血、高伤 | 第 4 波只放 2 个，必须有可读预警 |
| Boss | 阶段压力核心 | 高血、有节奏技能 | 第 5 波出现，配少量 Chaser 检查清杂能力 |

### 与当前运行时的关系

- 当前 `WaveManager` 可先用 `NORMAL` 承载 Chaser/Swarm 的表现占位，用 `ELITE` 承载 Tank/Dasher 的表现占位，用 `BOSS` 承载第 5 波 Boss。
- 设计目标是数据表能表达“战斗职责”，而不是只靠 HP、速度和颜色区分敌人。
- 前 5 波同屏敌人峰值先控制在 12 个以内，符合移动端可读性和性能预算。

## 3. 3 个角色差异

`RollData.ts` 已有 `Blade Adept / Hex Gambler / Storm Mage` 三个职业。本切片把它们固定为三种开局规则，而不是皮肤。

| 角色 | 面向玩家的定位 | 当前数据锚点 | 擅长 Hex | 明显弱点 | 适合玩家 |
| --- | --- | --- | --- | --- | --- |
| Blade Adept | 新手稳定型 | `maxHp +8`、`armor +2`、`damage +4`、`bladeCount 2` | Blade、Stat | 后期爆发和稀有构筑上限普通 | 第一次进入游戏的玩家 |
| Hex Gambler | 随机高收益型 | `maxHp -12`、`luck +3`、`energyPerAttack +8` | Utility、Risk | 血少，错误走位代价高 | 喜欢刷新、赌稀有、接受风险的玩家 |
| Storm Mage | 连锁清场型 | `maxHp -4`、`attackRange +35`、`chainHits +1` | Blade、Mobility | 前期刀数少，怕被贴脸 | 能读怪物节奏、喜欢范围成长的玩家 |

### 角色验收标准

- Blade Adept：不依赖高稀有卡，也能稳定通到第 5 波。
- Hex Gambler：每次 Draft 都应明显更像“高收益选择”，但被围住时更容易暴毙。
- Storm Mage：第 1 到 2 波压力略高，第 3 波后拿到连锁、范围或移动强化时清场感提升明显。

## 4. Hex 家族扩展

`RollData.ts` 当前分类为 `stat / blade / economy / risk`。内容语义上，`economy` 不再表示金币经济，而是 Draft Utility：免费刷新、额外选项、稀有度倾向。

目标 Hex 家族如下：

| 家族 | 作用 | 当前卡牌例子 | 后续补齐方向 |
| --- | --- | --- | --- |
| Blade | 改变攻击形态 | Extra Blade、Blade Fan、Orbiting Blade、Chain Cut | 刀数、角度、环绕、分裂、连锁上限 |
| Stat | 稳定数值成长 | Sharpen、Wide Arc、Giant Heart、Cosmic Armor | 血量、护甲、伤害、攻速、范围 |
| Mobility | 走位和生存窗口 | 暂由 Phase Step 占位 | 移速、闪避、短冲刺、受击后加速、防御窗口 |
| Risk | 高收益代价选择 | Critical Mass、Glass Edge | 降血、降防、变慢、提高敌人压力换输出 |
| Utility | Draft 规则变化 | Free Roll、Lucky Hex、Fourth Choice、Interest Seed | 免费刷新、额外选择、稀有度倾向；不含金币 |

### 命名和数据规则

- 如果代码暂时继续使用 `economy` 分类，文案和设计文档统一解释为 Utility，不写金币收益。
- 新卡牌描述要能在小屏一眼看懂，优先写“收益 + 代价”，避免长段机制说明。
- Risk 卡必须有明确代价，不做纯粹更强的金卡。
- Utility 卡只能改变 Draft 规则，不能新增金币、商店、利息或购买行为。

## 5. Draft 刷新和广告规则

固定规则：

1. 项目不做金币经济。
2. 每次 Draft 默认提供 1 次免费刷新。
3. 职业或 Utility Hex 可以增加每次 Draft 的免费刷新次数。
4. 免费刷新次数用完后，刷新按钮变成激励广告入口。
5. 本地预览可以模拟广告成功。
6. 真机平台由适配层接入真实激励广告 SDK。

禁止规则：

- 禁止金币刷新。
- 禁止金币购买 Hex。
- 禁止怪物掉金币。
- 禁止把 `economy` 文案写成金币收益。
- 禁止在没有平台适配层的情况下把广告逻辑写死进战斗或 Draft 核心流程。

## 6. 数据落地顺序

1. 先补前 5 波数据表：波次、敌人职责、数量、首次出现提示、Boss 标记。
2. 再把 3 个角色暴露到选择入口，并保证开局属性差异可见。
3. 然后把 Hex 分类文案从 Economy 统一调整为 Utility 语义。
4. 最后补 Mobility 家族卡牌，避免移动和生存只挂在 Stat 里。

本文件只定义内容目标；运行时代码改造应另开任务执行。
## 2026-07-04 playable roster update

Current implementation direction uses four weapon-bound playable characters:

| Character | Bound weapon | Combat role |
| --- | --- | --- |
| Knife Duelist | Short Blades | close 180-degree melee arcs, high mobility |
| Pirate | Shotgun | close-mid cone blast, heavy rhythm, knockback pressure |
| Sharpshooter | Dual Pistols | twin ranged shots, fast cadence, precision damage |
| Arcane Mage | Area Magic | compact rune burst, area damage, chain scaling |

This replaces the older three-character placeholder direction for the next
playable slice. The existing stable ids may remain in code for compatibility,
but player-facing names, weapon reads, and battle silhouettes should follow this
four-character roster.
