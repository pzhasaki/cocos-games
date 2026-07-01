import {
  _decorator,
  Button,
  Color,
  Component,
  EventKeyboard,
  EventTouch,
  Graphics,
  input,
  Input,
  KeyCode,
  Label,
  Layers,
  Node,
  tween,
  UIOpacity,
  UITransform,
  Vec3,
  view,
} from 'cc';
import {
  createDefaultUpgrades,
  getLoopBonus,
  getMonsterLevel,
  getUpgradeCost,
  LEVELS,
  UPGRADE_MAX_LEVEL,
} from './config/LevelConfig';
import type {
  MonsterLevel,
  MonsterPattern,
  UpgradeKind,
  UpgradeState,
} from './config/LevelConfig';
import { miniGameBridge } from './platform/DouyinBridge';
import type { MotionSample } from './platform/DouyinBridge';

const { ccclass, property } = _decorator;

interface BarView {
  root: Node;
  fill: Node;
  label: Label;
  width: number;
  height: number;
  color: string;
}

interface ModalAction {
  text: string;
  action: () => void;
  color?: string;
}

interface AttackWarning {
  node: Node;
  shape: 'circle' | 'rect';
  pattern: MonsterPattern;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  timer: number;
  total: number;
  damage: number;
}

type ScreenName = 'home' | 'battle' | 'upgrade';
type ShotSource = 'auto' | 'tap' | 'shake';

@ccclass('LightHeroGame')
export class LightHeroGame extends Component {
  @property
  rewardedVideoAdUnitId = '';

  private readonly saveKey = 'light-hero-save-v2';
  private readonly energyMax = 100;

  private stageWidth = 720;
  private stageHeight = 1280;
  private screen: ScreenName = 'home';
  private levelIndex = 0;
  private unlockedLevel = 0;
  private currentLevel!: MonsterLevel;
  private monsterHp = 1;
  private monsterMaxHp = 1;
  private heroHp = 3;
  private heroMaxHp = 3;
  private coins = 120;
  private energy = 0;
  private battleTime = 0;
  private battleElapsed = 0;
  private autoShotTimer = 0;
  private tapShotTimer = 0;
  private monsterAttackTimer = 0;
  private heroInvincibleTimer = 0;
  private shieldTimer = 0;
  private shieldCooldown = 0;
  private combo = 0;
  private comboTimer = 0;
  private paused = false;
  private dragging = false;
  private defeated = false;
  private wasHit = false;
  private revivedThisRound = false;
  private resultReward = 0;
  private resultStars = 0;
  private levelStars: Record<string, number> = {};
  private bestTimes: Record<string, number> = {};
  private upgrades: UpgradeState = createDefaultUpgrades();
  private heroTarget = new Vec3();
  private warnings: AttackWarning[] = [];
  private lastMotion?: MotionSample;
  private lastShakeAt = 0;
  private stopAccelerometer: () => void = () => {};

  private background!: Node;
  private warningLayer!: Node;
  private projectileLayer!: Node;
  private fxLayer!: Node;
  private uiLayer!: Node;
  private modalLayer!: Node;
  private heroNode!: Node;
  private monsterNode!: Node;
  private stageLabel!: Label;
  private coinLabel!: Label;
  private timeLabel!: Label;
  private heartLabel!: Label;
  private comboLabel!: Label;
  private hintLabel!: Label;
  private shieldButtonLabel!: Label;
  private beamButtonLabel!: Label;
  private heroBar!: BarView;
  private monsterBar!: BarView;
  private energyBar!: BarView;

  onLoad(): void {
    this.node.layer = Layers.Enum.UI_2D;
    this.loadSave();
    miniGameBridge.login();
    this.bindInput();
    this.buildHome();
  }

  onDestroy(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    this.stopAccelerometer();
  }

  update(deltaTime: number): void {
    if (this.screen !== 'battle' || this.paused || this.defeated) {
      return;
    }

    this.battleElapsed += deltaTime;
    this.battleTime = Math.max(0, this.battleTime - deltaTime);
    this.autoShotTimer = Math.max(0, this.autoShotTimer - deltaTime);
    this.tapShotTimer = Math.max(0, this.tapShotTimer - deltaTime);
    this.heroInvincibleTimer = Math.max(0, this.heroInvincibleTimer - deltaTime);
    this.shieldTimer = Math.max(0, this.shieldTimer - deltaTime);
    this.shieldCooldown = Math.max(0, this.shieldCooldown - deltaTime);
    this.comboTimer = Math.max(0, this.comboTimer - deltaTime);
    if (this.comboTimer <= 0) {
      this.combo = 0;
    }

    this.updateHeroMovement(deltaTime);
    this.updateAutoAttack(deltaTime);
    this.updateMonsterAttack(deltaTime);
    this.updateWarnings(deltaTime);
    this.animateIdle();
    this.refreshBattleHud();

    if (this.battleTime <= 0) {
      this.gameOver('时间到了，小英雄需要补充能量');
    }
  }

  private bindInput(): void {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    this.stopAccelerometer = miniGameBridge.startAccelerometer((sample) => this.onMotion(sample));
  }

  private buildHome(): void {
    this.screen = 'home';
    this.paused = false;
    this.rebuildRoot('#102033');
    this.drawBackground();
    this.fxLayer = this.createNode(this.node, 'FxLayer', 0, 0, this.stageWidth, this.stageHeight);
    this.uiLayer = this.createNode(this.node, 'UiLayer', 0, 0, this.stageWidth, this.stageHeight);

    this.createLabel(this.uiLayer, '光之小英雄', 0, this.stageHeight * 0.36, 560, 70, 46, '#FFFFFF');
    this.createLabel(this.uiLayer, '摇摇打怪', 0, this.stageHeight * 0.305, 420, 52, 34, '#FFE066');
    this.coinLabel = this.createLabel(this.uiLayer, `星星 ${this.coins}`, this.stageWidth * 0.25, this.stageHeight * 0.43, 250, 44, 26, '#FFE066');
    this.createLabel(this.uiLayer, `已解锁 第${this.unlockedLevel + 1}关`, -this.stageWidth * 0.24, this.stageHeight * 0.43, 280, 44, 25, '#DDE7F0');

    const heroPreview = this.createNode(this.uiLayer, 'HeroPreview', -this.stageWidth * 0.2, this.stageHeight * 0.08, 240, 300);
    this.heroNode = heroPreview;
    this.drawHero();
    const monsterPreview = this.createNode(this.uiLayer, 'MonsterPreview', this.stageWidth * 0.22, this.stageHeight * 0.08, 260, 300);
    this.monsterNode = monsterPreview;
    this.currentLevel = getMonsterLevel(this.unlockedLevel);
    this.drawMonster();

    this.createButton(this.uiLayer, '开始挑战', 0, -this.stageHeight * 0.17, 330, 82, '#E63946', () => this.startBattle(this.unlockedLevel));
    this.createButton(this.uiLayer, '技能升级', -this.stageWidth * 0.22, -this.stageHeight * 0.265, 240, 66, '#2A9D8F', () => this.buildUpgrade());
    this.createButton(this.uiLayer, '家长区', this.stageWidth * 0.22, -this.stageHeight * 0.265, 240, 66, '#3A86FF', () => this.showParentGate());

    const gridY = -this.stageHeight * 0.38;
    const buttonGap = Math.min(126, (this.stageWidth - 120) / Math.max(1, LEVELS.length - 1));
    const levelButtonWidth = Math.min(104, buttonGap - 18);
    const startX = -buttonGap * (LEVELS.length - 1) / 2;
    LEVELS.forEach((level, index) => {
      const unlocked = index <= this.unlockedLevel;
      const stars = this.levelStars[this.getLevelKey(index)] || 0;
      const label = unlocked ? `${level.stage}\n${'★'.repeat(stars) || ' '}` : `${level.stage}\n锁`;
      this.createButton(this.uiLayer, label, startX + index * buttonGap, gridY, levelButtonWidth, 76, unlocked ? '#457B9D' : '#46515F', () => {
        if (unlocked) {
          this.startBattle(index);
        } else {
          this.showFloatingText('先通过前面的关卡', new Vec3(0, -this.stageHeight * 0.22, 0), '#FFFFFF', 28);
        }
      });
    });

    this.modalLayer = this.createNode(this.node, 'ModalLayer', 0, 0, this.stageWidth, this.stageHeight);
    this.modalLayer.active = false;
  }

  private buildUpgrade(): void {
    this.screen = 'upgrade';
    this.paused = false;
    this.rebuildRoot('#122033');
    this.drawBackground();
    this.fxLayer = this.createNode(this.node, 'FxLayer', 0, 0, this.stageWidth, this.stageHeight);
    this.uiLayer = this.createNode(this.node, 'UiLayer', 0, 0, this.stageWidth, this.stageHeight);

    this.createLabel(this.uiLayer, '技能升级', 0, this.stageHeight * 0.39, 420, 60, 42, '#FFFFFF');
    this.coinLabel = this.createLabel(this.uiLayer, `星星 ${this.coins}`, 0, this.stageHeight * 0.33, 320, 44, 28, '#FFE066');
    this.createUpgradeRow('光弹', 'power', '提高自动光弹和摇动攻击伤害', this.stageHeight * 0.18);
    this.createUpgradeRow('护盾', 'shield', '减少护盾冷却，提升容错', this.stageHeight * 0.04);
    this.createUpgradeRow('光线', 'beam', '提高摇一摇大招伤害', -this.stageHeight * 0.1);
    this.createButton(this.uiLayer, '返回首页', 0, -this.stageHeight * 0.34, 260, 70, '#457B9D', () => this.buildHome());

    this.modalLayer = this.createNode(this.node, 'ModalLayer', 0, 0, this.stageWidth, this.stageHeight);
    this.modalLayer.active = false;
  }

  private createUpgradeRow(title: string, kind: UpgradeKind, desc: string, y: number): void {
    this.createRectNode(this.uiLayer, `${kind}Row`, 0, y, Math.min(620, this.stageWidth - 60), 118, '#1F2D3D', 235);
    this.createLabel(this.uiLayer, `${title} Lv.${this.upgrades[kind]}`, -this.stageWidth * 0.22, y + 24, 230, 38, 28, '#FFFFFF');
    this.createLabel(this.uiLayer, desc, -this.stageWidth * 0.16, y - 24, 330, 34, 20, '#DDE7F0');
    const level = this.upgrades[kind];
    const maxed = level >= UPGRADE_MAX_LEVEL;
    const text = maxed ? '满级' : `升级\n${getUpgradeCost(kind, level)}`;
    this.createButton(this.uiLayer, text, this.stageWidth * 0.29, y, 150, 70, maxed ? '#46515F' : '#2A9D8F', () => this.buyUpgrade(kind));
  }

  private startBattle(index: number): void {
    this.screen = 'battle';
    this.levelIndex = Math.max(0, index);
    this.currentLevel = getMonsterLevel(this.levelIndex);
    const loopBonus = getLoopBonus(this.levelIndex);

    this.heroMaxHp = 3 + Math.floor(Math.max(0, this.upgrades.shield - 1) / 4);
    this.heroHp = this.heroMaxHp;
    this.monsterMaxHp = this.currentLevel.hp + loopBonus * 140;
    this.monsterHp = this.monsterMaxHp;
    this.energy = 0;
    this.battleTime = this.currentLevel.timeLimit + loopBonus * 8;
    this.battleElapsed = 0;
    this.autoShotTimer = 0.25;
    this.tapShotTimer = 0;
    this.monsterAttackTimer = 0.8;
    this.heroInvincibleTimer = 0;
    this.shieldTimer = 0;
    this.shieldCooldown = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.paused = false;
    this.defeated = false;
    this.wasHit = false;
    this.revivedThisRound = false;
    this.warnings = [];

    this.rebuildRoot('#102033');
    this.drawBackground();
    this.warningLayer = this.createNode(this.node, 'WarningLayer', 0, 0, this.stageWidth, this.stageHeight);
    this.projectileLayer = this.createNode(this.node, 'ProjectileLayer', 0, 0, this.stageWidth, this.stageHeight);
    this.heroNode = this.createNode(this.node, 'Hero', 0, -this.stageHeight * 0.25, 170, 220);
    this.monsterNode = this.createNode(this.node, 'Monster', 0, this.stageHeight * 0.15, 240, 260);
    this.fxLayer = this.createNode(this.node, 'FxLayer', 0, 0, this.stageWidth, this.stageHeight);
    this.uiLayer = this.createNode(this.node, 'UiLayer', 0, 0, this.stageWidth, this.stageHeight);
    this.modalLayer = this.createNode(this.node, 'ModalLayer', 0, 0, this.stageWidth, this.stageHeight);
    this.modalLayer.active = false;

    this.heroTarget = new Vec3(0, -this.stageHeight * 0.25, 0);
    this.drawHero();
    this.drawMonster();
    this.createBattleHud();
    this.refreshBattleHud();
    this.showFloatingText(this.currentLevel.intro, new Vec3(0, this.stageHeight * 0.02, 0), '#FFFFFF', 30);
  }

  private createBattleHud(): void {
    this.stageLabel = this.createLabel(this.uiLayer, '', -this.stageWidth * 0.26, this.stageHeight * 0.45, 300, 44, 25, '#FFFFFF');
    this.coinLabel = this.createLabel(this.uiLayer, '', this.stageWidth * 0.3, this.stageHeight * 0.45, 230, 44, 24, '#FFE066');
    this.timeLabel = this.createLabel(this.uiLayer, '', 0, this.stageHeight * 0.45, 140, 44, 28, '#FFFFFF');
    this.heartLabel = this.createLabel(this.uiLayer, '', -this.stageWidth * 0.3, this.stageHeight * 0.38, 230, 42, 25, '#FFB3B3');
    this.comboLabel = this.createLabel(this.uiLayer, '', 0, this.stageHeight * 0.32, 360, 52, 34, '#FFE066');
    this.hintLabel = this.createLabel(this.uiLayer, '', 0, -this.stageHeight * 0.39, 560, 42, 22, '#DDE7F0');
    this.monsterBar = this.createBar(this.uiLayer, 0, this.stageHeight * 0.39, 330, 28, '#FF6B6B');
    this.heroBar = this.createBar(this.uiLayer, -this.stageWidth * 0.28, this.stageHeight * 0.345, 210, 22, '#4CC9A7');
    this.energyBar = this.createBar(this.uiLayer, 0, -this.stageHeight * 0.435, 460, 28, '#F9D94A');

    this.createButton(this.uiLayer, '暂停', -this.stageWidth * 0.4, this.stageHeight * 0.45, 96, 52, '#46515F', () => this.pauseBattle());
    this.createButton(this.uiLayer, '光弹', -this.stageWidth * 0.25, -this.stageHeight * 0.47, 150, 66, '#E63946', () => this.fireLightShot('tap'));
    this.shieldButtonLabel = this.createButton(this.uiLayer, '', 0, -this.stageHeight * 0.47, 150, 66, '#2A9D8F', () => this.useShield());
    this.beamButtonLabel = this.createButton(this.uiLayer, '', this.stageWidth * 0.25, -this.stageHeight * 0.47, 150, 66, '#F4A261', () => this.useUltraBeam('button'));
  }

  private updateAutoAttack(deltaTime: number): void {
    this.autoShotTimer -= deltaTime;
    if (this.autoShotTimer > 0) {
      return;
    }

    this.autoShotTimer = Math.max(0.34, 0.72 - this.upgrades.power * 0.03);
    this.fireLightShot('auto');
  }

  private updateMonsterAttack(deltaTime: number): void {
    this.monsterAttackTimer += deltaTime;
    if (this.monsterAttackTimer < this.currentLevel.attackEvery) {
      return;
    }

    this.monsterAttackTimer = 0;
    this.spawnMonsterWarning();
  }

  private updateHeroMovement(deltaTime: number): void {
    if (!this.heroNode) {
      return;
    }

    const current = this.heroNode.position;
    let target = this.clampHeroTarget(this.heroTarget.x, this.heroTarget.y);
    const magnet = this.warnings.find((warning) => warning.pattern === 'magnet');
    if (magnet && this.shieldTimer <= 0) {
      const pull = Math.min(1, deltaTime * 0.55);
      target = new Vec3(target.x + (magnet.x - target.x) * pull, target.y + (magnet.y - target.y) * pull, 0);
      this.heroTarget = this.clampHeroTarget(target.x, target.y);
    }

    const dx = target.x - current.x;
    const dy = target.y - current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 1) {
      return;
    }

    const speed = 1500;
    const step = Math.min(distance, speed * deltaTime);
    const next = new Vec3(current.x + (dx / distance) * step, current.y + (dy / distance) * step, 0);
    this.heroNode.setPosition(next);
  }

  private spawnMonsterWarning(): void {
    const heroPosition = this.heroNode.position;
    const damage = this.currentLevel.attack;

    switch (this.currentLevel.pattern) {
      case 'jump':
        this.addWarning('circle', 'jump', heroPosition.x, heroPosition.y, 0, 0, 92, damage, this.currentLevel.warningTime);
        break;
      case 'charge':
        this.addWarning('rect', 'charge', 0, heroPosition.y, this.stageWidth * 0.9, 92, 0, damage, this.currentLevel.warningTime);
        break;
      case 'bubble':
        this.addWarning('circle', 'bubble', heroPosition.x, heroPosition.y + 20, 0, 0, 78, damage, this.currentLevel.warningTime);
        this.addWarning('circle', 'bubble', this.randomLaneX(), heroPosition.y + 85, 0, 0, 70, damage, this.currentLevel.warningTime + 0.18);
        break;
      case 'magnet':
        this.addWarning('circle', 'magnet', 0, -this.stageHeight * 0.1, 0, 0, 130, damage, this.currentLevel.warningTime);
        this.showFloatingText('磁力吸引', new Vec3(0, this.stageHeight * 0.05, 0), '#FFB3B3', 26);
        break;
      case 'summon':
        this.addWarning('circle', 'summon', heroPosition.x, heroPosition.y, 0, 0, 82, damage, this.currentLevel.warningTime);
        this.addWarning('circle', 'summon', this.randomLaneX(), -this.stageHeight * 0.18, 0, 0, 76, damage, this.currentLevel.warningTime + 0.12);
        this.addWarning('circle', 'summon', this.randomLaneX(), -this.stageHeight * 0.31, 0, 0, 76, damage, this.currentLevel.warningTime + 0.24);
        break;
    }

    this.animateMonsterCue();
  }

  private addWarning(
    shape: 'circle' | 'rect',
    pattern: MonsterPattern,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    damage: number,
    total: number,
  ): void {
    const node = this.createNode(this.warningLayer, 'AttackWarning', x, y, width || radius * 2, height || radius * 2);
    const warning: AttackWarning = {
      node,
      shape,
      pattern,
      x,
      y,
      width,
      height,
      radius,
      timer: total,
      total,
      damage,
    };
    this.warnings.push(warning);
    this.redrawWarning(warning);
  }

  private updateWarnings(deltaTime: number): void {
    for (let index = this.warnings.length - 1; index >= 0; index -= 1) {
      const warning = this.warnings[index];
      warning.timer -= deltaTime;
      this.redrawWarning(warning);
      if (warning.timer > 0) {
        continue;
      }

      this.resolveWarning(warning);
      warning.node.destroy();
      this.warnings.splice(index, 1);
    }
  }

  private resolveWarning(warning: AttackWarning): void {
    this.animateMonsterAttack(warning.pattern);
    if (this.isHeroInsideWarning(warning)) {
      this.damageHero(warning.damage);
    } else {
      this.showFloatingText('躲开了', new Vec3(this.heroNode.position.x, this.heroNode.position.y + 88, 0), '#B8F2E6', 24);
    }
  }

  private damageHero(amount: number): void {
    if (this.heroInvincibleTimer > 0) {
      return;
    }

    if (this.shieldTimer > 0) {
      this.heroInvincibleTimer = 0.35;
      this.showFloatingText('护盾挡住', new Vec3(this.heroNode.position.x, this.heroNode.position.y + 92, 0), '#B8F2E6', 26);
      miniGameBridge.vibrateShort();
      return;
    }

    this.heroHp = Math.max(0, this.heroHp - amount);
    this.wasHit = true;
    this.heroInvincibleTimer = 1.1;
    this.showFloatingText('-1', new Vec3(this.heroNode.position.x, this.heroNode.position.y + 92, 0), '#FFB3B3', 32);
    miniGameBridge.vibrateShort();
    tween(this.heroNode)
      .to(0.06, { scale: new Vec3(0.92, 1.08, 1) })
      .to(0.08, { scale: new Vec3(1, 1, 1) })
      .start();

    if (this.heroHp <= 0) {
      this.gameOver('小英雄能量用完了');
    }
  }

  private fireLightShot(source: ShotSource): void {
    if (this.screen !== 'battle' || this.paused || this.defeated) {
      return;
    }

    if (source !== 'auto' && this.tapShotTimer > 0) {
      return;
    }

    if (source !== 'auto') {
      this.tapShotTimer = source === 'shake' ? 0.11 : 0.18;
    }

    this.combo += source === 'auto' ? 0 : 1;
    this.comboTimer = 1.4;
    const sourceBonus = source === 'shake' ? 8 : source === 'tap' ? 4 : 0;
    const comboBonus = Math.min(18, Math.floor(this.combo * 1.4));
    const damage = 18 + this.upgrades.power * 6 + sourceBonus + comboBonus;
    this.monsterHp = Math.max(0, this.monsterHp - damage);
    this.energy = Math.min(this.energyMax, this.energy + (source === 'auto' ? 5 : 9));
    this.animateHeroStrike(source, false);
    this.showFloatingText(`-${damage}`, new Vec3(this.monsterNode.position.x, this.monsterNode.position.y + 110, 0), '#FFE066', 28);

    if (this.monsterHp <= 0) {
      this.clearLevel();
    }
  }

  private useUltraBeam(source: 'shake' | 'button' | 'keyboard'): void {
    if (this.screen !== 'battle' || this.paused || this.defeated || this.energy < this.energyMax) {
      if (source !== 'shake') {
        this.showFloatingText('光能还没满', new Vec3(0, -this.stageHeight * 0.33, 0), '#FFFFFF', 24);
      }
      return;
    }

    const damage = 145 + this.upgrades.beam * 48;
    this.energy = 0;
    this.monsterAttackTimer = -0.65;
    this.monsterHp = Math.max(0, this.monsterHp - damage);
    this.clearWarnings();
    this.animateHeroStrike('shake', true);
    this.showFloatingText('超级光线', new Vec3(0, this.stageHeight * 0.12, 0), '#F9D94A', 40);
    this.showFloatingText(`-${damage}`, new Vec3(this.monsterNode.position.x, this.monsterNode.position.y + 132, 0), '#FFE066', 34);
    miniGameBridge.vibrateShort();

    if (this.monsterHp <= 0) {
      this.clearLevel();
    }
  }

  private useShield(): void {
    if (this.screen !== 'battle' || this.paused || this.defeated) {
      return;
    }

    if (this.shieldCooldown > 0) {
      this.showFloatingText('护盾冷却中', new Vec3(0, -this.stageHeight * 0.33, 0), '#FFFFFF', 24);
      return;
    }

    this.shieldTimer = 2.1 + this.upgrades.shield * 0.12;
    this.shieldCooldown = Math.max(5.5, 10.5 - this.upgrades.shield * 0.45);
    this.showFloatingText('光能护盾', new Vec3(this.heroNode.position.x, this.heroNode.position.y + 100, 0), '#B8F2E6', 28);
    miniGameBridge.vibrateShort();
  }

  private clearLevel(): void {
    if (this.defeated) {
      return;
    }

    this.defeated = true;
    this.clearWarnings();
    this.resultStars = this.calculateStars();
    const loopBonus = getLoopBonus(this.levelIndex);
    this.resultReward = this.currentLevel.rewardCoins + loopBonus * 45 + this.resultStars * 25;
    this.coins += this.resultReward;
    this.unlockedLevel = Math.max(this.unlockedLevel, Math.min(this.levelIndex + 1, LEVELS.length - 1));
    const key = this.getLevelKey(this.levelIndex);
    this.levelStars[key] = Math.max(this.levelStars[key] || 0, this.resultStars);
    const clearTime = Math.ceil(this.battleElapsed);
    this.bestTimes[key] = Math.min(this.bestTimes[key] || 999, clearTime);
    this.save();
    this.refreshBattleHud();
    this.animateMonsterDefeat();

    this.scheduleOnce(() => {
      this.showResultModal(false);
    }, 0.75);
  }

  private showResultModal(doubleClaimed: boolean): void {
    this.paused = true;
    const stars = '★'.repeat(this.resultStars);
    const nextIndex = Math.min(this.levelIndex + 1, LEVELS.length - 1);
    const actions: ModalAction[] = [
      {
        text: this.levelIndex >= LEVELS.length - 1 ? '回首页' : '下一关',
        color: '#E63946',
        action: () => {
          this.hideModal();
          if (this.levelIndex >= LEVELS.length - 1) {
            this.buildHome();
          } else {
            this.startBattle(nextIndex);
          }
        },
      },
      {
        text: '技能升级',
        color: '#2A9D8F',
        action: () => {
          this.hideModal();
          this.buildUpgrade();
        },
      },
    ];

    if (!doubleClaimed) {
      actions.splice(1, 0, {
        text: '双倍奖励',
        color: '#845EC2',
        action: () => {
          this.watchRewardAd(() => {
            this.coins += this.resultReward;
            this.save();
            this.showResultModal(true);
          }, false);
        },
      });
    }

    this.showModal('净化成功', `${stars}\n星星 +${this.resultReward}`, actions);
  }

  private gameOver(message: string): void {
    if (this.paused || this.defeated) {
      return;
    }

    this.paused = true;
    const actions: ModalAction[] = [
      {
        text: '重新开始',
        color: '#E63946',
        action: () => {
          this.hideModal();
          this.startBattle(this.levelIndex);
        },
      },
      {
        text: '回首页',
        color: '#457B9D',
        action: () => {
          this.hideModal();
          this.buildHome();
        },
      },
    ];

    if (!this.revivedThisRound) {
      actions.unshift({
        text: '广告复活',
        color: '#845EC2',
        action: () => {
          this.watchRewardAd(() => {
            this.revivedThisRound = true;
            this.heroHp = this.heroMaxHp;
            this.heroInvincibleTimer = 1.1;
            this.paused = false;
            this.hideModal();
          }, false);
        },
      });
    }

    this.showModal('需要补充能量', message, actions);
  }

  private pauseBattle(): void {
    if (this.screen !== 'battle') {
      return;
    }

    this.paused = true;
    this.showModal('暂停', '休息一下再继续', [
      {
        text: '继续',
        color: '#2A9D8F',
        action: () => {
          this.hideModal();
          this.paused = false;
        },
      },
      {
        text: '重来',
        color: '#E63946',
        action: () => {
          this.hideModal();
          this.startBattle(this.levelIndex);
        },
      },
      {
        text: '首页',
        color: '#457B9D',
        action: () => {
          this.hideModal();
          this.buildHome();
        },
      },
    ]);
  }

  private buyUpgrade(kind: UpgradeKind): void {
    if (this.upgrades[kind] >= UPGRADE_MAX_LEVEL) {
      this.showFloatingText('已满级', new Vec3(0, -this.stageHeight * 0.22, 0), '#FFFFFF', 28);
      return;
    }

    const cost = getUpgradeCost(kind, this.upgrades[kind]);
    if (this.coins < cost) {
      this.showFloatingText('星星不够', new Vec3(0, -this.stageHeight * 0.22, 0), '#FFCCCB', 28);
      return;
    }

    this.coins -= cost;
    this.upgrades[kind] += 1;
    this.save();
    this.showFloatingText('升级成功', new Vec3(0, -this.stageHeight * 0.22, 0), '#B8F2E6', 30);
    this.scheduleOnce(() => this.buildUpgrade(), 0.3);
  }

  private watchRewardAd(afterReward?: () => void, grantDefaultReward = true): void {
    this.paused = true;
    miniGameBridge.showRewardedVideo(this.rewardedVideoAdUnitId, (rewarded) => {
      if (rewarded) {
        if (grantDefaultReward) {
          this.coins += 160;
          this.save();
          this.showFloatingText('奖励 +160', new Vec3(0, -this.stageHeight * 0.2, 0), '#FFE066', 30);
        }
        afterReward?.();
      } else {
        this.showFloatingText('下次再试', new Vec3(0, -this.stageHeight * 0.2, 0), '#FFFFFF', 28);
      }
      this.paused = this.isModalOpen();
      if (this.screen === 'battle') {
        this.refreshBattleHud();
      } else if (this.coinLabel) {
        this.coinLabel.string = `星星 ${this.coins}`;
      }
    });
  }

  private showParentGate(): void {
    const a = 5 + Math.floor(Math.random() * 5);
    const b = 6 + Math.floor(Math.random() * 6);
    const answer = a + b;
    const options = [answer, answer + 2, answer - 1].sort(() => Math.random() - 0.5);

    this.paused = true;
    this.showModal('家长区', `${a} + ${b} = ?`, options.map((option) => ({
      text: String(option),
      color: option === answer ? '#2A9D8F' : '#457B9D',
      action: () => {
        this.hideModal();
        if (option === answer) {
          this.coins += 300;
          this.save();
          this.showFloatingText('家长奖励 +300', new Vec3(0, -this.stageHeight * 0.18, 0), '#FFE066', 30);
          if (this.coinLabel) {
            this.coinLabel.string = `星星 ${this.coins}`;
          }
        }
        this.paused = false;
      },
    })));
  }

  private onKeyDown(event: EventKeyboard): void {
    if (this.screen !== 'battle') {
      return;
    }

    if (event.keyCode === KeyCode.SPACE) {
      this.useUltraBeam('keyboard');
    }
    if (event.keyCode === KeyCode.KEY_J) {
      this.fireLightShot('tap');
    }
    if (event.keyCode === KeyCode.KEY_K) {
      this.useShield();
    }
  }

  private onTouchStart(event: EventTouch): void {
    if (this.screen !== 'battle' || this.paused || this.defeated || this.isModalOpen()) {
      return;
    }

    const local = this.getTouchLocalPosition(event);
    if (!this.isInHeroControlArea(local)) {
      return;
    }

    this.dragging = true;
    this.heroTarget = this.clampHeroTarget(local.x, local.y);
  }

  private onTouchMove(event: EventTouch): void {
    if (!this.dragging || this.screen !== 'battle' || this.paused || this.defeated) {
      return;
    }

    const local = this.getTouchLocalPosition(event);
    this.heroTarget = this.clampHeroTarget(local.x, local.y);
  }

  private onTouchEnd(): void {
    this.dragging = false;
  }

  private onMotion(sample: MotionSample): void {
    if (this.screen !== 'battle' || this.paused || this.defeated) {
      this.lastMotion = sample;
      return;
    }

    if (!this.lastMotion) {
      this.lastMotion = sample;
      return;
    }

    const dx = sample.x - this.lastMotion.x;
    const dy = sample.y - this.lastMotion.y;
    const dz = sample.z - this.lastMotion.z;
    const energy = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const now = sample.time;
    this.lastMotion = sample;

    if (energy <= 0.78 || now - this.lastShakeAt <= 120) {
      return;
    }

    this.lastShakeAt = now;
    if (this.energy >= this.energyMax) {
      this.useUltraBeam('shake');
    } else {
      this.fireLightShot('shake');
    }
  }

  private refreshBattleHud(): void {
    if (this.screen !== 'battle') {
      return;
    }

    this.stageLabel.string = `第${this.currentLevel.stage}关 ${this.currentLevel.name}`;
    this.coinLabel.string = `星星 ${this.coins}`;
    this.timeLabel.string = `${Math.ceil(this.battleTime)}秒`;
    this.heartLabel.string = `爱心 ${'❤'.repeat(Math.max(0, this.heroHp))}`;
    this.comboLabel.string = this.combo >= 3 ? `${this.combo} 连摇` : '';
    this.hintLabel.string = this.energy >= this.energyMax ? '光能满了，摇一摇释放超级光线' : '拖动躲避红色预警，摇一摇发射光弹';
    this.shieldButtonLabel.string = this.shieldCooldown > 0 ? `护盾\n${Math.ceil(this.shieldCooldown)}` : '护盾';
    this.beamButtonLabel.string = this.energy >= this.energyMax ? '超级\n光线' : '蓄能中';
    this.updateBar(this.heroBar, this.heroHp / this.heroMaxHp, `HP ${this.heroHp}/${this.heroMaxHp}`);
    this.updateBar(this.monsterBar, this.monsterHp / this.monsterMaxHp, `${this.currentLevel.name} ${Math.ceil(this.monsterHp)}/${this.monsterMaxHp}`);
    this.updateBar(this.energyBar, this.energy / this.energyMax, `光能 ${Math.floor(this.energy)}%`);
  }

  private calculateStars(): number {
    let stars = 1;
    if (!this.wasHit || this.heroHp >= Math.max(2, this.heroMaxHp - 1)) {
      stars += 1;
    }
    if (this.battleTime >= this.currentLevel.threeStarTime) {
      stars += 1;
    }
    return Math.min(3, stars);
  }

  private isHeroInsideWarning(warning: AttackWarning): boolean {
    const hero = this.heroNode.position;
    const heroRadius = 42;
    if (warning.shape === 'circle') {
      const dx = hero.x - warning.x;
      const dy = hero.y - warning.y;
      return Math.sqrt(dx * dx + dy * dy) <= warning.radius + heroRadius;
    }

    return Math.abs(hero.x - warning.x) <= warning.width / 2 + heroRadius
      && Math.abs(hero.y - warning.y) <= warning.height / 2 + heroRadius;
  }

  private clearWarnings(): void {
    this.warnings.forEach((warning) => warning.node.destroy());
    this.warnings = [];
  }

  private getTouchLocalPosition(event: EventTouch): Vec3 {
    const ui = event.getUILocation();
    const transform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
    return transform.convertToNodeSpaceAR(new Vec3(ui.x, ui.y, 0));
  }

  private isInHeroControlArea(position: Vec3): boolean {
    return position.y > -this.stageHeight * 0.37 && position.y < this.stageHeight * 0.1;
  }

  private clampHeroTarget(x: number, y: number): Vec3 {
    const maxX = this.stageWidth * 0.42;
    const minY = -this.stageHeight * 0.35;
    const maxY = this.stageHeight * 0.08;
    return new Vec3(
      Math.max(-maxX, Math.min(maxX, x)),
      Math.max(minY, Math.min(maxY, y)),
      0,
    );
  }

  private randomLaneX(): number {
    return (Math.random() * 2 - 1) * this.stageWidth * 0.32;
  }

  private animateIdle(): void {
    const time = Date.now() / 1000;
    if (this.heroNode) {
      const opacity = this.heroNode.getComponent(UIOpacity) || this.heroNode.addComponent(UIOpacity);
      opacity.opacity = this.heroInvincibleTimer > 0 && Math.floor(time * 14) % 2 === 0 ? 125 : 255;
      const shieldScale = this.shieldTimer > 0 ? 1.06 + Math.sin(time * 10) * 0.025 : 1;
      this.heroNode.setScale(shieldScale, shieldScale, 1);
    }
    if (this.monsterNode && !this.defeated) {
      const baseX = Math.sin(time * 1.6) * 12;
      const baseY = this.stageHeight * 0.15 + Math.sin(time * 2.4) * 8;
      this.monsterNode.setPosition(baseX, baseY, 0);
    }
  }

  private animateMonsterCue(): void {
    tween(this.monsterNode)
      .to(0.08, { scale: new Vec3(1.08, 0.92, 1) })
      .to(0.1, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  private animateMonsterAttack(pattern: MonsterPattern): void {
    const offset = pattern === 'charge' ? 80 : 34;
    tween(this.monsterNode)
      .to(0.08, { position: new Vec3(offset, this.stageHeight * 0.12, 0) })
      .to(0.12, { position: new Vec3(0, this.stageHeight * 0.15, 0) })
      .start();
  }

  private animateHeroStrike(source: ShotSource, ultra: boolean): void {
    const hero = this.heroNode.position;
    const monster = this.monsterNode.position;
    const beamWidth = ultra ? Math.abs(monster.x - hero.x) + 170 : Math.abs(monster.x - hero.x) + 80;
    const beamHeight = ultra ? 28 : source === 'shake' ? 14 : 10;
    const beam = this.createRectNode(this.projectileLayer, 'Beam', (hero.x + monster.x) / 2, (hero.y + monster.y) / 2, beamWidth, beamHeight, ultra ? '#F9D94A' : '#A8DADC', ultra ? 240 : 210);
    const angle = Math.atan2(monster.y - hero.y, monster.x - hero.x) * 180 / Math.PI;
    beam.setRotationFromEuler(0, 0, angle);
    const opacity = beam.addComponent(UIOpacity);
    opacity.opacity = 255;
    tween(opacity)
      .to(ultra ? 0.26 : 0.14, { opacity: 0 })
      .call(() => beam.destroy())
      .start();

    tween(this.monsterNode)
      .to(0.05, { scale: new Vec3(1.07, 0.93, 1) })
      .to(0.08, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  private animateMonsterDefeat(): void {
    const opacity = this.monsterNode.getComponent(UIOpacity) || this.monsterNode.addComponent(UIOpacity);
    opacity.opacity = 255;
    tween(this.monsterNode)
      .to(0.42, { scale: new Vec3(0.25, 0.25, 1) })
      .start();
    tween(opacity)
      .to(0.42, { opacity: 0 })
      .start();
    this.showFloatingText('净化成功', new Vec3(0, this.stageHeight * 0.12, 0), '#FFE066', 38);
  }

  private drawBackground(): void {
    const graphics = this.getGraphics(this.background);
    graphics.clear();
    graphics.fillColor = this.toColor('#102033');
    graphics.rect(-this.stageWidth / 2, -this.stageHeight / 2, this.stageWidth, this.stageHeight);
    graphics.fill();
    graphics.fillColor = this.toColor('#203A54');
    graphics.rect(-this.stageWidth / 2, -this.stageHeight / 2, this.stageWidth, this.stageHeight * 0.28);
    graphics.fill();
    graphics.fillColor = this.toColor('#FFE066', 92);
    graphics.circle(this.stageWidth * 0.34, this.stageHeight * 0.34, 48);
    graphics.fill();

    for (let i = 0; i < 8; i += 1) {
      const x = -this.stageWidth * 0.46 + i * this.stageWidth * 0.13;
      const height = 80 + (i % 4) * 34;
      graphics.fillColor = this.toColor(i % 2 === 0 ? '#2B4B66' : '#263F59');
      graphics.rect(x, -this.stageHeight * 0.36, this.stageWidth * 0.085, height);
      graphics.fill();
      graphics.fillColor = this.toColor('#FFE066', 125);
      graphics.rect(x + 14, -this.stageHeight * 0.34, 10, 12);
      graphics.rect(x + 42, -this.stageHeight * 0.31, 10, 12);
      graphics.fill();
    }
  }

  private drawHero(): void {
    const graphics = this.getGraphics(this.heroNode);
    graphics.clear();
    graphics.fillColor = this.toColor('#DDE7F0');
    graphics.circle(0, 58, 46);
    graphics.fill();
    graphics.fillColor = this.toColor('#E63946');
    graphics.rect(-42, -72, 84, 116);
    graphics.fill();
    graphics.fillColor = this.toColor('#F4F7FB');
    graphics.rect(-16, -72, 32, 116);
    graphics.fill();
    graphics.fillColor = this.toColor('#3A86FF');
    graphics.circle(0, -10, 16);
    graphics.fill();
    graphics.fillColor = this.toColor('#F9D94A');
    graphics.circle(-17, 70, 7);
    graphics.circle(17, 70, 7);
    graphics.fill();
    graphics.fillColor = this.toColor('#2B2D42');
    graphics.rect(-62, -16, 24, 72);
    graphics.rect(38, -16, 24, 72);
    graphics.rect(-34, -116, 28, 48);
    graphics.rect(6, -116, 28, 48);
    graphics.fill();
  }

  private drawMonster(): void {
    const graphics = this.getGraphics(this.monsterNode);
    graphics.clear();
    graphics.fillColor = this.toColor(this.currentLevel.color);
    const big = this.currentLevel.pattern === 'summon';
    graphics.circle(0, 0, big ? 86 : 70);
    graphics.fill();
    graphics.fillColor = this.toColor(this.currentLevel.accent);

    if (this.currentLevel.pattern === 'charge') {
      graphics.rect(-58, 34, 30, 66);
      graphics.rect(28, 34, 30, 66);
    } else if (this.currentLevel.pattern === 'bubble') {
      graphics.circle(-58, -46, 20);
      graphics.circle(58, -46, 20);
      graphics.circle(0, -62, 18);
    } else if (this.currentLevel.pattern === 'magnet') {
      graphics.rect(-76, -12, 152, 24);
      graphics.rect(-52, -42, 104, 18);
    } else if (this.currentLevel.pattern === 'summon') {
      graphics.circle(-66, -18, 26);
      graphics.circle(66, -18, 26);
      graphics.rect(-88, 8, 176, 22);
    } else {
      graphics.rect(-52, -52, 24, 42);
      graphics.rect(28, -52, 24, 42);
    }
    graphics.fill();

    graphics.fillColor = this.toColor('#F4F7FB');
    graphics.circle(-24, 22, 14);
    graphics.circle(24, 22, 14);
    graphics.fill();
    graphics.fillColor = this.toColor('#111827');
    graphics.circle(-24, 20, 6);
    graphics.circle(24, 20, 6);
    graphics.rect(-30, -32, 60, 10);
    graphics.fill();
  }

  private redrawWarning(warning: AttackWarning): void {
    const graphics = this.getGraphics(warning.node);
    const progress = 1 - Math.max(0, warning.timer / warning.total);
    graphics.clear();
    graphics.fillColor = this.toColor('#FF4D4D', 64 + Math.floor(progress * 130));
    if (warning.shape === 'circle') {
      graphics.circle(0, 0, warning.radius);
    } else {
      graphics.rect(-warning.width / 2, -warning.height / 2, warning.width, warning.height);
    }
    graphics.fill();
    graphics.strokeColor = this.toColor('#FFE066', 160);
    graphics.lineWidth = 5;
    if (warning.shape === 'circle') {
      graphics.circle(0, 0, Math.max(8, warning.radius * progress));
    } else {
      const w = Math.max(8, warning.width * progress);
      const h = Math.max(8, warning.height * progress);
      graphics.rect(-w / 2, -h / 2, w, h);
    }
    graphics.stroke();
  }

  private createBar(parent: Node, x: number, y: number, width: number, height: number, fillColor: string): BarView {
    const root = this.createRectNode(parent, 'Bar', x, y, width, height, '#0B1324', 230);
    const fill = this.createRectNode(root, 'Fill', 0, 0, width, height, fillColor);
    const label = this.createLabel(root, '', 0, 1, width, height + 4, 17, '#FFFFFF');
    return { root, fill, label, width, height, color: fillColor };
  }

  private updateBar(bar: BarView, ratio: number, text: string): void {
    const safeRatio = Math.max(0, Math.min(1, ratio));
    const fillWidth = Math.max(2, bar.width * safeRatio);
    bar.fill.setPosition(-bar.width / 2 + fillWidth / 2, 0, 0);
    this.setNodeSize(bar.fill, fillWidth, bar.height);
    this.redrawRect(bar.fill, fillWidth, bar.height, safeRatio > 0.24 ? bar.color : '#FF6B6B');
    bar.label.string = text;
  }

  private showModal(title: string, message: string, actions: ModalAction[]): void {
    this.modalLayer.removeAllChildren();
    this.modalLayer.active = true;
    this.createRectNode(this.modalLayer, 'Scrim', 0, 0, this.stageWidth, this.stageHeight, '#000000', 176);
    this.createRectNode(this.modalLayer, 'Panel', 0, 0, Math.min(610, this.stageWidth - 56), 400, '#1F2D3D', 250);
    this.createLabel(this.modalLayer, title, 0, 130, 540, 52, 34, '#FFFFFF');
    this.createLabel(this.modalLayer, message, 0, 58, 520, 82, 25, '#DDE7F0');

    const startX = actions.length === 1 ? 0 : -(actions.length - 1) * 106;
    actions.forEach((item, index) => {
      this.createButton(this.modalLayer, item.text, startX + index * 212, -110, 172, 68, item.color || '#457B9D', item.action);
    });
  }

  private hideModal(): void {
    this.modalLayer.active = false;
    this.modalLayer.removeAllChildren();
  }

  private isModalOpen(): boolean {
    return !!this.modalLayer && this.modalLayer.active;
  }

  private showFloatingText(text: string, position: Vec3, color: string, size: number): void {
    if (!this.fxLayer || !this.fxLayer.isValid) {
      return;
    }

    const node = this.createNode(this.fxLayer, 'FloatText', position.x, position.y, 420, 70);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = size;
    label.lineHeight = size + 6;
    label.color = this.toColor(color);
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.overflow = Label.Overflow.SHRINK;
    const opacity = node.addComponent(UIOpacity);
    opacity.opacity = 255;
    tween(node)
      .to(0.72, { position: new Vec3(position.x, position.y + 82, 0) })
      .call(() => node.destroy())
      .start();
    tween(opacity).to(0.72, { opacity: 0 }).start();
  }

  private createButton(parent: Node, text: string, x: number, y: number, width: number, height: number, color: string, onClick: () => void): Label {
    const node = this.createRectNode(parent, 'Button', x, y, width, height, color, 245);
    const button = node.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    node.on(Button.EventType.CLICK, onClick, this);
    const label = this.createLabel(node, text, 0, 0, width - 14, height - 8, height > 72 ? 28 : 22, '#FFFFFF');
    label.enableWrapText = true;
    return label;
  }

  private createLabel(parent: Node, text: string, x: number, y: number, width: number, height: number, fontSize: number, color: string): Label {
    const node = this.createNode(parent, 'Label', x, y, width, height);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.color = this.toColor(color);
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.enableWrapText = true;
    label.overflow = Label.Overflow.SHRINK;
    return label;
  }

  private createRectNode(parent: Node, name: string, x: number, y: number, width: number, height: number, color: string, alpha = 255): Node {
    const node = this.createNode(parent, name, x, y, width, height);
    this.redrawRect(node, width, height, color, alpha);
    return node;
  }

  private createNode(parent: Node, name: string, x: number, y: number, width: number, height: number): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.setParent(parent);
    node.setPosition(x, y, 0);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private rebuildRoot(color: string): void {
    const size = view.getVisibleSize();
    this.stageWidth = Math.max(640, size.width);
    this.stageHeight = Math.max(960, size.height);
    this.node.removeAllChildren();
    this.node.layer = Layers.Enum.UI_2D;
    const rootTransform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
    rootTransform.setContentSize(this.stageWidth, this.stageHeight);
    this.background = this.createRectNode(this.node, 'Background', 0, 0, this.stageWidth, this.stageHeight, color);
  }

  private setNodeSize(node: Node, width: number, height: number): void {
    const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
    transform.setContentSize(width, height);
  }

  private redrawRect(node: Node, width: number, height: number, color: string, alpha = 255): void {
    const graphics = this.getGraphics(node);
    graphics.clear();
    graphics.fillColor = this.toColor(color, alpha);
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
  }

  private getGraphics(node: Node): Graphics {
    return node.getComponent(Graphics) || node.addComponent(Graphics);
  }

  private toColor(hex: string, alpha = 255): Color {
    const cleaned = hex.replace('#', '');
    const value = Number.parseInt(cleaned, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return new Color(r, g, b, alpha);
  }

  private loadSave(): void {
    try {
      const raw = miniGameBridge.getStorageItem(this.saveKey) || miniGameBridge.getStorageItem('light-hero-save-v1');
      if (!raw) {
        return;
      }

      const save = JSON.parse(raw);
      this.levelIndex = Math.max(0, Number(save.levelIndex ?? 0));
      this.unlockedLevel = Math.max(this.levelIndex, Number(save.unlockedLevel ?? this.levelIndex ?? 0));
      this.unlockedLevel = Math.min(this.unlockedLevel, LEVELS.length - 1);
      this.coins = Math.max(0, Number(save.coins ?? 120));
      this.upgrades = {
        power: this.clampUpgradeLevel(Number(save.upgrades?.power ?? 1)),
        shield: this.clampUpgradeLevel(Number(save.upgrades?.shield ?? 1)),
        beam: this.clampUpgradeLevel(Number(save.upgrades?.beam ?? 1)),
      };
      this.levelStars = save.levelStars || {};
      this.bestTimes = save.bestTimes || {};
    } catch {
      this.levelIndex = 0;
      this.unlockedLevel = 0;
      this.coins = 120;
      this.upgrades = createDefaultUpgrades();
      this.levelStars = {};
      this.bestTimes = {};
    }
  }

  private save(): void {
    try {
      miniGameBridge.setStorageItem(this.saveKey, JSON.stringify({
        levelIndex: this.levelIndex,
        unlockedLevel: this.unlockedLevel,
        coins: this.coins,
        upgrades: this.upgrades,
        levelStars: this.levelStars,
        bestTimes: this.bestTimes,
      }));
    } catch {
      // Storage may be unavailable in some preview environments.
    }
  }

  private getLevelKey(index: number): string {
    return String(getMonsterLevel(index).stage);
  }

  private clampUpgradeLevel(level: number): number {
    return Math.max(1, Math.min(UPGRADE_MAX_LEVEL, Math.floor(level || 1)));
  }
}
