# Rollvive 场景节点层级文档

> 引擎: Cocos Creator 3.8.8
> 场景: GameScene (单场景架构，所有状态切换通过面板显隐完成)
> 设计分辨率: 480×320 (竖屏，TikTok 内嵌)

---

## 一、完整节点树

```
GameScene                              ← 场景根节点
│
├── GameRoot                           ── Node (空节点)
│   ├── GameCtrl                       ── Node → GameCtrl (状态机总控)
│   │
│   ├── Background                     ── Sprite (背景图，场景背景)
│   │   ├── Sky                        ── Sprite (天空层，视差滚动)
│   │   └── Ground                     ── Sprite (地面层)
│   │
│   ├── Player                         ── Node → Player (角色组件)
│   │   ├── Body                       ── Sprite (角色精灵)
│   │   │                             ── Animation (动画组件)
│   │   ├── AttackEffect               ── Node (攻击刀光特效)
│   │   │   └── particles              ── ParticleSystem2D
│   │   ├── ShieldEffect               ── Node (格挡护盾特效)
│   │   │   └── shield_ring            ── Sprite (环形护盾)
│   │   └── UltimateEffect             ── Node (必杀全屏特效)
│   │       └── flash                  ── Sprite (全屏闪光)
│   │   └── [Collider2D]               ── 碰撞组件(受击检测)
│   │
│   ├── MonsterRoot                    ── Node (所有动态怪物的父节点)
│   │   ├── Monster_Normal_001         ── Node → MonsterAI (每个怪物)
│   │   │   ├── Sprite                 ── Sprite
│   │   │   ├── Animation              ── Animation
│   │   │   ├── Collider2D             ── 碰撞组件
│   │   │   └── HealthBar_Root         ── Node → HealthBar
│   │   │       └── Health_Bar         ── ProgressBar (血条)
│   │   ├── Monster_Elite_001          ── Node → MonsterAI
│   │   │   └── ...                    ── (同上结构)
│   │   └── ...                        ── (更多怪物实例)
│   │
│   ├── BulletRoot                     ── Node (所有子弹的父节点)
│   │   ├── Bullet_001                 ── Node → Bullet
│   │   │   ├── Sprite                 ── Sprite (弹道精灵)
│   │   │   └── Collider2D             ── 碰撞组件
│   │   └── ...                        ── (更多子弹实例)
│   │
│   ├── DropRoot                       ── Node (掉落物父节点)
│   │   ├── Coin_001                   ── Node → (金币动画)
│   │   │   └── Sprite                 ── Sprite (金币图标)
│   │   └── ...                        ── (更多掉落实例)
│   │
│   ├── WaveManager                    ── Node → WaveManager
│   └── GyroManager                    ── Node → GyroManager
│
├── Canvas                             ── Canvas (UI根节点，自动适配)
│   ├── UIManager                      ── Node → UIManager
│   │
│   ├── StartPanel                     ── Widget(居中) → 开始面板
│   │   ├── title                      ── Label (游戏标题 "Roll命")
│   │   ├── subtitle                   ── Label (副标题 "抽到神装，割草无双")
│   │   ├── health_notice              ── Label (健康游戏忠告)
│   │   └── StartButton                ── Button → 开始游戏
│   │       └── label                  ── Label
│   │
│   ├── BattleHUD                      ── Widget(全屏) → 战斗中UI
│   │   ├── TopBar                     ── Node (顶部信息栏)
│   │   │   ├── WaveLabel              ── Label "第 1 波"
│   │   │   ├── GoldLabel              ── Label "💰 0"
│   │   │   └── PauseButton            ── Button "⏸" (暂停)
│   │   │
│   │   ├── PlayerStats                ── Node (左下玩家状态)
│   │   │   ├── HpBar                  ── ProgressBar (红色血条)
│   │   │   ├── HpLabel                ── Label "100/100"
│   │   │   ├── EnergyBar              ── ProgressBar (蓝色能量条)
│   │   │   └── EnergyLabel            ── Label "能量: 0/100"
│   │   │
│   │   └── VirtualJoystick            ── Node (移动端虚拟摇杆)
│   │       └── joystick_area          ── 摇杆区域 (左半屏)
│   │
│   ├── RollPanel                      ── Widget(居中) → 抽卡面板
│   │   ├── RollHeader                 ── Node
│   │   │   ├── RollWaveLabel          ── Label "第 3 波 结算"
│   │   │   ├── GoldDisplay            ── Label "金币: 12"
│   │   │   └── LevelDisplay           ── Label "等级 3"
│   │   ├── CardList                   ── Layout(Horizontal) → 5张卡牌
│   │   │   ├── Card_1                 ── Node → Card (卡牌预制体)
│   │   │   │   ├── Card_Border        ── Sprite (稀有度边框色)
│   │   │   │   ├── Card_Icon          ── Sprite (武器图标)
│   │   │   │   ├── Card_Name          ── Label (武器名称)
│   │   │   │   ├── Card_Cost          ── Label ("2💰")
│   │   │   │   ├── Card_Type          ── Label ("远程")
│   │   │   │   └── BuyButton          ── Button (购买按钮)
│   │   │   ├── Card_2                 ── ... (同Card_1)
│   │   │   ├── Card_3                 ── ...
│   │   │   ├── Card_4                 ── ...
│   │   │   └── Card_5                 ── ...
│   │   └── RollActions                ── Node (底部操作栏)
│   │       ├── LockButton             ── Button "🔒 锁定"
│   │       ├── DButton                ── Button "D ▶ 2💰"
│   │       ├── LevelUpButton          ── Button "升级 4💰"
│   │       └── ReadyButton            ── Button "准备 →"
│   │
│   ├── AugmentPanel                   ── Widget(居中) → 海克斯强化
│   │   ├── AugmentTitle               ── Label "海克斯强化 — 第5波"
│   │   ├── AugmentCard_1              ── Node (强化卡片1)
│   │   │   ├── Augment_Rarity         ── Sprite (金/紫/蓝 边框)
│   │   │   ├── Augment_Name           ── Label (强化名)
│   │   │   ├── Augment_Desc           ── Label (效果描述)
│   │   │   └── SelectButton           ── Button (选择)
│   │   ├── AugmentCard_2              ── ...
│   │   └── AugmentCard_3              ── ...
│   │
│   ├── PausePanel                     ── Widget(居中) → 暂停面板
│   │   ├── PauseTitle                 ── Label "游戏暂停"
│   │   ├── ResumeButton               ── Button "继续游戏"
│   │   ├── SensitivityButton          ── Button "灵敏度设置"
│   │   └── QuitButton                 ── Button "退出"
│   │
│   ├── SensitivityPanel               ── Widget(居中) → 灵敏度设置
│   │   ├── SensitivityTitle           ── Label "陀螺仪灵敏度"
│   │   ├── SensitivitySlider          ── Slider (拖动调节)
│   │   ├── SensitivityValue           ── Label "1.0"
│   │   ├── VibrateToggle              ── Toggle "震动反馈"
│   │   └── CloseButton                ── Button "关闭"
│   │
│   ├── ResultPanel                    ── Widget(居中) → 结算面板
│   │   ├── ResultTitle                ── Label "游戏结束"
│   │   ├── ResultContent              ── Node
│   │   │   ├── ResultWave             ── Label "到达波次: 12"
│   │   │   ├── ResultTime             ── Label "存活时间: 8分32秒"
│   │   │   ├── ResultKills            ── Label "击杀数: 156"
│   │   │   └── ResultDamage           ── Label "总伤害: 28450"
│   │   ├── ResultRating               ── Label "评级: A" (评级展示)
│   │   └── RestartButton              ── Button "再来一局"
│   │
│   └── FlashNode                      ── Sprite (全屏闪白，默认隐藏)
│
└── Camera                             ── Camera (2D正交投影)
```

---

## 二、组件挂载清单

### 核心节点 -> 组件 映射

| 节点路径 | 组件 | 说明 |
|---------|------|------|
| GameRoot/GameCtrl | `GameCtrl` | 状态机总控，单例 |
| GameRoot/Player | `Player` | 玩家战斗逻辑 |
| GameRoot/Player/Body | `Sprite` + `Animation` + `Collider2D` | 外观与碰撞 |
| GameRoot/MonsterRoot/\* | `MonsterAI` + `Sprite` + `Animation` + `Collider2D` | 怪物AI |
| GameRoot/MonsterRoot/\*/HealthBar_Root | `HealthBar` | 血条跟随 |
| GameRoot/MonsterRoot/\*/HealthBar_Root/Health_Bar | `ProgressBar` | 血条显示 |
| GameRoot/BulletRoot/\* | `Bullet` + `Sprite` + `Collider2D` | 弹道逻辑 |
| GameRoot/WaveManager | `WaveManager` | 波次控制 |
| GameRoot/GyroManager | `GyroManager` | 陀螺仪输入 |
| Canvas/UIManager | `UIManager` | UI总控 |
| Canvas/StartPanel | — | 开始面板容器 |
| Canvas/StartPanel/StartButton | `Button` | 开始按钮 |
| Canvas/BattleHUD/TopBar/PauseButton | `Button` | 暂停 |
| Canvas/BattleHUD/PlayerStats/HpBar | `ProgressBar` | HP条 |
| Canvas/BattleHUD/PlayerStats/EnergyBar | `ProgressBar` | 能量条 |
| Canvas/RollPanel/CardList/Card_\*/BuyButton | `Button` | 购买卡牌 |
| Canvas/RollPanel/RollActions/\* | `Button` ×4 | 抽卡操作 |
| Canvas/PausePanel/ResumeButton | `Button` | 恢复 |
| Canvas/SensitivityPanel/SensitivitySlider | `Slider` | 灵敏度滑块 |
| Canvas/ResultPanel/RestartButton | `Button` | 重新开始 |
| Canvas/FlashNode | `Sprite` | 全屏闪白 |

---

## 三、预制体 (Prefab) 清单

| Prefab 名 | 挂载脚本 | 用于 |
|-----------|---------|------|
| `Monster_Normal` | MonsterAI + Sprite + Animation + Collider2D + HealthBar | 普通怪物 |
| `Monster_Elite` | MonsterAI + Sprite + Animation + Collider2D + HealthBar | 精英怪物 (紫色标记) |
| `Bullet` | Bullet + Sprite + Collider2D | 子弹弹道 |
| `Drop_Coin` | Sprite + (简易动画) | 金币掉落 |
| `Card` | (卡牌交互) + Sprite + Label ×4 + Button | 抽卡卡牌 |
| `Augment_Card` | (海克斯卡片) + Sprite + Label ×2 + Button | 海克斯强化选项 |

---

## 四、场景参数设置

### Canvas

```
设计分辨率:   480 × 320
适配模式:    FitHeight (竖屏自适应)
Orientation:  portrait (竖屏)
```

### Camera

```
Projection:   ORTHO (2D正交投影)
Size:         160 (320/2)
ClearFlags:   SolidColor
Background:   #1a1a2e (深蓝紫背景)
```

### Physics (2D)

```
Physics System:  Box2D
Gravity:         (0, 0)  — 2D横版格斗，无重力
```

---

## 五、构建说明

### Cocos Creator 构建配置

```
发布平台:
  └─ 抖音小游戏 (Douyin Mini Game):
      构建设置:
        ├─ 主包压缩类型: 默认
        ├─ 分包配置: assets/resources 分到 separate
        │   └─ 分包名: "res" (存放图片/音频/AI配置)
        ├─ 初始场景: GameScene
        ├─ 默认竖屏: true
        ├─ 引擎分离: 开启 (减少首包)
        └─ 远程服务器: CDN URL (可选)

  └─ TikTok (TikTok Mini Game):
      构建设置同上 (Cocos 3.8+ 支持直接导出)

  └─ Web Mobile (H5调试):
      构建设置:
        ├─ 模板: mobile
        ├─ 内联所有Sprite: false
        └─ 预览用
```

### 分包策略 (TTMG规范)

```
主包 (≤4MB):
  ├─ scripts/ (全部TS脚本)
  ├─ scenes/GameScene
  └─ prefabs/ (核心预制体)

分包 "res" (≤16MB):
  ├─ images/ (所有贴图)
  ├─ audio/ (音效BGM)
  ├─ animations/ (动画剪辑)
  └─ config/ (JSON配置表)
```

---

## 六、事件流一览

```
                    GyroManager
                   ├─ GYRO_ATTACK    → Player._onAttack()        → WaveManager.damageMonstersInRange()
                   ├─ GYRO_ULTIMATE  → Player._onUltimate()      → WaveManager.damageAllMonsters()
                   ├─ GYRO_SHIELD    → Player._onShieldStart()   → 减伤状态
                   └─ GYRO_SHIELD_END→ Player._onShieldEnd()     → 减伤结束

                    Player
                   ├─ PLAYER_DAMAGED → UIManager.updatePlayerStats()
                   └─ PLAYER_DIED    → GameCtrl.onPlayerDied()   → State.RESULT

                    MonsterAI
                   ├─ MONSTER_DAMAGED→ (受击反馈)
                   └─ MONSTER_DIED   → WaveManager.recycleMonster()

                    WaveManager
                   └─ WAVE_CLEAR     → GameCtrl.onWaveClear()    → State.ROLL_PHASE

                    GameCtrl
                   └─ STATE_CHANGED  → 全局状态变更通知
```

---

## 七、各功能对应脚本速查

| 功能 | 脚本 | 核心方法 |
|------|------|---------|
| 状态机 | `GameCtrl.ts` | `changeState()`, `startGame()`, `togglePause()` |
| 陀螺仪 | `GyroManager.ts` | `_processRawData()`, `requestPermission()`, `setActive()` |
| 玩家攻击 | `Player.ts` | `_onAttack()`, `_onUltimate()`, `takeDamage()` |
| 怪物AI | `MonsterAI.ts` | `_updateChase()`, `_prepareCharge()`, `_performRangedAttack()` |
| 弹道 | `Bullet.ts` | `fire()`, `recycle()`, `_onBeginContact()` |
| 波次 | `WaveManager.ts` | `startWave()`, `clearAllMonsters()`, `damageAllMonsters()` |
| UI管理 | `UIManager.ts` | `showStartPanel()`, `updatePlayerStats()`, `flashScreen()` |
| 血条 | `HealthBar.ts` | update() 每帧跟随父节点 |
| 平台抽象 | `PlatformDef.ts` | `init()`, `isDouyin`, `showToast()` |
| 抖音适配 | `DouyinAdapter.ts` | 全部 IPlatformAPI 实现 |
| TikTok适配 | `TTAdapter.ts` | 全部 IPlatformAPI 实现 + H5回退 |
