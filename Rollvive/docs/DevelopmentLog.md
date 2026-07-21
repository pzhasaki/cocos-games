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

## 2026-07-20

Tool / model:

- Codex in local workspace.

Operator:

- Project owner requested a professional, detailed planning introduction and asked for it to be written into the project README.

Purpose:

- Add a clear planning entry point at the project root for product positioning, core loop, content systems, art direction, monetization constraints, performance limits, and acceptance criteria.

Human direction:

- Write the detailed Rollvive planning introduction into the project as a planning README.

Work summary:

- Added the root `README.md` as the project planning overview.
- Consolidated the current landscape-mobile direction, four weapon-bound character roster, wave/Draft loop, five Hex families, no-coin refresh rule, monster roles, Boss cadence, UI, art, audio, monetization, performance, and validation goals.
- Added links from the README to the existing detailed design and development documents.
- Clearly identified current `Graphics` runtime art as prototype/fallback rather than final commercial art.

Files changed:

- `README.md`
- `docs/DevelopmentLog.md`

Validation:

- Documentation-only change; runtime TypeScript validation not required.
- Manual consistency check against `AGENTS.md`, `docs/ContentPlan.md`, and the current four-character roster completed.

Accepted into project:

- Pending owner review of the planning README.

## 2026-07-21

Tool / model:

- Codex in local workspace.

Operator:

- Project owner requested an actionable asset-generation plan based on the game design.

Purpose:

- Audit current prototype assets and define a staged production plan for final characters, enemies, Bosses, environment, UI, VFX, animation, and audio.

Human direction:

- Plan asset generation before starting bulk production.

Work summary:

- Added `docs/AssetProductionPlan.md`.
- Classified all current 256×256 character and enemy PNGs as prototype/fallback assets.
- Defined A0 style lock, A1 first-five-wave vertical slice, A2 four-character completion, A3 enemy/Boss expansion, and A4 polish/audio stages.
- Added concrete deliverable counts, dimensions, naming rules, folder structure, generation workflow, quality gates, runtime checks, and evidence requirements.
- Selected the first recommended generation batch: Knife Duelist, Void Chaser, Core Tank, Rift Dasher, and Core Brute, with three candidates each.
- Linked the new plan from the project README.

Files changed:

- `docs/AssetProductionPlan.md`
- `README.md`
- `docs/DevelopmentLog.md`

Validation:

- Documentation-only change; runtime TypeScript validation not required.
- Existing raster inventory and dimensions were checked locally.
- Markdown formatting checked with `git diff --check`.

Accepted into project:

- Pending owner review before A0 image generation.

## 2026-07-21 A0 asset briefs

Tool / model:

- Codex in local workspace.

Operator:

- Project owner requested detailed, style-consistent descriptions for every image in the planned first generation batch.

Purpose:

- Turn the 15-image A0 batch into image-by-image production briefs that can be used directly for generation and review.

Human direction:

- Describe every image in detail and keep the style unified.

Work summary:

- Added `docs/A0AssetBriefs.md` with shared world, camera, composition, lighting, material, palette, output, and negative constraints.
- Added detailed briefs for three Knife Duelist candidates, three Void Chaser candidates, three Core Tank candidates, three Rift Dasher candidates, and three Core Brute Boss candidates.
- Defined each candidate's design purpose, silhouette, equipment or anatomy, materials, small-screen recognition points, and Boss phase-extension potential.
- Added a shared generation template and strict candidate selection criteria.
- Linked the detailed briefs from the production plan and project README.

Files changed:

- `docs/A0AssetBriefs.md`
- `docs/AssetProductionPlan.md`
- `README.md`
- `docs/DevelopmentLog.md`

Validation:

- Documentation-only change; runtime TypeScript validation not required.
- Markdown formatting and invalid replacement characters checked locally.

Accepted into project:

- Pending owner approval before image generation.

## 2026-07-21 Knife Duelist A0 generation

Tool / model:

- `imagegen` skill CLI fallback with `gpt-image-2` through the owner-provided OpenAI-compatible endpoint.
- Local chroma-key removal helper with soft matte, despill, and 1 px edge contraction.

Operator:

- Project owner authorized actual generation of the three Knife Duelist A0 candidates.

Purpose:

- Generate, clean, inspect, and compare the first three character-style candidates before expanding the art batch.

Human direction:

- Start actual image generation with the three Knife Duelist candidates.

Work summary:

- Generated Vanguard, Side Cut, and Blade Wing candidates at 1024×1024.
- Kept the generated chroma-key source images and produced RGBA transparent versions.
- Rejected the first Side Cut output because both short blades disappeared at small combat sizes.
- Performed one targeted edit to create Side Cut V2 with two separately readable short blades.
- Produced a full contact sheet and a 64/96/128 px readability sheet.
- Added `docs/A0KnifeDuelistGenerationReview.md` with accepted-candidate notes, rejected-output evidence, limitations, and a recommendation.
- Stored the complete generation prompt set in `docs/prompts/a0_knife_duelist_batch01.jsonl`.
- No API key or secret was written to any project file or log.

Files changed or generated:

- `docs/prompts/a0_knife_duelist_batch01.jsonl`
- `docs/A0KnifeDuelistGenerationReview.md`
- `output/imagegen/a0_knife_duelist/chroma/*.png`
- `output/imagegen/a0_knife_duelist/transparent/*.png`
- `output/imagegen/a0_knife_duelist/knife-duelist-a0-contact-sheet.png`
- `output/imagegen/a0_knife_duelist/knife-duelist-a0-readability-sheet.png`
- `docs/AssetProductionPlan.md`
- `README.md`
- `docs/DevelopmentLog.md`

Validation:

- All final candidate files are 1024×1024 RGBA PNG.
- Transparent corner pixels and non-empty alpha bounds verified.
- 64/96/128 px visual comparison completed.
- Markdown formatting and invalid replacement characters checked locally.
- Runtime TypeScript validation not required because no gameplay code or imported runtime asset changed.

Accepted into project:

- Three candidate directions are ready for owner review; no candidate has replaced the runtime sprite yet.
- Current design recommendation: use Blade Wing as the main direction, borrow Vanguard's teal armor balance, and retain Side Cut V2 as an attack-pose reference.

## 2026-07-21 Knife Duelist C runtime integration

Tool / model:

- Codex in local workspace.
- Pillow LANCZOS downscale for the generated RGBA source asset.

Operator:

- Project owner selected candidate C, Blade Wing, and requested it replace the game runtime material.

Purpose:

- Replace the temporary procedural Knife Duelist presentation with the selected generated bitmap while preserving safe fallback behavior and mobile texture sizing.

Human direction:

- Use candidate C for the runtime replacement.

Work summary:

- Exported the selected 1024×1024 source to a 512×512 RGBA runtime PNG at `assets/resources/characters/knife_duelist.png`.
- Added Cocos directory and image meta files for the new resources path.
- Updated `RuntimeEntry` to asynchronously load `characters/knife_duelist/spriteFrame`.
- Added separate Sprite nodes for the title loadout preview and arena player.
- Displayed the runtime image in a 76×76 battle frame, giving the trimmed subject an approximately 64 px combat height.
- Added horizontal facing flip and a restrained melee-action scale pulse.
- Preserved shield/shadow Graphics overlays and the complete procedural player fallback if loading fails.
- Kept other professions on their existing procedural art path.
- Updated the generation review with the owner's selection and the runtime integration state.

Files changed or added:

- `assets/resources.meta`
- `assets/resources/characters.meta`
- `assets/resources/characters/knife_duelist.png`
- `assets/resources/characters/knife_duelist.png.meta`
- `assets/scripts/RuntimeEntry.ts`
- `docs/A0KnifeDuelistGenerationReview.md`
- `docs/DevelopmentLog.md`

Validation:

- Runtime asset verified as 512×512 RGBA PNG with transparent corners and non-empty alpha bounds.
- `npm run validate:content`: passed.
- `npx tsc --noEmit --pretty false --skipLibCheck`: passed.
- `git diff --check`: passed for the integration files.
- `npx eslint assets/scripts/RuntimeEntry.ts`: not runnable because the project has no ESLint configuration file.
- Cocos Creator visual preview remains required to force editor reimport and verify the final 960×540 rendered scale.

Accepted into project:

- Candidate C is selected and connected to the temporary `RuntimeEntry` path.
- Final visual acceptance is pending Cocos Creator preview on the target 960×540 scene.

## 2026-07-21 Void Chaser A0 generation

Tool / model:

- `imagegen` skill CLI fallback with `gpt-image-2` through the owner-provided OpenAI-compatible endpoint.
- Local chroma-key removal helper with soft matte, despill, and 1 px edge contraction.

Operator:

- Project owner requested the next asset after the Knife Duelist runtime integration.

Purpose:

- Generate and compare three Void Chaser visual directions for the first-wave basic pursuit enemy.

Human direction:

- Continue to the next planned A0 asset.

Work summary:

- Generated Wedge Head, Split Jaw, and Grappler candidates at 1024×1024.
- Produced RGBA transparent versions from the chroma-key sources.
- Rejected the initial Grappler because it looked like a humanoid elite soldier rather than a basic alien chaser.
- Performed one targeted edit to create Grappler V2 with a low embedded head, compact torso, long arms, large claws, and visible magenta core.
- Produced a full contact sheet and a 40/64/128 px readability sheet.
- Added `docs/A0VoidChaserGenerationReview.md` with candidate strengths, limitations, rejected-output evidence, and the current recommendation.
- Stored the complete prompt set in `docs/prompts/a0_void_chaser_batch01.jsonl`.
- No API key or secret was written to any project file or log.

Files changed or generated:

- `docs/prompts/a0_void_chaser_batch01.jsonl`
- `docs/A0VoidChaserGenerationReview.md`
- `output/imagegen/a0_void_chaser/chroma/*.png`
- `output/imagegen/a0_void_chaser/transparent/*.png`
- `output/imagegen/a0_void_chaser/void-chaser-a0-contact-sheet.png`
- `output/imagegen/a0_void_chaser/void-chaser-a0-readability-sheet.png`
- `docs/AssetProductionPlan.md`
- `README.md`
- `docs/DevelopmentLog.md`

Validation:

- Final candidate files are 1024×1024 RGBA PNG with transparent corners.
- 40/64/128 px visual comparison completed.
- `git diff --check`: passed for text artifacts.
- Runtime TypeScript validation not required because no enemy runtime asset or gameplay code changed.

Accepted into project:

- Three Void Chaser directions are ready for owner review; no runtime enemy sprite has been replaced.
- Current recommendation: choose Split Jaw as the main Void Chaser direction and retain Grappler V2 as a possible future special enemy.

## 2026-07-21 Void Chaser C runtime integration

Tool / model:

- Codex in local workspace.
- Pillow LANCZOS resize and alpha-bound repacking for the generated RGBA source.

Operator:

- Project owner selected candidate C, Grappler V2, for actual runtime use.

Purpose:

- Replace the temporary procedural Void Chaser presentation with the selected generated bitmap while preserving mobile performance and fallback behavior.

Human direction:

- Use candidate C for the actual runtime asset.

Work summary:

- Repacked the transparent source around its alpha bounds and exported a 512×512 runtime PNG at `assets/resources/enemies/void_chaser.png`.
- Added Cocos resource-directory and image meta files.
- Added an enemy Sprite layer below the player Sprite and damage-text layer.
- Updated `RuntimeEntry` to load `enemies/void_chaser/spriteFrame` asynchronously.
- Added a lazy reusable Sprite-node pool for all living Chaser enemies.
- Preserved spawn scale, subtle movement pulse, horizontal facing, hit tint, shadow, health bar, and warning behavior.
- Skipped only the procedural Chaser body when the bitmap resource is available; all other enemy Graphics remain unchanged.
- Preserved the complete procedural Chaser fallback if resource loading fails.
- Updated the Void Chaser generation review with the owner's selection and runtime state.

Files changed or added:

- `assets/resources/enemies.meta`
- `assets/resources/enemies/void_chaser.png`
- `assets/resources/enemies/void_chaser.png.meta`
- `assets/scripts/RuntimeEntry.ts`
- `docs/A0VoidChaserGenerationReview.md`
- `docs/DevelopmentLog.md`

Validation:

- Runtime asset verified as 512×512 RGBA PNG with transparent corners and centered alpha bounds.
- At a 62×62 Sprite frame, the non-transparent subject is approximately 40 px high.
- `npm run validate:content`: passed.
- `npx tsc --noEmit --pretty false --skipLibCheck`: passed.
- `git diff --check`: passed for integration text files.
- Cocos Creator preview remains required to force asset reimport and inspect multi-enemy overlap in the 960×540 scene.

Accepted into project:

- Candidate C is selected and connected to the temporary `RuntimeEntry` Chaser path.
- Final visual acceptance is pending Cocos Creator multi-enemy preview.

## 2026-07-21 Core Tank A0 generation

Tool / model:

- `imagegen` skill CLI fallback with `gpt-image-2` through the owner-provided OpenAI-compatible endpoint.
- Local chroma-key removal helper with soft matte, despill, and 1 px edge contraction.

Operator:

- Project owner requested construction of the next planned A0 asset.

Purpose:

- Generate and compare three Core Tank directions for the slow high-health space-control enemy.

Human direction:

- Continue to the next asset after Void Chaser C runtime integration.

Work summary:

- Generated Beetle Fortress, Hex Tortoise, and Twin Shield candidates at 1024×1024.
- Produced RGBA transparent versions from the chroma-key sources.
- Rejected the initial Hex Tortoise because it lacked the central reactor and read as an ordinary armored turtle or obstacle.
- Performed one targeted edit to create Hex Tortoise V2 with a recessed yellow core, six orange plates, separated support legs, an alien head, and visible biomechanical joints.
- Recorded a remaining green ground-reflection contamination in B-v2 that must be cleaned if selected.
- Produced a full contact sheet and a 48/64/128 px readability sheet.
- Added `docs/A0CoreTankGenerationReview.md` with candidate strengths, limitations, rejected-output evidence, and the current recommendation.
- Stored the complete prompt set in `docs/prompts/a0_core_tank_batch01.jsonl`.
- No API key or secret was written to any project file or log.

Files changed or generated:

- `docs/prompts/a0_core_tank_batch01.jsonl`
- `docs/A0CoreTankGenerationReview.md`
- `output/imagegen/a0_core_tank/chroma/*.png`
- `output/imagegen/a0_core_tank/transparent/*.png`
- `output/imagegen/a0_core_tank/core-tank-a0-contact-sheet.png`
- `output/imagegen/a0_core_tank/core-tank-a0-readability-sheet.png`
- `docs/AssetProductionPlan.md`
- `README.md`
- `docs/DevelopmentLog.md`

Validation:

- Final candidate files are 1024×1024 RGBA PNG with transparent corners.
- 48/64/128 px visual comparison completed.
- `git diff --check`: passed for text artifacts.
- Runtime TypeScript validation not required because no Tank runtime asset or gameplay code changed.

Accepted into project:

- Three Core Tank directions are ready for owner review; no runtime Tank sprite has been replaced.
- Current recommendation: choose Hex Tortoise V2 after cleaning its residual green ground reflection.

## 2026-07-21 Core Tank C runtime integration

Tool / model:

- Codex in local workspace.
- Pillow LANCZOS resize and alpha-bound repacking for the selected RGBA source.

Operator:

- Project owner selected candidate C, Twin Shield, for actual runtime use.

Purpose:

- Replace the temporary procedural Core Tank presentation with the selected generated bitmap while preserving mobile performance and fallback behavior.

Human direction:

- Use candidate C for the actual runtime asset.

Work summary:

- Repacked the transparent source around its alpha bounds and exported a 512×512 runtime PNG at `assets/resources/enemies/core_tank.png`.
- Added the Cocos image meta file under the existing enemy resources directory.
- Updated `RuntimeEntry` to load `enemies/core_tank/spriteFrame` asynchronously.
- Added a separate lazy reusable Sprite-node pool for living Tank enemies.
- Displayed the Tank in a 90×90 Sprite frame, producing an approximately 61 px non-transparent subject height versus the Void Chaser's approximately 40 px height.
- Preserved spawn scale, slow movement pulse, horizontal facing, hit tint, shadow, health bar, and fallback behavior.
- Skipped only the procedural Tank body when the bitmap resource is available; all other enemy Graphics remain unchanged.
- Updated the Core Tank generation review with the owner's selection and runtime state.

Files changed or added:

- `assets/resources/enemies/core_tank.png`
- `assets/resources/enemies/core_tank.png.meta`
- `assets/scripts/RuntimeEntry.ts`
- `docs/A0CoreTankGenerationReview.md`
- `docs/DevelopmentLog.md`

Validation:

- Runtime asset verified as 512×512 RGBA PNG with transparent corners and centered alpha bounds.
- At a 90×90 Sprite frame, the non-transparent subject is approximately 61 px high.
- `npm run validate:content`: passed.
- `npx tsc --noEmit --pretty false --skipLibCheck`: passed.
- `git diff --check`: passed for integration text files.
- Cocos Creator preview remains required to force asset reimport and inspect overlap with Chasers in the 960×540 scene.

Accepted into project:

- Candidate C is selected and connected to the temporary `RuntimeEntry` Tank path.
- Final visual acceptance is pending Cocos Creator mixed-enemy preview.

## 2026-07-21 Crash Site map generation

Tool / model:

- `imagegen` skill CLI fallback with `gpt-image-2` through the owner-provided OpenAI-compatible endpoint.
- Pillow LANCZOS export and static gameplay-preview composition.

Operator:

- Project owner requested a map asset outside the next character/monster production step.

Purpose:

- Produce the first 16:9 Hexa-9 Crash Site battlefield with a clear center, restrained edge decoration, and verified readability against current runtime units.

Human direction:

- Generate a map asset.

Work summary:

- Added a detailed map prompt at `docs/prompts/map_crash_site_v01.txt`.
- Generated a 2048×1152 high-quality source map.
- Exported the project asset as a 1920×1080 RGB PNG at `assets/resources/environment/crash_site_base.png`.
- Added Cocos resource-directory and image meta files.
- Kept the central 70% combat area open and concentrated wreckage, crystals, and energy seams at the perimeter.
- Created a 960×540 static gameplay preview using the current Knife Duelist, four Void Chasers, and one Core Tank at their planned runtime sizes.
- Added `docs/CrashSiteMapReview.md` with visual content, file links, readability results, generation evidence, and runtime-integration guidance.
- No API key or secret was written to any project file or log.

Files changed or generated:

- `docs/prompts/map_crash_site_v01.txt`
- `output/imagegen/maps/crash-site-map-source-v01.png`
- `output/imagegen/maps/crash-site-map-gameplay-preview.png`
- `assets/resources/environment.meta`
- `assets/resources/environment/crash_site_base.png`
- `assets/resources/environment/crash_site_base.png.meta`
- `docs/CrashSiteMapReview.md`
- `docs/AssetProductionPlan.md`
- `README.md`
- `docs/DevelopmentLog.md`

Validation:

- Generated source verified as 2048×1152 PNG.
- Project asset verified as 1920×1080 RGB PNG.
- Static 960×540 unit-readability preview completed.
- `git diff --check`: passed for text artifacts.
- Runtime TypeScript validation not required because the map has not been connected to `RuntimeEntry`.

Accepted into project:

- Crash Site v01 is ready as a project resource and visual-review asset.
- Runtime integration and Cocos texture-compression verification remain pending.

## 2026-07-21 Crash Site runtime integration

Tool / model:

- Codex in local workspace.
- Pillow center-crop and LANCZOS resize for the runtime-specific arena texture.

Operator:

- Project owner requested that the generated map be put into actual runtime use.

Purpose:

- Display the Crash Site map in the 900×338 temporary runtime Arena without aspect-ratio distortion while preserving Graphics fallback and correct render ordering.

Human direction:

- Use the generated map in the game runtime.

Work summary:

- Cropped the central horizontal band of the 1920×1080 map to the Arena aspect ratio and exported `assets/resources/environment/crash_site_arena.png` at 1800×676.
- Added the Cocos image meta file for the Arena asset.
- Added an Arena map Sprite below the Graphics, enemy, player, and damage-number layers.
- Moved arena Graphics rendering to a dedicated overlay node so it no longer sits below the map Sprite.
- Updated `RuntimeEntry` to load `environment/crash_site_arena/spriteFrame` asynchronously.
- Reduced the old grid background to a light darkening overlay and border when the map is available.
- Preserved the complete old procedural grid when map loading fails.
- Created a 900×338 static runtime preview with current character and enemy assets.
- Updated `docs/CrashSiteMapReview.md` with the integration state and remaining Cocos checks.

Files changed or added:

- `assets/resources/environment/crash_site_arena.png`
- `assets/resources/environment/crash_site_arena.png.meta`
- `assets/scripts/RuntimeEntry.ts`
- `output/imagegen/maps/crash-site-arena-runtime-preview.png`
- `docs/CrashSiteMapReview.md`
- `docs/DevelopmentLog.md`

Validation:

- Arena texture verified as 1800×676 RGB PNG, exactly matching the 900×338 runtime aspect ratio.
- Static 900×338 mixed-unit preview completed.
- `npm run validate:content`: passed.
- `npx tsc --noEmit --pretty false --skipLibCheck`: passed.
- `git diff --check`: passed for integration text files.
- Cocos Creator visual preview remains required to force asset reimport and verify the final layered render.

Accepted into project:

- Crash Site v01 is connected to the temporary `RuntimeEntry` Arena with a procedural fallback.
- Final visual and texture-compression acceptance is pending Cocos Creator preview.
