export type Rarity = 'blue' | 'purple' | 'gold';
export type ProfessionId = 'blade_adept' | 'hex_gambler' | 'storm_mage';
export type HexCategory = 'stat' | 'blade' | 'economy' | 'risk';

export interface CombatBonus {
    maxHp?: number;
    armor?: number;
    dodge?: number;
    luck?: number;
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
}

export interface ProfessionData {
    id: ProfessionId;
    name: string;
    description: string;
    bonus: CombatBonus;
}

export interface HexFlags {
    bonusIncome: number;
    rerollDiscount: number;
    colorBias: number;
    extraChoice: number;
}

export interface HexCardData {
    id: string;
    name: string;
    rarity: Rarity;
    category: HexCategory;
    description: string;
    repeatable?: boolean;
    bonus?: CombatBonus;
    flags?: Partial<HexFlags>;
}

export interface HexChoiceView {
    data: HexCardData;
    alreadyPicked: boolean;
}

export interface HexViewModel {
    gold: number;
    wave: number;
    rerollCost: number;
    profession: ProfessionData;
    choices: HexChoiceView[];
    picked: HexCardData[];
}

export const PROFESSIONS: ProfessionData[] = [
    {
        id: 'blade_adept',
        name: 'Blade Adept',
        description: 'Starts with twin blades and scales well with blade-count augments.',
        bonus: { maxHp: 8, armor: 2, damage: 4, attackRange: 15, bladeCount: 2, fanAngle: 18 },
    },
    {
        id: 'hex_gambler',
        name: 'Hex Gambler',
        description: 'Lower health, more gold, better odds for Purple/Gold augments.',
        bonus: { maxHp: -12, luck: 3, damage: 2, attackRange: 5, bladeCount: 1, energyPerAttack: 8 },
    },
    {
        id: 'storm_mage',
        name: 'Storm Mage',
        description: 'Fewer blades, but stronger chain and ultimate scaling.',
        bonus: { maxHp: -4, dodge: 0.04, damage: 1, attackRange: 35, bladeCount: 1, chainHits: 1, ultimateMultiplier: 1 },
    },
];

export const DEFAULT_FLAGS: HexFlags = {
    bonusIncome: 0,
    rerollDiscount: 0,
    colorBias: 0,
    extraChoice: 0,
};

export const HEX_CARDS: HexCardData[] = [
    {
        id: 'extra_blade',
        name: 'Extra Blade',
        rarity: 'blue',
        category: 'blade',
        repeatable: true,
        description: 'Your attack fires one more blade.',
        bonus: { bladeCount: 1 },
    },
    {
        id: 'blade_fan',
        name: 'Blade Fan',
        rarity: 'purple',
        category: 'blade',
        repeatable: true,
        description: 'Blades spread wider and cover more space.',
        bonus: { fanAngle: 14, attackRange: 10 },
    },
    {
        id: 'orbiting_blade',
        name: 'Orbiting Blade',
        rarity: 'purple',
        category: 'blade',
        repeatable: true,
        description: 'Gain an orbiting blade that hits nearby enemies every attack.',
        bonus: { orbitBladeCount: 1, attackRange: 15 },
    },
    {
        id: 'split_edge',
        name: 'Split Edge',
        rarity: 'purple',
        category: 'blade',
        repeatable: true,
        description: 'Each attack adds a weaker side slash.',
        bonus: { splitBlades: 1, damagePercent: 0.08 },
    },
    {
        id: 'chain_cut',
        name: 'Chain Cut',
        rarity: 'purple',
        category: 'blade',
        repeatable: true,
        description: 'Blade hits echo to one additional enemy.',
        bonus: { chainHits: 1 },
    },
    {
        id: 'sharpen',
        name: 'Sharpen',
        rarity: 'blue',
        category: 'stat',
        repeatable: true,
        description: '+5 base damage.',
        bonus: { damage: 5 },
    },
    {
        id: 'wide_arc',
        name: 'Wide Arc',
        rarity: 'blue',
        category: 'stat',
        repeatable: true,
        description: '+25 attack range.',
        bonus: { attackRange: 25 },
    },
    {
        id: 'quick_draw',
        name: 'Quick Draw',
        rarity: 'purple',
        category: 'stat',
        repeatable: true,
        description: 'Attack cooldown is reduced.',
        bonus: { attackCooldown: -0.03, energyPerAttack: 4 },
    },
    {
        id: 'giant_heart',
        name: 'Giant Heart',
        rarity: 'blue',
        category: 'stat',
        repeatable: true,
        description: '+24 max HP.',
        bonus: { maxHp: 24 },
    },
    {
        id: 'cosmic_armor',
        name: 'Cosmic Armor',
        rarity: 'blue',
        category: 'stat',
        repeatable: true,
        description: '+4 armor and +10 max HP.',
        bonus: { armor: 4, maxHp: 10 },
    },
    {
        id: 'lucky_star',
        name: 'Lucky Star',
        rarity: 'blue',
        category: 'economy',
        repeatable: true,
        description: '+2 luck. Luck improves Purple/Gold odds.',
        bonus: { luck: 2 },
    },
    {
        id: 'phase_step',
        name: 'Phase Step',
        rarity: 'purple',
        category: 'stat',
        repeatable: true,
        description: '+8% dodge and +10 attack range.',
        bonus: { dodge: 0.08, attackRange: 10 },
    },
    {
        id: 'iron_core',
        name: 'Iron Core',
        rarity: 'purple',
        category: 'stat',
        repeatable: true,
        description: '+9 armor, +18 max HP, attacks slightly slower.',
        bonus: { armor: 9, maxHp: 18, attackCooldown: 0.025 },
    },
    {
        id: 'golden_luck',
        name: 'Golden Luck',
        rarity: 'gold',
        category: 'economy',
        description: '+7 luck and +1 bonus gold after every wave.',
        bonus: { luck: 7 },
        flags: { bonusIncome: 1 },
    },
    {
        id: 'star_guardian',
        name: 'Star Guardian',
        rarity: 'gold',
        category: 'stat',
        description: '+18 armor, +45 max HP, stronger block.',
        bonus: { armor: 18, maxHp: 45, shieldReduction: 0.08 },
    },
    {
        id: 'critical_mass',
        name: 'Critical Mass',
        rarity: 'gold',
        category: 'risk',
        description: '+55% damage and +1 blade, but -20 max HP.',
        bonus: { damagePercent: 0.55, bladeCount: 1, maxHp: -20 },
    },
    {
        id: 'evasive_fortune',
        name: 'Evasive Fortune',
        rarity: 'purple',
        category: 'stat',
        repeatable: true,
        description: '+4 luck and +5% dodge.',
        bonus: { luck: 4, dodge: 0.05 },
    },
    {
        id: 'glass_edge',
        name: 'Glass Edge',
        rarity: 'gold',
        category: 'risk',
        description: '+85% damage, -35 max HP.',
        bonus: { damagePercent: 0.85, maxHp: -35 },
    },
    {
        id: 'blade_storm',
        name: 'Blade Storm',
        rarity: 'gold',
        category: 'blade',
        description: '+3 blades, but each attack is slightly slower.',
        bonus: { bladeCount: 3, attackCooldown: 0.08 },
    },
    {
        id: 'storm_echo',
        name: 'Storm Echo',
        rarity: 'purple',
        category: 'blade',
        repeatable: true,
        description: '+2 chain hits and stronger ultimate.',
        bonus: { chainHits: 2, ultimateMultiplier: 0.8 },
    },
    {
        id: 'free_roll',
        name: 'Free Roll',
        rarity: 'blue',
        category: 'economy',
        description: 'Rerolls cost 1 less.',
        flags: { rerollDiscount: 1 },
    },
    {
        id: 'interest_seed',
        name: 'Interest Seed',
        rarity: 'purple',
        category: 'economy',
        description: '+2 gold after every wave.',
        flags: { bonusIncome: 2 },
    },
    {
        id: 'lucky_hex',
        name: 'Lucky Hex',
        rarity: 'purple',
        category: 'economy',
        description: 'Purple and Gold augments appear more often.',
        flags: { colorBias: 2 },
    },
    {
        id: 'fourth_choice',
        name: 'Fourth Choice',
        rarity: 'gold',
        category: 'economy',
        description: 'Hex drafts show one extra choice.',
        flags: { extraChoice: 1 },
    },
];
