# A0 Core Tank 候选生成评审

> 日期：2026-07-21
>
> 状态：3 个候选方向已生成并完成透明化与 48/64/128 px 可读性检查；项目负责人已选择 C 双盾推进型，并完成首轮运行时接入。

## 1. 生成信息

- 生成方式：`imagegen` 技能 CLI fallback。
- 模型：`gpt-image-2`。
- 接口：项目负责人提供的 OpenAI 兼容接口。
- 分辨率：1024×1024。
- 质量：medium。
- 背景流程：纯绿色键控背景生成，本地 chroma-key 去背、despill 与 1 px 边缘收缩。
- 最终候选格式：1024×1024 RGBA PNG。
- 密钥未写入项目文件、提示词或开发日志。

完整生成提示词：

- [a0_core_tank_batch01.jsonl](prompts/a0_core_tank_batch01.jsonl)

## 2. 联系表

- 完整候选：[core-tank-a0-contact-sheet.png](../output/imagegen/a0_core_tank/core-tank-a0-contact-sheet.png)
- 缩放验证：[core-tank-a0-readability-sheet.png](../output/imagegen/a0_core_tank/core-tank-a0-readability-sheet.png)

## 3. 候选结果

### A：Beetle Fortress / 甲虫堡垒型

文件：

- [透明候选](../output/imagegen/a0_core_tank/transparent/core-tank-a-beetle-fortress-clean.png)
- [键控原图](../output/imagegen/a0_core_tank/chroma/core-tank-a-beetle-fortress-chroma.png)

优点：

- 宽、低、前重的体型非常稳定，第一眼能够感受到高防御。
- 三段橙色陶瓷背甲、黄色横向核心和四条粗腿均具有良好层级。
- 48 px 下仍然可以辨认核心狭缝和外甲结构。
- 造型紧凑，适合做缓慢直线推进和受击震动。

问题：

- 外形接近悬浮载具或无人装甲车，生物性不足。
- 银白顶部甲片容易被理解为驾驶舱。
- 四肢与躯干连接较机械，紫黑生物组织表现偏少。

评审结论：

- 保留为候选。
- 更适合未来的机械防御单位；若作为 Core Tank，需要强化生物关节和异星头部。

### B：Hex Tortoise V2 / 六角龟甲型

文件：

- [透明候选 V2](../output/imagegen/a0_core_tank/transparent/core-tank-b-hex-tortoise-clean-v2b.png)
- [键控原图 V2](../output/imagegen/a0_core_tank/chroma/core-tank-b-hex-tortoise-chroma-v2.png)
- [被拒绝的初版透明图](../output/imagegen/a0_core_tank/transparent/core-tank-b-hex-tortoise-clean.png)

初版问题：

- 六角龟壳结构成立，但中央反应堆没有生成。
- 缺少清楚的头部与能量核心，更接近普通石龟或地形障碍。
- 因核心身份不足，初版被拒绝。

V2 修正结果：

- 中央改为凹陷的黄色六边形反应堆。
- 六块橙色甲片、暗色金属框和紫黑关节层级清晰。
- 六条支撑腿可以辨认，前方小型异星头部带红色感知点。
- 48 px 下仍然保持“厚壳＋核心＋多足”的完整信息。
- 三个方案中最符合高血量、慢速推进和压缩空间的职责。

剩余问题：

- 生成图带有一圈绿色接地反光，常规键控去背后仍有少量残留。
- 体型接近乌龟，需要通过机械步态和关节动画降低普通动物感。
- 中央核心亮度较高，正式版本需要略微收敛。

评审结论：

- 当前推荐的主方向。
- 若入选，必须先清理绿色接地反光，再进入运行时目录。

### C：Twin Shield / 双盾推进型

文件：

- [透明候选](../output/imagegen/a0_core_tank/transparent/core-tank-c-twin-shield-clean.png)
- [键控原图](../output/imagegen/a0_core_tank/chroma/core-tank-c-twin-shield-chroma.png)

优点：

- 两块巨大橙色盾甲和中央黄色缝隙具有极强正面阻挡感。
- 玩家可以直接理解“正面防御高，需要绕侧面”的机制暗示。
- 盾面撞痕、金属边框和厚重脚部材质清楚。
- 48 px 下双盾轮廓仍然成立。

问题：

- 姿态较高、较窄，空间压缩感弱于 A、B。
- 可见肢体接近双足，容易被理解为持盾人形或机器人。
- 正面机制过强，更适合拥有方向护甲的特殊精英，而不是纯高血 Tank。

评审结论：

- 保留为特殊精英候选。
- 如果作为 Core Tank，需要压低整体高度并补足四足支撑结构。

## 4. 综合比较

| 项目 | A 甲虫堡垒 | B 六角龟甲 V2 | C 双盾推进 |
| --- | --- | --- | --- |
| 高血重甲感 | 强 | 最强 | 强 |
| 空间压缩职责 | 强 | 最强 | 中 |
| 异星生物辨识 | 中 | 强 | 中 |
| 正面防御暗示 | 中 | 强 | 最强 |
| 48 px 可读性 | 通过 | 通过 | 通过 |
| 与现有异星生态统一 | 中 | 最强 | 中 |
| 推荐用途 | 机械重装备选 | Core Tank 主方向 | 方向护甲精英备选 |

## 5. 选择结果与运行时接入

初始专业评审推荐 B 六角龟甲型 V2；项目负责人最终选择 **C 双盾推进型** 作为当前 Core Tank 运行时方向。B 继续保留为未来六足厚壳怪或本角色后续改版参考。

运行时处理：

- 按透明主体边界重新居中和留白，并导出 512×512 RGBA 图。
- 正式资源路径为 `assets/resources/enemies/core_tank.png`。
- `RuntimeEntry` 通过 `resources.load('enemies/core_tank/spriteFrame')` 加载。
- Sprite 节点使用 90×90 显示框，主体实际高度约 61 px。
- 使用独立、懒创建并复用的 Core Tank Sprite 节点池。
- 保留出生缩放、缓慢脉冲、横向朝向、受击染色、阴影和血条。
- 资源加载失败时继续使用原有 `Graphics` Core Tank 形象。
- Void Chaser 与其他怪物不受本次替换影响。
- 原 `assets/textures/enemies/core_tank.png` 暂时保留为旧占位参考，不用于当前临时运行时路径。

后续美术步骤：

1. 在 Cocos Creator 的 960×540 预览中与 40 px Void Chaser 并排测试体型层级。
2. 确认两块大盾不会过度遮挡玩家、血条或冲刺预警。
3. 通过沉重踏步和盾面上下摆动强化慢速推进感。
4. 生成受击震动、盾甲破损和死亡碎裂素材。
5. 稳定后将相同 SpriteFrame 同步到非临时 Monster Prefab 流程。
