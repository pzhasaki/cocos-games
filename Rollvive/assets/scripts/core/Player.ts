import { _decorator, Animation, Color, Component, Node, Sprite, Vec3 } from 'cc';
import { GameCtrl, GameEvent } from './GameCtrl';
import type { CombatBonus } from '../data/RollData';

const { ccclass, property } = _decorator;

@ccclass('PlayerAttr')
class PlayerAttr {
    @property
    public maxHp: number = 100;

    @property
    public speed: number = 200;

    @property
    public attackDamage: number = 15;

    @property
    public attackRange: number = 100;

    @property
    public attackCooldown: number = 0.2;

    @property
    public ultimateMultiplier: number = 5;

    @property
    public energyPerAttack: number = 15;

    @property
    public maxEnergy: number = 100;

    @property
    public shieldReduction: number = 0.7;

    @property
    public invincibleTime: number = 300;
}

@ccclass('Player')
export class Player extends Component {
    @property({ type: PlayerAttr })
    public attrs: PlayerAttr = new PlayerAttr();

    @property({ type: Sprite })
    public bodySprite: Sprite | null = null;

    @property({ type: Animation })
    public anim: Animation | null = null;

    @property({ type: Node })
    public attackEffectNode: Node | null = null;

    @property({ type: Node })
    public shieldEffectNode: Node | null = null;

    @property({ type: Node })
    public ultimateEffectNode: Node | null = null;

    private _hp = 100;
    private _energy = 0;
    private _isDead = false;
    private _invincible = false;
    private _isShielding = false;
    private _isAttacking = false;
    private _runBonus: CombatBonus = {};
    private _killCount = 0;
    private _totalDamageDealt = 0;

    public get hp(): number { return this._hp; }
    public get maxHp(): number { return Math.max(1, this.attrs.maxHp + (this._runBonus.maxHp ?? 0)); }
    public get energy(): number { return this._energy; }
    public get maxEnergy(): number { return this.attrs.maxEnergy; }
    public get isDead(): boolean { return this._isDead; }
    public get isShielding(): boolean { return this._isShielding; }
    public get killCount(): number { return this._killCount; }
    public get totalDamageDealt(): number { return this._totalDamageDealt; }
    public get attackDamage(): number { return this._getAttackDamage(); }

    protected start(): void {
        this._registerEvents();
        this.reset();
    }

    protected onDestroy(): void {
        this._unregisterEvents();
    }

    public resetRunBonuses(): void {
        this._runBonus = {};
    }

    public setRunBonuses(bonus: CombatBonus): void {
        const oldMaxHp = this.maxHp;
        this._runBonus = { ...bonus };
        const newMaxHp = this.maxHp;
        if (newMaxHp > oldMaxHp) {
            this._hp += newMaxHp - oldMaxHp;
        }
        this._hp = Math.min(newMaxHp, Math.max(1, this._hp));
        this._refreshUI();
    }

    public reset(): void {
        this._hp = this.maxHp;
        this._energy = 0;
        this._isDead = false;
        this._invincible = false;
        this._isShielding = false;
        this._isAttacking = false;
        this._killCount = 0;
        this._totalDamageDealt = 0;

        this._setNodeActive(this.attackEffectNode, false);
        this._setNodeActive(this.shieldEffectNode, false);
        this._setNodeActive(this.ultimateEffectNode, false);
        this.anim?.play('player_idle');
        this._refreshUI();
    }

    public addKill(): void {
        this._killCount++;
    }

    public addDamageDealt(dmg: number): void {
        this._totalDamageDealt += dmg;
    }

    public takeDamage(damage: number, source?: Node): number {
        if (this._isDead || this._invincible) return 0;

        if (Math.random() < this._getDodgeChance()) {
            this._invincible = true;
            this._flashSprite();
            this.scheduleOnce(() => {
                this._invincible = false;
            }, this.attrs.invincibleTime / 1000);
            return 0;
        }

        const shieldReduction = Math.min(0.9, this.attrs.shieldReduction + (this._runBonus.shieldReduction ?? 0));
        const armoredDamage = damage * (100 / (100 + this._getArmor() * 8));
        const finalDamage = Math.max(1, Math.floor(this._isShielding ? armoredDamage * (1 - shieldReduction) : armoredDamage));
        this._hp = Math.max(0, this._hp - finalDamage);
        this._invincible = true;

        this.anim?.play('player_hit');
        this._flashSprite();
        this._refreshUI();
        GameCtrl.emit(GameEvent.PLAYER_DAMAGED, finalDamage);

        this.scheduleOnce(() => {
            this._invincible = false;
        }, this.attrs.invincibleTime / 1000);

        if (this._hp <= 0) {
            this._die();
        }

        return finalDamage;
    }

    public heal(amount: number): void {
        this._hp = Math.min(this.maxHp, this._hp + amount);
        this._refreshUI();
    }

    private _registerEvents(): void {
        GameCtrl.on(GameEvent.GYRO_ATTACK, this._onAttack, this);
        GameCtrl.on(GameEvent.GYRO_ULTIMATE, this._onUltimate, this);
        GameCtrl.on(GameEvent.GYRO_SHIELD, this._onShieldStart, this);
        GameCtrl.on(GameEvent.GYRO_SHIELD_END, this._onShieldEnd, this);
    }

    private _unregisterEvents(): void {
        GameCtrl.off(GameEvent.GYRO_ATTACK, this._onAttack, this);
        GameCtrl.off(GameEvent.GYRO_ULTIMATE, this._onUltimate, this);
        GameCtrl.off(GameEvent.GYRO_SHIELD, this._onShieldStart, this);
        GameCtrl.off(GameEvent.GYRO_SHIELD_END, this._onShieldEnd, this);
    }

    private _onAttack(): void {
        if (this._isDead || this._isAttacking) return;

        this._isAttacking = true;
        this._energy = Math.min(this._energy + this._getEnergyPerAttack(), this.maxEnergy);
        this.anim?.play('player_attack');
        this._showEffect(this.attackEffectNode, 160);
        this._performBladeAttack();
        this._refreshUI();

        this.scheduleOnce(() => {
            this._isAttacking = false;
        }, this._getAttackCooldown());
    }

    private _onUltimate(): void {
        if (this._isDead) return;
        if (this._energy < this.maxEnergy) {
            this._onAttack();
            return;
        }

        this._energy = 0;
        this.anim?.play('player_ultimate');
        this._showEffect(this.ultimateEffectNode, 600);

        const damage = this._getAttackDamage() * this._getUltimateMultiplier();
        const hitCount = GameCtrl.instance.waveManager?.damageAllMonsters(damage) ?? 0;
        this.addDamageDealt(damage * hitCount);
        GameCtrl.instance.uiManager?.flashScreen();
        this._refreshUI();
    }

    private _performBladeAttack(): void {
        const pos = this.node.getWorldPosition();
        const baseDamage = this._getAttackDamage();
        const bladeCount = Math.max(1, 1 + Math.floor(this._runBonus.bladeCount ?? 0));
        const splitCount = Math.max(0, Math.floor(this._runBonus.splitBlades ?? 0));
        const orbitCount = Math.max(0, Math.floor(this._runBonus.orbitBladeCount ?? 0));
        const chainHits = Math.max(0, Math.floor(this._runBonus.chainHits ?? 0));
        const range = this._getAttackRange();
        let totalHits = 0;

        for (let i = 0; i < bladeCount; i++) {
            const radius = range + (i % 3) * 8;
            totalHits += this._hitMonsters(pos, radius, baseDamage);
        }

        for (let i = 0; i < splitCount; i++) {
            totalHits += this._hitMonsters(pos, range * 0.78, baseDamage * 0.45);
        }

        if (orbitCount > 0) {
            totalHits += this._hitMonsters(pos, range * 0.55, baseDamage * 0.55 * orbitCount);
        }

        if (chainHits > 0 && totalHits > 0) {
            totalHits += this._hitMonsters(pos, range * 1.15, baseDamage * 0.28 * chainHits);
        }
    }

    private _hitMonsters(center: Vec3, radius: number, damage: number): number {
        const hitCount = GameCtrl.instance.waveManager?.damageMonstersInRange(center, radius, damage, false) ?? 0;
        if (hitCount > 0) {
            this.addDamageDealt(damage * hitCount);
        }
        return hitCount;
    }

    private _onShieldStart(): void {
        if (this._isDead) return;
        this._isShielding = true;
        this._setNodeActive(this.shieldEffectNode, true);
        this.anim?.play('player_shield');
    }

    private _onShieldEnd(): void {
        this._isShielding = false;
        this._setNodeActive(this.shieldEffectNode, false);
    }

    private _die(): void {
        if (this._isDead) return;
        this._isDead = true;
        this.anim?.play('player_die');
        this._setNodeActive(this.shieldEffectNode, false);
        this.scheduleOnce(() => {
            GameCtrl.instance.onPlayerDied();
        }, 0.5);
    }

    private _getAttackDamage(): number {
        const flat = this.attrs.attackDamage + (this._runBonus.damage ?? 0);
        return Math.max(1, flat * (1 + (this._runBonus.damagePercent ?? 0)));
    }

    private _getAttackRange(): number {
        return Math.max(30, this.attrs.attackRange + (this._runBonus.attackRange ?? 0));
    }

    private _getAttackCooldown(): number {
        return Math.max(0.06, this.attrs.attackCooldown + (this._runBonus.attackCooldown ?? 0));
    }

    private _getEnergyPerAttack(): number {
        return Math.max(1, this.attrs.energyPerAttack + (this._runBonus.energyPerAttack ?? 0));
    }

    private _getUltimateMultiplier(): number {
        return Math.max(1, this.attrs.ultimateMultiplier + (this._runBonus.ultimateMultiplier ?? 0));
    }

    private _getArmor(): number {
        return Math.max(0, this._runBonus.armor ?? 0);
    }

    private _getDodgeChance(): number {
        return Math.min(0.45, Math.max(0, this._runBonus.dodge ?? 0));
    }

    private _showEffect(node: Node | null, durationMs: number): void {
        if (!node) return;
        node.active = true;
        this.scheduleOnce(() => {
            node.active = false;
        }, durationMs / 1000);
    }

    private _setNodeActive(node: Node | null, active: boolean): void {
        if (node) {
            node.active = active;
        }
    }

    private _flashSprite(): void {
        if (!this.bodySprite) return;
        const original = this.bodySprite.color.clone();
        this.bodySprite.color = Color.RED;
        this.scheduleOnce(() => {
            if (this.bodySprite) {
                this.bodySprite.color = original;
            }
        }, 0.1);
    }

    private _refreshUI(): void {
        GameCtrl.instance.uiManager?.updatePlayerStats(this._hp, this.maxHp, this._energy, this.maxEnergy);
    }
}
