import { _decorator, Component, Node } from 'cc';
import { GameCtrl } from '../core/GameCtrl';
import { RuntimeEntry } from '../RuntimeEntry';

const { ccclass, property } = _decorator;

@ccclass('SceneBinder')
export class SceneBinder extends Component {
    @property({ type: GameCtrl })
    public gameCtrl: GameCtrl | null = null;

    @property({ type: RuntimeEntry })
    public runtimeEntry: RuntimeEntry | null = null;

    @property({ type: Node })
    public uiRoot: Node | null = null;

    @property({ type: Node })
    public worldRoot: Node | null = null;

    public resolveGameCtrl(): GameCtrl | null {
        return this.gameCtrl ?? this.node.getComponentInChildren(GameCtrl);
    }

    public resolveRuntimeEntry(): RuntimeEntry | null {
        return this.runtimeEntry ?? this.node.getComponentInChildren(RuntimeEntry);
    }

    public setTemporaryRuntimeActive(active: boolean): void {
        const runtime = this.resolveRuntimeEntry();
        if (runtime) {
            runtime.node.active = active;
        }
    }
}
