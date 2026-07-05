# Rollvive Development Log

This document keeps internal dated records for AI-assisted development,
human direction, implementation decisions, and verification notes. It is
intended to support future project review and possible software copyright
preparation. It is not a substitute for official filing requirements.

## Record Template

```text
Date:
Tool / model:
Operator:
Purpose:
Human direction:
Work summary:
Files changed:
Validation:
Accepted into project:
Notes:
```

## 2026-07-03 17:12 +08:00

Tool / model:

- Codex in local workspace.

Operator:

- Project owner directed the work in chat.

Purpose:

- Continue the mini-game prototype toward complex online-game-like character and monster presentation.
- Add a local agent instruction file and preserve work records for future software copyright preparation.

Human direction:

- Continue development.
- Characters and weapons are bound.
- UI can wait; priority is increasing character and boss/monster complexity.
- Final target is mobile landscape.
- Add a local restriction/instruction file similar to Claude's `agent.md`.
- Preserve work records for possible software copyright use.

Work summary:

- Added `AGENTS.md` as the local Codex instruction file for this repository.
- Recorded product direction, engineering constraints, art/asset constraints, and evidence-retention rules.
- Expanded the runtime prototype toward landscape mobile sizing (`960x540`) and larger arena proportions.
- Increased player visual complexity with layered armor, helmet/visor, chest core, shoulder/leg details, shadows, and bound weapon silhouettes.
- Increased monster/Boss visual complexity with role-specific silhouettes:
  - Void Chaser: forward alien hunter shape with core.
  - Core Tank: heavy shell body with armor slit and legs.
  - Rift Dasher: blade-wing triangular charger.
  - Star Spitter: throat cannon and plasma sac read.
  - Hex Swarm: twin-cell small pressure body.
  - Gravity Binder: floating gravity ring/lens read.
  - Core Brute Boss: horns, asymmetric arms, cracked hex core, phase-two crack marks.
- Added `binder` presentation metadata in character content data.
- Replaced `padStart` usage in project code to avoid older TypeScript target compatibility errors.

Files changed:

- `AGENTS.md`
- `docs/DevelopmentLog.md`
- `assets/scripts/RuntimeEntry.ts`
- `assets/scripts/domain/CharacterContent.ts`
- `assets/scripts/manager/UIManager.ts`

Validation:

- `npm run validate:content`: passed.
- `npx tsc --noEmit --pretty false`: blocked by local Cocos Creator engine declaration errors (`GPU*`, `pal/*`, `TypedArray`, ambient enum issues). Project-source errors found during this pass were addressed.

Accepted into project:

- Yes, as prototype implementation and documentation.

Notes:

- Current runtime-drawn visuals are still not final commercial art. They are a stronger silhouette/prototype layer to validate role identity before replacing with real transparent PNG / sprite sheet / Spine / prefab assets.
- True AI image generation was not available in this session because the built-in image generation tool was unavailable and no `OPENAI_API_KEY` was configured for CLI fallback.

## 2026-07-03 17:43 +08:00

Tool / model:

- Codex in local workspace.

Operator:

- Project owner directed the next iteration in chat.

Purpose:

- Continue the runtime prototype with language selection, timed survival wave flow, continuous enemy spawning, and lightweight XP/level progression.

Human direction:

- Add language selection before Start, with Chinese / English and English as default.
- Make each round last 60 seconds.
- During the 60-second round, enemies should keep spawning continuously like a Brotato-style loop, while Bosses should not be repeatedly generated.
- Add experience and level concepts that increase some base attributes.
- Keep improving UI design, and clarify future handling of provided design mockups.

Work summary:

- Added a title-screen language selector with default English and Chinese toggle.
- Localized key runtime labels for start, shield, refresh, restart, draft, result, and simple title copy.
- Changed runtime waves to a 60-second survival timer.
- Added continuous enemy spawning during battle with active-enemy budget checks.
- Kept Boss generation limited to the planned Boss enemy in Boss waves, while normal enemies continue to replenish.
- Added kill XP, player level, XP thresholds, and automatic level-up growth for HP, damage, movement speed, and attack rate.
- Added HUD display for wave timer, level, XP, HP, weapon, and active enemy count.

Files changed:

- `assets/scripts/RuntimeEntry.ts`
- `assets/scripts/domain/RunModel.ts`
- `docs/DevelopmentLog.md`

Validation:

- `npm run validate:content`: passed.
- `npx tsc --noEmit --pretty false --skipLibCheck`: passed in this workspace.

Accepted into project:

- Yes, as runtime prototype behavior and documentation.

Notes:

- For final UI with a supplied design file, the preferred production path is slicing/exporting real UI assets and using them in Cocos, while keeping canvas/Graphics generation for temporary prototypes, hit warnings, VFX, debug overlays, and small procedural effects.

## 2026-07-03 18:02 +08:00

Tool / model:

- Codex in local workspace.

Operator:

- Project owner directed the next iteration in chat.

Purpose:

- Continue using programmatic drawing to improve character and monster model richness before final asset production.

Human direction:

- Do not focus on future entrance-screen/UI asset workflow right now.
- Continue using procedural/program-drawn art.
- Keep making the models more refined and visually complex.

Work summary:

- Added extra layered player silhouette details:
  - dark cloak/back fins behind the body,
  - torso armor plate lines,
  - sharper helmet crest,
  - class-specific shoulder fins, rogue wing strokes, and mage orbital detail.
- Added more role-specific monster model details:
  - Tank: segmented armor plating.
  - Dasher: dark reactor core and nose-blade highlight.
  - Spitter: hex throat ring and back cannon read.
  - Swarm: extra legs/antenna strokes.
  - Binder: side antenna prongs and gravity lens complexity.
  - Boss: heavier asymmetric arm blocks, cannon/fist reads, extra chest/forehead hex detail, and phase-two crack emphasis.

Files changed:

- `assets/scripts/RuntimeEntry.ts`
- `docs/DevelopmentLog.md`

Validation:

- `npm run validate:content`: passed.
- `npx tsc --noEmit --pretty false --skipLibCheck`: passed.

Accepted into project:

- Yes, as procedural prototype art improvement.

Notes:

- This remains a procedural art layer for gameplay validation. It is intentionally becoming more detailed while staying readable at mobile landscape combat scale.

## 2026-07-03 18:36 +08:00

Tool / model:

- Codex in local workspace.

Operator:

- Project owner directed the next iteration in chat.

Purpose:

- Make weapon behavior read differently in combat, especially melee roles no longer feeling like ranged shooters.
- Continue Chinese localization coverage for the runtime prototype.

Human direction:

- Melee weapons should interact with the character as close-range periodic area attacks.
- Ranged weapons should have distinct projectile patterns, such as dual gun shots or area-impact attacks.
- Chinese localization should cover more of the in-game UI and battle feedback.

Work summary:

- Split starting weapon combat behavior by bound role:
  - Blade Adept now performs a forward 180-degree melee sweep with arc VFX and close-range target filtering.
  - Rift Spearman now performs a narrow forward thrust lane with pierce-style target filtering.
  - Hex Gambler now fires twin gun shots from offset barrels instead of generic single target shots.
  - Storm Mage now launches a slower core projectile that creates an area blast on hit.
- Expanded attack-trace rendering to support melee arcs, thrust lanes, projectile lines, and orb burst rings.
- Localized more runtime strings:
  - HUD labels for wave, level, HP, enemies, shield, mobility state, and draft refresh.
  - Battle log messages for melee seeking, weapon attacks, projectile hits, shield mitigation, wave clear, card pick, and level-up.
- Repaired the Chinese text entries that were displaying as mojibake in the runtime text table.

Files changed:

- `assets/scripts/RuntimeEntry.ts`
- `docs/DevelopmentLog.md`

Validation:

- `npm run validate:content`: passed.
- `npx tsc --noEmit --pretty false --skipLibCheck`: passed.

Accepted into project:

- Pending owner play validation.

Notes:

- Weapon feel is now more differentiated in code and VFX, but exact hit ranges/cooldowns should still be tuned after mobile landscape playtesting.

## 2026-07-03 18:50 +08:00

Tool / model:

- Codex in local workspace.

Operator:

- Project owner asked to continue implementation.

Purpose:

- Make bound character and weapon behavior feel more physically connected, not only mechanically different.

Human direction:

- Continue improving the action feel and visual sophistication of the current procedural prototype.

Work summary:

- Added a lightweight weapon-action animation state to the runtime player model.
- Connected attack events to visible role-specific weapon poses:
  - Blade swing now pushes the blades outward during the slash and adds a bright slash streak.
  - Spear thrust now extends the spear tip forward and draws thrust guide streaks.
  - Dual guns now visibly recoil and show two muzzle flashes.
  - Orb caster now expands the casting ring and side spell circles during casts.
- Added subtle body/shoulder bracing during attacks so the character reacts to the bound weapon.

Files changed:

- `assets/scripts/RuntimeEntry.ts`
- `docs/DevelopmentLog.md`

Validation:

- `npx tsc --noEmit --pretty false --skipLibCheck`: passed.
- `npm run validate:content`: passed.

Accepted into project:

- Pending owner play validation.

Notes:

- This is still programmatic prototype art, but weapon identity is now present in both hit logic and character animation.

## 2026-07-03 19:08 +08:00

Tool / model:

- Codex in local workspace.

Operator:

- Project owner requested a planned execution pass because the prototype still felt too rough.

Purpose:

- Reduce roughness in the current procedural combat screen before adding more features.
- Improve readability and impact for mobile landscape play.

Human direction:

- Use a planning approach, then execute improvements.
- Continue improving the current program-drawn prototype rather than waiting for future art assets.

Work summary:

- Added a concrete execution plan for the roughness pass:
  - visual layer audit,
  - player/weapon impact,
  - enemy/Boss feedback,
  - mobile landscape scale/readability,
  - documentation and validation.
- Added enemy hit-flash state and spawn-in state to runtime enemy positions.
- Added impact shard particles on enemy damage and larger shard bursts on enemy kills.
- Added spawn rings for enemies so newly generated enemies do not pop in as abruptly.
- Improved Boss warning readability with a charging ring during burst windup.
- Added a compact in-arena player HP/XP bar block to reduce reliance on dense top HUD text.
- Slightly increased the in-battle player model scale and loadout preview scale for better mobile landscape readability.
- Added extra arena edge bands and mechanical tick marks so the combat surface feels less empty.

Files changed:

- `assets/scripts/RuntimeEntry.ts`
- `docs/DevelopmentLog.md`

Validation:

- `npx tsc --noEmit --pretty false --skipLibCheck`: passed.
- `npm run validate:content`: passed.

Accepted into project:

- Pending owner play validation.

Notes:

- The prototype should now have stronger hit confirmation, spawn readability, and screen-scale clarity, but final online-game-quality characters will still require a later asset-production pass or generated bitmap sprites.

## 2026-07-03 19:24 +08:00

Tool / model:

- Codex in local workspace.

Operator:

- Project owner asked to continue the planned roughness-reduction work.

Purpose:

- Continue improving procedural character richness and combat readability without adding new feature systems.

Human direction:

- Keep going on visual polish because the current look is still too rough.

Work summary:

- Added more player model layering:
  - central armor chest plate,
  - belt and buckle,
  - visible arms/forearms tied into weapon bracing,
  - boots and lower trim details.
- Replaced the generic enemy warning line with type-specific danger reads:
  - Dasher now shows a forward dash lane.
  - Spitter now shows a target reticle on the player.
  - Binder now shows a projected gravity ring on the player.
  - Boss now shows a radial charge marker with spokes.
- Added projectile trails:
  - Enemy and orb projectiles now leave short directional tails.
  - Orb projectile also has a readable outer ring while traveling.
- Added extra detail to the default chaser monster body so common enemies are less plain.

Files changed:

- `assets/scripts/RuntimeEntry.ts`
- `docs/DevelopmentLog.md`

Validation:

- `npx tsc --noEmit --pretty false --skipLibCheck`: passed.
- `npm run validate:content`: passed.

Accepted into project:

- Pending owner play validation.

Notes:

- The current direction is still procedural/painterly prototype art. It is becoming more readable and game-like, but a later sprite/bitmap asset pass will be needed for true commercial-grade character fidelity.

## 2026-07-03 20:10 +08:00

Tool / model:

- Codex in local workspace.

Operator:

- Project owner requested the first four refined playable-character concepts and asked that the planning documents retain the design record.

Purpose:

- Reset the playable-character art-production batch around four weapon-bound heroes before importing bitmap sprites into Cocos.

Human direction:

- First character batch: Pirate with shotgun, Sharpshooter with dual pistols, Knife Duelist with short blades, and Arcane Mage with area magic.
- Keep characters and weapons bound together.
- Preserve the design work in local planning documents for future software copyright materials.

Work summary:

- Updated `docs/VisualAssetProductionSpec.md` with the new first production batch, roster table, and detailed image-generation prompts for all four playable characters.
- Updated `docs/CharacterWeaponMonsterDesign.md` with the gameplay identity, attack-shape mapping, and visual-read constraints for the four-character roster.
- Confirmed the current Codex session does not expose a built-in `image_gen` tool and the local `OPENAI_API_KEY` environment variable is not set, so live image generation is blocked until a generation route is available.

Files changed:

- `docs/VisualAssetProductionSpec.md`
- `docs/CharacterWeaponMonsterDesign.md`
- `docs/DevelopmentLog.md`

Validation:

- Documentation-only change; runtime TypeScript validation not required.
- `npm run validate:content`: passed.

Accepted into project:

- Pending owner review of the four-character roster and art prompts.

## 2026-07-04 00:35 +08:00

Tool / model:

- Codex in local workspace.

Operator:

- Project owner clarified that paid image generation is not available and asked to continue with programmatic/canvas-style character work.

Purpose:

- Move the prototype from abstract procedural characters toward four readable weapon-bound heroes without relying on generated bitmap art.

Human direction:

- Continue in-code art refinement.
- Implement Pirate / Shotgun, Sharpshooter / Dual Pistols, Knife Duelist / Short Blades, and Arcane Mage / Area Magic.
- Keep the planning record updated.

Work summary:

- Updated player-facing profession data:
  - `blade_adept` now displays as Knife Duelist.
  - `rift_spearman` now displays as Pirate.
  - `hex_gambler` now displays as Sharpshooter.
  - `storm_mage` now displays as Arcane Mage.
- Reworked bound weapon labels and descriptions:
  - Short Blades / KNIVES.
  - Deck Sweeper / SHOTGUN.
  - Twin Pistols / DUALS.
  - Rune Burst / MAGIC.
- Changed the old spear lane attack into a shotgun cone attack:
  - forward cone target filtering,
  - damage falloff across multiple targets,
  - pellet trace lines,
  - cone arc VFX,
  - stronger shotgun recoil and muzzle flash in the character weapon drawing.
- Reworked procedural player silhouettes:
  - Knife Duelist gets short-blade melee posture and cloak fins.
  - Pirate gets a wider armored coat, red scarf, shell belt, and broad shotgun read.
  - Sharpshooter keeps slim dual-pistol readability.
  - Arcane Mage keeps floating rune/core readability.
- Added the four-character roster update to `docs/ContentPlan.md`.

Files changed:

- `assets/scripts/RuntimeEntry.ts`
- `assets/scripts/data/RollData.ts`
- `docs/ContentPlan.md`
- `docs/DevelopmentLog.md`

Validation:

- `npx tsc --noEmit --pretty false --skipLibCheck`: passed.
- `npm run validate:content`: passed.

Accepted into project:

- Pending owner play validation.
