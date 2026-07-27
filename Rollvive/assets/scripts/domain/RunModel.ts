import {
    CombatBonus,
    DEFAULT_FLAGS,
    HexCardData,
    HexFlags,
    ProfessionData,
    PROFESSIONS,
} from '../data/RollData';

export type EnemyRank = 'normal' | 'elite' | 'boss';
export type DraftChoiceSource = 'wave-clear' | 'reroll' | 'debug';

export interface PlayerCombatStats {
    maxHp: number;
    hp: number;
    armor: number;
    dodge: number;
    luck: number;
    moveSpeed: number;
    damage: number;
    damagePercent: number;
    attackRange: number;
    attackCooldown: number;
    energy: number;
    energyPerAttack: number;
    ultimateMultiplier: number;
    shieldReduction: number;
    bladeCount: number;
    orbitBladeCount: number;
    chainHits: number;
    splitBlades: number;
    fanAngle: number;
    critChance: number;
    critMultiplier: number;
    lifesteal: number;
    executeBonus: number;
    bossDamageBonus: number;
    /** E passive: kill stacks, max 15 */
    killStacks: number;
    /** F passive: kill counter for heal every 8 */
    feelKillCounter: number;
    /** N passive: next hit bonus after dodge */
    postDodgeBonus: number;
    /** J passive: locked skill ids for +30% damage */
    lockedSkillIds: string[];
    /** Active ultimate remaining seconds */
    ultimateTimer: number;
    /** Active ultimate id (profession ultimate) */
    activeUltimateId: string | null;
    /** Temporary ATK multiplier from ultimates */
    ultimateDamageBonus: number;
    /** Temporary move speed bonus from ultimates */
    ultimateMoveBonus: number;
    /** Temporary attack cooldown multiplier (<1 = faster) */
    ultimateCooldownMul: number;
    /** Temporary damage taken multiplier */
    damageTakenMul: number;
    /** Invulnerable while ultimate (INFP etc.) */
    invulnerable: boolean;
    /** Perfect parry / block all damage window */
    blockAllDamage: boolean;
}

export interface RunEnemyModel {
    id: string;
    configId: string;
    name: string;
    rank: EnemyRank;
    maxHp: number;
    hp: number;
    armor: number;
    damage: number;
    attackCooldown: number;
    alive: boolean;
}

export interface WaveRuntimeModel {
    wave: number;
    elapsedSeconds: number;
    enemies: RunEnemyModel[];
    cleared: boolean;
}

export interface DraftDieModel {
    id: string;
    value: number;
    locked: boolean;
}

export interface DraftChoiceModel {
    id: string;
    card: HexCardData;
    dice: DraftDieModel[];
    source: DraftChoiceSource;
}

export interface RunStatsModel {
    kills: number;
    damageDealt: number;
    damageTaken: number;
    timeSeconds: number;
    wavesCleared: number;
    level: number;
    xp: number;
    xpToNext: number;
    freeDraftRefreshesUsed: number;
    rewardedDraftRefreshesRequested: number;
}

export interface DraftRefreshModel {
    freeRefreshesRemaining: number;
    rewardedAdRefreshAvailable: boolean;
    rewardedAdRefreshPending: boolean;
}

export interface RunModel {
    seed: number;
    profession: ProfessionData;
    player: PlayerCombatStats;
    flags: HexFlags;
    wave: WaveRuntimeModel;
    draftRefresh: DraftRefreshModel;
    pickedCards: HexCardData[];
    draftChoices: DraftChoiceModel[];
    selectedDraftChoiceId: string | null;
    stats: RunStatsModel;
}

export interface CreateInitialRunOptions {
    seed?: number;
    professionId?: string;
    profession?: ProfessionData;
    startingWave?: number;
    enemies?: RunEnemyModel[];
}

export interface DraftChoiceResult {
    run: RunModel;
    picked: HexCardData | null;
}

export interface DraftRefreshResult {
    run: RunModel;
    refreshed: boolean;
    requiresRewardedAd: boolean;
    reason: 'free' | 'rewarded-ad' | 'pending-ad' | 'unavailable';
}

const BASE_PLAYER_STATS: PlayerCombatStats = {
    maxHp: 100,
    hp: 100,
    armor: 0,
    dodge: 0,
    luck: 0,
    moveSpeed: 1,
    damage: 12,
    damagePercent: 0,
    attackRange: 120,
    attackCooldown: 0.7,
    energy: 0,
    energyPerAttack: 10,
    ultimateMultiplier: 1,
    shieldReduction: 0,
    bladeCount: 1,
    orbitBladeCount: 0,
    chainHits: 0,
    splitBlades: 0,
    fanAngle: 0,
    critChance: 0,
    critMultiplier: 2,
    lifesteal: 0,
    executeBonus: 0,
    bossDamageBonus: 0,
    killStacks: 0,
    feelKillCounter: 0,
    postDodgeBonus: 0,
    lockedSkillIds: [],
    ultimateTimer: 0,
    activeUltimateId: null,
    ultimateDamageBonus: 0,
    ultimateMoveBonus: 0,
    ultimateCooldownMul: 1,
    damageTakenMul: 1,
    invulnerable: false,
    blockAllDamage: false,
};

const MIN_PLAYER_MAX_HP = 1;
const MIN_ATTACK_COOLDOWN = 0.1;

export function createInitialRun(options: CreateInitialRunOptions = {}): RunModel {
    const profession = options.profession || findProfession(options.professionId) || PROFESSIONS[0];
    const seed = options.seed === undefined ? Date.now() : options.seed;

    // Map pitch base ATK/HP/SPD (80-120) onto runtime combat units.
    const baseFromPersonality: PlayerCombatStats = {
        ...BASE_PLAYER_STATS,
        maxHp: Math.round(72 + profession.baseHp * 0.45),
        hp: Math.round(72 + profession.baseHp * 0.45),
        damage: Math.round(6 + profession.baseAtk * 0.12),
        moveSpeed: clamp(0.78 + (profession.baseSpd - 80) * 0.004, 0.7, 1.35),
        attackRange: 110,
        attackCooldown: 0.72,
        energy: 0,
        energyPerAttack: 12,
        critMultiplier: 2,
    };

    const withBonus = applyCombatBonusToPlayer(baseFromPersonality, profession.bonus, true);
    const flags = { ...DEFAULT_FLAGS };
    // P-type: +1 free refresh permanently via profession draft rules (also handled in RollSystem).
    if (profession.traits.indexOf('P') >= 0) {
        flags.extraChoice = Math.max(flags.extraChoice, 1);
        flags.freeRefreshBonus += 1;
    }
    // J-type: can lock 1 skill for +30% damage.
    if (profession.traits.indexOf('J') >= 0) {
        flags.lockedSkillSlots = Math.max(flags.lockedSkillSlots, 1);
    }
    // N-type base dodge from dimension passive.
    if (profession.traits.indexOf('N') >= 0) {
        withBonus.dodge = clamp(withBonus.dodge + 0.15, 0, 0.85);
    }
    // S-type base crit from dimension passive.
    if (profession.traits.indexOf('S') >= 0) {
        withBonus.critChance = clamp(withBonus.critChance + 0.25, 0, 0.95);
        withBonus.critMultiplier = Math.max(withBonus.critMultiplier, 2);
    }

    return {
        seed,
        profession,
        player: withBonus,
        flags,
        wave: createWaveRuntime(options.startingWave || 1, options.enemies || []),
        draftRefresh: createDraftRefresh(flags),
        pickedCards: [],
        draftChoices: [],
        selectedDraftChoiceId: null,
        stats: {
            kills: 0,
            damageDealt: 0,
            damageTaken: 0,
            timeSeconds: 0,
            wavesCleared: 0,
            level: 1,
            xp: 0,
            xpToNext: 10,
            freeDraftRefreshesUsed: 0,
            rewardedDraftRefreshesRequested: 0,
        },
    };
}

export function createWaveRuntime(wave: number, enemies: RunEnemyModel[] = []): WaveRuntimeModel {
    return {
        wave,
        elapsedSeconds: 0,
        enemies: enemies.map(cloneEnemy),
        cleared: enemies.length > 0 ? enemies.every((enemy) => !enemy.alive || enemy.hp <= 0) : false,
    };
}

export function createDraftRefresh(flags: HexFlags): DraftRefreshModel {
    return {
        freeRefreshesRemaining: 1 + flags.freeRefreshBonus,
        rewardedAdRefreshAvailable: true,
        rewardedAdRefreshPending: false,
    };
}

export function createEnemy(params: Partial<RunEnemyModel> & { id: string; configId?: string; name?: string }): RunEnemyModel {
    const maxHp = params.maxHp === undefined ? 24 : Math.max(1, Math.floor(params.maxHp));
    const hp = params.hp === undefined ? maxHp : clamp(Math.floor(params.hp), 0, maxHp);

    return {
        id: params.id,
        configId: params.configId || params.id,
        name: params.name || params.configId || params.id,
        rank: params.rank || 'normal',
        maxHp,
        hp,
        armor: params.armor === undefined ? 0 : Math.max(0, params.armor),
        damage: params.damage === undefined ? 6 : Math.max(0, params.damage),
        attackCooldown: params.attackCooldown === undefined ? 1 : Math.max(0.1, params.attackCooldown),
        alive: params.alive === undefined ? hp > 0 : params.alive && hp > 0,
    };
}

export function setDraftChoices(run: RunModel, choices: DraftChoiceModel[]): RunModel {
    return cloneRun({
        ...run,
        draftChoices: choices.map(cloneDraftChoice),
        selectedDraftChoiceId: choices.length > 0 ? choices[0].id : null,
        draftRefresh: createDraftRefresh(run.flags),
    });
}

export function selectDraftChoice(run: RunModel, choiceId: string | null): RunModel {
    const exists = choiceId === null || run.draftChoices.some((choice) => choice.id === choiceId);

    return cloneRun({
        ...run,
        selectedDraftChoiceId: exists ? choiceId : run.selectedDraftChoiceId,
    });
}

export function applyDraftChoice(run: RunModel, choiceId?: string): DraftChoiceResult {
    const selectedId = choiceId || run.selectedDraftChoiceId;
    const choice = run.draftChoices.find((item) => item.id === selectedId);

    if (!choice) {
        return { run: cloneRun(run), picked: null };
    }

    const nextCards = run.pickedCards.concat([choice.card]);
    const nextFlags = applyHexFlags(run.flags, choice.card.flags);
    const nextPlayer = applyCombatBonusToPlayer(run.player, choice.card.bonus, false);

    return {
        run: cloneRun({
            ...run,
            player: nextPlayer,
            flags: nextFlags,
            pickedCards: nextCards,
            draftChoices: [],
            selectedDraftChoiceId: null,
        }),
        picked: choice.card,
    };
}

export function requestDraftRefresh(run: RunModel): DraftRefreshResult {
    if (run.draftRefresh.freeRefreshesRemaining > 0) {
        return {
            run: cloneRun({
                ...run,
                draftRefresh: {
                    ...run.draftRefresh,
                    freeRefreshesRemaining: run.draftRefresh.freeRefreshesRemaining - 1,
                },
                stats: {
                    ...run.stats,
                    freeDraftRefreshesUsed: run.stats.freeDraftRefreshesUsed + 1,
                },
            }),
            refreshed: true,
            requiresRewardedAd: false,
            reason: 'free',
        };
    }

    if (run.draftRefresh.rewardedAdRefreshPending) {
        return {
            run: cloneRun(run),
            refreshed: false,
            requiresRewardedAd: true,
            reason: 'pending-ad',
        };
    }

    if (!run.draftRefresh.rewardedAdRefreshAvailable) {
        return {
            run: cloneRun(run),
            refreshed: false,
            requiresRewardedAd: false,
            reason: 'unavailable',
        };
    }

    return {
        run: cloneRun({
            ...run,
            draftRefresh: {
                ...run.draftRefresh,
                rewardedAdRefreshPending: true,
            },
            stats: {
                ...run.stats,
                rewardedDraftRefreshesRequested: run.stats.rewardedDraftRefreshesRequested + 1,
            },
        }),
        refreshed: false,
        requiresRewardedAd: true,
        reason: 'rewarded-ad',
    };
}

export function completeRewardedDraftRefresh(run: RunModel, granted: boolean): DraftRefreshResult {
    if (!run.draftRefresh.rewardedAdRefreshPending) {
        return {
            run: cloneRun(run),
            refreshed: false,
            requiresRewardedAd: false,
            reason: 'unavailable',
        };
    }

    return {
        run: cloneRun({
            ...run,
            draftRefresh: {
                ...run.draftRefresh,
                rewardedAdRefreshPending: false,
            },
        }),
        refreshed: granted,
        requiresRewardedAd: false,
        reason: granted ? 'rewarded-ad' : 'unavailable',
    };
}

export function isRunDead(run: RunModel): boolean {
    return run.player.hp <= 0;
}

export function isWaveCleared(run: RunModel): boolean {
    return run.wave.enemies.length > 0 && run.wave.enemies.every((enemy) => !enemy.alive || enemy.hp <= 0);
}

export function cloneRun(run: RunModel): RunModel {
    return {
        ...run,
        profession: {
            ...run.profession,
            bonus: { ...run.profession.bonus },
            traits: [...run.profession.traits] as typeof run.profession.traits,
        },
        player: {
            ...run.player,
            lockedSkillIds: [...(run.player.lockedSkillIds || [])],
        },
        flags: { ...run.flags },
        draftRefresh: { ...run.draftRefresh },
        wave: {
            ...run.wave,
            enemies: run.wave.enemies.map(cloneEnemy),
        },
        pickedCards: run.pickedCards.map(cloneCard),
        draftChoices: run.draftChoices.map(cloneDraftChoice),
        stats: { ...run.stats },
    };
}

export function cloneEnemy(enemy: RunEnemyModel): RunEnemyModel {
    return { ...enemy };
}

function cloneDraftChoice(choice: DraftChoiceModel): DraftChoiceModel {
    return {
        ...choice,
        card: cloneCard(choice.card),
        dice: choice.dice.map((die) => ({ ...die })),
    };
}

function cloneCard(card: HexCardData): HexCardData {
    return {
        ...card,
        bonus: card.bonus ? { ...card.bonus } : undefined,
        flags: card.flags ? { ...card.flags } : undefined,
    };
}

function findProfession(professionId?: string): ProfessionData | null {
    if (!professionId) {
        return null;
    }

    return PROFESSIONS.find((profession) => profession.id === professionId) || null;
}

function applyCombatBonusToPlayer(
    stats: PlayerCombatStats,
    bonus: CombatBonus | undefined,
    healMaxHpDelta: boolean,
): PlayerCombatStats {
    if (!bonus) {
        return { ...stats };
    }

    const maxHpDelta = bonus.maxHp || 0;
    const nextMaxHp = Math.max(MIN_PLAYER_MAX_HP, stats.maxHp + maxHpDelta);
    const nextHp = healMaxHpDelta
        ? clamp(stats.hp + maxHpDelta, 0, nextMaxHp)
        : clamp(Math.min(stats.hp, nextMaxHp) + Math.max(0, maxHpDelta), 0, nextMaxHp);

    return {
        ...stats,
        maxHp: nextMaxHp,
        hp: nextHp,
        armor: Math.max(0, stats.armor + (bonus.armor || 0)),
        dodge: clamp(stats.dodge + (bonus.dodge || 0), 0, 0.85),
        luck: stats.luck + (bonus.luck || 0),
        moveSpeed: clamp(stats.moveSpeed + (bonus.moveSpeed || 0), 0.55, 1.85),
        damage: Math.max(0, stats.damage + (bonus.damage || 0)),
        damagePercent: Math.max(-0.95, stats.damagePercent + (bonus.damagePercent || 0)),
        attackRange: Math.max(0, stats.attackRange + (bonus.attackRange || 0)),
        attackCooldown: Math.max(MIN_ATTACK_COOLDOWN, stats.attackCooldown + (bonus.attackCooldown || 0)),
        energy: stats.energy,
        energyPerAttack: Math.max(0, stats.energyPerAttack + (bonus.energyPerAttack || 0)),
        ultimateMultiplier: Math.max(0, stats.ultimateMultiplier + (bonus.ultimateMultiplier || 0)),
        shieldReduction: clamp(stats.shieldReduction + (bonus.shieldReduction || 0), 0, 0.9),
        bladeCount: Math.max(1, Math.floor(stats.bladeCount + (bonus.bladeCount || 0))),
        orbitBladeCount: Math.max(0, Math.floor(stats.orbitBladeCount + (bonus.orbitBladeCount || 0))),
        chainHits: Math.max(0, Math.floor(stats.chainHits + (bonus.chainHits || 0))),
        splitBlades: Math.max(0, Math.floor(stats.splitBlades + (bonus.splitBlades || 0))),
        fanAngle: Math.max(0, stats.fanAngle + (bonus.fanAngle || 0)),
        critChance: clamp(stats.critChance + (bonus.critChance || 0), 0, 0.95),
        critMultiplier: Math.max(1.5, stats.critMultiplier + (bonus.critMultiplier || 0)),
        lifesteal: clamp(stats.lifesteal + (bonus.lifesteal || 0), 0, 0.5),
        executeBonus: Math.max(0, stats.executeBonus + (bonus.executeBonus || 0)),
        bossDamageBonus: Math.max(0, stats.bossDamageBonus + (bonus.bossDamageBonus || 0)),
        lockedSkillIds: [...(stats.lockedSkillIds || [])],
    };
}

function applyHexFlags(flags: HexFlags, patch: Partial<HexFlags> | undefined): HexFlags {
    if (!patch) {
        return { ...flags };
    }

    return {
        colorBias: flags.colorBias + (patch.colorBias || 0),
        extraChoice: flags.extraChoice + (patch.extraChoice || 0),
        freeRefreshBonus: flags.freeRefreshBonus + (patch.freeRefreshBonus || 0),
        lockedSkillSlots: flags.lockedSkillSlots + (patch.lockedSkillSlots || 0),
    };
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
