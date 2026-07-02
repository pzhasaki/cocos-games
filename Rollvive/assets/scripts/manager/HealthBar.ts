/**
 * HealthBar.ts — 简易血条组件（挂载在怪物节点上）
 *
 * 跟随怪物位置浮动显示血条
 *
 * 场景挂载: 怪物 Prefab 子节点 → HealthBar (ProgressBar)
 */
import { _decorator, Component, Node, ProgressBar, Vec3, v3 } from 'cc';
import { MonsterAI } from '../core/MonsterAI';

const { ccclass, property } = _decorator;

@ccclass('HealthBar')
export class HealthBar extends Component {
    @property({ type: ProgressBar, tooltip: '血条ProgressBar组件' })
    public progressBar: ProgressBar | null = null;

    @property({ tooltip: '血条偏移Y' })
    public offsetY: number = 40;

    private _owner: MonsterAI | null = null;
    private _ownerNode: Node | null = null;

    protected start(): void {
        // 寻找父级上的 MonsterAI
        let parent: Node | null = this.node.parent;
        while (parent) {
            this._owner = parent.getComponent(MonsterAI);
            if (this._owner) {
                this._ownerNode = parent;
                break;
            }
            parent = parent.parent;
        }
    }

    protected update(dt: number): void {
        if (!this._owner || !this._ownerNode) {
            this.node.active = false;
            return;
        }

        // 怪物死亡隐藏血条
        if (!this._owner.isAlive) {
            this.node.active = false;
            return;
        }

        // 更新血条位置（跟随怪物）
        const worldPos = this._ownerNode.worldPosition.clone();
        worldPos.y += this.offsetY;
        this.node.worldPosition = worldPos;

        // 更新血条值
        if (this.progressBar) {
            const ratio = this._owner.hp / this._owner.maxHp;
            this.progressBar.progress = Math.max(0, ratio);
        }
    }
}
