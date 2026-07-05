import { ENEMY_ARCHETYPES, RuntimeEnemyType, getWavePlan } from './BattleContent';
import { createEnemy, PlayerCombatStats, RunEnemyModel } from './RunModel';
import { clampToBudget } from './PerformanceBudget';

export function enemyTypeFromConfig(configId: string): RuntimeEnemyType {
    if (configId === 'tank' || configId === 'dasher' || configId === 'spitter' || configId === 'swarm' || configId === 'binder' || configId === 'boss') {
        return configId;
    }
    return 'chaser';
}

export function calculatePlayerDamage(player: PlayerCombatStats): number {
    const bladeBonus = Math.max(0, player.bladeCount - 1) * 0.18;
    const orbitBonus = player.orbitBladeCount * 0.12;
    const splitBonus = player.splitBlades * 0.08;
    return Math.max(1, Math.round(player.damage * (1 + player.damagePercent) * (1 + bladeBonus + orbitBonus + splitBonus)));
}

export function damageAfterArmor(rawDamage: number, armor: number): number {
    const armorReduction = armor / (armor + 100);
    return Math.max(1, Math.round(rawDamage * (1 - Math.min(0.9, armorReduction))));
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
            enemies.push(createEnemy({
                id: `w${wave}_${entry.type}_${i}`,
                configId: entry.type,
                name: archetype.rank === 'boss' ? `${archetype.name} W${wave}` : archetype.name,
                rank: archetype.rank,
                maxHp: Math.round(archetype.hp * bossScale),
                damage: Math.round(archetype.damage * (1 + waveScale * 0.09)),
                armor: Math.round(archetype.armor + waveScale * (archetype.rank === 'boss' ? 1.2 : 0.45)),
                attackCooldown: archetype.contactCooldown,
            }));
            created += 1;
        }
    }

    return enemies;
}
