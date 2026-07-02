# Rollvive Theme And Balance

## Recommended Theme

Working title:

- English: `Rollvive: Battle for Hexa-9`
- Chinese: `Rollvive：大战海克斯九号星`

Why this direction:

- TikTok users understand the fantasy quickly: tiny hero, alien planet, endless creatures, lucky upgrades.
- `Hexa-9` links naturally to the hex/augment mechanic without referencing TFT or any existing IP.
- Alien enemies and floating blades are visually readable on small mobile screens.
- The theme can support many future professions: Blade Adept, Hex Gambler, Storm Mage, Mech Medic, Void Miner.

Core pitch:

> Crash-land on Hexa-9, carve through alien swarms with floating blades, and shape every run through risky hex-power drafts.

Chinese short intro:

> 《Rollvive》是一款面向移动端的轻量生存肉鸽游戏。玩家在海克斯九号星操控职业英雄，以漂浮能量刃对抗不断增强的异星兽潮；每轮战斗结束后，从随机海克斯强化中选择成长方向，在伤害、护甲、幸运、经济和高风险增益之间构筑本局流派，并挑战每五波出现的星球守卫。

Visual anchors:

- Player: small astronaut/space rogue with floating energy blades.
- Enemies: alien slimes, drones, burrowers, star beasts.
- Bosses: named planet guardians every 5 waves.
- Hex cards: blue / purple / gold cosmic upgrade cards.

## Gameplay Direction

The game should stay simpler than Brotato:

- No weapon shop.
- No inventory micromanagement.
- One profession defines the starting style.
- Every cleared wave opens a hex draft.
- Pick 1 of 3 upgrades, or spend gold to reroll.
- Luck affects high-color odds.

## Three-Color Hex Rarity

Baseline draft odds are implemented as weighted pools:

| Color | Role | Base Weight |
| --- | --- | ---: |
| Blue | Reliable stat or simple mechanic | 68 |
| Purple | Build-shaping upgrade | 25 |
| Gold | Rare power spike or risky payoff | 7 |

Luck modifies weights:

- Purple weight: `+ luck * 1.2`
- Gold weight: `+ luck * 0.45`
- Blue weight: `- luck * 0.8`, with a floor

This keeps luck visible without making gold cards too common.

## Current Professions

| Profession | Identity | Starting Tradeoff |
| --- | --- | --- |
| Blade Adept | Stable beginner | 2 blades, light armor, good damage |
| Hex Gambler | High-roll economy | lower HP, more gold, higher Purple/Gold odds |
| Storm Mage | Chain/ultimate build | longer reach, chain hit, lower HP |

## Current Hex Families

Stat:

- Sharpen: flat damage
- Wide Arc: range
- Quick Draw: cooldown down
- Giant Heart: HP
- Cosmic Armor: armor + HP
- Phase Step: dodge + range
- Iron Core: armor + HP, slower attack
- Star Guardian: gold defensive spike

Blade:

- Extra Blade: +1 blade
- Blade Fan: wider spread
- Orbiting Blade: close-range extra hit
- Split Edge: side slash
- Chain Cut: echo hit
- Storm Echo: chain + ultimate
- Blade Storm: large blade spike, slower attack

Economy / Luck:

- Lucky Star: luck
- Golden Luck: luck + income
- Free Roll: cheaper rerolls
- Interest Seed: wave income
- Lucky Hex: better Purple/Gold odds
- Fourth Choice: draft shows 4 choices

Risk:

- Glass Edge: big damage, lower HP
- Critical Mass: damage + blade, lower HP

## Monster And Boss Balance

Current script balance:

- Normal waves scale gradually by count, HP and speed.
- Elite enemies appear on non-boss pressure waves.
- Every 5th wave spawns a Boss.
- Boss waves reduce normal enemy count slightly so the fight focuses on the boss.

Boss schedule suggestion:

| Wave | Boss Name | Theme | Mechanical Hook |
| --- | --- | --- | --- |
| 5 | Core Brute | First guardian | slow, tanky, simple charge |
| 10 | Rift Stalker | Mobility check | faster charge and ranged pressure |
| 15 | Iron Comet | Defense check | high HP and heavier collision damage |
| 20 | Hexa-9 Prime | Final boss | highest HP, high gold reward, mixed pressure |

Implementation note:

- `WaveManager.bossMonsterPrefab` is optional.
- If no Boss prefab is assigned, the script reuses the Elite prefab with Boss stats and red-orange tint.

## Next Tuning Targets

- Add visible attack shape VFX for blade count, orbiting blades and split blades.
- Add profession selection UI before start.
- Add boss warning banner and HP bar.
- Add simple post-run stats: picked hexes, highest damage, boss killed.
