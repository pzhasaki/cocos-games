export type MonsterPattern = 'jump' | 'charge' | 'bubble' | 'magnet' | 'summon';
export type UpgradeKind = 'power' | 'shield' | 'beam';

export interface MonsterLevel {
  stage: number;
  name: string;
  hp: number;
  attack: number;
  attackEvery: number;
  warningTime: number;
  timeLimit: number;
  threeStarTime: number;
  rewardCoins: number;
  color: string;
  accent: string;
  pattern: MonsterPattern;
  intro: string;
}

export interface UpgradeState {
  power: number;
  shield: number;
  beam: number;
}

export const UPGRADE_MAX_LEVEL = 10;

export const LEVELS: MonsterLevel[] = [
  {
    stage: 1,
    name: '果冻小怪',
    hp: 300,
    attack: 1,
    attackEvery: 3.1,
    warningTime: 1.25,
    timeLimit: 65,
    threeStarTime: 28,
    rewardCoins: 80,
    color: '#58C7A5',
    accent: '#FFE066',
    pattern: 'jump',
    intro: '拖动小英雄，躲开红色圈圈',
  },
  {
    stage: 2,
    name: '石头犀牛',
    hp: 420,
    attack: 1,
    attackEvery: 2.8,
    warningTime: 1.08,
    timeLimit: 70,
    threeStarTime: 30,
    rewardCoins: 105,
    color: '#8A97A8',
    accent: '#FFC857',
    pattern: 'charge',
    intro: '看到冲撞路线就快躲开',
  },
  {
    stage: 3,
    name: '泡泡章鱼',
    hp: 520,
    attack: 1,
    attackEvery: 2.55,
    warningTime: 1.0,
    timeLimit: 75,
    threeStarTime: 32,
    rewardCoins: 130,
    color: '#50BBD7',
    accent: '#F4F7FB',
    pattern: 'bubble',
    intro: '泡泡会落下来，别站在泡泡里',
  },
  {
    stage: 4,
    name: '磁铁螃蟹',
    hp: 650,
    attack: 1,
    attackEvery: 2.7,
    warningTime: 1.35,
    timeLimit: 80,
    threeStarTime: 34,
    rewardCoins: 155,
    color: '#FF7A7A',
    accent: '#3A2E39',
    pattern: 'magnet',
    intro: '它会吸住你，拖动反方向挣脱',
  },
  {
    stage: 5,
    name: '云朵巨兽',
    hp: 850,
    attack: 1,
    attackEvery: 2.35,
    warningTime: 1.05,
    timeLimit: 90,
    threeStarTime: 38,
    rewardCoins: 210,
    color: '#A678F0',
    accent: '#F9D94A',
    pattern: 'summon',
    intro: '光能满了就摇一摇清屏',
  },
];

export function getMonsterLevel(index: number): MonsterLevel {
  return LEVELS[index % LEVELS.length];
}

export function getLoopBonus(index: number): number {
  return Math.floor(index / LEVELS.length);
}

export function getUpgradeCost(kind: UpgradeKind, currentLevel: number): number {
  const baseCost: Record<UpgradeKind, number> = {
    power: 90,
    shield: 80,
    beam: 120,
  };
  return baseCost[kind] + currentLevel * currentLevel * 35;
}

export function createDefaultUpgrades(): UpgradeState {
  return {
    power: 1,
    shield: 1,
    beam: 1,
  };
}
