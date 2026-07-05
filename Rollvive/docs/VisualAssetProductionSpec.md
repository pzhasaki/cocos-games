# Rollvive Visual Asset Production Spec

This spec turns the current prototype art direction into concrete asset
requirements for final character, monster, Boss, and UI portrait production.

## Global Style Target

- Genre: stylized 2.5D sci-fi fantasy mobile roguelite.
- Quality target: online mobile game battle units, not icons or geometric placeholders.
- Camera: top-down / 3/4 top battle readability.
- Core language: hex-tech reactors, alien crystal armor, energy weapons, layered armor/fabric.
- Readability: every unit must remain recognizable when scaled to 128 px preview and combat size.
- Avoid: chibi-only design, plain circles, emoji style, generic robots, medieval-only fantasy weapons, noisy tiny details.

## Required Asset Types

### Characters

Each playable character needs:

- Full-body selection illustration: `768x1024` or `1024x1024`.
- Battle sprite or sprite sheet: source at least `256x256`, exported to transparent PNG.
- UI portrait: `256x256`.
- Hit flash or damage frame.
- Optional idle/move/attack frames if sprite sheet production is available.

### Monsters

Each normal/elite monster needs:

- Battle sprite: source at least `256x256`, transparent PNG.
- Hit flash variant.
- Death shard/particle reference.
- Warning marker if the monster has dash, projectile, or control-zone behavior.

### Boss

Each Boss needs:

- Concept illustration: `1024x1024` or `1024x768`.
- Battle sprite: source at least `512x512`, transparent PNG.
- Phase 2 battle variant.
- Telegraph markers for each skill.
- Death/core-break VFX reference.

## First Production Batch

The current playable-character art batch is reset to four weapon-bound heroes.
These are the first assets that should move from procedural Graphics placeholders
to generated bitmap sprites and later Cocos Sprite/Prefab views.

1. Pirate / Shotgun battle sprite, UI portrait, and selection illustration.
2. Sharpshooter / Dual Pistols battle sprite, UI portrait, and selection illustration.
3. Knife Duelist / Short Blades battle sprite, UI portrait, and selection illustration.
4. Arcane Mage / Area Magic battle sprite, UI portrait, and selection illustration.
5. After the four hero silhouettes are approved, continue with Core Brute Boss,
   Gravity Binder, Rift Dasher, Star Spitter, Core Tank, Void Chaser, and Hex Swarm.

## Current Playable Roster Direction

| Character | Bound weapon | Combat identity | Visual identity | Primary asset risk |
| --- | --- | --- | --- | --- |
| Pirate | Shotgun | Close-mid cone burst, heavy rhythm, strong knockback | sea-raider silhouette rebuilt as sci-fi fantasy armor, powder coat, shell belt, broad weapon | Must not look like a generic old pirate costume; the shotgun must read instantly |
| Sharpshooter | Dual Pistols | Twin bullets, ranged precision, fast reload cadence | slim mobile gunfighter, two glowing pistols, long scarf/coat tails, sharp visor | Twin guns can become too small at combat scale |
| Knife Duelist | Short Blades | Close 180-degree slashes, periodic melee arcs, high mobility | compact swordsman/assassin with paired short knives, layered light armor, aggressive stance | Must look melee, not like another ranged hero |
| Arcane Mage | Area Magic | Medium range area bursts, rune circles, delayed zone damage | floating caster, magic core, shoulder rune rings, robe armor plates | VFX must not cover the unit silhouette or warning zones |
 
## Image Generation Batch 01

Use these prompts for the first asset pass. For transparent PNGs with the current
imagegen workflow, generate on a flat chroma-key background first, then remove it
locally before importing into Cocos.

### Pirate / Shotgun Battle Sprite

```text
Use case: stylized-concept
Asset type: mobile landscape roguelite playable character battle sprite
Primary request: Pirate survivor with a bound shotgun weapon
Subject: a complex sci-fi fantasy sea-raider hero, armored captain coat, shell bandolier, glowing hex-tech shotgun held across the body, compact heroic proportions, readable weapon silhouette
Style/medium: polished 2D online mobile game character sprite concept, detailed layered costume, high quality game art, not chibi
Composition/framing: centered full body, top-down / 3/4 top battle view, facing slightly right, generous padding
Lighting/mood: crisp rim light, combat-ready, energetic
Color palette: deep navy coat, brass gold trims, weathered red scarf, cyan shotgun reactor glow
Constraints: no text, no watermark, no UI frame, no background objects, weapon visibly bound to the character
Avoid: historical-only pirate costume, skull cliché overload, realistic photo, flat icon style, tiny unreadable details
```

### Sharpshooter / Dual Pistols Battle Sprite

```text
Use case: stylized-concept
Asset type: mobile landscape roguelite playable character battle sprite
Primary request: Sharpshooter survivor with bound dual pistols
Subject: sleek elite gunfighter, two luminous pistols aimed in opposite forward angles, angular visor helmet, lightweight armored coat, ammo cells on belt, long scarf strips creating a readable silhouette
Style/medium: polished 2D online mobile game character sprite concept, complex but legible at small combat size
Composition/framing: centered full body, top-down / 3/4 top battle view, dynamic side-step pose, generous padding
Lighting/mood: sharp neon highlights, precise and dangerous
Color palette: charcoal armor, white gunmetal panels, electric blue and amber muzzle accents
Constraints: no text, no watermark, no UI frame, no background objects, both pistols must be clearly visible
Avoid: cowboy-only look, bulky rifle, chibi proportions, blurry edges, noisy micro-details
```

### Knife Duelist / Short Blades Battle Sprite

```text
Use case: stylized-concept
Asset type: mobile landscape roguelite playable character battle sprite
Primary request: Knife Duelist survivor with bound short-blade melee weapons
Subject: agile close-combat duelist, paired short knives held low and forward, segmented light armor, split waist cloak fins, glowing blade edges, shoulder guards shaped for a fast 180-degree slash
Style/medium: polished 2D online mobile game character sprite concept, rich layered armor and fabric, readable melee silhouette
Composition/framing: centered full body, top-down / 3/4 top battle view, crouched forward attack stance, generous padding
Lighting/mood: crisp rim light, fast and lethal
Color palette: dark teal armor, silver blade edges, crimson cloth accents, pale gold slash glow
Constraints: no text, no watermark, no UI frame, no background objects, knives must read as close-range melee
Avoid: katana samurai silhouette, long sword, ranged weapon pose, flat icon style, overly tiny details
```

### Arcane Mage / Area Magic Battle Sprite

```text
Use case: stylized-concept
Asset type: mobile landscape roguelite playable character battle sprite
Primary request: Arcane Mage survivor with bound area magic attack
Subject: floating battle mage, armored robe plates, glowing chest spell core, one hand casting a compact rune circle, small orbiting crystals, area-magic motif without a staff
Style/medium: polished 2D online mobile game character sprite concept, complex magical armor, readable at small combat scale
Composition/framing: centered full body, top-down / 3/4 top battle view, hovering pose, generous padding
Lighting/mood: luminous arcane energy, controlled and powerful
Color palette: violet robe armor, ivory plates, cyan and magenta spell-core glow
Constraints: no text, no watermark, no UI frame, no background objects, magic effect must stay compact around the character
Avoid: traditional wizard hat, giant staff, full-screen spell explosion, soft smoky transparency, noisy tiny runes
```

## Character Asset Prompts

### Blade Adept Battle Sprite

```text
Stylized 2.5D sci-fi fantasy online mobile game battle sprite, Blade Adept survivor, medium armored fighter with twin wrist-mounted energy blades, deep cobalt bodysuit, white ceramic armor plates, gold glowing hex-tech chest core, compact helmet with single visor, folded blade fins on the back, strong readable silhouette, centered full body, top-down 3/4 battle view, transparent background, no text, no watermark.
```

### Rift Spearman Battle Sprite

```text
Stylized 2.5D sci-fi fantasy online mobile game battle sprite, Rift Spearman survivor, tall agile armored lancer holding a long diagonal rift spear, teal and cyan lightweight armor, asymmetric shoulder guards, translucent torn energy mantle, split glowing blue spear tip like a spatial crack, readable mobile combat silhouette, centered full body, transparent background, no text, no watermark.
```

### Hex Gambler Battle Sprite

```text
Stylized 2.5D sci-fi fantasy online mobile game battle sprite, Hex Gambler survivor, slim cyber gambler rogue with compact pulse pistol, glowing dice-card reactor, black and emerald tactical coat, narrow visor helmet, hex chip magazines, asymmetrical cloak panels, dangerous agile silhouette, centered full body, transparent background, no text, no watermark.
```

### Storm Mage Battle Sprite

```text
Stylized 2.5D sci-fi fantasy online mobile game battle sprite, Storm Mage survivor, floating hex-tech caster, purple segmented armored robe, white-violet chest reactor, orbiting crystal energy core, rotating rune rings near shoulders, small lightning arcs, elegant combat silhouette, centered full body, transparent background, no text, no watermark.
```

## Monster Asset Prompts

### Void Chaser

```text
Stylized 2.5D alien hunter monster battle sprite, small aggressive forward-leaning body, red coral armor plates, three small back crystals, pale glowing eyes, exposed hex-tech core in abdomen, sharp readable silhouette for mobile roguelite combat, transparent background, no text, no watermark.
```

### Core Tank

```text
Stylized 2.5D heavy alien tank monster battle sprite, massive square front shell, orange ceramic armor plates, glowing yellow core slit, four short biomechanical legs, cracked hex armor details, slow fortress silhouette, transparent background, no text, no watermark.
```

### Rift Dasher

```text
Stylized 2.5D rift dasher alien monster battle sprite, sharp triangular manta-like body, folded blade wings, glowing yellow central rift line, magenta red armor, designed for charge attack, aggressive readable silhouette, transparent background, no text, no watermark.
```

### Star Spitter

```text
Stylized 2.5D ranged alien spitter monster battle sprite, hunched body, green translucent throat cannon, plasma sacs and biomechanical tubes on the back, glowing mouth aperture, small claw legs, readable ranged enemy silhouette, transparent background, no text, no watermark.
```

### Hex Swarm

```text
Stylized 2.5D tiny alien swarm creature battle sprite, twin-cell flying parasite, orange red soft body, two glowing eyes, small antennae, hexagonal particle fragments, simple but polished and readable at very small size, transparent background, no text, no watermark.
```

### Gravity Binder

```text
Stylized 2.5D gravity binder alien caster battle sprite, floating control monster with central purple gravity lens, hexagonal metal ring frame, small orbiting satellite nodes, no legs, suspended biomechanical body, violet energy tendrils, creates slow zones, transparent background, no text, no watermark.
```

## Boss Asset Prompt

### Core Brute

```text
Stylized 2.5D sci-fi fantasy boss monster battle sprite for online mobile roguelite game, Core Brute hex-core guardian, bulky purple-black crystalline armor shell, two tall broken crystal horns, huge cracked hexagonal chest reactor glowing magenta and gold, asymmetric arms with one heavy fist and one energy cannon limb, biomechanical joints, floating hex fragments, intimidating readable silhouette, phase two enraged cracks, transparent background, no text, no watermark.
```

## Acceptance Checklist

- The role is readable without text.
- The weapon is visibly bound to the character.
- The combat silhouette works at 64 px, 96 px, and 128 px.
- The sprite has transparent background and clean edges.
- No watermark, no UI text baked into the sprite.
- Colors do not conflict with enemy projectiles, player attacks, or warning zones.
- Boss phase 2 is visually different from phase 1.
- Assets can be imported into Cocos without relying on a background.
