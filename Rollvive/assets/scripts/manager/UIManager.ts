import { _decorator, Button, Color, Component, Label, Node, ProgressBar, Slider, Sprite, UITransform } from 'cc';
import { GameCtrl, GameEvent, GameState } from '../core/GameCtrl';
import { PlatformDef } from '../platform/PlatformDef';
import type { HexViewModel } from './RollSystem';

const { ccclass, property } = _decorator;

export interface ResultStats {
    wave: number;
    time: number;
    kills: number;
    damageDealt: number;
    victory?: boolean;
}

@ccclass('UIManager')
export class UIManager extends Component {
    @property({ type: Node })
    public startPanel: Node | null = null;

    @property({ type: Button })
    public startButton: Button | null = null;

    @property({ type: Label })
    public healthNoticeLabel: Label | null = null;

    @property({ type: Node })
    public battleHUD: Node | null = null;

    @property({ type: ProgressBar })
    public hpBar: ProgressBar | null = null;

    @property({ type: Label })
    public hpLabel: Label | null = null;

    @property({ type: ProgressBar })
    public energyBar: ProgressBar | null = null;

    @property({ type: Label })
    public energyLabel: Label | null = null;

    @property({ type: Label })
    public waveLabel: Label | null = null;

    @property({ type: Label })
    public statusLabel: Label | null = null;

    @property({ type: Node })
    public pausePanel: Node | null = null;

    @property({ type: Button })
    public resumeButton: Button | null = null;

    @property({ type: Button })
    public sensitivityButton: Button | null = null;

    @property({ type: Node })
    public sensitivityPanel: Node | null = null;

    @property({ type: Slider })
    public sensitivitySlider: Slider | null = null;

    @property({ type: Label })
    public sensitivityLabel: Label | null = null;

    @property({ type: Node })
    public rollPanel: Node | null = null;

    @property({ type: Button })
    public rollDButton: Button | null = null;

    @property({ type: Button })
    public rollLockButton: Button | null = null;

    @property({ type: Button })
    public rollReadyButton: Button | null = null;

    @property({ type: Label })
    public rollCostLabel: Label | null = null;

    @property({ type: Label })
    public rollHeaderLabel: Label | null = null;

    @property({ type: [Button] })
    public hexChoiceButtons: Button[] = [];

    @property({ type: [Label] })
    public hexChoiceNameLabels: Label[] = [];

    @property({ type: [Label] })
    public hexChoiceDescLabels: Label[] = [];

    @property({ type: [Label] })
    public hexChoiceRarityLabels: Label[] = [];

    @property({ type: Label })
    public pickedHexLabel: Label | null = null;

    @property({ type: Node })
    public augmentPanel: Node | null = null;

    @property({ type: Node })
    public resultPanel: Node | null = null;

    @property({ type: Label })
    public resultWaveLabel: Label | null = null;

    @property({ type: Label })
    public resultTimeLabel: Label | null = null;

    @property({ type: Label })
    public resultKillsLabel: Label | null = null;

    @property({ type: Label })
    public resultDamageLabel: Label | null = null;

    @property({ type: Button })
    public resultRestartButton: Button | null = null;

    @property({ type: Node })
    public flashNode: Node | null = null;

    protected onLoad(): void {
        // RuntimeEntry owns the live Mind Dungeon UI. Do not spawn the old
        // Start/Battle fallback panels — they sit on Canvas and steal touches.
        if (this.node.getComponent('RuntimeEntry')) {
            this.enabled = false;
            return;
        }
        this._ensureFallbackUI();
    }

    protected start(): void {
        if (!this.enabled) return;
        this._ensureFallbackUI();
        this._registerEvents();
        this._setupButtons();
    }

    protected onDestroy(): void {
        this._unregisterEvents();
    }

    public showStartPanel(show: boolean = true): void {
        this._setNodeActive(this.startPanel, show);
        if (show) {
            this._showHealthNotice();
            GameCtrl.instance.gyroManager?.requestPermission();
        }
    }

    public showBattleUI(show: boolean = true): void {
        this._setNodeActive(this.battleHUD, show);
    }

    public showPausePanel(show: boolean = true): void {
        this._setNodeActive(this.pausePanel, show);
    }

    public showRollPanel(show: boolean = true): void {
        this._setNodeActive(this.rollPanel, show);
        if (show) {
            this.refreshRollUI();
        }
    }

    public showResultPanel(show: boolean = true): void {
        this._setNodeActive(this.resultPanel, show);
    }

    public updatePlayerStats(hp: number, maxHp: number, energy: number, maxEnergy: number): void {
        if (this.hpBar) {
            this.hpBar.progress = maxHp > 0 ? hp / maxHp : 0;
        }
        if (this.hpLabel) {
            this.hpLabel.string = `${Math.ceil(Math.max(0, hp))}/${Math.ceil(maxHp)}`;
        }
        if (this.energyBar) {
            this.energyBar.progress = maxEnergy > 0 ? energy / maxEnergy : 0;
        }
        if (this.energyLabel) {
            this.energyLabel.string = `Energy ${Math.floor(energy)}/${maxEnergy}`;
        }
    }

    public updateWaveDisplay(wave: number): void {
        if (this.waveLabel) {
            this.waveLabel.string = `Wave ${wave}`;
        }
    }

    public updateRollHeader(view: HexViewModel): void {
        if (this.rollHeaderLabel) {
            this.rollHeaderLabel.string = `Wave ${view.wave}  ${view.profession.name}`;
        }
        if (this.rollCostLabel) {
            this.rollCostLabel.string = view.freeRefreshesRemaining > 0
                ? `Free refresh x${view.freeRefreshesRemaining}`
                : 'Refresh by rewarded ad';
        }
    }

    public refreshRollUI(): void {
        const view = GameCtrl.instance.rollView;
        this.updateRollHeader(view);

        for (let i = 0; i < this.hexChoiceButtons.length; i++) {
            const choice = view.choices[i];
            const hasChoice = !!choice;
            this._setNodeActive(this.hexChoiceButtons[i]?.node ?? null, hasChoice);
            if (!choice) continue;

            const disabled = choice.alreadyPicked && !choice.data.repeatable;
            this.hexChoiceButtons[i].interactable = !disabled;
            if (this.hexChoiceNameLabels[i]) {
                this.hexChoiceNameLabels[i].string = choice.data.name;
            }
            if (this.hexChoiceDescLabels[i]) {
                this.hexChoiceDescLabels[i].string = choice.data.description;
            }
            if (this.hexChoiceRarityLabels[i]) {
                this.hexChoiceRarityLabels[i].string = choice.data.rarity.toUpperCase();
            }
        }

        if (this.pickedHexLabel) {
            const latest = view.picked.slice(-4).map((item) => item.name).join(' / ');
            this.pickedHexLabel.string = latest.length > 0 ? `Picked: ${latest}` : view.profession.description;
        }
    }

    public flashScreen(): void {
        if (!this.flashNode) return;
        this.flashNode.active = true;
        const sprite = this.flashNode.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 255, 255, 200);
        }
        this.scheduleOnce(() => {
            this._setNodeActive(this.flashNode, false);
        }, 0.12);
    }

    public updateResult(stats: ResultStats): void {
        if (this.resultWaveLabel) {
            this.resultWaveLabel.string = `${stats.victory ? 'Victory' : 'Reached'} wave ${stats.wave}`;
        }
        if (this.resultTimeLabel) {
            const min = Math.floor(stats.time / 60);
            const sec = stats.time % 60;
            const secText = sec < 10 ? `0${sec}` : `${sec}`;
            this.resultTimeLabel.string = `Time ${min}:${secText}`;
        }
        if (this.resultKillsLabel) {
            this.resultKillsLabel.string = `Kills ${stats.kills}`;
        }
        if (this.resultDamageLabel) {
            this.resultDamageLabel.string = `Damage ${Math.floor(stats.damageDealt)}`;
        }
    }

    private _registerEvents(): void {
        GameCtrl.on(GameEvent.STATE_CHANGED, this._onStateChanged, this);
    }

    private _unregisterEvents(): void {
        GameCtrl.off(GameEvent.STATE_CHANGED, this._onStateChanged, this);
    }

    private _setupButtons(): void {
        this.startButton?.node.on(Button.EventType.CLICK, () => {
            PlatformDef.showToast('Game start');
            try {
                GameCtrl.instance.startGame();
            } catch {
                this._setNodeActive(this.startPanel, false);
                this._setNodeActive(this.battleHUD, true);
            }
        });

        this.resumeButton?.node.on(Button.EventType.CLICK, () => {
            GameCtrl.instance.resumeGame();
        });

        this.sensitivityButton?.node.on(Button.EventType.CLICK, () => {
            this._setNodeActive(this.sensitivityPanel, true);
        });

        this.sensitivitySlider?.node.on('slide', (slider: Slider) => {
            const val = slider.progress * 2.9 + 0.1;
            const gyro = GameCtrl.instance.gyroManager;
            if (gyro) {
                gyro.sensitivity = Math.round(val * 10) / 10;
                if (this.sensitivityLabel) {
                    this.sensitivityLabel.string = gyro.sensitivity.toFixed(1);
                }
            }
        });

        this.rollDButton?.node.on(Button.EventType.CLICK, () => {
            GameCtrl.instance.rerollHexDraft();
        });

        this.rollLockButton?.node.on(Button.EventType.CLICK, () => {
            PlatformDef.showToast('Hex drafts do not use lock.');
        });

        this.rollReadyButton?.node.on(Button.EventType.CLICK, () => {
            GameCtrl.instance.onRollReady();
        });

        this.hexChoiceButtons.forEach((button, index) => {
            button.node.on(Button.EventType.CLICK, () => {
                GameCtrl.instance.selectHexChoice(index);
            });
        });

        this.resultRestartButton?.node.on(Button.EventType.CLICK, () => {
            GameCtrl.instance.restart();
        });
    }

    private _showHealthNotice(): void {
        if (this.healthNoticeLabel) {
            this.healthNoticeLabel.string = PlatformDef.getHealthNotice();
            this.healthNoticeLabel.node.active = true;
        }
        this.scheduleOnce(() => {
            if (this.healthNoticeLabel && this.startPanel?.active) {
                this.healthNoticeLabel.node.active = false;
            }
        }, 3);
    }

    private _setNodeActive(node: Node | null, active: boolean): void {
        if (node) {
            node.active = active;
        }
    }

    private _ensureFallbackUI(): void {
        if (this.startPanel && this.startButton) return;

        const root = this.node.parent ?? this.node;
        const startPanel = this._createPanel('StartPanel', root);
        this._createBlock('StartPanelBg', startPanel, 440, 260, 0, 0, new Color(28, 46, 78, 255));
        const title = this._createLabel('Title', startPanel, 'Rollvive', 34);
        title.node.setPosition(0, 82, 0);

        const subtitle = this._createLabel('Subtitle', startPanel, 'Hex draft survival on Hexa-9', 15);
        subtitle.node.setPosition(0, 42, 0);

        const startButtonNode = this._createButton('StartButton', startPanel, 'START', 160, 48);
        startButtonNode.setPosition(0, -24, 0);

        const notice = this._createLabel('HealthNotice', startPanel, '', 11);
        notice.node.setPosition(0, -86, 0);

        const battleHUD = this._createPanel('BattleHUD', root);
        battleHUD.active = false;
        this._createBlock('BattleBg', battleHUD, 480, 320, 0, 0, new Color(18, 22, 34, 255));
        this.hpLabel = this._createLabel('HpLabel', battleHUD, '100/100', 14);
        this.hpLabel.node.setPosition(-172, 132, 0);
        this.energyLabel = this._createLabel('EnergyLabel', battleHUD, 'Energy 0/100', 14);
        this.energyLabel.node.setPosition(0, 132, 0);
        this.waveLabel = this._createLabel('WaveLabel', battleHUD, 'Wave 0', 14);
        this.waveLabel.node.setPosition(174, 132, 0);
        this.statusLabel = this._createLabel('StatusLabel', battleHUD, 'PLAYER', 14);
        this.statusLabel.node.setPosition(174, 106, 0);
        const marker = this._createLabel('PlayerMarker', battleHUD, 'PLAYER', 46);
        marker.node.setPosition(0, -8, 0);
        const prompt = this._createLabel('Prompt', battleHUD, 'Game screen loaded. Combat systems are next.', 15);
        prompt.node.setPosition(0, -112, 0);

        const rollPanel = this._createPanel('RollPanel', root);
        rollPanel.active = false;
        this.rollHeaderLabel = this._createLabel('RollHeader', rollPanel, 'Choose a hex', 18);
        this.rollHeaderLabel.node.setPosition(0, 104, 0);
        this.rollCostLabel = this._createLabel('RollCost', rollPanel, 'Free refresh x1', 13);
        this.rollCostLabel.node.setPosition(0, 74, 0);
        this.rollReadyButton = this._createButton('RollReadyButton', rollPanel, 'TAKE FIRST', 150, 42).getComponent(Button);
        this.rollReadyButton?.node.setPosition(0, -72, 0);

        const resultPanel = this._createPanel('ResultPanel', root);
        resultPanel.active = false;
        this.resultWaveLabel = this._createLabel('ResultWave', resultPanel, 'Reached wave 0', 22);
        this.resultWaveLabel.node.setPosition(0, 58, 0);
        this.resultTimeLabel = this._createLabel('ResultTime', resultPanel, 'Time 0:00', 14);
        this.resultTimeLabel.node.setPosition(0, 24, 0);
        this.resultKillsLabel = this._createLabel('ResultKills', resultPanel, 'Kills 0', 14);
        this.resultKillsLabel.node.setPosition(0, -2, 0);
        this.resultDamageLabel = this._createLabel('ResultDamage', resultPanel, 'Damage 0', 14);
        this.resultDamageLabel.node.setPosition(0, -28, 0);
        this.resultRestartButton = this._createButton('RestartButton', resultPanel, 'RESTART', 150, 42).getComponent(Button);
        this.resultRestartButton?.node.setPosition(0, -86, 0);

        this.startPanel = startPanel;
        this.startButton = startButtonNode.getComponent(Button);
        this.healthNoticeLabel = notice;
        this.battleHUD = battleHUD;
        this.rollPanel = rollPanel;
        this.resultPanel = resultPanel;
    }

    private _createPanel(name: string, parent: Node): Node {
        const node = new Node(name);
        node.setParent(parent);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(480, 320);
        return node;
    }

    private _createLabel(name: string, parent: Node, text: string, fontSize: number): Label {
        const node = new Node(name);
        node.setParent(parent);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(360, Math.max(28, fontSize + 10));
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.color = Color.WHITE;
        return label;
    }

    private _createBlock(name: string, parent: Node, width: number, height: number, x: number, y: number, color: Color): Sprite {
        const node = new Node(name);
        node.setParent(parent);
        node.setPosition(x, y, 0);
        node.layer = parent.layer;
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);
        const sprite = node.addComponent(Sprite);
        sprite.color = color;
        sprite.type = Sprite.Type.SLICED;
        return sprite;
    }

    private _createButton(name: string, parent: Node, text: string, width: number, height: number): Node {
        const node = new Node(name);
        node.setParent(parent);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);
        this._createBlock(`${name}Bg`, node, width, height, 0, 0, new Color(238, 174, 72, 255));
        node.addComponent(Button);

        const label = this._createLabel(`${name}Label`, node, text, 20);
        label.node.setPosition(0, 0, 0);
        return node;
    }

    private _onStateChanged(oldState: GameState, newState: GameState): void {
        if (newState === GameState.ROLL_PHASE) {
            this.refreshRollUI();
        }
    }
}
