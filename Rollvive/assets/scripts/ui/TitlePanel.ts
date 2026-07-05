import { _decorator, Button, Component, Label, Node } from "cc";

const { ccclass, property } = _decorator;

export interface TitlePanelView {
  title?: string;
  subtitle?: string;
  notice?: string;
  startText?: string;
}

export interface TitlePanelActions {
  onStart?: () => void;
}

@ccclass("TitlePanel")
export class TitlePanel extends Component {
  @property({ type: Label })
  public titleLabel: Label | null = null;

  @property({ type: Label })
  public subtitleLabel: Label | null = null;

  @property({ type: Label })
  public noticeLabel: Label | null = null;

  @property({ type: Button })
  public startButton: Button | null = null;

  @property({ type: Label })
  public startButtonLabel: Label | null = null;

  private _actions: TitlePanelActions = {};

  protected onDestroy(): void {
    this._unbindActions();
  }

  public render(view: TitlePanelView): void {
    this._setText(this.titleLabel, view.title);
    this._setText(this.subtitleLabel, view.subtitle);
    this._setText(this.noticeLabel, view.notice);
    this._setText(this.startButtonLabel, view.startText);
  }

  public show(): void {
    this.node.active = true;
  }

  public hide(): void {
    this.node.active = false;
  }

  public bindActions(actions: TitlePanelActions): void {
    this._unbindActions();
    this._actions = actions;
    this.startButton?.node.on(Button.EventType.CLICK, this._onStartClick, this);
  }

  private _unbindActions(): void {
    this.startButton?.node.off(
      Button.EventType.CLICK,
      this._onStartClick,
      this,
    );
  }

  private _onStartClick(): void {
    this._actions.onStart?.();
  }

  private _setText(label: Label | null, value: string | undefined): void {
    if (label && value !== undefined) {
      label.string = value;
    }
  }
}
