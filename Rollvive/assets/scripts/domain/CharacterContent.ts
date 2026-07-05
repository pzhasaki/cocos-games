import type { RuntimeEnemyType } from './BattleContent';

export type CharacterClassId = 'sentinel' | 'runner' | 'arcanist';
export type WeaponClassId = 'sword' | 'spear' | 'bow' | 'orb';
export type AttackRhythmId = 'steady' | 'burst' | 'charged' | 'channel';
export type WeaponRangeBand = 'melee' | 'mid' | 'long' | 'screen';
export type EnemyBehaviorTag =
    | 'advance'
    | 'armor'
    | 'boss'
    | 'charge'
    | 'control'
    | 'dash'
    | 'flank'
    | 'kite'
    | 'pack'
    | 'ranged'
    | 'summon'
    | 'telegraph';

export interface CharacterClassContent {
    id: CharacterClassId;
    name: string;
    role: 'balanced' | 'mobility' | 'caster';
    startingWeapon: WeaponClassId;
    hpBias: number;
    speedBias: number;
    damageBias: number;
    visualKey: string;
    portraitKey: string;
    introAnimationKey: string;
}

export interface WeaponAttackTiming {
    cadence: AttackRhythmId;
    cooldownSeconds: number;
    windupSeconds: number;
    activeSeconds: number;
    recoverySeconds: number;
}

export interface WeaponRangeProfile {
    band: WeaponRangeBand;
    minRange: number;
    maxRange: number;
    arcDegrees: number;
    pierce: number;
}

export interface WeaponClassContent {
    id: WeaponClassId;
    name: string;
    attackTiming: WeaponAttackTiming;
    range: WeaponRangeProfile;
    projectileSpeed: number;
    presentationKey: string;
    trailKey: string;
    impactKey: string;
    audioKey: string;
}

export interface MonsterPresentationContent {
    enemyType: RuntimeEnemyType;
    behaviorTags: readonly EnemyBehaviorTag[];
    visualKey: string;
    spawnVfxKey: string;
    attackVfxKey: string;
    deathVfxKey: string;
    silhouetteKey: string;
}

export const CHARACTER_CLASSES: Readonly<Record<CharacterClassId, CharacterClassContent>> = {
    sentinel: {
        id: 'sentinel',
        name: 'Astra Sentinel',
        role: 'balanced',
        startingWeapon: 'sword',
        hpBias: 1.12,
        speedBias: 0.98,
        damageBias: 1,
        visualKey: 'character.sentinel.model',
        portraitKey: 'character.sentinel.portrait',
        introAnimationKey: 'character.sentinel.intro',
    },
    runner: {
        id: 'runner',
        name: 'Rift Runner',
        role: 'mobility',
        startingWeapon: 'spear',
        hpBias: 0.92,
        speedBias: 1.16,
        damageBias: 0.96,
        visualKey: 'character.runner.model',
        portraitKey: 'character.runner.portrait',
        introAnimationKey: 'character.runner.intro',
    },
    arcanist: {
        id: 'arcanist',
        name: 'Core Arcanist',
        role: 'caster',
        startingWeapon: 'orb',
        hpBias: 0.86,
        speedBias: 1,
        damageBias: 1.14,
        visualKey: 'character.arcanist.model',
        portraitKey: 'character.arcanist.portrait',
        introAnimationKey: 'character.arcanist.intro',
    },
};

export const WEAPON_CLASSES: Readonly<Record<WeaponClassId, WeaponClassContent>> = {
    sword: {
        id: 'sword',
        name: 'Starforged Sword',
        attackTiming: {
            cadence: 'steady',
            cooldownSeconds: 0.68,
            windupSeconds: 0.08,
            activeSeconds: 0.14,
            recoverySeconds: 0.16,
        },
        range: {
            band: 'melee',
            minRange: 0,
            maxRange: 92,
            arcDegrees: 110,
            pierce: 2,
        },
        projectileSpeed: 0,
        presentationKey: 'weapon.sword.slash',
        trailKey: 'trail.blade.short',
        impactKey: 'impact.sword.spark',
        audioKey: 'audio.weapon.sword',
    },
    spear: {
        id: 'spear',
        name: 'Rift Spear',
        attackTiming: {
            cadence: 'charged',
            cooldownSeconds: 0.92,
            windupSeconds: 0.16,
            activeSeconds: 0.1,
            recoverySeconds: 0.2,
        },
        range: {
            band: 'mid',
            minRange: 18,
            maxRange: 150,
            arcDegrees: 34,
            pierce: 4,
        },
        projectileSpeed: 0,
        presentationKey: 'weapon.spear.thrust',
        trailKey: 'trail.spear.line',
        impactKey: 'impact.spear.puncture',
        audioKey: 'audio.weapon.spear',
    },
    bow: {
        id: 'bow',
        name: 'Pulse Bow',
        attackTiming: {
            cadence: 'burst',
            cooldownSeconds: 1.05,
            windupSeconds: 0.12,
            activeSeconds: 0.04,
            recoverySeconds: 0.18,
        },
        range: {
            band: 'long',
            minRange: 42,
            maxRange: 260,
            arcDegrees: 8,
            pierce: 1,
        },
        projectileSpeed: 420,
        presentationKey: 'weapon.bow.pulse',
        trailKey: 'trail.bow.pulse',
        impactKey: 'impact.bow.flash',
        audioKey: 'audio.weapon.bow',
    },
    orb: {
        id: 'orb',
        name: 'Gravity Orb',
        attackTiming: {
            cadence: 'channel',
            cooldownSeconds: 1.25,
            windupSeconds: 0.24,
            activeSeconds: 0.38,
            recoverySeconds: 0.12,
        },
        range: {
            band: 'screen',
            minRange: 32,
            maxRange: 210,
            arcDegrees: 360,
            pierce: 0,
        },
        projectileSpeed: 170,
        presentationKey: 'weapon.orb.gravity',
        trailKey: 'trail.orb.arc',
        impactKey: 'impact.orb.implode',
        audioKey: 'audio.weapon.orb',
    },
};

export const MONSTER_PRESENTATION: Readonly<Record<RuntimeEnemyType, MonsterPresentationContent>> = {
    chaser: {
        enemyType: 'chaser',
        behaviorTags: ['advance', 'flank'],
        visualKey: 'monster.void_chaser.body',
        spawnVfxKey: 'vfx.spawn.void_small',
        attackVfxKey: 'vfx.attack.claw',
        deathVfxKey: 'vfx.death.void_pop',
        silhouetteKey: 'silhouette.chaser',
    },
    tank: {
        enemyType: 'tank',
        behaviorTags: ['advance', 'armor', 'telegraph'],
        visualKey: 'monster.core_tank.body',
        spawnVfxKey: 'vfx.spawn.core_heavy',
        attackVfxKey: 'vfx.attack.ground_slam',
        deathVfxKey: 'vfx.death.core_shatter',
        silhouetteKey: 'silhouette.tank',
    },
    dasher: {
        enemyType: 'dasher',
        behaviorTags: ['dash', 'charge', 'telegraph'],
        visualKey: 'monster.rift_dasher.body',
        spawnVfxKey: 'vfx.spawn.rift_cut',
        attackVfxKey: 'vfx.attack.dash_line',
        deathVfxKey: 'vfx.death.rift_spark',
        silhouetteKey: 'silhouette.dasher',
    },
    spitter: {
        enemyType: 'spitter',
        behaviorTags: ['ranged', 'kite', 'telegraph'],
        visualKey: 'monster.star_spitter.body',
        spawnVfxKey: 'vfx.spawn.star_pulse',
        attackVfxKey: 'vfx.attack.acid_shot',
        deathVfxKey: 'vfx.death.star_fizzle',
        silhouetteKey: 'silhouette.spitter',
    },
    swarm: {
        enemyType: 'swarm',
        behaviorTags: ['pack', 'advance', 'flank'],
        visualKey: 'monster.hex_swarm.body',
        spawnVfxKey: 'vfx.spawn.hex_cluster',
        attackVfxKey: 'vfx.attack.swarm_bite',
        deathVfxKey: 'vfx.death.hex_pop',
        silhouetteKey: 'silhouette.swarm',
    },
    binder: {
        enemyType: 'binder',
        behaviorTags: ['ranged', 'telegraph', 'control'],
        visualKey: 'monster.gravity_binder.body',
        spawnVfxKey: 'vfx.spawn.gravity_lens',
        attackVfxKey: 'vfx.attack.gravity_zone',
        deathVfxKey: 'vfx.death.gravity_shatter',
        silhouetteKey: 'silhouette.binder',
    },
    boss: {
        enemyType: 'boss',
        behaviorTags: ['boss', 'summon', 'telegraph', 'armor'],
        visualKey: 'monster.core_brute.body',
        spawnVfxKey: 'vfx.spawn.boss_core',
        attackVfxKey: 'vfx.attack.boss_sweep',
        deathVfxKey: 'vfx.death.boss_collapse',
        silhouetteKey: 'silhouette.boss',
    },
};
