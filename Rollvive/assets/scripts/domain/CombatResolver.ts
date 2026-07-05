import { GameEvent } from './GameState';
import { cloneEnemy, cloneRun, isRunDead, isWaveCleared, RunEnemyModel, RunModel } from './RunModel';

export type CombatEvent =
    | PlayerAttackEvent
    | EnemyDamagedEvent
    | EnemyDiedEvent
    | PlayerDamagedEvent
    | PlayerDiedEvent
    | WaveClearedEvent;

export interface CombatResolveInput {
    targetEnemyId?: string;
    enemyCounterAttackIds?: string[];
    forceDodge?: boolean;
}

export interface CombatResolveResult {
    run: RunModel;
    events: CombatEvent[];
}

export interface PlayerAttackEvent {
    type: 'combat:player-attack';
    targetEnemyIds: string[];
    baseDamage: number;
}

export interface EnemyDamagedEvent {
    type: typeof GameEvent.EnemyDamaged;
    enemyId: string;
    amount: number;
    remainingHp: number;
}

export interface EnemyDiedEvent {
    type: typeof GameEvent.EnemyDied;
    enemyId: string;
}

export interface PlayerDamagedEvent {
    type: typeof GameEvent.PlayerDamaged;
    amount: number;
    remainingHp: number;
    dodged: boolean;
    sourceEnemyId: string;
}

export interface PlayerDiedEvent {
    type: typeof GameEvent.PlayerDied;
}

export interface WaveClearedEvent {
    type: typeof GameEvent.WaveCleared;
    wave: number;
}

export function resolveCombatRound(run: RunModel, input: CombatResolveInput = {}): CombatResolveResult {
    const next = cloneRun(run);
    const events: CombatEvent[] = [];

    if (isRunDead(next)) {
        return { run: next, events };
    }

    const targetIds = chooseTargets(next, input.targetEnemyId);
    const attackDamage = calculatePlayerDamage(next);

    if (targetIds.length > 0) {
        events.push({
            type: 'combat:player-attack',
            targetEnemyIds: targetIds,
            baseDamage: attackDamage,
        });
    }

    for (let i = 0; i < targetIds.length; i += 1) {
        const enemyIndex = next.wave.enemies.findIndex((enemy) => enemy.id === targetIds[i] && enemy.alive);

        if (enemyIndex < 0) {
            continue;
        }

        const damageScale = i === 0 ? 1 : 0.55;
        const enemy = next.wave.enemies[enemyIndex];
        const damage = calculateDamageAfterArmor(Math.round(attackDamage * damageScale), enemy.armor);
        const updatedEnemy = damageEnemy(enemy, damage);
        next.wave.enemies[enemyIndex] = updatedEnemy;
        next.stats.damageDealt += damage;

        events.push({
            type: GameEvent.EnemyDamaged,
            enemyId: updatedEnemy.id,
            amount: damage,
            remainingHp: updatedEnemy.hp,
        });

        if (!updatedEnemy.alive) {
            next.stats.kills += 1;
            events.push({
                type: GameEvent.EnemyDied,
                enemyId: updatedEnemy.id,
            });
        }
    }

    next.player.energy = Math.min(100, next.player.energy + next.player.energyPerAttack);

    const counterAttackIds = input.enemyCounterAttackIds || next.wave.enemies.filter((enemy) => enemy.alive).map((enemy) => enemy.id);
    for (let i = 0; i < counterAttackIds.length; i += 1) {
        if (isRunDead(next)) {
            break;
        }

        const enemy = next.wave.enemies.find((item) => item.id === counterAttackIds[i] && item.alive);
        if (!enemy) {
            continue;
        }

        const dodged = input.forceDodge === undefined ? false : input.forceDodge;
        const damage = dodged ? 0 : calculateDamageAfterArmor(enemy.damage, next.player.armor, next.player.shieldReduction);
        next.player.hp = Math.max(0, next.player.hp - damage);
        next.stats.damageTaken += damage;

        events.push({
            type: GameEvent.PlayerDamaged,
            amount: damage,
            remainingHp: next.player.hp,
            dodged,
            sourceEnemyId: enemy.id,
        });
    }

    if (isRunDead(next)) {
        events.push({ type: GameEvent.PlayerDied });
    }

    if (isWaveCleared(next) && !next.wave.cleared) {
        next.wave.cleared = true;
        next.stats.wavesCleared += 1;
        events.push({
            type: GameEvent.WaveCleared,
            wave: next.wave.wave,
        });
    }

    return { run: next, events };
}

export function calculatePlayerDamage(run: RunModel): number {
    const raw = run.player.damage * (1 + run.player.damagePercent);
    const bladeBonus = Math.max(0, run.player.bladeCount - 1) * 0.18;
    const orbitBonus = run.player.orbitBladeCount * 0.12;
    const splitBonus = run.player.splitBlades * 0.08;

    return Math.max(1, Math.round(raw * (1 + bladeBonus + orbitBonus + splitBonus)));
}

export function calculateDamageAfterArmor(rawDamage: number, armor: number, shieldReduction = 0): number {
    const armorReduction = armor / (armor + 100);
    const totalReduction = clamp(armorReduction + shieldReduction, 0, 0.9);

    return Math.max(1, Math.round(rawDamage * (1 - totalReduction)));
}

function chooseTargets(run: RunModel, preferredEnemyId?: string): string[] {
    const aliveEnemies = run.wave.enemies.filter((enemy) => enemy.alive);
    const preferred = preferredEnemyId ? aliveEnemies.find((enemy) => enemy.id === preferredEnemyId) : null;
    const ordered = preferred
        ? [preferred].concat(aliveEnemies.filter((enemy) => enemy.id !== preferred.id))
        : aliveEnemies;
    const count = Math.max(1, 1 + run.player.chainHits);

    return ordered.slice(0, count).map((enemy) => enemy.id);
}

function damageEnemy(enemy: RunEnemyModel, damage: number): RunEnemyModel {
    const next = cloneEnemy(enemy);
    next.hp = Math.max(0, next.hp - damage);
    next.alive = next.hp > 0;

    return next;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
