/**
 * Bullet.ts — 弹道/子弹组件
 *
 * 同时服务于:
 *   - 玩家武器攻击弹道
 *   - 怪物远程攻击弹道
 *
 * 使用对象池管理（由 WaveManager 分配和回收）
 *
 * 场景挂载: Bullet_Prefab 根节点
 */
import { _decorator, Component, Node, Vec3, v3, Sprite, Collider2D, Contact2DType, IPhysics2DContact, Color } from 'cc';
import { Player } from './Player';
import { MonsterAI } from './MonsterAI';
import { GameCtrl, GameEvent } from './GameCtrl';

const { ccclass, property } = _decorator;

@ccclass('Bullet')
export class Bullet extends Component {
    @property({ type: Sprite, tooltip: '弹道精灵' })
    public sprite: Sprite | null = null;

    @property({ type: Node, tooltip: '击中特效节点' })
    public hitEffectNode: Node | null = null;

    /* ---- 运行时 ---- */
    private _direction: Vec3 = v3(0, 0, 0);
    private _speed: number = 300;
    private _damage: number = 10;
    private _isEnemyBullet: boolean = false;
    private _active: boolean = false;
    private _lifeTime: number = 0;
    private readonly _maxLife: number = 5; // 最大存活秒数

    protected start(): void {
        const collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this);
        }
    }

    protected update(dt: number): void {
        if (!this._active) return;

        // 弹道飞行
        const movement = new Vec3(
            this._direction.x * this._speed * dt,
            this._direction.y * this._speed * dt,
            0,
        );
        this.node.position = this.node.position.add(movement);

        // 超期回收
        this._lifeTime += dt;
        if (this._lifeTime >= this._maxLife) {
            this._deactivate();
        }
    }

    /** 发射子弹 (由武器或MonsterAI调用) */
    public fire(
        origin: Vec3,
        target: Vec3,
        speed: number,
        damage: number,
        isEnemyBullet: boolean,
    ): void {
        this.node.position.set(origin);

        // 计算方向
        Vec3.subtract(this._direction, target, origin);
        this._direction.y = 0; // 水平方向
        this._direction.normalize();

        this._speed = speed;
        this._damage = damage;
        this._isEnemyBullet = isEnemyBullet;
        this._lifeTime = 0;
        this._active = true;

        this.node.active = true;

        // 翻转精灵朝向
        if (this.sprite) {
            const scale = this.sprite.node.scale.clone();
            scale.x = this._direction.x < 0 ? -1 : 1;
            this.sprite.node.setScale(scale);
        }
    }

    /** 回收子弹回对象池 */
    public recycle(): void {
        this._deactivate();
    }

    private _deactivate(): void {
        this._active = false;
        this.node.active = false;

        // 显示击中特效
        if (this.hitEffectNode) {
            this.hitEffectNode.active = true;
            this.scheduleOnce(() => {
                if (this.hitEffectNode) {
                    this.hitEffectNode.active = false;
                }
            }, 0.15);
        }
    }

    /* ======================== 碰撞 ======================== */

    private _onBeginContact(
        selfCollider: Collider2D,
        otherCollider: Collider2D,
        contact: IPhysics2DContact,
    ): void {
        if (!this._active) return;

        const otherNode = otherCollider.node;

        if (this._isEnemyBullet) {
            // 敌方子弹 → 伤害玩家
            const player = otherNode.getComponent(Player);
            if (player) {
                player.takeDamage(this._damage, this.node);
                this._deactivate();
            }
        } else {
            // 玩家子弹 → 伤害怪物
            const monster = otherNode.getComponent(MonsterAI);
            if (monster && monster.isAlive) {
                monster.takeDamage(this._damage);
                if (monster.hp <= 0) {
                    GameCtrl.instance.player?.addKill();
                }
                this._deactivate();
            }
        }
    }
}
