import { _decorator, Component } from 'cc';
import { GameState } from '../core/GameCtrl';
import { SceneBinder } from './SceneBinder';

const { ccclass, property } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
    @property({ type: SceneBinder })
    public sceneBinder: SceneBinder | null = null;

    @property
    public useTemporaryRuntimeEntry = true;

    protected start(): void {
        const binder = this.sceneBinder ?? this.node.getComponent(SceneBinder) ?? this.node.getComponentInChildren(SceneBinder);
        if (!binder) {
            console.warn('[GameBootstrap] SceneBinder is missing.');
            return;
        }

        if (this.useTemporaryRuntimeEntry) {
            binder.setTemporaryRuntimeActive(true);
            return;
        }

        binder.setTemporaryRuntimeActive(false);
        const gameCtrl = binder.resolveGameCtrl();
        if (!gameCtrl) {
            console.warn('[GameBootstrap] GameCtrl is missing.');
            return;
        }

        if (gameCtrl.state !== GameState.START) {
            gameCtrl.changeState(GameState.START);
        }
    }
}
