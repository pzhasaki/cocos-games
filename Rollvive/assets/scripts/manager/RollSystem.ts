import {
    DEFAULT_FLAGS,
    HEX_CARDS,
    PROFESSIONS,
    RARITY_WEIGHT,
    professionHasTrait,
} from '../data/RollData';
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

export class RollSystem {
    private _wave = 1;
    private _profession: ProfessionData = PROFESSIONS[0];
    private _flags: HexFlags = { ...DEFAULT_FLAGS };
    private readonly _picked: HexCardData[] = [];
    private _choices: HexChoiceView[] = [];
    private _freeRefreshesRemaining = 1;
    private _rewardedAdRefreshPending = false;
    private _rewardedAdRefreshAvailable = true;
    private readonly _lockedSkillIds: string[] = [];

    public reset(_unusedStartingResource: number, professionId: ProfessionId): void {
        this._wave = 1;
        this._profession = PROFESSIONS.find((item) => item.id === professionId) ?? PROFESSIONS[0];
        this._flags = { ...DEFAULT_FLAGS };
        this._picked.length = 0;
        this._choices = [];
        this._lockedSkillIds.length = 0;
        this._rewardedAdRefreshPending = false;
        this._rewardedAdRefreshAvailable = true;

        // P passive: 4 choices + extra free refresh
        if (professionHasTrait(this._profession, 'P')) {
            this._flags.extraChoice = Math.max(this._flags.extraChoice, 1);
            this._flags.freeRefreshBonus += 1;
        }
        // J passive: can lock 1 skill
        if (professionHasTrait(this._profession, 'J')) {
            this._flags.lockedSkillSlots = Math.max(this._flags.lockedSkillSlots, 1);
        }

        this._freeRefreshesRemaining = this._getFreeRefreshCount();
    }

    public grantWaveRewards(wave: number): void {
        this._wave = wave;
    }

    public beginDraft(wave: number): void {
        this._wave = wave;
        this._freeRefreshesRemaining = this._getFreeRefreshCount();
        this._rewardedAdRefreshPending = false;
        this._choices = this._rollChoices();
    }

    public rerollDraft(): string {
        if (this._freeRefreshesRemaining > 0) {
            this._freeRefreshesRemaining -= 1;
            this._choices = this._rollChoices();
            return 'Refreshed draft.';
        }

        this._rewardedAdRefreshPending = true;
        return 'Rewarded ad refresh requested.';
    }

    public completeRewardedRefresh(granted: boolean): string {
        if (!this._rewardedAdRefreshPending) {
            return 'No rewarded refresh is pending.';
        }

        this._rewardedAdRefreshPending = false;
        if (!granted) {
            return 'Ad refresh was not granted.';
        }

        this._choices = this._rollChoices();
        return 'Ad refresh granted.';
    }

    public selectChoice(index: number): { ok: boolean; message: string; card?: HexCardData } {
        const choice = this._choices[index];
        if (!choice) return { ok: false, message: 'No skill in that slot.' };
        if (choice.alreadyPicked && !choice.data.repeatable) {
            return { ok: false, message: `${choice.data.name} is unique.` };
        }

        this._picked.push(choice.data);
        if (choice.data.flags) {
            this._flags = { ...this._flags, ...this._sumFlags(choice.data.flags) };
        }

        // Auto-lock first lockable skill for J types if slot available.
        if (
            professionHasTrait(this._profession, 'J') &&
            choice.data.lockable &&
            this._lockedSkillIds.length < this._flags.lockedSkillSlots &&
            this._lockedSkillIds.indexOf(choice.data.id) < 0
        ) {
            this._lockedSkillIds.push(choice.data.id);
        }

        this._choices = [];
        return { ok: true, message: `Picked ${choice.data.name}.`, card: choice.data };
    }

    public getLockedSkillIds(): string[] {
        return [...this._lockedSkillIds];
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
            wave: this._wave,
            freeRefreshesRemaining: this._freeRefreshesRemaining,
            rewardedAdRefreshAvailable: this._rewardedAdRefreshAvailable,
            rewardedAdRefreshPending: this._rewardedAdRefreshPending,
            profession: this._profession,
            choices: this._choices.map((choice) => ({
                ...choice,
                locked: this._lockedSkillIds.indexOf(choice.data.id) >= 0,
            })),
            picked: [...this._picked],
        };
    }

    private _rollChoices(): HexChoiceView[] {
        // Base 3 choices; P / extraChoice → up to 4 (pitch: P gives 4-pick)
        const count = Math.min(4, 3 + this._flags.extraChoice);
        const results: HexChoiceView[] = [];
        const pickedUnique = new Set(this._picked.filter((card) => !card.repeatable).map((card) => card.id));
        const pool = HEX_CARDS.filter((card) => card.repeatable || !pickedUnique.has(card.id));
        const seen = new Set<string>();
        let guard = 0;

        while (results.length < count && seen.size < pool.length && guard < 200) {
            guard += 1;
            const card = this._weightedPick(pool);
            if (seen.has(card.id)) continue;
            seen.add(card.id);
            results.push({
                data: card,
                alreadyPicked: false,
                locked: this._lockedSkillIds.indexOf(card.id) >= 0,
            });
        }

        return results;
    }

    private _weightedPick(pool: HexCardData[]): HexCardData {
        const total = pool.reduce((sum, card) => sum + this._getCardWeight(card), 0);
        let roll = Math.random() * total;

        for (const card of pool) {
            roll -= this._getCardWeight(card);
            if (roll <= 0) return card;
        }

        return pool[0] ?? HEX_CARDS[0];
    }

    /**
     * Base rarity weight × exclusive draft bias.
     * Matching exclusiveTo profession: ~3.2× weight (signature often appears).
     * Other professions seeing someone else's exclusive: ~0.35× (rare teaser).
     */
    private _getCardWeight(card: HexCardData): number {
        const rarityWeight = this._getWeight(card.rarity);
        if (!card.exclusiveTo) return rarityWeight;
        if (card.exclusiveTo === this._profession.id) return rarityWeight * 3.2;
        return rarityWeight * 0.35;
    }

    private _getWeight(rarity: Rarity): number {
        const bias = this._flags.colorBias;
        const luck = this._getCurrentLuck();
        const base = RARITY_WEIGHT[rarity] ?? 20;
        if (rarity === 'purple') return base + bias * 6 + luck * 1.2;
        if (rarity === 'orange') return base + bias * 2 + luck * 0.45;
        if (rarity === 'blue') return base + bias * 1 + luck * 0.3;
        return Math.max(12, base - bias * 4 - luck * 0.6);
    }

    private _getCurrentLuck(): number {
        return Math.max(0, this.getTotalCombatBonus().luck ?? 0);
    }

    private _sumFlags(source: Partial<HexFlags>): Partial<HexFlags> {
        return {
            colorBias: this._flags.colorBias + (source.colorBias ?? 0),
            extraChoice: this._flags.extraChoice + (source.extraChoice ?? 0),
            freeRefreshBonus: this._flags.freeRefreshBonus + (source.freeRefreshBonus ?? 0),
            lockedSkillSlots: this._flags.lockedSkillSlots + (source.lockedSkillSlots ?? 0),
        };
    }

    private _getFreeRefreshCount(): number {
        return 1 + this._flags.freeRefreshBonus;
    }

    private _addBonus(target: CombatBonus, source: CombatBonus): void {
        target.maxHp = (target.maxHp ?? 0) + (source.maxHp ?? 0);
        target.armor = (target.armor ?? 0) + (source.armor ?? 0);
        target.dodge = (target.dodge ?? 0) + (source.dodge ?? 0);
        target.luck = (target.luck ?? 0) + (source.luck ?? 0);
        target.moveSpeed = (target.moveSpeed ?? 0) + (source.moveSpeed ?? 0);
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
        target.critChance = (target.critChance ?? 0) + (source.critChance ?? 0);
        target.critMultiplier = (target.critMultiplier ?? 0) + (source.critMultiplier ?? 0);
        target.lifesteal = (target.lifesteal ?? 0) + (source.lifesteal ?? 0);
        target.executeBonus = (target.executeBonus ?? 0) + (source.executeBonus ?? 0);
        target.bossDamageBonus = (target.bossDamageBonus ?? 0) + (source.bossDamageBonus ?? 0);
    }
}

export type { HexViewModel, HexCardData, ProfessionId, CombatBonus };
