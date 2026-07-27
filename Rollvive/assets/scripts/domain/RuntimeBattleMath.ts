import { professionHasTrait, type ProfessionData } from '../data/RollData';
import { ENEMY_ARCHETYPES, RuntimeEnemyType, getWavePlan } from './BattleContent';
import { createEnemy, PlayerCombatStats, RunEnemyModel } from './RunModel';
import { clampToBudget } from './PerformanceBudget';

export interface DamageContext {
    player: PlayerCombatStats;
    profession: ProfessionData;
    enemy?: RunEnemyModel | null;
    /** Nearby ally/enemy count for I passive (enemies within introvert radius). */
    nearbyEnemyCount?: number;
    isCritical?: boolean;
}

export interface DamageResult {
    damage: number;
    isCritical: boolean;
    multipliers: string[];
}

export function enemyTypeFromConfig(configId: string): RuntimeEnemyType {
    if (
        configId === 'tank' ||
        configId === 'dasher' ||
        configId === 'spitter' ||
        configId === 'swarm' ||
        configId === 'binder' ||
        configId === 'boss' ||
        configId === 'doubt' ||
        configId === 'anxiety' ||
        configId === 'procrastination'
    ) {
        return configId as RuntimeEnemyType;
    }
    return 'chaser';
}

/** Base weapon damage before dimension / ultimate multipliers. */
export function calculatePlayerDamage(player: PlayerCombatStats): number {
    const bladeBonus = Math.max(0, player.bladeCount - 1) * 0.18;
    const orbitBonus = player.orbitBladeCount * 0.12;
    const splitBonus = player.splitBlades * 0.08;
    return Math.max(
        1,
        Math.round(player.damage * (1 + player.damagePercent) * (1 + bladeBonus + orbitBonus + splitBonus)),
    );
}

/**
 * Full damage pipeline with MBTI dimension passives, crit, execute, boss bonus, ults.
 */
export function resolvePlayerHitDamage(ctx: DamageContext): DamageResult {
    const { player, profession, enemy } = ctx;
    let damage = calculatePlayerDamage(player);
    const multipliers: string[] = [];
    let isCritical = !!ctx.isCritical;

    // E: kill stacks (max 15) → +4% ATK each
    if (professionHasTrait(profession, 'E') && player.killStacks > 0) {
        const stacks = Math.min(15, player.killStacks);
        damage *= 1 + stacks * 0.04;
        multipliers.push(`E+${stacks}`);
    }

    // I: alone within introvert radius → +25%
    if (professionHasTrait(profession, 'I')) {
        const nearby = ctx.nearbyEnemyCount ?? 99;
        if (nearby <= 1) {
            damage *= 1.25;
            multipliers.push('I');
        }
    }

    // S: 25% crit for 200% (plus card crit)
    const critChance = Math.min(0.95, player.critChance + (professionHasTrait(profession, 'S') ? 0 : 0));
    if (!isCritical && Math.random() < critChance) {
        isCritical = true;
    }
    if (isCritical) {
        damage *= player.critMultiplier || 2;
        multipliers.push('CRIT');
    }

    // N post-dodge next-hit bonus
    if (player.postDodgeBonus > 0) {
        damage *= 1 + player.postDodgeBonus;
        multipliers.push('N');
    }

    // T: HP < 35% → +60%
    if (professionHasTrait(profession, 'T') && player.maxHp > 0 && player.hp / player.maxHp < 0.35) {
        damage *= 1.6;
        multipliers.push('T');
    }

    // Blood rage / execute card bonus when low HP
    if (player.executeBonus > 0 && player.maxHp > 0 && player.hp / player.maxHp < 0.5) {
        damage *= 1 + player.executeBonus;
        multipliers.push('RAGE');
    }

    // J locked skills: approximate as +30% if any skill locked
    if (professionHasTrait(profession, 'J') && (player.lockedSkillIds?.length ?? 0) > 0) {
        damage *= 1.3;
        multipliers.push('J');
    }

    // Boss / elite bonus
    if (enemy && (enemy.rank === 'boss' || enemy.rank === 'elite') && player.bossDamageBonus > 0) {
        damage *= 1 + player.bossDamageBonus;
        multipliers.push('BOSS');
    }

    // Ultimate damage bonus
    if (player.ultimateDamageBonus > 0) {
        damage *= 1 + player.ultimateDamageBonus * Math.max(0.5, player.ultimateMultiplier || 1);
        multipliers.push('ULT');
    }

    return {
        damage: Math.max(1, Math.round(damage)),
        isCritical,
        multipliers,
    };
}

export function damageAfterArmor(rawDamage: number, armor: number): number {
    const armorReduction = armor / (armor + 100);
    return Math.max(1, Math.round(rawDamage * (1 - Math.min(0.9, armorReduction))));
}

/** Count living enemies within radius of a point (for I passive). */
export function countNearbyEnemies(
    enemies: RunEnemyModel[],
    positions: Map<string, { x: number; y: number }>,
    originX: number,
    originY: number,
    radius: number,
): number {
    let count = 0;
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const pos = positions.get(enemy.id);
        if (!pos) continue;
        if (Math.hypot(pos.x - originX, pos.y - originY) <= radius) {
            count += 1;
        }
    }
    return count;
}

const FLOOR_BOSS_NAMES: Record<number, { en: string; zh: string }> = {
    1: { en: 'Workplace Fear', zh: '职场恐惧' },
    2: { en: 'Social Judgment', zh: '社交审判' },
    3: { en: 'Attachment Void', zh: '依恋虚空' },
    4: { en: 'Self Abyss', zh: '自我深渊' },
};

export function bossNameForFloor(floor: number, zh = false): string {
    const entry = FLOOR_BOSS_NAMES[Math.min(4, Math.max(1, floor))] ?? FLOOR_BOSS_NAMES[1];
    return zh ? entry.zh : entry.en;
}

export function createRuntimeWaveEnemies(wave: number, maxActiveEnemies: number): RunEnemyModel[] {
    const plan = getWavePlan(wave);
    const total = plan.enemies.reduce((sum, entry) => sum + entry.count, 0);
    const count = clampToBudget(total, maxActiveEnemies);
    const enemies: RunEnemyModel[] = [];
    let created = 0;

    for (const entry of plan.enemies) {
        const archetype = ENEMY_ARCHETYPES[entry.type];
        for (let i = 0; i < entry.count && created < count; i += 1) {
            const waveScale = Math.max(0, wave - 1);
            const bossScale = archetype.rank === 'boss' ? 1 + waveScale * 0.18 : 1 + waveScale * 0.14;
            const bossName = bossNameForFloor(plan.floor);
            enemies.push(
                createEnemy({
                    id: `w${wave}_${entry.type}_${i}`,
                    configId: entry.type,
                    name: archetype.rank === 'boss' ? bossName : archetype.name,
                    rank: archetype.rank,
                    maxHp: Math.round(archetype.hp * bossScale),
                    damage: Math.round(archetype.damage * (1 + waveScale * 0.09)),
                    armor: Math.round(archetype.armor + waveScale * (archetype.rank === 'boss' ? 1.2 : 0.45)),
                    attackCooldown: archetype.contactCooldown,
                }),
            );
            created += 1;
        }
    }

    return enemies;
}
