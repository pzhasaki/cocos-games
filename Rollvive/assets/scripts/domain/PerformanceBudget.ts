export interface RuntimePerformanceBudget {
    targetFps: number;
    maxActiveEnemies: number;
    maxActiveProjectiles: number;
    maxActiveDamageNumbers: number;
    maxActiveVfx: number;
    maxUiRefreshHz: number;
    fixedSimulationStepMs: number;
    enemyAiTickMs: number;
    cleanupIntervalMs: number;
}

export const MOBILE_PERFORMANCE_BUDGET: RuntimePerformanceBudget = {
    targetFps: 60,
    maxActiveEnemies: 36,
    maxActiveProjectiles: 80,
    maxActiveDamageNumbers: 18,
    maxActiveVfx: 24,
    maxUiRefreshHz: 10,
    fixedSimulationStepMs: 33,
    enemyAiTickMs: 100,
    cleanupIntervalMs: 500,
};

export function clampToBudget(value: number, max: number): number {
    return Math.max(0, Math.min(Math.floor(value), max));
}
