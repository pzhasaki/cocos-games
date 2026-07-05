# Rollvive Art Direction Bible

> 目标：把 Rollvive 从“可玩的几何原型”推进到“可交给 AI 出图或美术外包的线上游戏级角色/怪兽设定”。
> 本文先定义复杂角色、武器、Boss、怪物的视觉设计，不直接等同于最终可商用美术成品。

## 1. 总体美术方向

Rollvive 的核心视觉关键词：

- 科幻幸存者
- 异星遗迹
- 六边形符文
- 装甲织物混搭
- 能量武器
- 克苏鲁感但不恐怖写实
- 横屏移动端可读

目标不是做可爱圆形怪物，也不是简单 Q 版图标。角色和怪兽应该像线上手游里的战斗单位：有复杂轮廓、有装备层次、有材质差异、有可识别的职业身份。

推荐风格：

- 2.5D stylized sci-fi fantasy
- 半写实比例，战斗中可缩成 64-128 px 仍能看出身份
- 角色身体比例略夸张：头肩和武器更醒目，腿部简化
- 怪物以轮廓记忆点优先：角、核心、壳、触须、炮口、冲刺翼片
- UI 头像/立绘可以比战斗 Sprite 更复杂

禁用方向：

- 纯圆点、纯几何块、普通 emoji 风
- 过度暗黑导致小屏看不清
- 角色和武器分离到无法看出绑定套装
- Boss 只是普通怪放大
- 所有角色都穿同款紧身衣换颜色

## 2. 资产层级

每个核心角色至少需要三层资产：

1. 角色选择立绘：512x768 或 768x1024，展示完整设计和武器。
2. 战斗 Sprite：256x256 透明 PNG 或序列帧，强调轮廓和武器方向。
3. UI 头像：256x256，突出脸、肩甲、职业符号。

每个怪物至少需要：

1. 战斗 Sprite：256x256 透明 PNG。
2. 受击帧：同尺寸，可用变亮、裂纹、能量溢出。
3. 死亡碎裂 VFX：可复用粒子和碎片。

Boss 至少需要：

1. Boss 立绘：1024x1024 或 1024x768。
2. 战斗 Sprite：512x512。
3. Phase 2 变体。
4. 技能预警图形。
5. 核心破裂/死亡爆发图形。

## 3. 统一设计语言

### 3.1 六边形与骰子语言

Rollvive 的“Roll”不应该只出现在 UI 文案里，而要成为视觉符号：

- 胸甲、肩甲、武器核心使用六边形孔洞。
- 能量核心像发光骰子，表面有 1-6 个符文点。
- 强化卡牌的图标可以复用六边形切角。
- Boss 身上有破碎的六边形晶核。

### 3.2 材质

角色材质组合：

- 内层：深色战斗服、弹性织物、哑光黑灰。
- 外层：硬质陶瓷装甲、金属边框、发光能量管。
- 武器：高亮能量刃、悬浮晶核、机械枪管、符文轨道。

怪物材质组合：

- 生物外壳：半透明晶壳、软肉、硬刺。
- 能量器官：发光核心、裂纹、脉冲纹路。
- 寄生科技：残破金属环、断裂装甲、异星电路。

### 3.3 小屏可读性规则

每个单位必须有“三秒识别点”：

- Blade Adept：双能量刃 + 稳重蓝金装甲。
- Rift Spearman：长枪斜线轮廓 + 青蓝裂隙披挂。
- Hex Gambler：手枪/卡牌/骰子核心 + 绿黑危险感。
- Storm Mage：悬浮法球 + 紫白符文环。
- Chaser：尖头追击轮廓。
- Tank：厚壳方形体。
- Dasher：三角冲刺翼片。
- Spitter：后仰炮口/喉囊。
- Binder：重力环和束缚核心。
- Boss：巨角、胸口核心、破碎六边形王冠。

## 4. 角色设计

### 4.1 Blade Adept

定位：新手稳定型，近中距离双刃。

外观轮廓：

- 中等身材，站姿稳定，肩宽明显。
- 双臂装备短能量刃，刃从手腕外侧展开。
- 背后有两个折叠式刀翼，暗示后续多刀成长。
- 头盔是单眼圆形 visor，中央嵌六边形光孔。

服装和装备：

- 主体是深蓝战斗服。
- 胸甲为白蓝陶瓷装甲，边缘金色。
- 肩甲厚实但不笨重，带短横向护板。
- 腰部有六边形电池匣和两枚备用刀柄。
- 靴子有磁吸底板，适合异星地表高速变向。

武器：

- 两把短能量刃，颜色金黄偏白。
- 刀背是实体金属框，刀刃是发光能量面。
- 攻击时生成扇形刀光，不要像普通剑气，而是由多个六边形碎片拼成弧线。

颜色：

- 主色：深蓝、钴蓝。
- 辅色：暖金、白色装甲。
- 发光色：金白。

性格视觉：

- 可靠、专业、正面作战。
- 不要太轻飘，不要像刺客。

AI 出图提示词：

```text
Stylized sci-fi fantasy mobile game character, Blade Adept survivor, medium armored fighter with twin wrist-mounted energy blades, deep cobalt bodysuit, white ceramic armor plates, gold glowing hex-tech accents, single round visor helmet with hexagonal light aperture, folded blade wings on the back, compact heroic silhouette, detailed layered armor, polished online mobile game concept art, full body, 3/4 view, transparent or plain dark background, readable at small size, no text, no watermark.
```

负面提示：

```text
no simple circle body, no emoji style, no plain robot, no medieval sword, no photorealism, no bulky mech, no excessive tiny noise, no text
```

### 4.2 Rift Spearman

定位：长距离穿刺，节奏更慢但攻击线清晰。

外观轮廓：

- 身形比 Blade Adept 更高、更修长。
- 长枪斜跨角色全身，是最重要的识别线。
- 披挂像裂隙旗帜，由几片半透明能量布组成。
- 头盔侧面有细长天线，像空间定位器。

服装和装备：

- 青蓝色轻甲，胸口是纵向裂隙核心。
- 肩甲一大一小，形成非对称轮廓。
- 左臂是稳定器，右臂连接长枪供能线。
- 腿部装甲轻，强调机动穿刺。

武器：

- Rift Spear 是实体枪杆 + 分叉能量枪尖。
- 枪尖像打开的空间裂缝，不是普通矛头。
- 枪杆上有环形加速器，攻击前短暂发亮。

颜色：

- 主色：深青、蓝绿。
- 辅色：银白、暗蓝。
- 发光色：冰蓝、青白。

性格视觉：

- 冷静、精准、有武术感。
- 不要像骑士长矛，要像科幻裂隙武器。

AI 出图提示词：

```text
Stylized sci-fi fantasy mobile game character, Rift Spearman survivor, tall agile armored lancer holding a long diagonal rift spear, teal and cyan lightweight armor, asymmetric shoulder guards, translucent torn energy mantle, spear tip split into glowing blue spatial rift blades, hex-tech core on chest, sleek helmet with side antenna, detailed online game character concept art, full body 3/4 view, strong readable silhouette, plain dark background, no text, no watermark.
```

### 4.3 Hex Gambler

定位：高风险高收益，远程枪械和随机强化倾向。

外观轮廓：

- 更瘦、更低姿态，像随时侧身闪避。
- 单手持短枪，另一只手夹着发光骰子/卡牌。
- 外套下摆不规则，像赌徒披风但要科幻化。
- 头盔 visor 更窄，表情感更狡黠。

服装和装备：

- 黑绿短外套，内层是轻型防护服。
- 胸前有一个透明骰子反应炉，内部点数会发光。
- 腰间挂着弹匣、筹码形能量盘、折叠卡包。
- 手套指尖发光，暗示操作概率/抽卡。

武器：

- Pulse Gun 是短管能量手枪。
- 枪口有骰点状散热孔。
- 射击弹道是细绿线，命中时爆出小型六边形碎光。

颜色：

- 主色：黑绿、墨绿。
- 辅色：荧光绿、灰银。
- 发光色：酸绿。

性格视觉：

- 危险、灵活、赌徒气质。
- 不要做成西部牛仔；更像赛博概率术士。

AI 出图提示词：

```text
Stylized sci-fi fantasy mobile game character, Hex Gambler survivor, slim agile cyber gambler with compact pulse pistol and glowing dice cards, black and emerald green tactical coat, transparent dice reactor in the chest, hexagonal chip magazines on belt, narrow visor helmet, asymmetrical cloak panels, high-risk rogue silhouette, detailed layered costume, polished online mobile game concept art, full body 3/4 view, plain dark background, no text, no watermark.
```

### 4.4 Storm Mage

定位：中远程连锁法球，成长后清场。

外观轮廓：

- 站姿更悬浮，脚底略离地。
- 身边有 1-3 个悬浮法球轨道。
- 头部和肩部有符文环，让轮廓更神秘。
- 长袍不是传统布袍，而是分片装甲布和能量线路。

服装和装备：

- 紫色内层战斗服。
- 白紫色胸甲，中央是风暴核心。
- 肩部悬浮小型雷环。
- 背后有折叠式符文翼片。

武器：

- Orbit Core / 法球是悬浮的六边形晶核。
- 外层有两个旋转环，内核像小型雷云。
- 攻击时释放短链闪电，不能铺满屏幕。

颜色：

- 主色：深紫、靛紫。
- 辅色：白、淡银。
- 发光色：紫白、淡蓝电弧。

性格视觉：

- 高智、远程、脆但强。
- 不要变成传统魔法师帽子长袍。

AI 出图提示词：

```text
Stylized sci-fi fantasy mobile game character, Storm Mage survivor, floating hex-tech caster with orbiting energy core, purple armored robes made of segmented plates and fabric, white violet chest reactor, rotating rune rings around shoulders and head, small lightning arcs, elegant but combat-ready silhouette, sci-fi fantasy online mobile game concept art, full body 3/4 view, readable at small size, plain dark background, no text, no watermark.
```

## 5. Boss 设计

### 5.1 Core Brute / 裂核守卫

定位：第 5 波 Boss，检验走位、清杂和持续输出。

外观轮廓：

- 巨大上半身，短腿或悬浮下盘。
- 头部和肩部连成厚重外壳。
- 两根向上的晶角，形成 Boss 级剪影。
- 胸口有巨大裂开的六边形核心。
- 左右手臂不对称：一只重拳，一只炮状能量臂。

材质：

- 外壳是紫黑异星晶甲。
- 裂缝里透出粉红/金色核心光。
- 关节处有生物软组织和机械环。
- 角上有断裂边缘和能量流纹。

Phase 1：

- 核心完整，光稳定。
- 动作慢，释放径向弹幕较少。
- 色彩偏紫和粉。

Phase 2：

- 核心裂开，露出金黄色内核。
- 角和肩甲出现红色裂纹。
- 身体周围出现失控六边形碎片。
- 弹幕更多，并留下重力减速区。

技能视觉：

- Radial Burst：胸口核心收缩 0.5 秒，然后释放 8-12 个能量弹。
- Gravity Slam：抬起重拳，地面出现六边形预警圈。
- Phase Break：血量低于 52% 时外壳爆裂，短暂白闪，核心变金红。

AI 出图提示词：

```text
Stylized sci-fi fantasy boss monster for an online mobile roguelite game, Core Brute, massive alien hex-core guardian, bulky purple-black crystalline armor shell, two tall broken crystal horns, huge cracked hexagonal reactor in the chest glowing magenta and gold, asymmetric arms with one heavy fist and one energy cannon limb, biomechanical joints, floating hex fragments, intimidating but readable silhouette, phase two enraged cracks, high-detail concept art, 3/4 front view, plain dark background, no text, no watermark.
```

Boss 战斗 Sprite 提示词：

```text
Top-down 2.5D battle sprite of the Core Brute boss, compact readable silhouette, large horns, cracked glowing chest core, purple crystalline armor, asymmetric arms, transparent background, designed for mobile game combat at 128-256 px, strong outline, no text, no watermark.
```

## 6. 怪物设计

### 6.1 Void Chaser

职责：基础追击压力。

复杂化方向：

- 不再是红色小块，而是“异星猎犬/寄生追踪体”。
- 头部前伸，背部有 3 个小晶刺。
- 腿部可以弱化，但要有向前扑的姿态。
- 核心发光点在胸腹部。

AI 提示词：

```text
Stylized alien chaser monster for mobile roguelite game, small aggressive hunter creature, forward-leaning body, red coral-like armor plates, three small back crystals, glowing pale eyes, exposed hex-tech core in abdomen, sharp readable silhouette, top-down 2.5D battle sprite, transparent background, no text, no watermark.
```

### 6.2 Core Tank

职责：空间压缩，高血量。

复杂化方向：

- 像移动堡垒，不是方块。
- 巨大前壳、低重心、四个短支撑腿。
- 壳上有损坏的装甲板和黄色核心缝。
- 受击时壳裂纹发光。

AI 提示词：

```text
Stylized heavy alien tank monster, slow armored creature with massive square front shell, orange ceramic armor plates, glowing yellow core slit, four short mechanical-organic legs, cracked hex armor details, mobile game 2.5D battle sprite, transparent background, readable silhouette, no text, no watermark.
```

### 6.3 Rift Dasher

职责：蓄力冲刺威胁。

复杂化方向：

- 三角轮廓保留，但做成“裂隙飞梭兽”。
- 前端尖刺，侧翼像折叠刀片。
- 蓄力时身体中线发光。
- 冲刺轨迹用红黄预警线。

AI 提示词：

```text
Stylized rift dasher alien monster, sharp triangular manta-like body, folded blade wings, glowing yellow central rift line, magenta red armor, built for charge attack, aggressive mobile game enemy sprite, top-down 2.5D view, transparent background, strong silhouette, no text.
```

### 6.4 Star Spitter

职责：远程弹道压力。

复杂化方向：

- 喉囊/炮口是主要识别点。
- 身体后仰，前方有发光吐弹器官。
- 背上有绿色毒液管和小型散热孔。
- 子弹是慢速绿色等离子团。

AI 提示词：

```text
Stylized ranged alien spitter monster, green translucent throat cannon, hunched body with plasma sacs and biomechanical tubes, glowing mouth aperture, small claw legs, readable ranged enemy silhouette, mobile roguelite battle sprite, transparent background, no text, no watermark.
```

### 6.5 Hex Swarm

职责：数量压力。

复杂化方向：

- 单体不必太复杂，但轮廓要清楚。
- 像双囊飞虫/分裂细胞。
- 两个发光眼点，细小触角。
- 死亡可以爆成小六边形碎片。

AI 提示词：

```text
Stylized tiny alien swarm creature, twin-cell flying parasite, orange red soft body, two glowing eyes, small antennae, hexagonal particle fragments, simple but polished mobile game enemy sprite, transparent background, readable at very small size, no text.
```

### 6.6 Gravity Binder

职责：控制区/减速威胁。

复杂化方向：

- 身体像悬浮祭司/重力核心装置。
- 中央大圆环或六边形重力透镜。
- 下方没有腿，靠反重力悬浮。
- 周围有两到三个小型卫星环。
- 投放技能时地面出现紫色六边形束缚阵。

AI 提示词：

```text
Stylized gravity binder alien caster, floating control monster with central purple gravity lens, hexagonal metal ring frame, small orbiting satellite nodes, no legs, suspended biomechanical body, violet energy tendrils, creates slow zones, polished mobile roguelite enemy sprite, transparent background, strong readable silhouette, no text.
```

## 7. AI 出图批量提示词规范

全局风格前缀：

```text
Stylized 2.5D sci-fi fantasy online mobile game art, polished character concept, complex layered design, readable silhouette for small mobile screen, hex-tech visual language, alien ruins survival roguelite, clean strong outline, high detail but not noisy, no text, no watermark.
```

战斗 Sprite 后缀：

```text
top-down 2.5D battle sprite, transparent background, centered full body, generous padding, readable at 128 px, strong outline, no cast shadow, no floor, no text, no watermark.
```

角色立绘后缀：

```text
full body hero character illustration, 3/4 view, dynamic idle pose, plain dark background, high quality online mobile game concept art, no text, no watermark.
```

Boss 后缀：

```text
large boss concept art, 3/4 front view, intimidating scale, complex armor and glowing core, phase two variant details, plain dark background, no text, no watermark.
```

## 8. 首批交付清单

优先出图顺序：

1. Blade Adept 角色立绘 + 战斗 Sprite。
2. Hex Gambler 角色立绘 + 战斗 Sprite。
3. Storm Mage 角色立绘 + 战斗 Sprite。
4. Core Brute Boss Phase 1/2。
5. Void Chaser / Tank / Dasher / Spitter / Binder。
6. Hex Swarm 可最后，因为它小屏只需要清晰轮廓。

每张图验收标准：

- 缩到 128x128 仍能看出身份。
- 看轮廓能判断职业或怪物职责。
- 武器和角色绑定关系明确。
- 不依赖文字说明。
- 背景可透明抠出。
- 横屏战斗中不会遮挡核心信息。

## 9. 接入 Cocos 的建议尺寸

战斗内显示尺寸：

- 玩家：高度 42-56 px。
- 普通怪：高度 28-42 px。
- Tank/Binder：高度 42-56 px。
- Boss：高度 88-120 px。
- 弹道：8-14 px。
- 技能预警圈：半径 32-80 px，半透明。

源资产尺寸：

- 玩家战斗 Sprite：256x256。
- 普通怪 Sprite：256x256。
- Boss Sprite：512x512。
- 头像：256x256。
- 角色立绘：768x1024。

导入规则：

- 所有 Sprite 保持透明 PNG。
- 统一 pivot 在脚底或身体中心偏下。
- 影子单独做一层，不烘进角色图。
- 武器轨迹/VFX 单独做，不和角色主图绑定死。
- Phase 2 Boss 可以使用同一骨架换贴图，也可以使用独立 Sprite。

