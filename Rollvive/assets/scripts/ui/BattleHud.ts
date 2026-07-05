import { _decorator, Button, Component, Label, ProgressBar } from "cc";

const { ccclass, property } = _decorator;

export interface BattleHudView {
  hp?: number;
  maxHp?: number;
  energy?: number;
  maxEnergy?: number;
  wave?: number;
  killCount?: number;
  timerText?: string;
}

export interface BattleHudActions {
  onPause?: () => void;
  onSkill?: () => void;
}

@ccclass("BattleHud")
export class BattleHud extends Component {
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

  @property({ type: Label })
  public killLabel: Label | null = null;

  @property({ type: Label })
  public timerLabel: Label | null = null;

  @property({ type: Button })
  public pauseButton: Button | null = null;

  @property({ type: Button })
  public skillButton: Button | null = null;

  private _actions: BattleHudActions = {};

  protected onDestroy(): void {
    this._unbindActions();
  }

  public render(view: BattleHudView): void {
    const hp = view.hp ?? 0;
    const maxHp = view.maxHp ?? 0;
    const energy = view.energy ?? 0;
    const maxEnergy = view.maxEnergy ?? 0;

    if (this.hpBar && view.hp !== undefined && view.maxHp !== undefined) {
      this.hpBar.progress = this._ratio(hp, maxHp);
    }
    if (
      this.energyBar &&
      view.energy !== undefined &&
      view.maxEnergy !== undefined
    ) {
      this.energyBar.progress = this._ratio(energy, maxEnergy);
    }

    this._setText(
      this.hpLabel,
      view.hp !== undefined && view.maxHp !== undefined
        ? `${Math.ceil(hp)}/${Math.ceil(maxHp)}`
        : undefined,
    );
    this._setText(
      this.energyLabel,
      view.energy !== undefined && view.maxEnergy !== undefined
        ? `${Math.floor(energy)}/${Math.floor(maxEnergy)}`
        : undefined,
    );
    this._setText(
      this.waveLabel,
      view.wave !== undefined ? `Wave ${view.wave}` : undefined,
    );
    this._setText(
      this.killLabel,
      view.killCount !== undefined ? `Kills ${view.killCount}` : undefined,
    );
    this._setText(this.timerLabel, view.timerText);
  }

  public show(): void {
    this.node.active = true;
  }

  public hide(): void {
    this.node.active = false;
  }

  public bindActions(actions: BattleHudActions): void {
    this._unbindActions();
    this._actions = actions;
    this.pauseButton?.node.on(Button.EventType.CLICK, this._onPauseClick, this);
    this.skillButton?.node.on(Button.EventType.CLICK, this._onSkillClick, this);
  }

  private _unbindActions(): void {
    this.pauseButton?.node.off(
      Button.EventType.CLICK,
      this._onPauseClick,
      this,
    );
    this.skillButton?.node.off(
      Button.EventType.CLICK,
      this._onSkillClick,
      this,
    );
  }

  private _onPauseClick(): void {
    this._actions.onPause?.();
  }

  private _onSkillClick(): void {
    this._actions.onSkill?.();
  }

  private _ratio(value: number, max: number): number {
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, value / max));
  }

  private _setText(label: Label | null, value: string | undefined): void {
    if (label && value !== undefined) {
      label.string = value;
    }
  }
}
