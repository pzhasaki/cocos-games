# A0 Void Chaser 候选生成评审

> 日期：2026-07-21
>
> 状态：3 个候选方向已生成并完成透明化与 40/64/128 px 可读性检查；项目负责人已选择 C 双臂扑杀型 V2，并完成首轮运行时接入。

## 1. 生成信息

- 生成方式：`imagegen` 技能 CLI fallback。
- 模型：`gpt-image-2`。
- 接口：项目负责人提供的 OpenAI 兼容接口。
- 分辨率：1024×1024。
- 质量：medium。
- 背景流程：纯绿色键控背景生成，本地 chroma-key 去背、despill 与 1 px 边缘收缩。
- 最终候选格式：1024×1024 RGBA PNG，四角透明。
- 密钥未写入项目文件、提示词或开发日志。

完整生成提示词：

- [a0_void_chaser_batch01.jsonl](prompts/a0_void_chaser_batch01.jsonl)

## 2. 联系表

- 完整候选：[void-chaser-a0-contact-sheet.png](../output/imagegen/a0_void_chaser/void-chaser-a0-contact-sheet.png)
- 缩放验证：[void-chaser-a0-readability-sheet.png](../output/imagegen/a0_void_chaser/void-chaser-a0-readability-sheet.png)

## 3. 候选结果

### A：Wedge Head / 楔头猎兽型

文件：

- [透明候选](../output/imagegen/a0_void_chaser/transparent/void-chaser-a-wedgehead-clean.png)
- [键控原图](../output/imagegen/a0_void_chaser/chroma/void-chaser-a-wedgehead-chroma.png)

优点：

- 红珊瑚楔形甲片和前倾姿态具有明确的追击方向。
- 白色眼部在 40 px 下仍然可见。
- 轮廓独特，不容易与人形角色或机械单位混淆。
- 红紫晶体材质与 Hexa-9 异星生态方向一致。

问题：

- 两只眼和腹部核心均接近白色，核心层级不够明确。
- 肢体结构略抽象，可能被误认为飞行虫群或多头生物。
- 背部尖刺与头甲数量偏多，缩小后容易合并。

评审结论：

- 保留为候选。
- 若入选，需要把腹部核心改为洋红，并减少一处次要甲片。

### B：Split Jaw / 四足裂颚型

文件：

- [透明候选](../output/imagegen/a0_void_chaser/transparent/void-chaser-b-splitjaw-clean.png)
- [键控原图](../output/imagegen/a0_void_chaser/chroma/void-chaser-b-splitjaw-chroma.png)

优点：

- 四足低伏和前高后低的身体结构最符合持续追击职责。
- 纵向白色裂颚是强识别点，同时保持非地球生物感。
- 洋红腹部核心、红色背甲和紫黑肢体层级清楚。
- 40 px 下仍能读出冲向前方的头部、腿和背甲节奏。
- 材质颗粒、切面和暗部处理与短刃决斗家C方案最接近。

问题：

- 前肢较粗，静态图会稍微接近重型怪物。
- 裂颚的高亮面积需要在正式版本中略微降低，避免像玩家攻击光效。
- 尾部与后腿在小尺寸下可能发生轮廓合并。

评审结论：

- 当前推荐的主方向。
- 正式运行时版本需要适度缩小前肢、提高后腿动作感，强化“快而脆”而非“重而硬”。

### C：Grappler V2 / 双臂扑杀型

文件：

- [透明候选 V2](../output/imagegen/a0_void_chaser/transparent/void-chaser-c-grappler-clean-v2.png)
- [键控原图 V2](../output/imagegen/a0_void_chaser/chroma/void-chaser-c-grappler-chroma-v2.png)
- [被拒绝的初版透明图](../output/imagegen/a0_void_chaser/transparent/void-chaser-c-grappler-clean.png)

初版问题：

- 宽肩、胸甲、头盔和大型手臂过于接近人形装甲士兵。
- 体量与姿态更像精英或 Boss，而不是可大量出现的基础追击怪。
- 因职责层级错误，初版被拒绝。

V2 修正结果：

- 去除了人形肩甲和士兵式胸腔。
- 压低头部、缩短躯干，并保留两条前伸长臂。
- 洋红 Hex 核心成为清楚的胸部识别点。
- 双臂巨爪在 40 px 下仍然能够辨认。

剩余问题：

- 巨爪使轮廓略像螃蟹，仍需要通过奔跑动画证明其追击职责。
- 表面更圆润、卡通化，细节密度低于 A、B 和已选中的短刃决斗家C方案。
- 横向白色眼缝仍略像科技护目镜。

评审结论：

- V2 进入候选池，初版保留为拒绝证据。
- 更适合未来的抓取型特殊怪，而不是第一波唯一的基础追击者。

## 4. 综合比较

| 项目 | A 楔头猎兽 | B 四足裂颚 | C 双臂扑杀 V2 |
| --- | --- | --- | --- |
| 追击方向感 | 强 | 最强 | 中 |
| 基础怪层级 | 强 | 强 | 中 |
| 异星生态辨识 | 强 | 最强 | 中 |
| 与角色美术统一 | 强 | 最强 | 中 |
| 40 px 可读性 | 通过 | 通过 | 通过 |
| 后续动画潜力 | 中 | 强 | 强 |
| 推荐用途 | 基础怪备选 | Void Chaser 主方向 | 抓取特殊怪备选 |

## 5. 选择结果与运行时接入

初始专业评审推荐 B 四足裂颚型；项目负责人最终选择 **C 双臂扑杀型 V2** 作为当前 Void Chaser 运行时方向。B 继续保留为未来快速四足追击怪或本角色后续改版参考。

运行时处理：

- 按透明主体边界重新居中和留白，并导出 512×512 RGBA 图。
- 正式资源路径为 `assets/resources/enemies/void_chaser.png`。
- `RuntimeEntry` 通过 `resources.load('enemies/void_chaser/spriteFrame')` 加载。
- Sprite 节点使用 62×62 显示框，主体实际高度约 40 px。
- 使用懒创建并复用的 Sprite 节点池，避免每帧或每次刷怪重复创建节点。
- 保留出生缩放、轻微移动脉冲、横向朝向、受击染色、阴影和血条。
- 资源加载失败时继续使用原有 `Graphics` Void Chaser 形象。
- 其他怪物不受本次替换影响。
- 原 `assets/textures/enemies/void_chaser.png` 暂时保留为旧占位参考，不用于当前临时运行时路径。

后续美术步骤：

1. 在 Cocos Creator 的 960×540 预览中测试 4～12 个同屏 Chaser。
2. 确认巨爪不会遮挡玩家、血条或其他小型敌人。
3. 通过前后摆臂和身体前倾动画进一步消除螃蟹感。
4. 生成奔跑关键帧、受击图和死亡碎裂素材。
5. 稳定后将相同 SpriteFrame 同步到非临时怪物 Prefab 流程。
