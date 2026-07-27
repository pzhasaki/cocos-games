import type { EnemyRank } from './RunModel';

/**
 * Enemy archetypes for Mind Dungeon.
 * Pitch maps negative emotions to enemy roles; we keep legacy runtime ids
 * (chaser/tank/...) as stable config keys and add emotion-themed names.
 */
export type RuntimeEnemyType =
    | 'chaser'
    | 'tank'
    | 'dasher'
    | 'spitter'
    | 'swarm'
    | 'binder'
    | 'boss'
    | 'doubt'
    | 'anxiety'
    | 'procrastination';

export interface EnemyArchetype {
    id: RuntimeEnemyType;
    name: string;
    nameZh: string;
    emotion: string;
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
    floor: number;
    title: string;
    titleZh: string;
    goal: string;
    goalZh: string;
    enemies: WaveEnemyEntry[];
    isBoss?: boolean;
}

export const ENEMY_ARCHETYPES: Record<RuntimeEnemyType, EnemyArchetype> = {
    // Legacy keys remain for continuous spawn / AI routing.
    chaser: {
        id: 'chaser',
        name: 'Anxiety Dart',
        nameZh: '焦虑三角',
        emotion: 'Anxiety',
        rank: 'normal',
        hp: 28,
        damage: 6,
        armor: 0,
        speed: 72,
        radius: 8,
        contactCooldown: 0.78,
        xpRole: 'pressure',
    },
    tank: {
        id: 'tank',
        name: 'Perfection Statue',
        nameZh: '完美雕像',
        emotion: 'Perfectionism',
        rank: 'elite',
        hp: 110,
        damage: 9,
        armor: 12,
        speed: 28,
        radius: 14,
        contactCooldown: 1.0,
        xpRole: 'space-control',
    },
    dasher: {
        id: 'dasher',
        name: 'Anger Lance',
        nameZh: '愤怒冲锋',
        emotion: 'Anger',
        rank: 'normal',
        hp: 48,
        damage: 14,
        armor: 2,
        speed: 50,
        radius: 10,
        contactCooldown: 1.05,
        xpRole: 'burst-threat',
    },
    spitter: {
        id: 'spitter',
        name: 'Comparison Shade',
        nameZh: '攀比残影',
        emotion: 'Comparison',
        rank: 'normal',
        hp: 40,
        damage: 8,
        armor: 0,
        speed: 30,
        radius: 10,
        contactCooldown: 1.1,
        xpRole: 'ranged-threat',
    },
    swarm: {
        id: 'swarm',
        name: 'Doubt Swarm',
        nameZh: '疑虑分裂',
        emotion: 'Doubt',
        rank: 'normal',
        hp: 14,
        damage: 4,
        armor: 0,
        speed: 80,
        radius: 6,
        contactCooldown: 0.7,
        xpRole: 'pressure',
    },
    binder: {
        id: 'binder',
        name: 'Procrastination Shell',
        nameZh: '拖延时钟',
        emotion: 'Procrastination',
        rank: 'elite',
        hp: 70,
        damage: 7,
        armor: 5,
        speed: 26,
        radius: 12,
        contactCooldown: 1.2,
        xpRole: 'control-threat',
    },
    boss: {
        id: 'boss',
        name: 'Workplace Fear',
        nameZh: '职场恐惧',
        emotion: 'Workplace Anxiety',
        rank: 'boss',
        hp: 480,
        damage: 16,
        armor: 16,
        speed: 28,
        radius: 20,
        contactCooldown: 0.66,
        xpRole: 'boss',
    },
    // Explicit emotion aliases (same stats, alternate naming for content tables).
    doubt: {
        id: 'doubt',
        name: 'Doubt Orb',
        nameZh: '疑虑',
        emotion: 'Doubt',
        rank: 'normal',
        hp: 22,
        damage: 5,
        armor: 0,
        speed: 55,
        radius: 9,
        contactCooldown: 0.85,
        xpRole: 'pressure',
    },
    anxiety: {
        id: 'anxiety',
        name: 'Anxiety Spike',
        nameZh: '焦虑',
        emotion: 'Anxiety',
        rank: 'normal',
        hp: 18,
        damage: 5,
        armor: 0,
        speed: 88,
        radius: 7,
        contactCooldown: 0.65,
        xpRole: 'pressure',
    },
    procrastination: {
        id: 'procrastination',
        name: 'Delay Snail',
        nameZh: '拖延',
        emotion: 'Procrastination',
        rank: 'elite',
        hp: 85,
        damage: 6,
        armor: 8,
        speed: 22,
        radius: 13,
        contactCooldown: 1.3,
        xpRole: 'control-threat',
    },
};

/**
 * Floor 1 — Workplace Anxiety (pitch ~90s layer).
 * Waves 1-4 build pressure; wave 5 is Workplace Fear boss.
 * Later floors reuse scaling until full 4-floor content lands.
 */
export const EARLY_WAVE_PLANS: WavePlan[] = [
    {
        wave: 1,
        floor: 1,
        title: 'First Intrusion',
        titleZh: '初入深渊',
        goal: 'Learn move + auto-attack. Clear anxiety darts.',
        goalZh: '学会移动与自动攻击，清理焦虑实体。',
        enemies: [
            { type: 'anxiety', count: 3 },
            { type: 'chaser', count: 2 },
        ],
    },
    {
        wave: 2,
        floor: 1,
        title: 'Deadline Pressure',
        titleZh: '截止日期',
        goal: 'Kite a perfection statue while clearing darts.',
        goalZh: '拉扯完美雕像，同时清理小怪。',
        enemies: [
            { type: 'chaser', count: 4 },
            { type: 'tank', count: 1 },
            { type: 'anxiety', count: 2 },
        ],
    },
    {
        wave: 3,
        floor: 1,
        title: 'Meeting Swarm',
        titleZh: '会议虫潮',
        goal: 'Feel density — doubt orbs split your attention.',
        goalZh: '感受密度压力，疑虑实体分散注意力。',
        enemies: [
            { type: 'chaser', count: 3 },
            { type: 'swarm', count: 6 },
            { type: 'doubt', count: 3 },
        ],
    },
    {
        wave: 4,
        floor: 1,
        title: 'Anger Spike',
        titleZh: '愤怒突刺',
        goal: 'Read dash telegraphs from anger lances.',
        goalZh: '读懂愤怒冲锋的预警。',
        enemies: [
            { type: 'chaser', count: 4 },
            { type: 'dasher', count: 2 },
            { type: 'procrastination', count: 1 },
        ],
    },
    {
        wave: 5,
        floor: 1,
        title: 'Workplace Fear',
        titleZh: '职场恐惧',
        goal: 'Floor 1 boss — file-storm pressure + adds.',
        goalZh: '第一层 BOSS：文件风暴 + 杂兵。',
        isBoss: true,
        enemies: [
            { type: 'boss', count: 1 },
            { type: 'chaser', count: 4 },
            { type: 'swarm', count: 4 },
            { type: 'anxiety', count: 2 },
        ],
    },
    {
        wave: 6,
        floor: 2,
        title: 'Social Static',
        titleZh: '社交噪声',
        goal: 'Floor 2 opens — ranged comparison shades.',
        goalZh: '第二层开启：攀比残影远程压力。',
        enemies: [
            { type: 'chaser', count: 5 },
            { type: 'spitter', count: 2 },
            { type: 'swarm', count: 4 },
        ],
    },
    {
        wave: 7,
        floor: 2,
        title: 'Heavy Judgment',
        titleZh: '沉重评判',
        goal: 'Break tank + swarm pressure with your build.',
        goalZh: '用构筑打破重甲与虫潮。',
        enemies: [
            { type: 'tank', count: 2 },
            { type: 'chaser', count: 5 },
            { type: 'swarm', count: 6 },
        ],
    },
    {
        wave: 8,
        floor: 2,
        title: 'Delay Field',
        titleZh: '拖延力场',
        goal: 'Escape procrastination slow zones.',
        goalZh: '逃离拖延减速区域。',
        enemies: [
            { type: 'binder', count: 1 },
            { type: 'procrastination', count: 1 },
            { type: 'chaser', count: 5 },
            { type: 'dasher', count: 2 },
        ],
    },
    {
        wave: 9,
        floor: 2,
        title: 'Mixed Inner Noise',
        titleZh: '混杂内耗',
        goal: 'Prioritize ranged and control threats.',
        goalZh: '优先处理远程与控制威胁。',
        enemies: [
            { type: 'spitter', count: 2 },
            { type: 'binder', count: 1 },
            { type: 'swarm', count: 8 },
            { type: 'dasher', count: 2 },
        ],
    },
    {
        wave: 10,
        floor: 2,
        title: 'Social Judgment',
        titleZh: '社交审判',
        goal: 'Floor 2 boss check with control support.',
        goalZh: '第二层 BOSS 检验。',
        isBoss: true,
        enemies: [
            { type: 'boss', count: 1 },
            { type: 'binder', count: 1 },
            { type: 'spitter', count: 2 },
            { type: 'chaser', count: 6 },
        ],
    },
    // —— Floor 3 · Self Judgment / Attachment ——
    {
        wave: 11,
        floor: 3,
        title: 'Mirror Fragments',
        titleZh: '镜中碎片',
        goal: 'Floor 3 opens — self-doubt tanks and anxiety darts.',
        goalZh: '第三层开启：自我审判坦克与焦虑箭雨。',
        enemies: [
            { type: 'tank', count: 2 },
            { type: 'doubt', count: 4 },
            { type: 'chaser', count: 5 },
            { type: 'anxiety', count: 4 },
        ],
    },
    {
        wave: 12,
        floor: 3,
        title: 'Shame Swarm',
        titleZh: '羞耻虫潮',
        goal: 'Dense swarm plus comparison shades from the edge.',
        goalZh: '高密度虫潮 + 边缘攀比残影。',
        enemies: [
            { type: 'swarm', count: 10 },
            { type: 'spitter', count: 3 },
            { type: 'anxiety', count: 4 },
            { type: 'chaser', count: 4 },
        ],
    },
    {
        wave: 13,
        floor: 3,
        title: 'Attachment Pull',
        titleZh: '依恋牵引',
        goal: 'Binders and delay shells force you into kill boxes.',
        goalZh: '绑定壳与拖延力场把你拉进击杀区。',
        enemies: [
            { type: 'binder', count: 2 },
            { type: 'procrastination', count: 2 },
            { type: 'chaser', count: 6 },
            { type: 'dasher', count: 2 },
        ],
    },
    {
        wave: 14,
        floor: 3,
        title: 'Inner Critic',
        titleZh: '内在批评者',
        goal: 'Mixed self-judgment pressure before the floor boss.',
        goalZh: 'Boss 前的混合自我审判压力。',
        enemies: [
            { type: 'tank', count: 2 },
            { type: 'spitter', count: 2 },
            { type: 'dasher', count: 3 },
            { type: 'swarm', count: 8 },
            { type: 'doubt', count: 3 },
        ],
    },
    {
        wave: 15,
        floor: 3,
        title: 'Attachment Void',
        titleZh: '依恋虚空',
        goal: 'Floor 3 boss — spiral void pressure + control adds.',
        goalZh: '第三层 BOSS：螺旋虚空 + 控制杂兵。',
        isBoss: true,
        enemies: [
            { type: 'boss', count: 1 },
            { type: 'binder', count: 2 },
            { type: 'spitter', count: 2 },
            { type: 'swarm', count: 6 },
            { type: 'anxiety', count: 3 },
        ],
    },
    // —— Floor 4 · Existential Crisis ——
    {
        wave: 16,
        floor: 4,
        title: 'Void Edge',
        titleZh: '虚空边缘',
        goal: 'Floor 4 opens — dash + range from all sides.',
        goalZh: '第四层开启：四面冲锋与远程。',
        enemies: [
            { type: 'dasher', count: 4 },
            { type: 'spitter', count: 3 },
            { type: 'chaser', count: 6 },
            { type: 'anxiety', count: 4 },
        ],
    },
    {
        wave: 17,
        floor: 4,
        title: 'Meaning Collapse',
        titleZh: '意义崩塌',
        goal: 'Heavy armor and binders collapse safe space.',
        goalZh: '重甲与绑定压缩安全空间。',
        enemies: [
            { type: 'tank', count: 3 },
            { type: 'binder', count: 2 },
            { type: 'swarm', count: 10 },
            { type: 'procrastination', count: 1 },
        ],
    },
    {
        wave: 18,
        floor: 4,
        title: 'Final Noise',
        titleZh: '最终噪声',
        goal: 'Full emotional orchestra — prioritize threats.',
        goalZh: '全情绪合奏，优先处理高威胁。',
        enemies: [
            { type: 'spitter', count: 3 },
            { type: 'dasher', count: 3 },
            { type: 'binder', count: 1 },
            { type: 'chaser', count: 6 },
            { type: 'swarm', count: 8 },
            { type: 'doubt', count: 4 },
        ],
    },
    {
        wave: 19,
        floor: 4,
        title: 'Before the Abyss',
        titleZh: '深渊之前',
        goal: 'Elite gauntlet before Self Abyss.',
        goalZh: '自我深渊前的精英试炼。',
        enemies: [
            { type: 'tank', count: 2 },
            { type: 'binder', count: 2 },
            { type: 'dasher', count: 4 },
            { type: 'spitter', count: 3 },
            { type: 'procrastination', count: 2 },
            { type: 'swarm', count: 6 },
        ],
    },
    {
        wave: 20,
        floor: 4,
        title: 'Self Abyss',
        titleZh: '自我深渊',
        goal: 'Floor 4 final boss — cross-storm existential pressure.',
        goalZh: '第四层最终 BOSS：十字风暴存在危机。',
        isBoss: true,
        enemies: [
            { type: 'boss', count: 1 },
            { type: 'tank', count: 2 },
            { type: 'binder', count: 2 },
            { type: 'spitter', count: 3 },
            { type: 'dasher', count: 2 },
            { type: 'swarm', count: 6 },
        ],
    },
];

export function getWavePlan(wave: number): WavePlan {
    const early = EARLY_WAVE_PLANS.find((plan) => plan.wave === wave);
    if (early) return early;

    // Beyond handwritten 1-20: soft scale using floor themes (loops after 20).
    const bossWave = wave % 5 === 0;
    const floor = Math.min(4, 1 + Math.floor(((wave - 1) % 20) / 5));
    const pressureCount = Math.min(22, 8 + Math.floor(wave * 0.7));
    const enemies: WaveEnemyEntry[] = bossWave
        ? [
            { type: 'boss', count: 1 },
            { type: 'chaser', count: Math.max(5, Math.floor(pressureCount * 0.5)) },
            { type: 'swarm', count: Math.max(4, Math.floor(pressureCount * 0.35)) },
            { type: 'dasher', count: 1 + Math.floor(wave / 8) },
            { type: 'spitter', count: 1 + Math.floor(wave / 12) },
            { type: 'binder', count: wave >= 10 ? 1 + Math.floor(wave / 20) : 0 },
            { type: 'tank', count: floor >= 3 ? 1 : 0 },
        ]
        : [
            { type: 'chaser', count: Math.max(4, Math.floor(pressureCount * 0.5)) },
            { type: 'swarm', count: Math.max(3, Math.floor(pressureCount * 0.3)) },
            { type: floor >= 2 ? 'spitter' : 'tank', count: 1 + Math.floor(wave / 7) },
            { type: 'dasher', count: wave >= 6 ? 1 + Math.floor(wave / 8) : 0 },
            { type: 'binder', count: wave >= 8 ? 1 + Math.floor(wave / 14) : 0 },
            { type: 'anxiety', count: 2 + Math.floor(wave / 10) },
            { type: 'tank', count: floor >= 3 ? 1 + Math.floor(wave / 15) : 0 },
            { type: 'procrastination', count: floor >= 3 ? 1 : 0 },
        ];

    const floorTheme = getFloorTheme(floor);
    return {
        wave,
        floor,
        title: bossWave ? `${floorTheme.en} Guardian` : `${floorTheme.en} Depth ${wave}`,
        titleZh: bossWave ? `${floorTheme.zh} 守卫` : `${floorTheme.zh} 第 ${wave} 波`,
        goal: bossWave ? 'Survive boss pressure and emotional adds.' : 'Scale pressure with mixed mind entities.',
        goalZh: bossWave ? '在 BOSS 与情绪杂兵中存活。' : '在混合心魔压力中构筑成长。',
        isBoss: bossWave,
        enemies: enemies.filter((entry) => entry.count > 0),
    };
}

export function getFloorTheme(floor: number): { en: string; zh: string } {
    switch (floor) {
        case 1:
            return { en: 'Workplace Anxiety', zh: '职场焦虑' };
        case 2:
            return { en: 'Social Anxiety', zh: '社交焦虑' };
        case 3:
            return { en: 'Self Judgment', zh: '自我审判' };
        case 4:
            return { en: 'Existential Crisis', zh: '存在危机' };
        default:
            return { en: 'Mind Dungeon', zh: '意识深渊' };
    }
}
