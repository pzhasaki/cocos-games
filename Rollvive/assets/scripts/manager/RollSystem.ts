import { DEFAULT_FLAGS, HEX_CARDS, PROFESSIONS } from '../data/RollData';
import type {
    CombatBonus,
    HexCardData,
    HexChoiceView,
    HexFlags,
    HexViewModel,
    ProfessionData,
    ProfessionId,
    Rarity,
} from '../data/RollData';

const RARITY_WEIGHT: Record<Rarity, number> = {
    blue: 68,
    purple: 25,
    gold: 7,
};

export class RollSystem {
    private _gold = 0;
    private _wave = 1;
    private _profession: ProfessionData = PROFESSIONS[0];
    private _flags: HexFlags = { ...DEFAULT_FLAGS };
    private readonly _picked: HexCardData[] = [];
    private _choices: HexChoiceView[] = [];

    public reset(startingGold: number, professionId: ProfessionId): void {
        this._gold = startingGold;
        this._wave = 1;
        this._profession = PROFESSIONS.find((item) => item.id === professionId) ?? PROFESSIONS[0];
        this._flags = { ...DEFAULT_FLAGS };
        this._picked.length = 0;
        this._choices = [];

        if (professionId === 'hex_gambler') {
            this._gold += 4;
            this._flags.colorBias += 1;
        }
    }

    public get gold(): number {
        return this._gold;
    }

    public addGold(amount: number): void {
        this._gold = Math.max(0, this._gold + amount);
    }

    public grantWaveRewards(wave: number): number {
        this._wave = wave;
        const base = Math.min(8, 3 + Math.floor(wave / 2));
        const total = base + this._flags.bonusIncome;
        this.addGold(total);
        return total;
    }

    public beginDraft(wave: number): void {
        this._wave = wave;
        this._choices = this._rollChoices();
    }

    public rerollDraft(): string {
        const cost = this.getRerollCost();
        if (this._gold < cost) {
            return `Need ${cost} gold to reroll.`;
        }

        this._gold -= cost;
        this._choices = this._rollChoices();
        return cost > 0 ? `Rerolled for ${cost} gold.` : 'Free reroll.';
    }

    public selectChoice(index: number): { ok: boolean; message: string; card?: HexCardData } {
        const choice = this._choices[index];
        if (!choice) return { ok: false, message: 'No hex in that slot.' };
        if (choice.alreadyPicked && !choice.data.repeatable) {
            return { ok: false, message: `${choice.data.name} is unique.` };
        }

        this._picked.push(choice.data);
        if (choice.data.flags) {
            this._flags = { ...this._flags, ...this._sumFlags(choice.data.flags) };
        }
        this._choices = [];
        return { ok: true, message: `Picked ${choice.data.name}.`, card: choice.data };
    }

    public getTotalCombatBonus(): CombatBonus {
        const total: CombatBonus = {};
        this._addBonus(total, this._profession.bonus);

        for (const card of this._picked) {
            if (card.bonus) {
                this._addBonus(total, card.bonus);
            }
        }

        return total;
    }

    public getViewModel(): HexViewModel {
        return {
            gold: this._gold,
            wave: this._wave,
            rerollCost: this.getRerollCost(),
            profession: this._profession,
            choices: [...this._choices],
            picked: [...this._picked],
        };
    }

    public getRerollCost(): number {
        return Math.max(0, 2 - this._flags.rerollDiscount);
    }

    private _rollChoices(): HexChoiceView[] {
        const count = 3 + this._flags.extraChoice;
        const results: HexChoiceView[] = [];
        const pickedUnique = new Set(this._picked.filter((card) => !card.repeatable).map((card) => card.id));
        const pool = HEX_CARDS.filter((card) => card.repeatable || !pickedUnique.has(card.id));
        const seen = new Set<string>();

        while (results.length < count && seen.size < pool.length) {
            const card = this._weightedPick(pool);
            if (seen.has(card.id)) continue;
            seen.add(card.id);
            results.push({
                data: card,
                alreadyPicked: false,
            });
        }

        return results;
    }

    private _weightedPick(pool: HexCardData[]): HexCardData {
        const total = pool.reduce((sum, card) => sum + this._getWeight(card.rarity), 0);
        let roll = Math.random() * total;

        for (const card of pool) {
            roll -= this._getWeight(card.rarity);
            if (roll <= 0) return card;
        }

        return pool[0] ?? HEX_CARDS[0];
    }

    private _getWeight(rarity: Rarity): number {
        const bias = this._flags.colorBias;
        const luck = this._getCurrentLuck();
        if (rarity === 'purple') return RARITY_WEIGHT[rarity] + bias * 6 + luck * 1.2;
        if (rarity === 'gold') return RARITY_WEIGHT[rarity] + bias * 2 + luck * 0.45;
        return Math.max(18, RARITY_WEIGHT[rarity] - bias * 5 - luck * 0.8);
    }

    private _getCurrentLuck(): number {
        return Math.max(0, this.getTotalCombatBonus().luck ?? 0);
    }

    private _sumFlags(source: Partial<HexFlags>): Partial<HexFlags> {
        return {
            bonusIncome: this._flags.bonusIncome + (source.bonusIncome ?? 0),
            rerollDiscount: this._flags.rerollDiscount + (source.rerollDiscount ?? 0),
            colorBias: this._flags.colorBias + (source.colorBias ?? 0),
            extraChoice: this._flags.extraChoice + (source.extraChoice ?? 0),
        };
    }

    private _addBonus(target: CombatBonus, source: CombatBonus): void {
        target.maxHp = (target.maxHp ?? 0) + (source.maxHp ?? 0);
        target.armor = (target.armor ?? 0) + (source.armor ?? 0);
        target.dodge = (target.dodge ?? 0) + (source.dodge ?? 0);
        target.luck = (target.luck ?? 0) + (source.luck ?? 0);
        target.damage = (target.damage ?? 0) + (source.damage ?? 0);
        target.damagePercent = (target.damagePercent ?? 0) + (source.damagePercent ?? 0);
        target.attackRange = (target.attackRange ?? 0) + (source.attackRange ?? 0);
        target.attackCooldown = (target.attackCooldown ?? 0) + (source.attackCooldown ?? 0);
        target.energyPerAttack = (target.energyPerAttack ?? 0) + (source.energyPerAttack ?? 0);
        target.ultimateMultiplier = (target.ultimateMultiplier ?? 0) + (source.ultimateMultiplier ?? 0);
        target.shieldReduction = (target.shieldReduction ?? 0) + (source.shieldReduction ?? 0);
        target.bladeCount = (target.bladeCount ?? 0) + (source.bladeCount ?? 0);
        target.orbitBladeCount = (target.orbitBladeCount ?? 0) + (source.orbitBladeCount ?? 0);
        target.chainHits = (target.chainHits ?? 0) + (source.chainHits ?? 0);
        target.splitBlades = (target.splitBlades ?? 0) + (source.splitBlades ?? 0);
        target.fanAngle = (target.fanAngle ?? 0) + (source.fanAngle ?? 0);
    }
}

export type { HexViewModel, HexCardData, ProfessionId, CombatBonus };
