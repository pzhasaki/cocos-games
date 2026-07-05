# Rollvive Local Agent Rules

This file is the local instruction file for Codex-style agents working in this
project. Treat it like Claude's `agent.md` / `CLAUDE.md`: read it before making
changes in this repository.

## Product Direction

- Rollvive is a mobile landscape roguelite survival game built with Cocos Creator 3.8.8.
- Target play orientation is mobile landscape. Default runtime design size is `960x540`.
- Characters and starting weapons are bound as one loadout. Do not add a free weapon selection UI unless the owner explicitly asks for it.
- The near-term priority is polished, complex character and monster identity, then UI polish, then extra features.
- The desired art direction is online mobile game quality: layered silhouettes, armor/material details, readable shapes, and clear role identity.
- Current `Graphics`-drawn runtime art is a prototype/fallback only. Do not describe it as final commercial art.

## Engineering Rules

- Keep gameplay changes scoped and validate with `npm run validate:content`.
- Prefer Cocos TypeScript patterns already present in `assets/scripts`.
- Do not revert unrelated user or previous-agent changes in the dirty worktree.
- Preserve the existing wave/draft loop unless the requested task directly changes it.
- Keep mobile performance constraints visible: capped active enemies, projectiles, VFX, damage numbers, and throttled HUD refresh.
- Avoid hidden branching by character. Character differences should flow through data/loadout stats and weapon profiles.

## Art And Asset Rules

- Final character and monster assets should be transparent PNG, sprite sheet, Spine, or prefab-backed assets, not permanent ad hoc circles.
- Player battle size target: roughly 42-64 px high in combat.
- Normal monster size target: roughly 30-48 px high.
- Elite monster size target: roughly 46-64 px high.
- Boss size target: roughly 100-140 px high.
- Weapon trails, hit flashes, warning zones, hitboxes, and debug ranges may remain `Graphics` overlays.

## Documentation And Copyright Evidence

- Keep `docs/DevelopmentLog.md` updated after meaningful AI-assisted work.
- Record the date, tool, purpose, files changed, human direction, and validation status.
- Keep prompts, art specs, accepted/rejected outputs, screenshots, and test notes when available.
- Software copyright filing material should describe the final software/source, while AI records are kept as internal evidence.

## Current Verification Commands

```powershell
npm run validate:content
npx tsc --noEmit --pretty false
```

Note: `npx tsc --noEmit` may fail on local Cocos Creator engine declaration files
(`GPU*`, `pal/*`, `TypedArray`, ambient const enum issues). If that happens,
separate engine declaration failures from project source failures in the final
report.
