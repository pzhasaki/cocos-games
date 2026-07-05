import { _decorator, Button, Component, Label } from "cc";

const { ccclass, property } = _decorator;

export interface ResultPanelView {
  title?: string;
  waveText?: string;
  timeText?: string;
  killsText?: string;
  damageText?: string;
  restartText?: string;
}

export interface ResultPanelActions {
  onRestart?: () => void;
  onHome?: () => void;
}

@ccclass("ResultPanel")
export class ResultPanel extends Component {
  @property({ type: Label })
  public titleLabel: Label | null = null;

  @property({ type: Label })
  public waveLabel: Label | null = null;

  @property({ type: Label })
  public timeLabel: Label | null = null;

  @property({ type: Label })
  public killsLabel: Label | null = null;

  @property({ type: Label })
  public damageLabel: Label | null = null;

  @property({ type: Button })
  public restartButton: Button | null = null;

  @property({ type: Label })
  public restartButtonLabel: Label | null = null;

  @property({ type: Button })
  public homeButton: Button | null = null;

  private _actions: ResultPanelActions = {};

  protected onDestroy(): void {
    this._unbindActions();
  }

  public render(view: ResultPanelView): void {
    this._setText(this.titleLabel, view.title);
    this._setText(this.waveLabel, view.waveText);
    this._setText(this.timeLabel, view.timeText);
    this._setText(this.killsLabel, view.killsText);
    this._setText(this.damageLabel, view.damageText);
    this._setText(this.restartButtonLabel, view.restartText);
  }

  public show(): void {
    this.node.active = true;
  }

  public hide(): void {
    this.node.active = false;
  }

  public bindActions(actions: ResultPanelActions): void {
    this._unbindActions();
    this._actions = actions;
    this.restartButton?.node.on(
      Button.EventType.CLICK,
      this._onRestartClick,
      this,
    );
    this.homeButton?.node.on(Button.EventType.CLICK, this._onHomeClick, this);
  }

  private _unbindActions(): void {
    this.restartButton?.node.off(
      Button.EventType.CLICK,
      this._onRestartClick,
      this,
    );
    this.homeButton?.node.off(Button.EventType.CLICK, this._onHomeClick, this);
  }

  private _onRestartClick(): void {
    this._actions.onRestart?.();
  }

  private _onHomeClick(): void {
    this._actions.onHome?.();
  }

  private _setText(label: Label | null, value: string | undefined): void {
    if (label && value !== undefined) {
      label.string = value;
    }
  }
}
