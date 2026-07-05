import { _decorator, Button, Component, Label } from "cc";

const { ccclass, property } = _decorator;

export interface RollChoiceView {
  name?: string;
  description?: string;
  rarity?: string;
  disabled?: boolean;
}

export interface RollPanelView {
  header?: string;
  refreshText?: string;
  pickedText?: string;
  readyText?: string;
  rerollText?: string;
  choices?: RollChoiceView[];
}

export interface RollPanelActions {
  onReroll?: () => void;
  onLock?: () => void;
  onReady?: () => void;
  onChoice?: (index: number) => void;
}

@ccclass("RollPanel")
export class RollPanel extends Component {
  @property({ type: Label })
  public headerLabel: Label | null = null;

  @property({ type: Label })
  public refreshLabel: Label | null = null;

  @property({ type: Label })
  public pickedLabel: Label | null = null;

  @property({ type: Button })
  public rerollButton: Button | null = null;

  @property({ type: Label })
  public rerollButtonLabel: Label | null = null;

  @property({ type: Button })
  public lockButton: Button | null = null;

  @property({ type: Button })
  public readyButton: Button | null = null;

  @property({ type: Label })
  public readyButtonLabel: Label | null = null;

  @property({ type: [Button] })
  public choiceButtons: Button[] = [];

  @property({ type: [Label] })
  public choiceNameLabels: Label[] = [];

  @property({ type: [Label] })
  public choiceDescriptionLabels: Label[] = [];

  @property({ type: [Label] })
  public choiceRarityLabels: Label[] = [];

  private _actions: RollPanelActions = {};

  protected onDestroy(): void {
    this._unbindActions();
  }

  public render(view: RollPanelView): void {
    this._setText(this.headerLabel, view.header);
    this._setText(this.refreshLabel, view.refreshText);
    this._setText(this.pickedLabel, view.pickedText);
    this._setText(this.readyButtonLabel, view.readyText);
    this._setText(this.rerollButtonLabel, view.rerollText);

    const choices = view.choices ?? [];
    for (let i = 0; i < this.choiceButtons.length; i++) {
      const choice = choices[i];
      const button = this.choiceButtons[i];
      button.node.active = !!choice;
      button.interactable = !choice?.disabled;

      this._setText(this.choiceNameLabels[i] ?? null, choice?.name ?? "");
      this._setText(
        this.choiceDescriptionLabels[i] ?? null,
        choice?.description ?? "",
      );
      this._setText(this.choiceRarityLabels[i] ?? null, choice?.rarity ?? "");
    }
  }

  public show(): void {
    this.node.active = true;
  }

  public hide(): void {
    this.node.active = false;
  }

  public bindActions(actions: RollPanelActions): void {
    this._unbindActions();
    this._actions = actions;

    this.rerollButton?.node.on(
      Button.EventType.CLICK,
      this._onRerollClick,
      this,
    );
    this.lockButton?.node.on(Button.EventType.CLICK, this._onLockClick, this);
    this.readyButton?.node.on(Button.EventType.CLICK, this._onReadyClick, this);
    this.choiceButtons.forEach((button) => {
      button.node.on(Button.EventType.CLICK, this._onChoiceClick, this);
    });
  }

  private _unbindActions(): void {
    this.rerollButton?.node.off(
      Button.EventType.CLICK,
      this._onRerollClick,
      this,
    );
    this.lockButton?.node.off(Button.EventType.CLICK, this._onLockClick, this);
    this.readyButton?.node.off(
      Button.EventType.CLICK,
      this._onReadyClick,
      this,
    );
    this.choiceButtons.forEach((button) => {
      button.node.off(Button.EventType.CLICK, this._onChoiceClick, this);
    });
  }

  private _onRerollClick(): void {
    this._actions.onReroll?.();
  }

  private _onLockClick(): void {
    this._actions.onLock?.();
  }

  private _onReadyClick(): void {
    this._actions.onReady?.();
  }

  private _onChoiceClick(button: Button): void {
    const index = this.choiceButtons.findIndex((item) => item === button);
    if (index >= 0) {
      this._actions.onChoice?.(index);
    }
  }

  private _setText(label: Label | null, value: string | undefined): void {
    if (label && value !== undefined) {
      label.string = value;
    }
  }
}
