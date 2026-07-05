import { MOBILE_PERFORMANCE_BUDGET } from './PerformanceBudget';

export type EnemyThreatLevel = 'normal' | 'elite' | 'boss';

export type AttackTrailKind = 'blade' | 'chain' | 'critical' | 'boss';

export interface DamageNumberFeedbackSpec {
    maxActive: number;
    normalColor: string;
    criticalColor: string;
    playerDamageColor: string;
    lifetimeMs: number;
    riseDistancePx: number;
}

export interface EnemyHealthBarFeedbackSpec {
    showFor: readonly EnemyThreatLevel[];
    hideWhenFullForNormal: boolean;
    showAfterDamageMs: number;
    eliteAlwaysVisible: boolean;
    bossAlwaysVisible: boolean;
    minVisibleHpRatio: number;
}

export interface AttackTrailFeedbackSpec {
    color: string;
    durationMs: number;
    widthPx: number;
    fadeOutMs: number;
}

export interface DeathFeedbackSpec {
    normalDurationMs: number;
    eliteDurationMs: number;
    bossDurationMs: number;
    vfxColor: string;
    fadeScale: number;
}

export interface BossWarningFeedbackSpec {
    enabled: boolean;
    preSpawnWarningMs: number;
    bannerDurationMs: number;
    pulseIntervalMs: number;
    screenTintColor: string;
    dangerRingColor: string;
    dangerRingDurationMs: number;
    bossHpBarLabel: string;
}

export interface CombatFeedbackSpec {
    damageNumbers: DamageNumberFeedbackSpec;
    enemyHealthBars: EnemyHealthBarFeedbackSpec;
    attackTrails: Readonly<Record<AttackTrailKind, AttackTrailFeedbackSpec>>;
    death: DeathFeedbackSpec;
    bossWarning: BossWarningFeedbackSpec;
}

export const DAMAGE_NUMBER_FEEDBACK: DamageNumberFeedbackSpec = {
    maxActive: MOBILE_PERFORMANCE_BUDGET.maxActiveDamageNumbers,
    normalColor: '#F8F1D8',
    criticalColor: '#FFD166',
    playerDamageColor: '#FF5A5F',
    lifetimeMs: 650,
    riseDistancePx: 28,
};

export const ENEMY_HEALTH_BAR_FEEDBACK: EnemyHealthBarFeedbackSpec = {
    showFor: ['normal', 'elite', 'boss'],
    hideWhenFullForNormal: true,
    showAfterDamageMs: 1800,
    eliteAlwaysVisible: true,
    bossAlwaysVisible: true,
    minVisibleHpRatio: 0.999,
};

export const ATTACK_TRAIL_FEEDBACK: Readonly<Record<AttackTrailKind, AttackTrailFeedbackSpec>> = {
    blade: {
        color: '#7DD3FC',
        durationMs: 140,
        widthPx: 4,
        fadeOutMs: 90,
    },
    chain: {
        color: '#A7F3D0',
        durationMs: 180,
        widthPx: 3,
        fadeOutMs: 110,
    },
    critical: {
        color: '#FDE047',
        durationMs: 220,
        widthPx: 5,
        fadeOutMs: 130,
    },
    boss: {
        color: '#FB7185',
        durationMs: 260,
        widthPx: 6,
        fadeOutMs: 160,
    },
};

export const DEATH_FEEDBACK: DeathFeedbackSpec = {
    normalDurationMs: 360,
    eliteDurationMs: 520,
    bossDurationMs: 900,
    vfxColor: '#E5E7EB',
    fadeScale: 1.18,
};

export const BOSS_WARNING_FEEDBACK: BossWarningFeedbackSpec = {
    enabled: true,
    preSpawnWarningMs: 1800,
    bannerDurationMs: 1400,
    pulseIntervalMs: 300,
    screenTintColor: '#7F1D1D',
    dangerRingColor: '#F43F5E',
    dangerRingDurationMs: 1200,
    bossHpBarLabel: 'BOSS',
};

export const COMBAT_FEEDBACK_SPEC: CombatFeedbackSpec = {
    damageNumbers: DAMAGE_NUMBER_FEEDBACK,
    enemyHealthBars: ENEMY_HEALTH_BAR_FEEDBACK,
    attackTrails: ATTACK_TRAIL_FEEDBACK,
    death: DEATH_FEEDBACK,
    bossWarning: BOSS_WARNING_FEEDBACK,
};
