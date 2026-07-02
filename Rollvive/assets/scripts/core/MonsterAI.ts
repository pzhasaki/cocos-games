/**
 * MonsterAI.ts — 怪物 AI 组件（有限状态机）
 *
 * 状态流转:
 *   IDLE → CHASE → CHARGE / RANGED_ATTACK → IDLE
 *              ↕ (受击 → HIT → CHASE)
 *   HP ≤ 0 → DIE
 *
 * 每种怪物可通过 Prefab 上的属性面板差异化配置。
 *
 * 场景挂载: 每个怪物 Prefab 根节点
 */
import {
    _decorator, Component, Node, Vec3, v3, Sprite, Animation, Collider2D,
    Contact2DType, IPhysics2DContact, UITransform, tween, Tween, Color,
} from 'cc';
import { GameCtrl, GameEvent } from './GameCtrl';
import { Player } from './Player';
import { Bullet } from './Bullet';

const { ccclass, property } = _decorator;

/** 怪物行为状态 */
export enum MonsterState {
    IDLE = 'IDLE',
    CHASE = 'CHASE',
    CHARGE = 'CHARGE',
    RANGED_ATTACK = 'RANGED_ATTACK',
    HIT = 'HIT',
    DIE = 'DIE',
}

/** 怪物类型枚举 — 不同 Prefab 共用此脚本时区分行为 */
export enum MonsterType {
    NORMAL = 'NORMAL',
    ELITE = 'ELITE',
    BOSS = 'BOSS',
}

@ccclass('MonsterAI')
export class MonsterAI extends Component {
    /* ---- 面板注入 ---- */
    @property({ type: Sprite, tooltip: '怪物精灵' })
    public bodySprite: Sprite | null = null;

    @property({ type: Animation, tooltip: '怪物动画' })
    public anim: Animation | null = null;

    @property({ tooltip: '怪物类型' })
    public monsterType: MonsterType = MonsterType.NORMAL;

    @property({ tooltip: '最大生命值' })
    public maxHp: number = 50;

    @property({ tooltip: '行走速度 (px/s)' })
    public speed: number = 80;

    @property({ tooltip: '冲撞速度 (px/s)' })
    public chargeSpeed: number = 350;

    @property({ tooltip: '冲撞伤害' })
    public chargeDamage: number = 15;

    @property({ tooltip: '远程攻击弹道速度' })
    public bulletSpeed: number = 250;

    @property({ tooltip: '远程攻击伤害' })
    public rangedDamage: number = 10;

    @property({ tooltip: '攻击间隔 (s)' })
    public attackInterval: number = 3.0;

    @property({ tooltip: '追踪范围 (px)' })
    public chaseRange: number = 500;

    @property({ tooltip: '近战攻击范围 (px)' })
    public meleeRange: number = 60;

    @property({ tooltip: '死亡后掉落金币数' })
    public goldDrop: number = 1;

    /* ---- 运行时 ---- */
    private _hp: number = 50;
    private _state: MonsterState = MonsterState.IDLE;
    private _player: Player | null = null;
    private _playerNode: Node | null = null;
    private _stateTimer: number = 0;
    private _isActive: boolean = false;
    private _chargeTargetPos: Vec3 = v3(0, 0, 0);
    private _isCharging: boolean = false;

    // 掉落prefab引用（通过 WaveManager 对象池获取）
    private _dropCoinNode: Node | null = null;

    /* ======================== getter ======================== */

    public get hp(): number { return this._hp; }
    public get state(): MonsterState { return this._state; }
    public get isAlive(): boolean { return this._state !== MonsterState.DIE; }
    public get actorType(): MonsterType { return this.monsterType; }

    /* ======================== 生命周期 ======================== */

    protected start(): void {
        this._hp = this.maxHp;
        this._player = GameCtrl.instance.player;
        this._playerNode = this._player?.node ?? null;

        // 注册碰撞回调
        const collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this);
        }
    }

    protected update(dt: number): void {
        if (!this._isActive) return;
        if (this._state === MonsterState.DIE || this._state === MonsterState.HIT) return;

        this._stateTimer -= dt;

        switch (this._state) {
            case MonsterState.IDLE:
                this._updateIdle(dt);
                break;
            case MonsterState.CHASE:
                this._updateChase(dt);
                break;
            case MonsterState.CHARGE:
                this._updateCharge(dt);
                break;
            case MonsterState.RANGED_ATTACK:
                this._updateRangedAttack(dt);
                break;
        }
    }

    /* ======================== 公开接口 ======================== */

    /** 激活AI（波次开始时由 WaveManager 调用） */
    public activate(): void {
        this._isActive = true;
        this._hp = this.maxHp;
        this._state = MonsterState.IDLE;
        this._stateTimer = 0.5; // IDLE 0.5s 后进入 CHASE
        this.node.active = true;
    }

    /** 停用AI */
    public deactivate(): void {
        this._isActive = false;
        this._state = MonsterState.IDLE;
        this.node.active = false;
    }

    /** 受到伤害 (由碰撞/范围检测调用) */
    public takeDamage(damage: number): boolean {
        if (this._state === MonsterState.DIE) return false;

        this._hp -= damage;

        // 受击闪红
        if (this.bodySprite) {
            const orig = this.bodySprite.color.clone();
            this.bodySprite.color = Color.RED;
            this.scheduleOnce(() => {
                if (this.bodySprite) this.bodySprite.color = orig;
            }, 0.08);
        }

        // 受击状态
        if (this._state !== MonsterState.HIT) {
            this._changeState(MonsterState.HIT);
            this.scheduleOnce(() => {
                if (this._state === MonsterState.HIT) {
                    this._changeState(MonsterState.CHASE);
                }
            }, 0.2);
        }

        // 广播事件
        GameCtrl.emit(GameEvent.MONSTER_DAMAGED, damage, this.node);

        // 死亡
        if (this._hp <= 0) {
            this._die();
            return true;
        }
        return false;
    }

    /* ======================== 状态机 ======================== */

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

    /* ---------- IDLE ---------- */

    private _updateIdle(dt: number): void {
        if (this._stateTimer <= 0) {
            this._changeState(MonsterState.CHASE);
        }
    }

    /* ---------- CHASE 追踪玩家 ---------- */

    private _updateChase(dt: number): void {
        if (!this._playerNode) return;

        const dist = this._distanceToPlayer();
        if (dist > this.chaseRange) {
            // 超出追踪范围，原地巡逻（简化：直接朝向玩家走）
        }

        // 向玩家移动
        this._moveTowardPlayer(this.speed, dt);

        // 距离足够 → 冲撞
        if (dist < this.meleeRange * 3 && this._stateTimer <= -this.attackInterval) {
            this._changeState(MonsterState.CHARGE);
            return;
        }

        // 周期性远程攻击
        if (this._stateTimer <= -this.attackInterval * 1.5) {
            if (dist > this.meleeRange * 2) {
                this._changeState(MonsterState.RANGED_ATTACK);
                return;
            }
        }

        // 接近到近战范围 → 碰撞伤害由 contact 处理
    }

    /* ---------- CHARGE 冲撞 ---------- */

    private _prepareCharge(): void {
        if (!this._playerNode) return;
        this._chargeTargetPos.set(this._playerNode.getWorldPosition());

        // 冲撞预警（闪白或提示）
        this.anim?.play('monster_charge_ready');

        // 0.3s 后冲刺
        this.scheduleOnce(() => {
            if (this._state === MonsterState.CHARGE) {
                this._isCharging = true;
                this.anim?.play('monster_charge');
            }
        }, 0.3);
    }

    private _updateCharge(dt: number): void {
        if (!this._isCharging || !this._playerNode) return;

        // 朝目标位置高速移动
        const dir = new Vec3();
        Vec3.subtract(dir, this._chargeTargetPos, this.node.position);
        dir.y = 0; // 水平方向
        if (dir.length() < 10) {
            // 到达目标
            this._isCharging = false;
            this._changeState(MonsterState.CHASE);
            return;
        }
        dir.normalize().multiplyScalar(this.chargeSpeed * 0.016);
        this.node.position = this.node.position.add(dir);

        // 冲撞持续超过 1.5s 则结束
        this._stateTimer -= 0.016;
        if (this._stateTimer <= -1.5) {
            this._isCharging = false;
            this._changeState(MonsterState.CHASE);
        }
    }

    /* ---------- RANGED_ATTACK 远程弹道 ---------- */

    private _performRangedAttack(): void {
        this.anim?.play('monster_attack_ranged');

        // 生成子弹
        const bulletNode = this._spawnBullet();
        if (bulletNode) {
            const bullet = bulletNode.getComponent(Bullet);
            if (bullet) {
                bullet.fire(
                    this.node.position,
                    this._playerNode?.position ?? v3(0, 0, 0),
                    this.bulletSpeed,
                    this.rangedDamage,
                    true, // isEnemyBullet
                );
            }
        }

        // 恢复追踪
        this.scheduleOnce(() => {
            if (this._state === MonsterState.RANGED_ATTACK) {
                this._changeState(MonsterState.CHASE);
            }
        }, 0.4);
    }

    private _updateRangedAttack(dt: number): void {
        // 远程攻击是瞬间行为，状态由 timer 切换回 CHASE
    }

    /* ======================== 子弹生成 ======================== */

    private _spawnBullet(): Node | null {
        const wm = GameCtrl.instance.waveManager;
        if (!wm) return null;
        const bulletNode = wm.getBulletFromPool();
        if (!bulletNode) return null;
        return bulletNode;
    }

    /* ======================== 死亡 ======================== */

    private _die(): void {
        this._changeState(MonsterState.DIE);
        this.anim?.play('monster_die');
        this._isActive = false;

        // 掉落金币
        this._spawnDrop();

        // 广播
        GameCtrl.emit(GameEvent.MONSTER_DIED, this.node);

        // 通知 WaveManager 回收
        this.scheduleOnce(() => {
            GameCtrl.instance.waveManager?.recycleMonster(this.node);
        }, 0.5);
    }

    private _spawnDrop(): void {
        GameCtrl.instance.waveManager?.spawnDrop(
            this.node.position,
            this.goldDrop,
        );
    }

    /* ======================== 碰撞回调 ======================== */

    private _onBeginContact(
        selfCollider: Collider2D,
        otherCollider: Collider2D,
        contact: IPhysics2DContact,
    ): void {
        if (this._state === MonsterState.DIE) return;

        // 与玩家碰撞 → 冲撞伤害
        if (otherCollider.node.name === 'Player' || otherCollider.getComponent(Player)) {
            if (this._state === MonsterState.CHARGE || this._state === MonsterState.CHASE) {
                const player = otherCollider.getComponent(Player);
                if (player && !player.isDead) {
                    const dmg = this._state === MonsterState.CHARGE
                        ? this.chargeDamage
                        : 5; // 普通碰撞伤害
                    player.takeDamage(dmg, this.node);
                }
            }
        }
    }

    /* ======================== 工具方法 ======================== */

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

    /** 供 WaveManager 设置位置用 */
    public setDropNode(node: Node | null): void {
        this._dropCoinNode = node;
    }
}
