# A0 短刃决斗家候选生成评审

> 日期：2026-07-21
>
> 状态：3 个候选方向已生成并完成透明化与 64/96/128 px 可读性检查；项目负责人已选择 C 折叠刃翼型，并完成首轮运行时接入。

## 1. 生成信息

- 生成方式：`imagegen` 技能 CLI fallback。
- 模型：`gpt-image-2`。
- 接口：项目负责人提供的 OpenAI 兼容接口。
- 分辨率：1024×1024。
- 质量：medium。
- 背景流程：纯绿色键控背景生成，本地 chroma-key 去背，1 px 边缘收缩与 despill。
- 最终候选格式：1024×1024 RGBA PNG，四角透明。
- 密钥未写入项目文件、提示词或开发日志。

完整生成提示词保存在：

- [a0_knife_duelist_batch01.jsonl](prompts/a0_knife_duelist_batch01.jsonl)

## 2. 联系表

- 完整候选：[knife-duelist-a0-contact-sheet.png](../output/imagegen/a0_knife_duelist/knife-duelist-a0-contact-sheet.png)
- 缩放验证：[knife-duelist-a0-readability-sheet.png](../output/imagegen/a0_knife_duelist/knife-duelist-a0-readability-sheet.png)

## 3. 候选结果

### A：Vanguard / 稳健先锋型

文件：

- [透明候选](../output/imagegen/a0_knife_duelist/transparent/knife-duelist-a-vanguard-clean.png)
- [键控原图](../output/imagegen/a0_knife_duelist/chroma/knife-duelist-a-vanguard-chroma.png)

优点：

- 头肩宽、重心低，具有可靠的新手角色气质。
- 青灰装甲、金白核心与暗红腰布层级清楚。
- 主手发光短刃在 64 px 下仍然非常明显。
- 姿势紧凑，适合默认待机或近战准备动作。

问题：

- 副手短刃较暗、较细，缩小后接近护臂尖端。
- 胸口 Hex 核心偏柔和，骰点符号没有充分体现。
- 俯视角度略弱，更接近较高机位的角色概念图。

评审结论：

- 保留为候选。
- 如果入选，需要在正式战斗 Sprite 中加粗副手刀刃并强化核心形状。

### B：Side Cut V2 / 高速侧切型

文件：

- [透明候选 V2](../output/imagegen/a0_knife_duelist/transparent/knife-duelist-b-sidecut-clean-v2.png)
- [键控原图 V2](../output/imagegen/a0_knife_duelist/chroma/knife-duelist-b-sidecut-chroma-v2.png)
- [被拒绝的初版透明图](../output/imagegen/a0_knife_duelist/transparent/knife-duelist-b-sidecut-clean.png)

初版问题：

- 横向动作成立，但两把短刃与交叉手臂重叠。
- 在 96 px 和 64 px 下几乎无法判断武器数量，因此被拒绝。

V2 修正结果：

- 保留原有侧步、装甲、头盔、披挂和镜头。
- 两只手分别持有一把完整短刃，武器伸出身体两侧。
- 双刀在 64 px 下仍然可以辨认。
- 暗红披挂与横向步幅带来三者中最强的速度感。

剩余问题：

- 主装甲偏黑白，深青职业色较弱。
- 身体方向感强，但作为静态待机图略显攻击动作过满。

评审结论：

- V2 进入候选池，初版保留为拒绝证据。
- 更适合作为攻击关键帧或角色选择动态姿势，而非唯一待机图。

### C：Blade Wing / 折叠刃翼型

文件：

- [透明候选](../output/imagegen/a0_knife_duelist/transparent/knife-duelist-c-bladewing-clean.png)
- [键控原图](../output/imagegen/a0_knife_duelist/chroma/knife-duelist-c-bladewing-chroma.png)

优点：

- 双短刃、背部折叠刃架和胸口核心均清楚可见。
- 最能表达“额外刀刃、环绕刀刃和多刀 Hex 构筑”的成长来源。
- 黑银装甲、暗红披挂与强能量核心形成最完整的线上游戏角色层次。
- 在 64 px 下仍能保留头盔亮面、核心、刃架和双刀四个识别点。

问题：

- 核心发光更接近橙色，需要后续统一到淡金色。
- 背部刃架较抢眼，需要在实战中确认不会被误认为翅膀或远程武器。
- 装甲深青比例偏少，需要通过最终配色稿加强职业主色。

评审结论：

- 保留为候选，并作为当前推荐的主方向。
- 后续应将能量色调整为淡金、增加深青甲片，并用动画证明背部结构是折叠刀架。

## 4. 综合比较

| 项目 | A 稳健先锋 | B 高速侧切 V2 | C 折叠刃翼 |
| --- | --- | --- | --- |
| 新手角色稳定感 | 强 | 中 | 强 |
| 双短刃可读性 | 中 | 强 | 强 |
| 移动与攻击动势 | 中 | 最强 | 强 |
| Hex 科技辨识 | 中 | 中 | 最强 |
| 多刀成长扩展 | 弱 | 中 | 最强 |
| 64 px 可读性 | 通过，副手偏弱 | 通过 | 通过 |
| 推荐用途 | 待机/基础姿势 | 攻击关键帧 | 主设计方向 |

## 5. 选择结果与运行时接入

项目负责人已选择 **C 折叠刃翼型** 作为角色主设计方向。B V2 继续保留为侧切攻击关键帧参考，A 保留为稳健比例与青色肩甲参考。

运行时处理：

- 从 1024×1024 透明源图导出 512×512 RGBA 运行时图。
- 正式资源路径为 `assets/resources/characters/knife_duelist.png`。
- `RuntimeEntry` 通过 `resources.load('characters/knife_duelist/spriteFrame')` 加载。
- 角色选择预览和战斗角色均使用同一 SpriteFrame。
- 战斗显示框为 76×76，透明主体实际高度约 64 px。
- 横向移动时允许水平翻转，近战攻击时提供轻微缩放反馈。
- 加载失败时保留原有 `Graphics` 角色作为降级方案。
- 其他三个角色暂时继续使用原有程序绘制形象。
- 原 `assets/textures/characters/blade_adept.png` 暂时保留为旧占位参考，不再用于当前 `RuntimeEntry` 的短刃决斗家显示。

后续美术步骤：

1. 将橙色能量统一修正为策划要求的淡金色。
2. 生成标准待机、左右侧切和双刀交叉攻击关键帧。
3. 制作受击帧或验证运行时闪白材质。
4. 打开 Cocos Creator 完成资源重导入，并在 960×540 实战中复核锚点、遮挡与翻转效果。
5. 稳定后再将正式 SpriteFrame 同步到非临时 `Player.prefab` 流程。
