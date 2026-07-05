import type { EnemyRank } from './RunModel';

export type RuntimeEnemyType = 'chaser' | 'tank' | 'dasher' | 'spitter' | 'swarm' | 'binder' | 'boss';

export interface EnemyArchetype {
    id: RuntimeEnemyType;
    name: string;
    rank: EnemyRank;
    hp: number;
    damage: number;
    armor: number;
    speed: number;
    radius: number;
    contactCooldown: number;
    xpRole: 'pressure' | 'space-control' | 'burst-threat' | 'ranged-threat' | 'control-threat' | 'boss';
}

export interface WaveEnemyEntry {
    type: RuntimeEnemyType;
    count: number;
}

export interface WavePlan {
    wave: number;
    title: string;
    goal: string;
    enemies: WaveEnemyEntry[];
}

export const ENEMY_ARCHETYPES: Record<RuntimeEnemyType, EnemyArchetype> = {
    chaser: {
        id: 'chaser',
        name: 'Void Chaser',
        rank: 'normal',
        hp: 34,
        damage: 6,
        armor: 1,
        speed: 58,
        radius: 9,
        contactCooldown: 0.82,
        xpRole: 'pressure',
    },
    tank: {
        id: 'tank',
        name: 'Core Tank',
        rank: 'elite',
        hp: 92,
        damage: 9,
        armor: 10,
        speed: 35,
        radius: 13,
        contactCooldown: 0.95,
        xpRole: 'space-control',
    },
    dasher: {
        id: 'dasher',
        name: 'Rift Dasher',
        rank: 'normal',
        hp: 48,
        damage: 12,
        armor: 2,
        speed: 46,
        radius: 10,
        contactCooldown: 1.05,
        xpRole: 'burst-threat',
    },
    spitter: {
        id: 'spitter',
        name: 'Star Spitter',
        rank: 'normal',
        hp: 40,
        damage: 8,
        armor: 0,
        speed: 28,
        radius: 10,
        contactCooldown: 1.1,
        xpRole: 'ranged-threat',
    },
    swarm: {
        id: 'swarm',
        name: 'Hex Swarm',
        rank: 'normal',
        hp: 18,
        damage: 4,
        armor: 0,
        speed: 76,
        radius: 7,
        contactCooldown: 0.72,
        xpRole: 'pressure',
    },
    binder: {
        id: 'binder',
        name: 'Gravity Binder',
        rank: 'elite',
        hp: 62,
        damage: 7,
        armor: 4,
        speed: 32,
        radius: 11,
        contactCooldown: 1.15,
        xpRole: 'control-threat',
    },
    boss: {
        id: 'boss',
        name: 'Core Brute',
        rank: 'boss',
        hp: 420,
        damage: 16,
        armor: 18,
        speed: 30,
        radius: 18,
        contactCooldown: 0.66,
        xpRole: 'boss',
    },
};

export const EARLY_WAVE_PLANS: WavePlan[] = [
    {
        wave: 1,
        title: 'First Contact',
        goal: 'Learn movement and automatic attacks.',
        enemies: [{ type: 'chaser', count: 4 }],
    },
    {
        wave: 2,
        title: 'Hold Distance',
        goal: 'Kite a tougher enemy while clearing pressure.',
        enemies: [
            { type: 'chaser', count: 4 },
            { type: 'tank', count: 1 },
        ],
    },
    {
        wave: 3,
        title: 'Crowd Pressure',
        goal: 'Feel the first build upgrade against a larger pack.',
        enemies: [
            { type: 'chaser', count: 4 },
            { type: 'swarm', count: 5 },
        ],
    },
    {
        wave: 4,
        title: 'Read The Dash',
        goal: 'React to dash warning windows.',
        enemies: [
            { type: 'chaser', count: 4 },
            { type: 'tank', count: 1 },
            { type: 'dasher', count: 2 },
        ],
    },
    {
        wave: 5,
        title: 'Core Brute',
        goal: 'First boss check with light add pressure.',
        enemies: [
            { type: 'boss', count: 1 },
            { type: 'chaser', count: 4 },
            { type: 'swarm', count: 4 },
        ],
    },
    {
        wave: 6,
        title: 'Crossfire',
        goal: 'Read slow projectiles while staying mobile.',
        enemies: [
            { type: 'chaser', count: 5 },
            { type: 'spitter', count: 2 },
            { type: 'swarm', count: 4 },
        ],
    },
    {
        wave: 7,
        title: 'Heavy Pack',
        goal: 'Use your build to break tank and swarm pressure.',
        enemies: [
            { type: 'tank', count: 2 },
            { type: 'chaser', count: 5 },
            { type: 'swarm', count: 6 },
        ],
    },
    {
        wave: 8,
        title: 'Gravity Snare',
        goal: 'Escape control zones before the pack collapses.',
        enemies: [
            { type: 'binder', count: 1 },
            { type: 'chaser', count: 5 },
            { type: 'dasher', count: 2 },
        ],
    },
    {
        wave: 9,
        title: 'Mixed Threats',
        goal: 'Prioritize ranged and control threats under pressure.',
        enemies: [
            { type: 'spitter', count: 2 },
            { type: 'binder', count: 1 },
            { type: 'swarm', count: 8 },
            { type: 'dasher', count: 2 },
        ],
    },
    {
        wave: 10,
        title: 'Guardian Two',
        goal: 'Second boss check with ranged and control support.',
        enemies: [
            { type: 'boss', count: 1 },
            { type: 'binder', count: 1 },
            { type: 'spitter', count: 2 },
            { type: 'chaser', count: 6 },
        ],
    },
];

export function getWavePlan(wave: number): WavePlan {
    const early = EARLY_WAVE_PLANS.find((plan) => plan.wave === wave);
    if (early) return early;

    const bossWave = wave % 5 === 0;
    const pressureCount = Math.min(18, 5 + Math.floor(wave * 0.85));
    const enemies: WaveEnemyEntry[] = bossWave
        ? [
            { type: 'boss', count: 1 },
            { type: 'chaser', count: Math.max(4, Math.floor(pressureCount * 0.55)) },
            { type: 'swarm', count: Math.max(3, Math.floor(pressureCount * 0.35)) },
            { type: 'dasher', count: Math.floor(wave / 5) },
            { type: 'binder', count: wave >= 10 ? 1 : 0 },
        ]
        : [
            { type: 'chaser', count: Math.max(3, Math.floor(pressureCount * 0.55)) },
            { type: 'swarm', count: Math.max(2, Math.floor(pressureCount * 0.3)) },
            { type: wave >= 7 ? 'spitter' : 'tank', count: 1 + Math.floor(wave / 6) },
            { type: 'dasher', count: wave >= 6 ? 1 + Math.floor(wave / 8) : 0 },
            { type: 'binder', count: wave >= 8 ? 1 + Math.floor(wave / 12) : 0 },
        ];

    return {
        wave,
        title: bossWave ? `Guardian ${wave / 5}` : `Wave ${wave}`,
        goal: bossWave ? 'Survive boss pressure and adds.' : 'Scale pressure with mixed enemy roles.',
        enemies: enemies.filter((entry) => entry.count > 0),
    };
}
