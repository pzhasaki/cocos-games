import { _decorator, Component, Node, director, game } from 'cc';
import { GyroManager } from '../manager/GyroManager';
import { UIManager } from '../manager/UIManager';
import { Player } from './Player';
import { WaveManager } from '../manager/WaveManager';
import { PlatformDef } from '../platform/PlatformDef';
import { RollSystem } from '../manager/RollSystem';
import type { HexViewModel, ProfessionId } from '../manager/RollSystem';

const { ccclass, property } = _decorator;

export enum GameState {
    IDLE = 'IDLE',
    START = 'START',
    BATTLE = 'BATTLE',
    ROLL_PHASE = 'ROLL_PHASE',
    PAUSE = 'PAUSE',
    RESULT = 'RESULT',
}

export const GameEvent = {
    GYRO_ATTACK: 'gyro-attack',
    GYRO_ULTIMATE: 'gyro-ultimate',
    GYRO_SHIELD: 'gyro-shield',
    GYRO_SHIELD_END: 'gyro-shield-end',
    PLAYER_DAMAGED: 'player-damaged',
    PLAYER_DIED: 'player-died',
    MONSTER_DAMAGED: 'monster-damaged',
    MONSTER_DIED: 'monster-died',
    WAVE_CLEAR: 'wave-clear',
    WAVE_UPDATE: 'wave-update',
    STATE_CHANGED: 'state-changed',
    RESULT_UPDATE: 'result-update',
    COIN_COLLECTED: 'coin-collected',
} as const;

@ccclass('GameCtrl')
export class GameCtrl extends Component {
    private static _instance: GameCtrl | null = null;

    public static get instance(): GameCtrl {
        if (!GameCtrl._instance) {
            throw new Error('GameCtrl is not initialized. Check GameScene bindings.');
        }
        return GameCtrl._instance;
    }

    @property({ type: GyroManager })
    public gyroManager: GyroManager | null = null;

    @property({ type: UIManager })
    public uiManager: UIManager | null = null;

    @property({ type: Player })
    public player: Player | null = null;

    @property({ type: WaveManager })
    public waveManager: WaveManager | null = null;

    @property
    public restartOnGameOver: boolean = true;

    @property
    public startingGold: number = 4;

    @property
    public maxWaves: number = 20;

    @property({ tooltip: 'blade_adept | hex_gambler | storm_mage' })
    public selectedProfession: string = 'blade_adept';

    private _state: GameState = GameState.IDLE;
    private _elapsed = 0;
    private _isPaused = false;
    private _waveCount = 0;
    private _runActive = false;
    private _victory = false;
    private readonly _hexSystem = new RollSystem();

    protected onLoad(): void {
        if (GameCtrl._instance) {
            this.node.destroy();
            return;
        }

        GameCtrl._instance = this;
        this.node.on(GameEvent.COIN_COLLECTED, this._onCoinCollected, this);
    }

    protected start(): void {
        PlatformDef.init();
        this.changeState(GameState.START);
    }

    protected update(dt: number): void {
        if (this._state !== GameState.BATTLE || this._isPaused) return;
        this._elapsed += dt;
    }

    protected onDestroy(): void {
        this.node.off(GameEvent.COIN_COLLECTED, this._onCoinCollected, this);
        if (GameCtrl._instance === this) {
            GameCtrl._instance = null;
        }
    }

    public get state(): GameState {
        return this._state;
    }

    public get waveCount(): number {
        return this._waveCount;
    }

    public get rollView(): HexViewModel {
        return this._hexSystem.getViewModel();
    }

    public changeState(newState: GameState): void {
        if (this._state === newState) return;

        const oldState = this._state;
        this._exitState(oldState);
        this._state = newState;
        this._enterState(newState);
        this.node.emit(GameEvent.STATE_CHANGED, oldState, newState);
        console.log(`[GameCtrl] State ${oldState} -> ${newState}`);
    }

    public startGame(): void {
        this._startNewRun();
        this.changeState(GameState.BATTLE);
    }

    public selectProfession(professionId: string): void {
        if (this._runActive) return;
        this.selectedProfession = professionId;
        PlatformDef.showToast(`Profession: ${professionId}`);
    }

    public onWaveClear(): void {
        if (this._state !== GameState.BATTLE) return;

        this.node.emit(GameEvent.WAVE_CLEAR, this._waveCount);
        const income = this._hexSystem.grantWaveRewards(this._waveCount);
        this._syncEconomyUI();
        PlatformDef.showToast(`Wave clear: +${income} gold`);

        if (this.maxWaves > 0 && this._waveCount >= this.maxWaves) {
            this._victory = true;
            this.changeState(GameState.RESULT);
            return;
        }

        this.changeState(GameState.ROLL_PHASE);
    }

    public onRollReady(): void {
        if (this._state !== GameState.ROLL_PHASE) return;
        this.selectHexChoice(0);
    }

    public rerollHexDraft(): void {
        if (this._state !== GameState.ROLL_PHASE) return;
        const message = this._hexSystem.rerollDraft();
        this._syncEconomyUI();
        this.uiManager?.refreshRollUI();
        PlatformDef.showToast(message);
    }

    public selectHexChoice(index: number): void {
        if (this._state !== GameState.ROLL_PHASE) return;

        const result = this._hexSystem.selectChoice(index);
        PlatformDef.showToast(result.message);
        if (!result.ok) return;

        this._syncPlayerBonuses();
        this._syncEconomyUI();
        this._waveCount += 1;
        this.changeState(GameState.BATTLE);
    }

    public togglePause(): void {
        if (this._state === GameState.BATTLE) {
            this.changeState(GameState.PAUSE);
        } else if (this._state === GameState.PAUSE) {
            this.resumeGame();
        }
    }

    public resumeGame(): void {
        if (this._state !== GameState.PAUSE) return;
        this._isPaused = false;
        this.uiManager?.showPausePanel(false);
        this.gyroManager?.setActive(true);
        game.resume();
        this._state = GameState.BATTLE;
        this.node.emit(GameEvent.STATE_CHANGED, GameState.PAUSE, GameState.BATTLE);
    }

    public onPlayerDied(): void {
        this._victory = false;
        this.gyroManager?.setActive(false);
        this.waveManager?.clearAllMonsters();
        this.changeState(GameState.RESULT);
    }

    public restart(): void {
        game.resume();
        if (this.restartOnGameOver) {
            director.loadScene(director.getScene()!.name);
        } else {
            this.changeState(GameState.START);
        }
    }

    private _startNewRun(): void {
        this._elapsed = 0;
        this._isPaused = false;
        this._waveCount = 1;
        this._runActive = true;
        this._victory = false;
        this._hexSystem.reset(this.startingGold, this.selectedProfession as ProfessionId);
        this._syncPlayerBonuses();
        this.player?.reset();
        this._syncEconomyUI();
    }

    private _exitState(state: GameState): void {
        switch (state) {
            case GameState.BATTLE:
                this.gyroManager?.setActive(false);
                this.waveManager?.clearAllMonsters();
                break;
            case GameState.ROLL_PHASE:
                this.uiManager?.showRollPanel(false);
                break;
            case GameState.PAUSE:
                this.uiManager?.showPausePanel(false);
                break;
        }
    }

    private _enterState(state: GameState): void {
        switch (state) {
            case GameState.START:
                this._onStart();
                break;
            case GameState.BATTLE:
                this._onBattleStart();
                break;
            case GameState.ROLL_PHASE:
                this._onRollPhaseStart();
                break;
            case GameState.PAUSE:
                this._onPause();
                break;
            case GameState.RESULT:
                this._onResult();
                break;
        }
    }

    private _onStart(): void {
        this._runActive = false;
        this._elapsed = 0;
        this._waveCount = 0;
        this._isPaused = false;
        this.gyroManager?.setActive(false);
        this.uiManager?.showStartPanel(true);
        this.uiManager?.showBattleUI(false);
        this.uiManager?.showRollPanel(false);
        this.uiManager?.showResultPanel(false);
    }

    private _onBattleStart(): void {
        if (!this._runActive) {
            this._startNewRun();
        }

        this._isPaused = false;
        this.uiManager?.showStartPanel(false);
        this.uiManager?.showResultPanel(false);
        this.uiManager?.showBattleUI(true);
        this.uiManager?.updateWaveDisplay(this._waveCount);
        this.gyroManager?.setActive(true);
        this.waveManager?.startWave(this._waveCount);
    }

    private _onRollPhaseStart(): void {
        this._hexSystem.beginDraft(this._waveCount);
        this._syncEconomyUI();
        this.uiManager?.showBattleUI(false);
        this.uiManager?.showRollPanel(true);
    }

    private _onPause(): void {
        this._isPaused = true;
        this.gyroManager?.setActive(false);
        this.uiManager?.showPausePanel(true);
        game.pause();
    }

    private _onResult(): void {
        this._isPaused = true;
        this._runActive = false;
        this.gyroManager?.setActive(false);
        this.waveManager?.clearAllMonsters();
        this.uiManager?.showBattleUI(false);
        this.uiManager?.showRollPanel(false);

        const stats = {
            wave: this._waveCount,
            time: Math.floor(this._elapsed),
            kills: this.player?.killCount ?? 0,
            damageDealt: this.player?.totalDamageDealt ?? 0,
            victory: this._victory,
        };
        this.node.emit(GameEvent.RESULT_UPDATE, stats);
        this.uiManager?.showResultPanel(true);
        this.uiManager?.updateResult(stats);
    }

    private _syncPlayerBonuses(): void {
        this.player?.setRunBonuses(this._hexSystem.getTotalCombatBonus());
    }

    private _syncEconomyUI(): void {
        const view = this._hexSystem.getViewModel();
        this.uiManager?.updateGold(view.gold);
        this.uiManager?.updateRollHeader(view);
    }

    private _onCoinCollected(amount: number = 1): void {
        this._hexSystem.addGold(amount);
        this._syncEconomyUI();
    }

    public static on(event: string, callback: (...args: any[]) => void, target?: unknown): void {
        GameCtrl._instance?.node.on(event, callback, target);
    }

    public static off(event: string, callback: (...args: any[]) => void, target?: unknown): void {
        GameCtrl._instance?.node.off(event, callback, target);
    }

    public static emit(event: string, ...args: any[]): void {
        GameCtrl._instance?.node.emit(event, ...args);
    }
}
