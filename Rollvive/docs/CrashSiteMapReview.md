# 海克斯九号星坠毁区地图评审

> 日期：2026-07-21
>
> 状态：首张地图素材已生成、导出并完成当前角色/怪物战斗尺寸可读性预览；900×338专用版本已接入临时运行时场景。

## 1. 资产定位

- 地图名称：Hexa-9 Crash Site / 海克斯九号星坠毁区。
- 使用场景：第一章节、前 5 波战斗场地。
- 游戏画面：移动端横屏 960×540。
- 最终素材：1920×1080 RGB PNG。
- 资源路径：`assets/resources/environment/crash_site_base.png`。
- 高分辨率生成源图：2048×1152。
- 运行时Arena素材：1800×676 RGB PNG，显示尺寸900×338。

## 2. 视觉内容

- 中央约 70% 区域保持平坦、开阔，适合角色移动和怪物包围。
- 地面为低饱和蓝灰色异星玄武岩，带大块裂纹和少量 Hex 纹理。
- 左上边缘布置坠毁飞船引擎与破碎船体。
- 右上、右下边缘布置暗红色异星晶体簇。
- 下方边缘布置少量橙色破损陶瓷装甲板。
- 紫蓝能量裂缝只出现在外围，不进入主要战斗区域。
- 四周通过暗色岩层和残骸形成自然边界，不烘焙 UI 框。

## 3. 文件

- [高分辨率源图](../output/imagegen/maps/crash-site-map-source-v01.png)
- [1920×1080项目素材](../assets/resources/environment/crash_site_base.png)
- [1800×676运行时Arena素材](../assets/resources/environment/crash_site_arena.png)
- [960×540战斗可读性预览](../output/imagegen/maps/crash-site-map-gameplay-preview.png)
- [900×338运行时Arena预览](../output/imagegen/maps/crash-site-arena-runtime-preview.png)
- [完整生成提示词](prompts/map_crash_site_v01.txt)

## 4. 可读性检查

已使用当前运行时素材进行静态合成检查：

- 短刃决斗家：约 64 px 主体高度。
- Void Chaser：约 40 px 主体高度，共 4 个。
- Core Tank：约 61 px 主体高度，共 1 个。

检查结论：

- 玩家金橙色核心在蓝灰地面上清楚可见。
- Void Chaser 的红紫身体和白色眼缝在中心区域保持辨识。
- Core Tank 的橙色双盾与普通怪形成清楚体型层级。
- 中央没有高亮黄色或红色地表，不会伪装成攻击或预警。
- 边缘晶体具有场景记忆点，但不会侵入主要移动区域。
- 左上飞船引擎是当前最亮场景物件；运行时应位于不可行走边缘，避免与奖励提示混淆。

## 5. 运行时接入状态

已完成：

1. 从1920×1080地图中央裁出与Arena比例一致的1800×676版本，避免拉伸。
2. 通过 `resources.load('environment/crash_site_arena/spriteFrame')` 异步加载。
3. 渲染层级调整为地图、Graphics、敌人Sprite、玩家Sprite、伤害文字。
4. 地图加载成功后，旧Graphics背景仅保留低透明暗层与边框。
5. 地图加载失败时自动恢复完整旧网格背景。

仍需验证：

1. 在Cocos Creator中触发资源重导入并检查900×338实际显示。
2. 检查Draft、Result和Boss警告状态下的地图与UI对比度。
3. 检查目标平台纹理压缩与包体；必要时提供更小的1280×481降级图。
4. 1920×1080基础图目前也位于resources目录，首发包体优化时可移出运行时资源包，仅保留Arena版本。

## 6. 生成记录

- 生成方式：`imagegen` 技能 CLI fallback。
- 模型：`gpt-image-2`。
- 接口：项目负责人提供的 OpenAI 兼容接口。
- 生成尺寸：2048×1152。
- 生成质量：high。
- 生成耗时：约 208 秒。
- 未使用透明背景，不需要键控去背。
- API密钥未写入任何项目文件、提示词或日志。
