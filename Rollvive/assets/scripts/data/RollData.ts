/**
 * Mind Dungeon content data — MBTI personality roguelite.
 * Source: 16 Personalities: Mind Dungeon pitch (M1 prototype slice).
 */

export type Rarity = 'white' | 'blue' | 'purple' | 'orange';
/** @deprecated prefer Rarity; kept for older call sites */
export type LegacyRarity = Rarity | 'gold';

export type ProfessionId =
    | 'intj' | 'intp' | 'entj' | 'entp'
    | 'infj' | 'infp' | 'enfj' | 'enfp'
    | 'istj' | 'isfj' | 'estj' | 'esfj'
    | 'istp' | 'isfp' | 'estp' | 'esfp';

export type MbtiAxis = 'EI' | 'SN' | 'TF' | 'JP';
export type MbtiTrait = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
export type PersonalityGroup = 'NT' | 'NF' | 'SJ' | 'SP';
export type WeaponStyleId = 'blade' | 'spear' | 'gun' | 'orb';
export type UltimateId =
    | 'time_dilation'
    | 'chain_bomb'
    | 'elite_mark'
    | 'mind_convert'
    | 'screen_mark'
    | 'phoenix_form'
    | 'aura_command'
    | 'element_sprites'
    | 'deploy_turret'
    | 'heal_sanctuary'
    | 'summon_guards'
    | 'full_restore'
    | 'perfect_parry'
    | 'element_spread'
    | 'berserk_surge'
    | 'taunt_shockwave';

export type HexCategory = 'stat' | 'blade' | 'mobility' | 'economy' | 'risk' | 'element' | 'legendary';

export interface CombatBonus {
    maxHp?: number;
    armor?: number;
    dodge?: number;
    luck?: number;
    moveSpeed?: number;
    damage?: number;
    damagePercent?: number;
    attackRange?: number;
    attackCooldown?: number;
    energyPerAttack?: number;
    ultimateMultiplier?: number;
    shieldReduction?: number;
    bladeCount?: number;
    orbitBladeCount?: number;
    chainHits?: number;
    splitBlades?: number;
    fanAngle?: number;
    critChance?: number;
    critMultiplier?: number;
    lifesteal?: number;
    executeBonus?: number;
    bossDamageBonus?: number;
}

export interface ProfessionData {
    id: ProfessionId;
    code: string;
    name: string;
    nameZh: string;
    title: string;
    titleZh: string;
    description: string;
    descriptionZh: string;
    group: PersonalityGroup;
    traits: readonly [MbtiTrait, MbtiTrait, MbtiTrait, MbtiTrait];
    weaponStyle: WeaponStyleId;
    combatStyle: string;
    combatStyleZh: string;
    baseAtk: number;
    baseHp: number;
    baseSpd: number;
    bonus: CombatBonus;
    ultimateId: UltimateId;
    ultimateName: string;
    ultimateNameZh: string;
    ultimateDescription: string;
    ultimateDescriptionZh: string;
    ultimateDuration: number;
    ultimateEnergyCost: number;
}

export interface HexFlags {
    colorBias: number;
    extraChoice: number;
    freeRefreshBonus: number;
    lockedSkillSlots: number;
}

export interface HexCardData {
    id: string;
    name: string;
    nameZh?: string;
    rarity: Rarity;
    category: HexCategory;
    description: string;
    descriptionZh?: string;
    repeatable?: boolean;
    bonus?: CombatBonus;
    flags?: Partial<HexFlags>;
    /** Marks a skill as lockable by J-type passive */
    lockable?: boolean;
    /**
     * Exclusive signature card for one MBTI hero.
     * Still appears in the shared pool, but draft weight is heavily biased
     * toward the matching profession (and slightly reduced for others).
     */
    exclusiveTo?: ProfessionId;
}

export interface HexChoiceView {
    data: HexCardData;
    alreadyPicked: boolean;
    locked?: boolean;
}

export interface HexViewModel {
    wave: number;
    freeRefreshesRemaining: number;
    rewardedAdRefreshAvailable: boolean;
    rewardedAdRefreshPending: boolean;
    profession: ProfessionData;
    choices: HexChoiceView[];
    picked: HexCardData[];
}

export interface DimensionPassiveSpec {
    trait: MbtiTrait;
    axis: MbtiAxis;
    name: string;
    nameZh: string;
    description: string;
    descriptionZh: string;
}

/** 8 dimension passives from the pitch (4 axes × 2 poles). */
export const DIMENSION_PASSIVES: Readonly<Record<MbtiTrait, DimensionPassiveSpec>> = {
    E: {
        trait: 'E',
        axis: 'EI',
        name: 'Extrovert Charge',
        nameZh: '外倾充能',
        description: 'Each kill stacks +4% ATK (max 15).',
        descriptionZh: '击杀叠攻，最多 15 层。',
    },
    I: {
        trait: 'I',
        axis: 'EI',
        name: 'Introvert Focus',
        nameZh: '内倾专注',
        description: '+25% damage while fighting alone.',
        descriptionZh: '3m 内无敌方时 +25% 伤害。',
    },
    S: {
        trait: 'S',
        axis: 'SN',
        name: 'Sensing Crit',
        nameZh: '实感暴击',
        description: '25% crit chance for 200% damage.',
        descriptionZh: '25% 暴击，暴击伤害 200%。',
    },
    N: {
        trait: 'N',
        axis: 'SN',
        name: 'Intuition Veil',
        nameZh: '直觉闪避',
        description: '+15% dodge; after dodge next hit +40%.',
        descriptionZh: '15% 闪避，闪避后下一击 +40%。',
    },
    T: {
        trait: 'T',
        axis: 'TF',
        name: 'Thinking Execute',
        nameZh: '思考斩杀',
        description: 'When HP < 35%, deal +60% damage.',
        descriptionZh: 'HP < 35% 时伤害 +60%。',
    },
    F: {
        trait: 'F',
        axis: 'TF',
        name: 'Feeling Recovery',
        nameZh: '情感回血',
        description: 'Every 8 kills heal 12% max HP.',
        descriptionZh: '每 8 击杀回血 12% HP。',
    },
    J: {
        trait: 'J',
        axis: 'JP',
        name: 'Judging Lock',
        nameZh: '判断锁定',
        description: 'Lock 1 skill for +30% damage.',
        descriptionZh: '锁定 1 个技能，该技能 +30% 伤害。',
    },
    P: {
        trait: 'P',
        axis: 'JP',
        name: 'Perceiving Draft',
        nameZh: '知觉刷新',
        description: 'Drafts show 4 choices and +1 free refresh.',
        descriptionZh: '升级 4 选 1，并 +1 次免费刷新。',
    },
};

export const DEFAULT_FLAGS: HexFlags = {
    colorBias: 0,
    extraChoice: 0,
    freeRefreshBonus: 0,
    lockedSkillSlots: 0,
};

const base = (
    partial: Omit<ProfessionData, 'ultimateEnergyCost'> & { ultimateEnergyCost?: number },
): ProfessionData => ({
    ultimateEnergyCost: 100,
    ...partial,
});

/** All 16 MBTI heroes. Base ATK/HP/SPD roughly 80-115 as pitch. */
export const PROFESSIONS: ProfessionData[] = [
    base({
        id: 'intj', code: 'INTJ', name: 'Architect', nameZh: '建筑师',
        title: 'Time Sniper', titleZh: '狙击炮台',
        description: 'Keep distance, slow time, and delete elites.',
        descriptionZh: '保持距离，时间减速后爆发点杀。',
        group: 'NT', traits: ['I', 'N', 'T', 'J'], weaponStyle: 'gun',
        combatStyle: 'Sniper turret', combatStyleZh: '狙击炮台',
        baseAtk: 110, baseHp: 90, baseSpd: 95,
        bonus: { damage: 8, attackRange: 55, attackCooldown: -0.05, dodge: 0.05, bladeCount: 1 },
        ultimateId: 'time_dilation', ultimateName: 'Time Dilation', ultimateNameZh: '时间减速',
        ultimateDescription: 'Slow enemies 70% and deal x2.5 damage for 5s.',
        ultimateDescriptionZh: '时间减速 70%，伤害 ×250%，持续 5 秒。',
        ultimateDuration: 5,
    }),
    base({
        id: 'intp', code: 'INTP', name: 'Logician', nameZh: '逻辑学家',
        title: 'Chain Detonator', titleZh: '风筝引爆',
        description: 'Kite packs and chain-detonate them.',
        descriptionZh: '风筝拉怪，连锁炸弹清场。',
        group: 'NT', traits: ['I', 'N', 'T', 'P'], weaponStyle: 'orb',
        combatStyle: 'Kite detonate', combatStyleZh: '风筝引爆',
        baseAtk: 100, baseHp: 85, baseSpd: 105,
        bonus: { damage: 4, attackRange: 35, chainHits: 1, dodge: 0.08, bladeCount: 1 },
        ultimateId: 'chain_bomb', ultimateName: 'Chain Bomb', ultimateNameZh: '连锁炸弹',
        ultimateDescription: 'Detonate a bomb for 800% ATK that chains 3 times.',
        ultimateDescriptionZh: '连锁炸弹 800% ATK，链 3 次。',
        ultimateDuration: 0.8,
    }),
    base({
        id: 'entj', code: 'ENTJ', name: 'Commander', nameZh: '指挥官',
        title: 'Elite Hunter', titleZh: '精英猎手',
        description: 'Mark elites for massive XP and kill rewards.',
        descriptionZh: '标记精英，猎杀获得暴量成长。',
        group: 'NT', traits: ['E', 'N', 'T', 'J'], weaponStyle: 'gun',
        combatStyle: 'Elite hunter', combatStyleZh: '精英猎手',
        baseAtk: 108, baseHp: 100, baseSpd: 100,
        bonus: { damage: 6, maxHp: 8, attackRange: 40, bladeCount: 1 },
        ultimateId: 'elite_mark', ultimateName: 'Command Mark', ultimateNameZh: '猎杀标记',
        ultimateDescription: 'Marked kills grant 3x XP for 8s.',
        ultimateDescriptionZh: '标记击杀 = 3 倍 EXP，持续 8 秒。',
        ultimateDuration: 8,
    }),
    base({
        id: 'entp', code: 'ENTP', name: 'Debater', nameZh: '辩论家',
        title: 'Turncoat', titleZh: '以敌制敌',
        description: 'Convert enemies and fight with chaos.',
        descriptionZh: '转化敌人，以敌制敌。',
        group: 'NT', traits: ['E', 'N', 'T', 'P'], weaponStyle: 'orb',
        combatStyle: 'Enemy convert', combatStyleZh: '以敌制敌',
        baseAtk: 95, baseHp: 88, baseSpd: 112,
        bonus: { damage: 3, moveSpeed: 0.08, luck: 2, chainHits: 1, bladeCount: 1 },
        ultimateId: 'mind_convert', ultimateName: 'Mind Convert', ultimateNameZh: '意识转化',
        ultimateDescription: 'Stun and weaken 40% of living enemies for 8s.',
        ultimateDescriptionZh: '转化/削弱 40% 敌人，持续 8 秒。',
        ultimateDuration: 8,
    }),
    base({
        id: 'infj', code: 'INFJ', name: 'Advocate', nameZh: '提倡者',
        title: 'Wave Clearer', titleZh: '一波清场',
        description: 'Mark the whole screen, then pierce through.',
        descriptionZh: '全屏标记后穿透清场。',
        group: 'NF', traits: ['I', 'N', 'F', 'J'], weaponStyle: 'gun',
        combatStyle: 'Wave clear', combatStyleZh: '一波清场',
        baseAtk: 102, baseHp: 95, baseSpd: 98,
        bonus: { damage: 5, attackRange: 45, chainHits: 1, bladeCount: 1 },
        ultimateId: 'screen_mark', ultimateName: 'Fate Mark', ultimateNameZh: '命运标记',
        ultimateDescription: 'Mark all enemies 6s; first hit each deals x3.',
        ultimateDescriptionZh: '全屏标记 6 秒，首击 ×300% 穿透。',
        ultimateDuration: 6,
    }),
    base({
        id: 'infp', code: 'INFP', name: 'Mediator', nameZh: '调停者',
        title: 'Comeback Form', titleZh: '苟活翻盘',
        description: 'Survive long enough, then flip the fight.',
        descriptionZh: '苟活后变身翻盘。',
        group: 'NF', traits: ['I', 'N', 'F', 'P'], weaponStyle: 'blade',
        combatStyle: 'Comeback', combatStyleZh: '苟活翻盘',
        baseAtk: 90, baseHp: 110, baseSpd: 100,
        bonus: { maxHp: 18, dodge: 0.06, damage: 2, bladeCount: 2, fanAngle: 18 },
        ultimateId: 'phoenix_form', ultimateName: 'Phoenix Form', ultimateNameZh: '凤凰形态',
        ultimateDescription: 'Invulnerable +150% ATK for 8s.',
        ultimateDescriptionZh: '变身无敌 +150% ATK，持续 8 秒。',
        ultimateDuration: 8,
    }),
    base({
        id: 'enfj', code: 'ENFJ', name: 'Protagonist', nameZh: '主人公',
        title: 'Support Warrior', titleZh: '辅助战士',
        description: 'Weaken packs while amplifying your strikes.',
        descriptionZh: '削弱敌人并强化自身输出。',
        group: 'NF', traits: ['E', 'N', 'F', 'J'], weaponStyle: 'spear',
        combatStyle: 'Support warrior', combatStyleZh: '辅助战士',
        baseAtk: 98, baseHp: 105, baseSpd: 100,
        bonus: { maxHp: 12, damage: 4, attackRange: 20, bladeCount: 1, fanAngle: 16 },
        ultimateId: 'aura_command', ultimateName: 'Aura Command', ultimateNameZh: '气场统御',
        ultimateDescription: 'Enemies deal -60% damage; you gain +80% ATK for 10s.',
        ultimateDescriptionZh: '敌 -60% 伤，自身 +80% ATK，持续 10 秒。',
        ultimateDuration: 10,
    }),
    base({
        id: 'enfp', code: 'ENFP', name: 'Campaigner', nameZh: '竞选者',
        title: 'Summon Runner', titleZh: '召唤跑酷',
        description: 'Dash around while sprites chase for you.',
        descriptionZh: '召唤精灵自动追击，你负责跑位。',
        group: 'NF', traits: ['E', 'N', 'F', 'P'], weaponStyle: 'orb',
        combatStyle: 'Summon parkour', combatStyleZh: '召唤跑酷',
        baseAtk: 92, baseHp: 92, baseSpd: 115,
        bonus: { moveSpeed: 0.12, dodge: 0.05, attackRange: 25, chainHits: 1, bladeCount: 1 },
        ultimateId: 'element_sprites', ultimateName: 'Element Sprites', ultimateNameZh: '元素精灵',
        ultimateDescription: 'Summon 5 auto-chasing elemental sprites for 8s.',
        ultimateDescriptionZh: '召唤 5 个元素精灵自动追击，持续 8 秒。',
        ultimateDuration: 8,
    }),
    base({
        id: 'istj', code: 'ISTJ', name: 'Logistician', nameZh: '物流师',
        title: 'Fortress', titleZh: '阵地防守',
        description: 'Hold ground with turrets and armor.',
        descriptionZh: '部署炮塔，阵地防守。',
        group: 'SJ', traits: ['I', 'S', 'T', 'J'], weaponStyle: 'spear',
        combatStyle: 'Fortress defense', combatStyleZh: '阵地防守',
        baseAtk: 100, baseHp: 115, baseSpd: 85,
        bonus: { maxHp: 20, armor: 6, damage: 4, attackCooldown: 0.05, bladeCount: 1, fanAngle: 14 },
        ultimateId: 'deploy_turret', ultimateName: 'Deploy Turret', ultimateNameZh: '部署炮塔',
        ultimateDescription: 'Deploy a turret dealing 120% ATK (max 2).',
        ultimateDescriptionZh: '部署炮塔 120% ATK（最多 2 个）。',
        ultimateDuration: 12,
    }),
    base({
        id: 'isfj', code: 'ISFJ', name: 'Defender', nameZh: '守卫者',
        title: 'Immortal Tank', titleZh: '不死坦克',
        description: 'Soak damage inside a healing sanctuary.',
        descriptionZh: '治疗领域内减伤硬抗。',
        group: 'SJ', traits: ['I', 'S', 'F', 'J'], weaponStyle: 'blade',
        combatStyle: 'Immortal tank', combatStyleZh: '不死坦克',
        baseAtk: 88, baseHp: 120, baseSpd: 88,
        bonus: { maxHp: 28, armor: 8, shieldReduction: 0.08, bladeCount: 2, fanAngle: 20 },
        ultimateId: 'heal_sanctuary', ultimateName: 'Heal Sanctuary', ultimateNameZh: '治疗领域',
        ultimateDescription: 'Heal 8% HP/s and take 50% less damage for 8s.',
        ultimateDescriptionZh: '治疗领域 8% HP/s + 减伤 50%，持续 8 秒。',
        ultimateDuration: 8,
    }),
    base({
        id: 'estj', code: 'ESTJ', name: 'Executive', nameZh: '总经理',
        title: 'Swarm Tactics', titleZh: '人海战术',
        description: 'Overwhelm with guards and steady fire.',
        descriptionZh: '召唤守卫，人海压制。',
        group: 'SJ', traits: ['E', 'S', 'T', 'J'], weaponStyle: 'gun',
        combatStyle: 'Swarm tactics', combatStyleZh: '人海战术',
        baseAtk: 105, baseHp: 108, baseSpd: 95,
        bonus: { maxHp: 14, damage: 5, attackRange: 30, bladeCount: 1 },
        ultimateId: 'summon_guards', ultimateName: 'Summon Guards', ultimateNameZh: '召唤守卫',
        ultimateDescription: 'Summon 4 guards dealing 80% ATK for 10s.',
        ultimateDescriptionZh: '召唤 4 守卫 80% ATK，持续 10 秒。',
        ultimateDuration: 10,
    }),
    base({
        id: 'esfj', code: 'ESFJ', name: 'Consul', nameZh: '执政官',
        title: 'Field Medic', titleZh: '不死奶妈',
        description: 'Full restore and amp your next push.',
        descriptionZh: '满血回复并大幅强化输出。',
        group: 'SJ', traits: ['E', 'S', 'F', 'J'], weaponStyle: 'orb',
        combatStyle: 'Field medic', combatStyleZh: '不死奶妈',
        baseAtk: 90, baseHp: 118, baseSpd: 98,
        bonus: { maxHp: 24, armor: 4, energyPerAttack: 6, bladeCount: 1 },
        ultimateId: 'full_restore', ultimateName: 'Full Restore', ultimateNameZh: '全队鼓舞',
        ultimateDescription: 'Fully heal and gain +80% ATK for 8s.',
        ultimateDescriptionZh: '满血 + 自身 +80% ATK，持续 8 秒。',
        ultimateDuration: 8,
    }),
    base({
        id: 'istp', code: 'ISTP', name: 'Virtuoso', nameZh: '鉴赏家',
        title: 'Parry Counter', titleZh: '高风险反杀',
        description: 'Block everything, then counter hard.',
        descriptionZh: '格挡后高倍率反击。',
        group: 'SP', traits: ['I', 'S', 'T', 'P'], weaponStyle: 'blade',
        combatStyle: 'High-risk counter', combatStyleZh: '高风险反杀',
        baseAtk: 108, baseHp: 95, baseSpd: 108,
        bonus: { damage: 7, dodge: 0.04, moveSpeed: 0.06, bladeCount: 2, fanAngle: 24 },
        ultimateId: 'perfect_parry', ultimateName: 'Perfect Parry', ultimateNameZh: '完美格挡',
        ultimateDescription: 'Block all damage 5s, then counter for x3.',
        ultimateDescriptionZh: '格挡全伤 5 秒，反击 ×300%。',
        ultimateDuration: 5,
    }),
    base({
        id: 'isfp', code: 'ISFP', name: 'Adventurer', nameZh: '探险家',
        title: 'Element Spread', titleZh: '灵活霰弹',
        description: 'Flexible multi-direction elemental blasts.',
        descriptionZh: '十二方向元素箭，灵活霰弹。',
        group: 'SP', traits: ['I', 'S', 'F', 'P'], weaponStyle: 'spear',
        combatStyle: 'Flexible shotgun', combatStyleZh: '灵活霰弹',
        baseAtk: 100, baseHp: 100, baseSpd: 110,
        bonus: { damage: 5, moveSpeed: 0.08, fanAngle: 22, splitBlades: 1, bladeCount: 1 },
        ultimateId: 'element_spread', ultimateName: 'Element Spread', ultimateNameZh: '元素霰弹',
        ultimateDescription: 'Fire 12 elemental arrows for 200% ATK each.',
        ultimateDescriptionZh: '12 方向元素箭 ×200% ATK。',
        ultimateDuration: 0.6,
    }),
    base({
        id: 'estp', code: 'ESTP', name: 'Entrepreneur', nameZh: '企业家',
        title: 'Berserker', titleZh: '狂暴战士',
        description: 'Close the gap and melt everything.',
        descriptionZh: '攻速移速狂暴，近身碾压。',
        group: 'SP', traits: ['E', 'S', 'T', 'P'], weaponStyle: 'blade',
        combatStyle: 'Berserker', combatStyleZh: '狂暴战士',
        baseAtk: 112, baseHp: 95, baseSpd: 112,
        bonus: { damage: 8, attackCooldown: -0.08, moveSpeed: 0.1, bladeCount: 2, fanAngle: 26 },
        ultimateId: 'berserk_surge', ultimateName: 'Berserk Surge', ultimateNameZh: '狂暴冲击',
        ultimateDescription: 'Attack speed +200% and move speed +60% for 6s.',
        ultimateDescriptionZh: '攻速 +200% + 移速 +60%，持续 6 秒。',
        ultimateDuration: 6,
    }),
    base({
        id: 'esfp', code: 'ESFP', name: 'Entertainer', nameZh: '表演者',
        title: 'Crowd Closer', titleZh: '聚怪一波',
        description: 'Taunt the swarm, then detonate the stage.',
        descriptionZh: '全屏嘲讽后冲击波一波清。',
        group: 'SP', traits: ['E', 'S', 'F', 'P'], weaponStyle: 'spear',
        combatStyle: 'Gather and smash', combatStyleZh: '聚怪一波',
        baseAtk: 105, baseHp: 102, baseSpd: 108,
        bonus: { damage: 6, maxHp: 10, moveSpeed: 0.06, fanAngle: 20, bladeCount: 1 },
        ultimateId: 'taunt_shockwave', ultimateName: 'Stage Shockwave', ultimateNameZh: '舞台冲击波',
        ultimateDescription: 'Taunt all enemies then deal 400% ATK shockwave.',
        ultimateDescriptionZh: '全屏嘲讽 + 400% ATK 冲击波。',
        ultimateDuration: 1.2,
    }),
];

/** Draft rarity weights (pitch: white 45 / blue 30 / purple 18 / orange 7). */
export const RARITY_WEIGHT: Record<Rarity, number> = {
    white: 45,
    blue: 30,
    purple: 18,
    orange: 7,
};

/**
 * Skill pool — pitch target 72 skills (M1 core 48 + M4 expansion 24).
 */
export const HEX_CARDS: HexCardData[] = [
    // —— White / Common ——
    { id: 'atk_up', name: 'Attack Up', nameZh: '攻击强化', rarity: 'white', category: 'stat', repeatable: true, lockable: true, description: '+10% damage.', descriptionZh: '伤害 +10%。', bonus: { damagePercent: 0.1 } },
    { id: 'hp_up', name: 'Vitality', nameZh: '生命强化', rarity: 'white', category: 'stat', repeatable: true, description: '+10% max HP.', descriptionZh: '最大生命 +10%。', bonus: { maxHp: 12 } },
    { id: 'spd_up', name: 'Swift Feet', nameZh: '迅捷步伐', rarity: 'white', category: 'mobility', repeatable: true, description: '+8% move speed.', descriptionZh: '移速 +8%。', bonus: { moveSpeed: 0.08 } },
    { id: 'range_up', name: 'Long Reach', nameZh: '延展射程', rarity: 'white', category: 'stat', repeatable: true, lockable: true, description: '+20 attack range.', descriptionZh: '攻击范围 +20。', bonus: { attackRange: 20 } },
    { id: 'armor_up', name: 'Light Armor', nameZh: '轻甲', rarity: 'white', category: 'stat', repeatable: true, description: '+3 armor and +6 HP.', descriptionZh: '护甲 +3，生命 +6。', bonus: { armor: 3, maxHp: 6 } },
    { id: 'burn_touch', name: 'Burn Touch', nameZh: '灼烧', rarity: 'white', category: 'element', repeatable: true, lockable: true, description: '+8 base damage (burn edge).', descriptionZh: '基础伤害 +8（灼烧）。', bonus: { damage: 8 } },
    { id: 'slow_edge', name: 'Chill Edge', nameZh: '减速', rarity: 'white', category: 'element', repeatable: true, description: '+6% dodge while kiting.', descriptionZh: '风筝时闪避 +6%。', bonus: { dodge: 0.06 } },
    { id: 'poison_tip', name: 'Poison Tip', nameZh: '中毒', rarity: 'white', category: 'element', repeatable: true, lockable: true, description: '+6 damage and slight lifesteal.', descriptionZh: '伤害 +6，微量吸血。', bonus: { damage: 6, lifesteal: 0.02 } },
    { id: 'extra_slash', name: 'Extra Slash', nameZh: '额外斩击', rarity: 'white', category: 'blade', repeatable: true, lockable: true, description: 'Attack hits one more target.', descriptionZh: '攻击多打 1 个目标。', bonus: { bladeCount: 1 } },
    { id: 'quick_hands', name: 'Quick Hands', nameZh: '快手', rarity: 'white', category: 'stat', repeatable: true, lockable: true, description: 'Slightly faster attacks.', descriptionZh: '攻速略微提升。', bonus: { attackCooldown: -0.04 } },
    { id: 'lucky_spark', name: 'Lucky Spark', nameZh: '幸运火花', rarity: 'white', category: 'economy', repeatable: true, description: '+2 luck for better drafts.', descriptionZh: '幸运 +2，提升高稀有率。', bonus: { luck: 2 } },
    { id: 'focus_core', name: 'Focus Core', nameZh: '专注核心', rarity: 'white', category: 'stat', repeatable: true, description: '+5% crit chance.', descriptionZh: '暴击率 +5%。', bonus: { critChance: 0.05 } },

    // —— Blue / Rare ——
    { id: 'double_shot', name: 'Double Shot', nameZh: '双发', rarity: 'blue', category: 'blade', repeatable: true, lockable: true, description: '+1 projectile / blade.', descriptionZh: '额外 1 发/刀。', bonus: { bladeCount: 1, splitBlades: 1 } },
    { id: 'ricochet', name: 'Ricochet', nameZh: '弹射', rarity: 'blue', category: 'blade', repeatable: true, lockable: true, description: '+2 chain hits.', descriptionZh: '弹射/连锁 +2。', bonus: { chainHits: 2 } },
    { id: 'pierce', name: 'Pierce', nameZh: '穿透', rarity: 'blue', category: 'blade', repeatable: true, lockable: true, description: 'Attacks pierce further.', descriptionZh: '攻击穿透更强。', bonus: { chainHits: 1, attackRange: 15, damagePercent: 0.08 } },
    { id: 'lifesteal', name: 'Blood Siphon', nameZh: '吸血', rarity: 'blue', category: 'stat', repeatable: true, description: '5% lifesteal on hits.', descriptionZh: '命中吸血 5%。', bonus: { lifesteal: 0.05 } },
    { id: 'blood_rage', name: 'Blood Rage', nameZh: '血怒', rarity: 'blue', category: 'risk', repeatable: true, lockable: true, description: 'When HP < 50%, +40% ATK.', descriptionZh: 'HP < 50% 时 +40% 伤害。', bonus: { executeBonus: 0.4, damagePercent: 0.1 } },
    { id: 'reflect_shell', name: 'Reflect Shell', nameZh: '反弹', rarity: 'blue', category: 'stat', repeatable: true, description: '+6 armor and shield.', descriptionZh: '护甲 +6，减伤提升。', bonus: { armor: 6, shieldReduction: 0.05 } },
    { id: 'blade_fan', name: 'Blade Fan', nameZh: '扇形刃', rarity: 'blue', category: 'blade', repeatable: true, description: 'Wider attack arc.', descriptionZh: '攻击扇角更宽。', bonus: { fanAngle: 16, attackRange: 10 } },
    { id: 'phase_step', name: 'Phase Step', nameZh: '相位步伐', rarity: 'blue', category: 'mobility', repeatable: true, description: '+8% dodge and +8% move speed.', descriptionZh: '闪避 +8%，移速 +8%。', bonus: { dodge: 0.08, moveSpeed: 0.08, attackRange: 8 } },
    { id: 'orbit_guard', name: 'Orbit Guard', nameZh: '环绕护卫', rarity: 'blue', category: 'blade', repeatable: true, description: 'Gain an orbiting hit.', descriptionZh: '获得环绕攻击。', bonus: { orbitBladeCount: 1 } },
    { id: 'energy_surge', name: 'Energy Surge', nameZh: '能量涌动', rarity: 'blue', category: 'stat', repeatable: true, description: 'Fill ultimate energy faster.', descriptionZh: '大招能量获取加快。', bonus: { energyPerAttack: 8 } },
    { id: 'wide_arc', name: 'Wide Arc', nameZh: '广域弧', rarity: 'blue', category: 'stat', repeatable: true, lockable: true, description: '+30 attack range.', descriptionZh: '攻击范围 +30。', bonus: { attackRange: 30 } },
    { id: 'iron_core', name: 'Iron Core', nameZh: '钢铁核心', rarity: 'blue', category: 'stat', repeatable: true, description: '+8 armor, +16 HP, slightly slower.', descriptionZh: '护甲 +8，生命 +16，攻速略降。', bonus: { armor: 8, maxHp: 16, attackCooldown: 0.02 } },

    // —— Purple / Epic ——
    { id: 'element_master', name: 'Element Master', nameZh: '元素大师', rarity: 'purple', category: 'element', repeatable: true, lockable: true, description: 'Elemental damage +50%.', descriptionZh: '元素伤害 +50%。', bonus: { damagePercent: 0.5 } },
    { id: 'giant_slayer', name: 'Giant Slayer', nameZh: '巨人杀手', rarity: 'purple', category: 'stat', repeatable: true, lockable: true, description: '+80% damage to elites/bosses.', descriptionZh: '对精英/BOSS +80% 伤害。', bonus: { bossDamageBonus: 0.8 } },
    { id: 'black_hole', name: 'Black Hole', nameZh: '黑洞', rarity: 'purple', category: 'blade', description: 'Pull pressure: +2 blades, +range.', descriptionZh: '吸引压制：+2 刀，范围提升。', bonus: { bladeCount: 2, attackRange: 25, fanAngle: 12 } },
    { id: 'gilded', name: 'Gilded', nameZh: '镀金', rarity: 'purple', category: 'economy', description: '+5 luck and +1 free refresh.', descriptionZh: '幸运 +5，免费刷新 +1。', bonus: { luck: 5 }, flags: { freeRefreshBonus: 1 } },
    { id: 'time_warp', name: 'Time Warp', nameZh: '时间扭曲', rarity: 'purple', category: 'mobility', description: 'Faster attacks and stronger ultimate.', descriptionZh: '攻速提升，大招更强。', bonus: { attackCooldown: -0.08, ultimateMultiplier: 0.5, energyPerAttack: 6 } },
    { id: 'mirror_clone', name: 'Mirror Clone', nameZh: '镜像分身', rarity: 'purple', category: 'blade', description: '+2 orbit blades.', descriptionZh: '环绕刃 +2。', bonus: { orbitBladeCount: 2, damagePercent: 0.12 } },
    { id: 'chain_storm', name: 'Chain Storm', nameZh: '连锁风暴', rarity: 'purple', category: 'blade', repeatable: true, lockable: true, description: '+3 chain hits and stronger ult.', descriptionZh: '连锁 +3，大招增强。', bonus: { chainHits: 3, ultimateMultiplier: 0.4 } },
    { id: 'void_step', name: 'Void Walk', nameZh: '虚空行走', rarity: 'purple', category: 'mobility', description: '+14% dodge, +12% move, brief shield.', descriptionZh: '闪避 +14%，移速 +12%，减伤提升。', bonus: { dodge: 0.14, moveSpeed: 0.12, shieldReduction: 0.06 } },
    { id: 'crit_engine', name: 'Crit Engine', nameZh: '暴击引擎', rarity: 'purple', category: 'stat', repeatable: true, lockable: true, description: '+15% crit, crit hits harder.', descriptionZh: '暴击率 +15%，暴伤提升。', bonus: { critChance: 0.15, critMultiplier: 0.5 } },
    { id: 'fourth_choice', name: 'Fourth Choice', nameZh: '第四选项', rarity: 'purple', category: 'economy', description: 'Drafts show one extra choice.', descriptionZh: '强化选择多 1 个选项。', flags: { extraChoice: 1 } },
    { id: 'free_roll', name: 'Free Roll', nameZh: '免费刷新', rarity: 'purple', category: 'economy', description: '+1 free refresh every draft.', descriptionZh: '每次强化额外 1 次免费刷新。', flags: { freeRefreshBonus: 1 } },
    { id: 'storm_echo', name: 'Storm Echo', nameZh: '风暴回响', rarity: 'purple', category: 'blade', repeatable: true, description: '+2 chain and +ult power.', descriptionZh: '连锁 +2，大招增强。', bonus: { chainHits: 2, ultimateMultiplier: 0.6 } },

    // —— Orange / Legendary ——
    { id: 'doom_hammer', name: 'Doom Hammer', nameZh: '毁灭之锤', rarity: 'orange', category: 'legendary', description: 'Massive boss damage and +1 blade.', descriptionZh: '对强敌巨额伤害，+1 刀。', bonus: { bossDamageBonus: 1.2, bladeCount: 1, damagePercent: 0.35 } },
    { id: 'infinite_growth', name: 'Infinite Growth', nameZh: '无限成长', rarity: 'orange', category: 'legendary', description: 'Every level permanently +5% ATK this run.', descriptionZh: '每升 1 级永久 ATK +5%（本局）。', bonus: { damagePercent: 0.25, luck: 3 } },
    { id: 'element_avatar', name: 'Element Avatar', nameZh: '元素化身', rarity: 'orange', category: 'legendary', description: 'All element bonuses amplified.', descriptionZh: '全元素加成大幅提升。', bonus: { damagePercent: 0.45, chainHits: 2, orbitBladeCount: 1 } },
    { id: 'judgment_day', name: 'Judgment Day', nameZh: '审判日', rarity: 'orange', category: 'legendary', description: 'Huge burst potential and energy gain.', descriptionZh: '爆发潜力与能量获取暴增。', bonus: { damagePercent: 0.6, energyPerAttack: 15, ultimateMultiplier: 1 } },
    { id: 'godslayer', name: 'Godslayer', nameZh: '弑神者', rarity: 'orange', category: 'legendary', description: 'Boss fights +200% ATK.', descriptionZh: 'BOSS 战 ATK +200%。', bonus: { bossDamageBonus: 2, damage: 12 } },
    { id: 'jung_archetype', name: 'Jung Archetype', nameZh: '荣格原型', rarity: 'orange', category: 'legendary', description: 'Stack another random dimension edge.', descriptionZh: '叠加另一维度被动收益。', bonus: { damagePercent: 0.2, dodge: 0.08, critChance: 0.1, maxHp: 20 } },
    { id: 'second_self', name: 'Second Self', nameZh: '第二人格', rarity: 'orange', category: 'legendary', description: 'Ultimate recharges faster and hits harder.', descriptionZh: '大招充能更快、伤害更高。', bonus: { energyPerAttack: 12, ultimateMultiplier: 1.2, damagePercent: 0.15 } },
    { id: 'critical_mass', name: 'Critical Mass', nameZh: '临界质量', rarity: 'orange', category: 'risk', description: '+55% damage and +1 blade, -20 HP.', descriptionZh: '伤害 +55%，+1 刀，生命 -20。', bonus: { damagePercent: 0.55, bladeCount: 1, maxHp: -20 } },
    { id: 'glass_edge', name: 'Glass Edge', nameZh: '玻璃锋刃', rarity: 'orange', category: 'risk', description: '+85% damage, -35 HP.', descriptionZh: '伤害 +85%，生命 -35。', bonus: { damagePercent: 0.85, maxHp: -35 } },
    { id: 'blade_storm', name: 'Blade Storm', nameZh: '刀刃风暴', rarity: 'orange', category: 'blade', description: '+3 blades, slightly slower attacks.', descriptionZh: '+3 刀，攻速略降。', bonus: { bladeCount: 3, attackCooldown: 0.06 } },
    { id: 'star_guardian', name: 'Star Guardian', nameZh: '星辰守护', rarity: 'orange', category: 'stat', description: '+18 armor, +45 HP, stronger block.', descriptionZh: '护甲 +18，生命 +45，减伤提升。', bonus: { armor: 18, maxHp: 45, shieldReduction: 0.1 } },
    { id: 'golden_luck', name: 'Golden Luck', nameZh: '金色幸运', rarity: 'orange', category: 'economy', description: '+7 luck and +1 free refresh each draft.', descriptionZh: '幸运 +7，每次强化免费刷新 +1。', bonus: { luck: 7 }, flags: { freeRefreshBonus: 1 } },

    // —— M4 expansion (+24 → 72 total, pitch target) ——
    // White
    { id: 'shield_up', name: 'Shield Up', nameZh: '护盾强化', rarity: 'white', category: 'stat', repeatable: true, description: '+4% damage reduction.', descriptionZh: '减伤 +4%。', bonus: { shieldReduction: 0.04 } },
    { id: 'energy_sip', name: 'Energy Sip', nameZh: '能量汲取', rarity: 'white', category: 'stat', repeatable: true, description: '+4 ultimate energy per attack.', descriptionZh: '每次攻击大招能量 +4。', bonus: { energyPerAttack: 4 } },
    { id: 'keen_eye', name: 'Keen Eye', nameZh: '锐利之眼', rarity: 'white', category: 'stat', repeatable: true, lockable: true, description: '+4% crit chance.', descriptionZh: '暴击率 +4%。', bonus: { critChance: 0.04 } },
    { id: 'brace', name: 'Brace', nameZh: '稳固', rarity: 'white', category: 'stat', repeatable: true, description: '+2 armor and +8 HP.', descriptionZh: '护甲 +2，生命 +8。', bonus: { armor: 2, maxHp: 8 } },
    { id: 'spark_dash', name: 'Spark Dash', nameZh: '火花冲刺', rarity: 'white', category: 'mobility', repeatable: true, description: '+6% move speed.', descriptionZh: '移速 +6%。', bonus: { moveSpeed: 0.06 } },
    { id: 'minor_heal', name: 'Minor Heal', nameZh: '微愈', rarity: 'white', category: 'stat', repeatable: true, description: '+3% lifesteal.', descriptionZh: '吸血 +3%。', bonus: { lifesteal: 0.03 } },
    // Blue
    { id: 'split_shot', name: 'Split Shot', nameZh: '分裂射击', rarity: 'blue', category: 'blade', repeatable: true, lockable: true, description: '+1 split projectile.', descriptionZh: '分裂弹 +1。', bonus: { splitBlades: 1, bladeCount: 1 } },
    { id: 'frost_aura', name: 'Frost Aura', nameZh: '冰霜光环', rarity: 'blue', category: 'element', repeatable: true, description: '+8% dodge and chill edge.', descriptionZh: '闪避 +8%，附带寒意。', bonus: { dodge: 0.08, damage: 4 } },
    { id: 'overcharge', name: 'Overcharge', nameZh: '过载', rarity: 'blue', category: 'stat', repeatable: true, lockable: true, description: 'Faster attacks and +energy.', descriptionZh: '攻速提升，能量获取加快。', bonus: { attackCooldown: -0.05, energyPerAttack: 5 } },
    { id: 'thorn_mail', name: 'Thorn Mail', nameZh: '荆棘甲', rarity: 'blue', category: 'stat', repeatable: true, description: '+5 armor and light reflect.', descriptionZh: '护甲 +5，轻量反伤。', bonus: { armor: 5, shieldReduction: 0.03 } },
    { id: 'hunter_mark', name: 'Hunter Mark', nameZh: '猎人印记', rarity: 'blue', category: 'stat', repeatable: true, lockable: true, description: '+25% damage to elites/bosses.', descriptionZh: '对精英/BOSS +25% 伤害。', bonus: { bossDamageBonus: 0.25 } },
    { id: 'greed_coin', name: 'Greed Coin', nameZh: '贪婪之币', rarity: 'blue', category: 'economy', repeatable: true, description: '+3 luck.', descriptionZh: '幸运 +3。', bonus: { luck: 3 } },
    // Purple
    { id: 'soul_link', name: 'Soul Link', nameZh: '灵魂链接', rarity: 'purple', category: 'blade', repeatable: true, lockable: true, description: '+2 chain hits and +damage.', descriptionZh: '连锁 +2，伤害提升。', bonus: { chainHits: 2, damagePercent: 0.12 } },
    { id: 'chrono_boot', name: 'Chrono Boot', nameZh: '时空之靴', rarity: 'purple', category: 'mobility', description: '+12% move, +8% dodge, faster attacks.', descriptionZh: '移速 +12%，闪避 +8%，攻速提升。', bonus: { moveSpeed: 0.12, dodge: 0.08, attackCooldown: -0.04 } },
    { id: 'blood_nova', name: 'Blood Nova', nameZh: '血之新星', rarity: 'purple', category: 'risk', description: '+35% damage when low HP.', descriptionZh: '低血时伤害 +35%。', bonus: { executeBonus: 0.35, damagePercent: 0.1 } },
    { id: 'prism_guard', name: 'Prism Guard', nameZh: '棱镜守护', rarity: 'purple', category: 'element', description: 'Element resist and +armor.', descriptionZh: '元素防护与护甲提升。', bonus: { armor: 10, shieldReduction: 0.08, maxHp: 12 } },
    { id: 'echo_blade', name: 'Echo Blade', nameZh: '回声之刃', rarity: 'purple', category: 'blade', repeatable: true, lockable: true, description: '+1 orbit blade and +ult power.', descriptionZh: '环绕刃 +1，大招增强。', bonus: { orbitBladeCount: 1, ultimateMultiplier: 0.35 } },
    { id: 'draft_sage', name: 'Draft Sage', nameZh: '构筑贤者', rarity: 'purple', category: 'economy', description: '+4 luck and +1 free refresh.', descriptionZh: '幸运 +4，免费刷新 +1。', bonus: { luck: 4 }, flags: { freeRefreshBonus: 1 } },
    // Orange
    { id: 'abyss_crown', name: 'Abyss Crown', nameZh: '深渊王冠', rarity: 'orange', category: 'legendary', description: 'Global power: damage, range, energy.', descriptionZh: '全局强化：伤害、范围、能量。', bonus: { damagePercent: 0.4, attackRange: 20, energyPerAttack: 10 } },
    { id: 'persona_shift', name: 'Persona Shift', nameZh: '人格切换', rarity: 'orange', category: 'legendary', description: 'Hybrid growth across dimensions.', descriptionZh: '跨维度混合成长。', bonus: { damagePercent: 0.18, dodge: 0.1, critChance: 0.08, maxHp: 18, luck: 2 } },
    { id: 'omega_slash', name: 'Omega Slash', nameZh: '欧米茄斩', rarity: 'orange', category: 'blade', description: '+2 blades, wide arc, big damage.', descriptionZh: '+2 刀，宽扇角，高伤。', bonus: { bladeCount: 2, fanAngle: 20, damagePercent: 0.3 } },
    { id: 'immortal_core', name: 'Immortal Core', nameZh: '不灭核心', rarity: 'orange', category: 'stat', description: 'Huge bulk and sustain.', descriptionZh: '超高生存与续航。', bonus: { maxHp: 55, armor: 14, lifesteal: 0.06, shieldReduction: 0.08 } },
    { id: 'luck_storm', name: 'Luck Storm', nameZh: '幸运风暴', rarity: 'orange', category: 'economy', description: '+8 luck and extra draft choice.', descriptionZh: '幸运 +8，强化多 1 选项。', bonus: { luck: 8 }, flags: { freeRefreshBonus: 1, extraChoice: 1 } },
    { id: 'void_cannon', name: 'Void Cannon', nameZh: '虚空加农', rarity: 'orange', category: 'legendary', description: 'Long range void burst power.', descriptionZh: '远距虚空爆发。', bonus: { attackRange: 40, damagePercent: 0.5, chainHits: 1, energyPerAttack: 8 } },

    // —— 16 exclusive signature cards (one per MBTI; draft-biased, not full trees) ——
    {
        id: 'excl_intj_chrono_scope', name: 'Chrono Scope', nameZh: '时空瞄准镜',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'intj', lockable: true,
        description: 'INTJ: +range, +ult power, sniper edge.',
        descriptionZh: 'INTJ 专属：射程与大招强化，狙击锋刃。',
        bonus: { attackRange: 35, ultimateMultiplier: 0.55, damagePercent: 0.15, energyPerAttack: 6 },
    },
    {
        id: 'excl_intp_logic_fuse', name: 'Logic Fuse', nameZh: '逻辑引信',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'intp', lockable: true,
        description: 'INTP: chain bombs and kite damage.',
        descriptionZh: 'INTP 专属：连锁引爆与风筝伤害。',
        bonus: { chainHits: 3, damagePercent: 0.18, attackRange: 18 },
    },
    {
        id: 'excl_entj_command_seal', name: 'Command Seal', nameZh: '指挥印',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'entj', lockable: true,
        description: 'ENTJ: elite/boss hunter seal.',
        descriptionZh: 'ENTJ 专属：精英/BOSS 猎杀印记。',
        bonus: { bossDamageBonus: 0.7, damagePercent: 0.12, energyPerAttack: 5 },
    },
    {
        id: 'excl_entp_chaos_mirror', name: 'Chaos Mirror', nameZh: '混沌之镜',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'entp',
        description: 'ENTP: luck, chains, convert edge.',
        descriptionZh: 'ENTP 专属：幸运、连锁与转化锋芒。',
        bonus: { luck: 4, chainHits: 2, moveSpeed: 0.08, damagePercent: 0.1 },
    },
    {
        id: 'excl_infj_fate_thread', name: 'Fate Thread', nameZh: '命运之线',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'infj', lockable: true,
        description: 'INFJ: pierce mark and wave clear.',
        descriptionZh: 'INFJ 专属：穿透标记与清场。',
        bonus: { chainHits: 2, attackRange: 28, damagePercent: 0.16, ultimateMultiplier: 0.4 },
    },
    {
        id: 'excl_infp_phoenix_ember', name: 'Phoenix Ember', nameZh: '凤凰余烬',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'infp',
        description: 'INFP: bulk + comeback execute.',
        descriptionZh: 'INFP 专属：厚血与翻盘斩杀。',
        bonus: { maxHp: 28, executeBonus: 0.35, lifesteal: 0.04, damagePercent: 0.1 },
    },
    {
        id: 'excl_enfj_aura_core', name: 'Aura Core', nameZh: '气场核心',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'enfj', lockable: true,
        description: 'ENFJ: bulk, range, support pressure.',
        descriptionZh: 'ENFJ 专属：生存、射程与辅助压制。',
        bonus: { maxHp: 18, attackRange: 22, damagePercent: 0.14, shieldReduction: 0.05 },
    },
    {
        id: 'excl_enfp_sprite_bond', name: 'Sprite Bond', nameZh: '精灵羁绊',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'enfp',
        description: 'ENFP: speed, dodge, summon synergy.',
        descriptionZh: 'ENFP 专属：移速、闪避与召唤协同。',
        bonus: { moveSpeed: 0.14, dodge: 0.08, orbitBladeCount: 1, chainHits: 1 },
    },
    {
        id: 'excl_istj_fortress_bolt', name: 'Fortress Bolt', nameZh: '要塞螺栓',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'istj', lockable: true,
        description: 'ISTJ: armor fortress and steady fire.',
        descriptionZh: 'ISTJ 专属：护甲要塞与稳定火力。',
        bonus: { armor: 10, maxHp: 22, damage: 6, attackCooldown: 0.03 },
    },
    {
        id: 'excl_isfj_sanctuary_ward', name: 'Sanctuary Ward', nameZh: '圣域守护',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'isfj',
        description: 'ISFJ: immortal bulk and sustain.',
        descriptionZh: 'ISFJ 专属：不死坦克与续航。',
        bonus: { maxHp: 32, armor: 8, lifesteal: 0.05, shieldReduction: 0.08 },
    },
    {
        id: 'excl_estj_guard_banner', name: 'Guard Banner', nameZh: '守卫战旗',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'estj', lockable: true,
        description: 'ESTJ: swarm firepower and bulk.',
        descriptionZh: 'ESTJ 专属：人海火力与生存力。',
        bonus: { damage: 8, maxHp: 16, bladeCount: 1, energyPerAttack: 5 },
    },
    {
        id: 'excl_esfj_medic_charm', name: 'Medic Charm', nameZh: '医师护符',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'esfj',
        description: 'ESFJ: heal amp and energy surge.',
        descriptionZh: 'ESFJ 专属：回血强化与能量涌动。',
        bonus: { maxHp: 26, energyPerAttack: 10, lifesteal: 0.04, ultimateMultiplier: 0.35 },
    },
    {
        id: 'excl_istp_parry_edge', name: 'Parry Edge', nameZh: '格挡锋刃',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'istp', lockable: true,
        description: 'ISTP: counter damage and mobility.',
        descriptionZh: 'ISTP 专属：反击伤害与机动。',
        bonus: { damagePercent: 0.22, dodge: 0.06, moveSpeed: 0.08, critChance: 0.08 },
    },
    {
        id: 'excl_isfp_prism_shot', name: 'Prism Shot', nameZh: '棱镜霰弹',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'isfp',
        description: 'ISFP: multi-direction elemental spread.',
        descriptionZh: 'ISFP 专属：多向元素霰弹。',
        bonus: { fanAngle: 24, splitBlades: 1, bladeCount: 1, damagePercent: 0.14 },
    },
    {
        id: 'excl_estp_berserk_core', name: 'Berserk Core', nameZh: '狂暴核心',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'estp', lockable: true,
        description: 'ESTP: attack speed and close-range melt.',
        descriptionZh: 'ESTP 专属：攻速与近身碾压。',
        bonus: { attackCooldown: -0.1, moveSpeed: 0.1, damagePercent: 0.2, bladeCount: 1 },
    },
    {
        id: 'excl_esfp_stage_pulse', name: 'Stage Pulse', nameZh: '舞台脉冲',
        rarity: 'purple', category: 'legendary', exclusiveTo: 'esfp',
        description: 'ESFP: gather pressure and shockwave amp.',
        descriptionZh: 'ESFP 专属：聚怪压力与冲击波强化。',
        bonus: { damagePercent: 0.18, fanAngle: 18, maxHp: 14, ultimateMultiplier: 0.5 },
    },
];

export function getProfession(id: ProfessionId | string | undefined): ProfessionData {
    return PROFESSIONS.find((item) => item.id === id) ?? PROFESSIONS[0];
}

export function professionHasTrait(profession: ProfessionData, trait: MbtiTrait): boolean {
    return profession.traits.indexOf(trait) >= 0;
}

export function listTraits(profession: ProfessionData): string {
    return profession.traits.join('');
}

export function normalizeRarity(rarity: string): Rarity {
    if (rarity === 'gold') return 'orange';
    if (rarity === 'white' || rarity === 'blue' || rarity === 'purple' || rarity === 'orange') {
        return rarity;
    }
    return 'white';
}

export function rarityColorHex(rarity: Rarity): string {
    switch (rarity) {
        case 'white': return '#D8DEE8';
        case 'blue': return '#5BA8FF';
        case 'purple': return '#B56CFF';
        case 'orange': return '#FFB040';
        default: return '#D8DEE8';
    }
}
