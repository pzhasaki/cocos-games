import { _decorator, Component } from "cc";
import { BattleHud, BattleHudActions, BattleHudView } from "./BattleHud";
import {
  ResultPanel,
  ResultPanelActions,
  ResultPanelView,
} from "./ResultPanel";
import { RollPanel, RollPanelActions, RollPanelView } from "./RollPanel";
import { TitlePanel, TitlePanelActions, TitlePanelView } from "./TitlePanel";

const { ccclass, property } = _decorator;

export interface UIRootView {
  title?: TitlePanelView;
  battle?: BattleHudView;
  roll?: RollPanelView;
  result?: ResultPanelView;
}

export interface UIRootActions {
  title?: TitlePanelActions;
  battle?: BattleHudActions;
  roll?: RollPanelActions;
  result?: ResultPanelActions;
}

@ccclass("UIRoot")
export class UIRoot extends Component {
  @property({ type: TitlePanel })
  public titlePanel: TitlePanel | null = null;

  @property({ type: BattleHud })
  public battleHud: BattleHud | null = null;

  @property({ type: RollPanel })
  public rollPanel: RollPanel | null = null;

  @property({ type: ResultPanel })
  public resultPanel: ResultPanel | null = null;

  public render(view: UIRootView): void {
    if (view.title) {
      this.titlePanel?.render(view.title);
    }
    if (view.battle) {
      this.battleHud?.render(view.battle);
    }
    if (view.roll) {
      this.rollPanel?.render(view.roll);
    }
    if (view.result) {
      this.resultPanel?.render(view.result);
    }
  }

  public show(): void {
    this.node.active = true;
  }

  public hide(): void {
    this.node.active = false;
  }

  public showTitle(): void {
    this.titlePanel?.show();
    this.battleHud?.hide();
    this.rollPanel?.hide();
    this.resultPanel?.hide();
  }

  public showBattle(): void {
    this.titlePanel?.hide();
    this.battleHud?.show();
    this.rollPanel?.hide();
    this.resultPanel?.hide();
  }

  public showRoll(): void {
    this.titlePanel?.hide();
    this.battleHud?.show();
    this.rollPanel?.show();
    this.resultPanel?.hide();
  }

  public showResult(): void {
    this.titlePanel?.hide();
    this.battleHud?.hide();
    this.rollPanel?.hide();
    this.resultPanel?.show();
  }

  public bindActions(actions: UIRootActions): void {
    this.titlePanel?.bindActions(actions.title ?? {});
    this.battleHud?.bindActions(actions.battle ?? {});
    this.rollPanel?.bindActions(actions.roll ?? {});
    this.resultPanel?.bindActions(actions.result ?? {});
  }
}
