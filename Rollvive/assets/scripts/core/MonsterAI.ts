import {
    _decorator,
    Animation,
    Collider2D,
    Color,
    Component,
    Contact2DType,
    IPhysics2DContact,
    Node,
    Sprite,
    v3,
    Vec3,
} from 'cc';
import { Bullet } from './Bullet';
import { GameCtrl, GameEvent } from './GameCtrl';
import { Player } from './Player';

const { ccclass, property } = _decorator;

export enum MonsterState {
    IDLE = 'IDLE',
    CHASE = 'CHASE',
    CHARGE = 'CHARGE',
    RANGED_ATTACK = 'RANGED_ATTACK',
    HIT = 'HIT',
    DIE = 'DIE',
}

export enum MonsterType {
    NORMAL = 'NORMAL',
    ELITE = 'ELITE',
    BOSS = 'BOSS',
}

@ccclass('MonsterAI')
export class MonsterAI extends Component {
    @property({ type: Sprite })
    public bodySprite: Sprite | null = null;

    @property({ type: Animation })
    public anim: Animation | null = null;

    @property
    public monsterType: MonsterType = MonsterType.NORMAL;

    @property
    public maxHp: number = 50;

    @property
    public speed: number = 80;

    @property
    public chargeSpeed: number = 350;

    @property
    public chargeDamage: number = 15;

    @property
    public bulletSpeed: number = 250;

    @property
    public rangedDamage: number = 10;

    @property
    public attackInterval: number = 3;

    @property
    public chaseRange: number = 500;

    @property
    public meleeRange: number = 60;

    private _hp = 50;
    private _state: MonsterState = MonsterState.IDLE;
    private _player: Player | null = null;
    private _playerNode: Node | null = null;
    private _stateTimer = 0;
    private _isActive = false;
    private _isCharging = false;
    private readonly _chargeTargetPos: Vec3 = v3();

    public get hp(): number {
        return this._hp;
    }

    public get state(): MonsterState {
        return this._state;
    }

    public get isAlive(): boolean {
        return this._state !== MonsterState.DIE;
    }

    public get actorType(): MonsterType {
        return this.monsterType;
    }

    protected start(): void {
        this._hp = this.maxHp;
        this._player = GameCtrl.instance.player;
        this._playerNode = this._player?.node ?? null;

        const collider = this.getComponent(Collider2D);
        collider?.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this);
    }

    protected onDestroy(): void {
        const collider = this.getComponent(Collider2D);
        collider?.off(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this);
    }

    protected update(dt: number): void {
        if (!this._isActive || this._state === MonsterState.DIE || this._state === MonsterState.HIT) {
            return;
        }

        this._stateTimer -= dt;
        switch (this._state) {
            case MonsterState.IDLE:
                this._updateIdle();
                break;
            case MonsterState.CHASE:
                this._updateChase(dt);
                break;
            case MonsterState.CHARGE:
                this._updateCharge(dt);
                break;
            case MonsterState.RANGED_ATTACK:
                break;
        }
    }

    public activate(): void {
        this._isActive = true;
        this._hp = this.maxHp;
        this._state = MonsterState.IDLE;
        this._stateTimer = 0.5;
        this._isCharging = false;
        this.node.active = true;
    }

    public deactivate(): void {
        this._isActive = false;
        this._state = MonsterState.IDLE;
        this._isCharging = false;
        this.node.active = false;
    }

    public takeDamage(damage: number): boolean {
        if (this._state === MonsterState.DIE) return false;

        this._hp = Math.max(0, this._hp - Math.max(0, damage));
        this._flashHit();
        GameCtrl.emit(GameEvent.MONSTER_DAMAGED, damage, this.node);

        if (this._hp <= 0) {
            this._die();
            return true;
        }

        if (this._state !== MonsterState.HIT) {
            this._changeState(MonsterState.HIT);
            this.scheduleOnce(() => {
                if (this._state === MonsterState.HIT) {
                    this._changeState(MonsterState.CHASE);
                }
            }, 0.2);
        }

        return false;
    }

    private _updateIdle(): void {
        if (this._stateTimer <= 0) {
            this._changeState(MonsterState.CHASE);
        }
    }

    private _updateChase(dt: number): void {
        if (!this._playerNode) return;

        const dist = this._distanceToPlayer();
        this._moveTowardPlayer(this.speed, dt);

        if (dist < this.meleeRange * 3 && this._stateTimer <= -this.attackInterval) {
            this._changeState(MonsterState.CHARGE);
            return;
        }

        if (dist > this.meleeRange * 2 && this._stateTimer <= -this.attackInterval * 1.5) {
            this._changeState(MonsterState.RANGED_ATTACK);
        }
    }

    private _updateCharge(dt: number): void {
        if (!this._isCharging || !this._playerNode) return;

        const dir = new Vec3();
        Vec3.subtract(dir, this._chargeTargetPos, this.node.position);
        dir.y = 0;

        if (dir.length() < 10) {
            this._isCharging = false;
            this._changeState(MonsterState.CHASE);
            return;
        }

        dir.normalize().multiplyScalar(this.chargeSpeed * dt);
        this.node.position = this.node.position.add(dir);

        if (this._stateTimer <= -1.5) {
            this._isCharging = false;
            this._changeState(MonsterState.CHASE);
        }
    }

    private _changeState(newState: MonsterState): void {
        if (this._state === newState) return;

        this._state = newState;
        this._stateTimer = 0;

        switch (newState) {
            case MonsterState.IDLE:
                this.anim?.play('monster_idle');
                break;
            case MonsterState.CHASE:
                this.anim?.play('monster_walk');
                break;
            case MonsterState.CHARGE:
                this._prepareCharge();
                break;
            case MonsterState.RANGED_ATTACK:
                this._performRangedAttack();
                break;
            case MonsterState.HIT:
                this.anim?.play('monster_hit');
                break;
        }
    }

    private _prepareCharge(): void {
        if (!this._playerNode) return;

        this._chargeTargetPos.set(this._playerNode.getWorldPosition());
        this.anim?.play('monster_charge_ready');
        this.scheduleOnce(() => {
            if (this._state === MonsterState.CHARGE) {
                this._isCharging = true;
                this.anim?.play('monster_charge');
            }
        }, 0.3);
    }

    private _performRangedAttack(): void {
        this.anim?.play('monster_attack_ranged');

        const bulletNode = GameCtrl.instance.waveManager?.getBulletFromPool();
        const bullet = bulletNode?.getComponent(Bullet);
        if (bullet) {
            bullet.fire(
                this.node.position,
                this._playerNode?.position ?? v3(),
                this.bulletSpeed,
                this.rangedDamage,
                true,
            );
        }

        this.scheduleOnce(() => {
            if (this._state === MonsterState.RANGED_ATTACK) {
                this._changeState(MonsterState.CHASE);
            }
        }, 0.4);
    }

    private _die(): void {
        this._changeState(MonsterState.DIE);
        this.anim?.play('monster_die');
        this._isActive = false;
        GameCtrl.emit(GameEvent.MONSTER_DIED, this.node);
        this.scheduleOnce(() => {
            GameCtrl.instance.waveManager?.recycleMonster(this.node);
        }, 0.5);
    }

    private _flashHit(): void {
        if (!this.bodySprite) return;

        const original = this.bodySprite.color.clone();
        this.bodySprite.color = Color.RED;
        this.scheduleOnce(() => {
            if (this.bodySprite) {
                this.bodySprite.color = original;
            }
        }, 0.08);
    }

    private _onBeginContact(
        _selfCollider: Collider2D,
        otherCollider: Collider2D,
        _contact: IPhysics2DContact,
    ): void {
        if (this._state === MonsterState.DIE) return;

        const player = otherCollider.getComponent(Player);
        if (!player || player.isDead) return;

        const damage = this._state === MonsterState.CHARGE ? this.chargeDamage : 5;
        player.takeDamage(damage, this.node);
    }

    private _distanceToPlayer(): number {
        if (!this._playerNode) return Infinity;
        return Vec3.distance(this.node.position, this._playerNode.position);
    }

    private _moveTowardPlayer(speed: number, dt: number): void {
        if (!this._playerNode) return;

        const dir = new Vec3();
        Vec3.subtract(dir, this._playerNode.position, this.node.position);
        if (dir.length() < this.meleeRange) return;

        dir.y = 0;
        dir.normalize().multiplyScalar(speed * dt);
        this.node.position = this.node.position.add(dir);
    }
}
