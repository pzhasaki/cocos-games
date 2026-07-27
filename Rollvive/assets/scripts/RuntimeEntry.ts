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
    Node,
    resources,
    Sprite,
    SpriteFrame,
    UITransform,
    Vec2,
} from 'cc';
import { GameState } from './domain/GameState';
import { createEnemy, createInitialRun, createWaveRuntime, RunEnemyModel, RunModel } from './domain/RunModel';
import { MOBILE_PERFORMANCE_BUDGET } from './domain/PerformanceBudget';
import { ENEMY_ARCHETYPES, getFloorTheme, getWavePlan, RuntimeEnemyType } from './domain/BattleContent';
import { ATTACK_TRAIL_FEEDBACK, DAMAGE_NUMBER_FEEDBACK } from './domain/FeedbackSpec';
import {
    calculatePlayerDamage,
    countNearbyEnemies,
    createRuntimeWaveEnemies,
    damageAfterArmor,
    enemyTypeFromConfig,
    resolvePlayerHitDamage,
} from './domain/RuntimeBattleMath';
import { RollSystem } from './manager/RollSystem';
import { DIMENSION_PASSIVES, HEX_CARDS, PROFESSIONS, professionHasTrait, rarityColorHex } from './data/RollData';
import type { CombatBonus, HexCardData, HexChoiceView, MbtiTrait, ProfessionId, UltimateId, WeaponStyleId } from './data/RollData';

const { ccclass } = _decorator;

interface EnemyPosition {
    x: number;
    y: number;
    contactCooldown: number;
    type: RuntimeEnemyType;
    actionTimer: number;
    windupTimer: number;
    dashCooldown: number;
    dashVx: number;
    dashVy: number;
    warningTimer: number;
    hitFlashTimer: number;
    spawnTimer: number;
    deathTimer: number;
}

interface AttackTrace {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    ttl: number;
    duration: number;
    color: Color;
    kind: 'line' | 'arc' | 'thrust' | 'burst';
    radius?: number;
    angle?: number;
    width?: number;
}

interface FloatingText {
    text: string;
    x: number;
    y: number;
    ttl: number;
    duration: number;
    color: Color;
    label: Label;
}

interface VfxPulse {
    x: number;
    y: number;
    ttl: number;
    duration: number;
    radius: number;
    maxRadius: number;
    lineWidth: number;
    color: Color;
    /** Optional bitmap VFX key under resources/vfx/ (hit_spark, crit_burst, ...). */
    spriteKey?: string;
    size?: number;
}

interface ControlZone {
    x: number;
    y: number;
    radius: number;
    ttl: number;
    duration: number;
    damageCooldown: number;
    color: Color;
}

interface ImpactShard {
    x: number;
    y: number;
    vx: number;
    vy: number;
    ttl: number;
    duration: number;
    size: number;
    color: Color;
}

type WeaponId = WeaponStyleId;
type WeaponActionKind = WeaponId | 'none';

interface WeaponSpec {
    id: WeaponId;
    name: string;
    shortName: string;
    description: string;
    rangeBonus: number;
    damageMultiplier: number;
    cooldownMultiplier: number;
    targetBonus: number;
    color: Color;
}

interface LoadoutSpec {
    professionId: ProfessionId;
    weaponId: WeaponId;
    roleTag: string;
    bodyColor: Color;
    trimColor: Color;
    silhouette: 'duelist' | 'pirate' | 'sharpshooter' | 'mage';
}

/** Introvert alone radius in arena px (~3m feel). */
const INTROVERT_RADIUS = 96;
const MAX_ULTIMATE_ENERGY = 100;

interface PlayerProjectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    radius: number;
    ttl: number;
    color: Color;
    owner: 'enemy' | 'player';
    weaponId?: WeaponId;
    pierceRemaining?: number;
    hitIds?: string[];
    blastRadius?: number;
    isCritical?: boolean;
}

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 540;
const ARENA_WIDTH = 900;
const ARENA_HEIGHT = 338;
const ARENA_HALF_WIDTH = ARENA_WIDTH / 2;
const ARENA_HALF_HEIGHT = ARENA_HEIGHT / 2;
const PLAYER_RADIUS = 18;
const ENEMY_RADIUS = 11;
const CONTACT_RANGE = 34;
const JOYSTICK_RADIUS = 52;
const DASH_TRIGGER_RANGE = 150;
const DASH_WINDUP_SECONDS = 0.42;
const DASH_DURATION_SECONDS = 0.22;
const WAVE_DURATION_SECONDS = 60;
const BASE_SPAWN_INTERVAL_SECONDS = 1.15;

type RuntimeLanguage = 'en' | 'zh';

const UI_TEXT: Record<RuntimeLanguage, Record<string, string>> = {
    en: {
        subtitle: '16 Personalities · Mind Dungeon — play your type.',
        language: 'LANGUAGE',
        loadouts: 'MBTI PERSONALITIES',
        start: 'ENTER ABYSS',
        shield: 'ULTIMATE',
        restart: 'RESTART',
        refresh: 'REFRESH',
        watchAd: 'WATCH AD',
        draft: 'SKILL DRAFT',
        arenaClear: 'Mind clear',
        runComplete: 'RUN COMPLETE',
        wave: 'Wave',
        level: 'Lv',
        hp: 'HP',
        enemies: 'Foes',
        freeRefresh: 'Free refresh',
        pickUpgrade: 'Pick one skill',
        auto: 'AUTO',
        firing: 'FIRING',
        seeking: 'SEEK',
        snared: 'SNARED',
        mobile: 'MOBILE',
        shieldReady: 'READY',
        phase1: 'PHASE 1',
        phase2: 'PHASE 2',
        shieldUp: 'Ultimate active {seconds}s.',
        meleeSeek: '{weapon} seeking melee range.',
        rangedSeek: '{weapon} seeking target.',
        bladeSwing: '{weapon} swept {hits}, KO {kills}.',
        spearThrust: '{weapon} blasted {hits}, KO {kills}.',
        gunShot: '{weapon} fired shots.',
        orbShot: '{weapon} launched a core.',
        projectileHit: 'Hit for {damage}.',
        shieldProjectile: 'Blocked — took {damage}.',
        contactHit: 'Contact damage {damage}.',
        shieldContact: 'Blocked contact — took {damage}.',
        waveClear: 'Wave {wave} clear. Pick a skill or refresh.',
        picked: 'Picked {card}.',
        levelUp: 'Level {level}: base stats improved.',
        ultimateReady: 'Ultimate READY — tap ULTIMATE.',
        ultimateUsed: 'Ultimate: {name}',
        energyLow: 'Ultimate energy {energy}/100.',
    },
    zh: {
        subtitle: '16型人格 · 意识深渊 — 成为你的人格。',
        language: '语言',
        loadouts: 'MBTI 人格',
        start: '进入深渊',
        shield: '大招',
        restart: '再来',
        refresh: '刷新',
        watchAd: '看广告',
        draft: '技能选择',
        arenaClear: '心魔清空',
        runComplete: '本局结束',
        wave: '波次',
        level: '等级',
        hp: '生命',
        enemies: '心魔',
        freeRefresh: '免费刷新',
        pickUpgrade: '选择一项技能',
        auto: '自动',
        firing: '攻击中',
        seeking: '寻敌',
        snared: '被束缚',
        mobile: '可移动',
        shieldReady: '就绪',
        phase1: '一阶段',
        phase2: '二阶段',
        shieldUp: '大招生效 {seconds} 秒。',
        meleeSeek: '{weapon} 寻找近战距离。',
        rangedSeek: '{weapon} 寻找目标。',
        bladeSwing: '{weapon} 横扫 {hits}，击败 {kills}。',
        spearThrust: '{weapon} 轰击 {hits}，击败 {kills}。',
        gunShot: '{weapon} 射击。',
        orbShot: '{weapon} 发射核心。',
        projectileHit: '受到 {damage} 点伤害。',
        shieldProjectile: '格挡后受到 {damage}。',
        contactHit: '贴身伤害 {damage}。',
        shieldContact: '格挡贴身，受到 {damage}。',
        waveClear: '第 {wave} 波完成。选择技能或刷新。',
        picked: '选择了 {card}。',
        levelUp: '等级 {level}：基础属性提升。',
        ultimateReady: '大招就绪 — 点击大招。',
        ultimateUsed: '大招：{name}',
        energyLow: '大招能量 {energy}/100。',
    },
};

const WEAPON_SPECS: Record<WeaponId, WeaponSpec> = {
    blade: {
        id: 'blade',
        name: 'Short Blades',
        shortName: 'KNIVES',
        description: 'Close 180-degree short-blade sweeps with fast melee rhythm.',
        rangeBonus: 0,
        damageMultiplier: 1.08,
        cooldownMultiplier: 0.95,
        targetBonus: 0,
        color: new Color(255, 218, 110, 255),
    },
    spear: {
        id: 'spear',
        name: 'Deck Sweeper',
        shortName: 'SHOTGUN',
        description: 'Close-mid cone blast with heavy rhythm and splash pressure.',
        rangeBonus: 28,
        damageMultiplier: 1.12,
        cooldownMultiplier: 1.16,
        targetBonus: 2,
        color: new Color(70, 218, 238, 255),
    },
    gun: {
        id: 'gun',
        name: 'Twin Pistols',
        shortName: 'DUALS',
        description: 'Fast ranged twin shots, precise and readable.',
        rangeBonus: 82,
        damageMultiplier: 0.82,
        cooldownMultiplier: 0.68,
        targetBonus: 0,
        color: new Color(142, 220, 255, 255),
    },
    orb: {
        id: 'orb',
        name: 'Rune Burst',
        shortName: 'MAGIC',
        description: 'Area magic core that bursts on impact and scales with chain.',
        rangeBonus: -12,
        damageMultiplier: 0.95,
        cooldownMultiplier: 0.9,
        targetBonus: 2,
        color: new Color(204, 154, 255, 255),
    },
};

const WEAPON_ORDER: WeaponId[] = ['blade', 'spear', 'gun', 'orb'];

const GROUP_COLORS: Record<string, { body: Color; trim: Color }> = {
    NT: { body: new Color(56, 92, 168, 255), trim: new Color(120, 190, 255, 255) },
    NF: { body: new Color(112, 72, 168, 255), trim: new Color(210, 150, 255, 255) },
    SJ: { body: new Color(48, 110, 98, 255), trim: new Color(120, 220, 180, 255) },
    SP: { body: new Color(150, 78, 52, 255), trim: new Color(255, 180, 90, 255) },
};

const STYLE_SILHOUETTE: Record<WeaponId, LoadoutSpec['silhouette']> = {
    blade: 'duelist',
    spear: 'pirate',
    gun: 'sharpshooter',
    orb: 'mage',
};

function buildProfessionLoadouts(): Record<ProfessionId, LoadoutSpec> {
    const map = {} as Record<ProfessionId, LoadoutSpec>;
    for (const p of PROFESSIONS) {
        const colors = GROUP_COLORS[p.group] ?? GROUP_COLORS.NT;
        map[p.id] = {
            professionId: p.id,
            weaponId: p.weaponStyle,
            roleTag: p.combatStyle,
            bodyColor: colors.body,
            trimColor: colors.trim,
            silhouette: STYLE_SILHOUETTE[p.weaponStyle],
        };
    }
    return map;
}

const PROFESSION_LOADOUTS: Record<ProfessionId, LoadoutSpec> = buildProfessionLoadouts();

/** Title screen shows a focused M1 pair + full 16 grid (pageable groups). */
const TITLE_PROFESSION_ORDER: ProfessionId[] = PROFESSIONS.map((p) => p.id);

@ccclass('RuntimeEntry')
export class RuntimeEntry extends Component {
    private _root: Node | null = null;
    private _menu: Node | null = null;
    private _game: Node | null = null;
    private _arenaGraphics: Graphics | null = null;
    private _arenaMapSpriteNode: Node | null = null;
    private _arenaMapSprite: Sprite | null = null;
    private _enemySpriteLayer: Node | null = null;
    private readonly _voidChaserSpriteNodes: Node[] = [];
    private _voidChaserSpriteFrame: SpriteFrame | null = null;
    private readonly _coreTankSpriteNodes: Node[] = [];
    private _coreTankSpriteFrame: SpriteFrame | null = null;
    /** MBTI hero battle sprites keyed by profession id. */
    private readonly _heroSpriteFrames = new Map<ProfessionId, SpriteFrame>();
    /** MBTI hero UI portraits (bust) keyed by profession id. */
    private readonly _portraitSpriteFrames = new Map<ProfessionId, SpriteFrame>();
    /** Emotion / archetype enemy sprites keyed by RuntimeEnemyType. */
    private readonly _enemySpriteFrames = new Map<RuntimeEnemyType, SpriteFrame>();
    /** Floor-specific boss sprites (1=Workplace Fear … 4=Self Abyss). */
    private readonly _bossSpriteByFloor = new Map<number, SpriteFrame>();
    /** Hex skill icons keyed by card id. */
    private readonly _skillIconFrames = new Map<string, SpriteFrame>();
    /** Ultimate ability icons keyed by UltimateId. */
    private readonly _ultimateIconFrames = new Map<UltimateId, SpriteFrame>();
    /** Floor arena maps keyed by floor 1-4. */
    private readonly _floorMapFrames = new Map<number, SpriteFrame>();
    /** Summon / ally sprites (turret, guard, element_sprite). */
    private readonly _summonSpriteFrames = new Map<string, SpriteFrame>();
    /** MBTI dimension passive icons E/I/S/N/T/F/J/P. */
    private readonly _dimIconFrames = new Map<MbtiTrait, SpriteFrame>();
    /** Weapon style icons blade/spear/gun/orb. */
    private readonly _weaponIconFrames = new Map<WeaponStyleId, SpriteFrame>();
    /** Misc UI chrome (heart, coin, energy, rarity frames, etc.). */
    private readonly _uiIconFrames = new Map<string, SpriteFrame>();
    /** VFX keyframes (slash, explosion, heal_ring, hit_spark, ...). */
    private readonly _vfxFrames = new Map<string, SpriteFrame>();
    /** Pooled floating VFX sprite nodes (bitmap overlays). */
    private readonly _vfxSpritePool: Array<{ node: Node; sprite: Sprite }> = [];
    private readonly _activeVfxSprites: Array<{ node: Node; sprite: Sprite; ttl: number; duration: number; baseSize: number }> = [];
    private readonly _enemyBoltSprites: Array<{ node: Node; sprite: Sprite }> = [];
    private _vfxSpriteLayer: Node | null = null;
    /** Draft card background sprites (one per choice slot). */
    private readonly _choiceCardBgSprites: Sprite[] = [];
    private readonly _choiceLockSprites: Sprite[] = [];
    private _rerollIconSprite: Sprite | null = null;
    private _titleOrnamentSprite: Sprite | null = null;
    private _waveClearBadgeSprite: Sprite | null = null;
    private _waveClearBadgeTimer = 0;
    private _resultBannerSprite: Sprite | null = null;
    private readonly _professionFrameSprites: Sprite[] = [];
    private _hpBarFrameSprite: Sprite | null = null;
    private _hpBarFillSprite: Sprite | null = null;
    private _energyBarFillSprite: Sprite | null = null;
    private _statusBarRoot: Node | null = null;
    private readonly _statusBarWidth = 168;
    /** Pooled sprite nodes per enemy type for multi-unit waves. */
    private readonly _enemySpritePools = new Map<RuntimeEnemyType, Node[]>();
    private readonly _summonSpriteNodes: Node[] = [];
    private _arenaPlayerSpriteNode: Node | null = null;
    private _arenaPlayerSprite: Sprite | null = null;
    private _damageTextLayer: Node | null = null;
    private _loadoutPreviewGraphics: Graphics | null = null;
    private _loadoutPreviewSpriteNode: Node | null = null;
    private _loadoutPreviewSprite: Sprite | null = null;
    private _ultimateIconSprite: Sprite | null = null;
    private _weaponPreviewSprite: Sprite | null = null;
    private _joystickBase: Node | null = null;
    private _joystickBaseGraphics: Graphics | null = null;
    private _joystickKnob: Node | null = null;
    private _joystickKnobGraphics: Graphics | null = null;
    private _startButton: Button | null = null;
    private _languageButtons: Button[] = [];
    private _professionButtons: Button[] = [];
    private _weaponButtons: Button[] = [];
    private _languageHandlers: Array<() => void> = [];
    private _professionHandlers: Array<() => void> = [];
    private _weaponHandlers: Array<() => void> = [];
    private _shieldButton: Button | null = null;
    private _rerollButton: Button | null = null;
    private _choiceButtons: Button[] = [];
    private _choiceLabels: Label[] = [];
    private _choiceIconSprites: Sprite[] = [];
    private _choiceHandlers: Array<() => void> = [];
    private _hudLabel: Label | null = null;
    private _enemyLabel: Label | null = null;
    private _statusLabel: Label | null = null;
    private _resultLabel: Label | null = null;
    private _menuInfoLabel: Label | null = null;
    private _logLabel: Label | null = null;

    private readonly _rollSystem = new RollSystem();
    private readonly _enemyPositions = new Map<string, EnemyPosition>();
    private readonly _floatingTexts: FloatingText[] = [];
    private readonly _floatingTextPool: Label[] = [];
    private readonly _attackTraces: AttackTrace[] = [];
    private readonly _projectiles: PlayerProjectile[] = [];
    private readonly _vfxPulses: VfxPulse[] = [];
    private readonly _controlZones: ControlZone[] = [];
    private readonly _impactShards: ImpactShard[] = [];
    private _state = GameState.Boot;
    private _run: RunModel | null = null;
    private _language: RuntimeLanguage = 'en';
    private _selectedProfessionId: ProfessionId = 'intj';
    private _selectedWeaponId: WeaponId = 'gun';
    private _titlePage = 0;
    private _pageButton: Button | null = null;
    private _facingX = 1;
    private _facingY = 0;
    private _playerX = -240;
    private _playerY = 0;
    private _moveInput = new Vec2(0, 0);
    private _keyboardInput = new Vec2(0, 0);
    private readonly _pressedKeys = new Set<KeyCode>();
    private _joystickTouchId: number | null = null;
    private _attackTimer = 0;
    private _shieldTimer = 0;
    private _weaponActionTimer = 0;
    private _weaponActionDuration = 0.001;
    private _weaponActionKind: WeaponActionKind = 'none';
    private _uiTimer = 0;
    private _perfTimer = 0;
    private _perfFps = 60;
    private _lastLog = '';
    private _spawnTimer = 0;
    private _spawnSerial = 0;

    protected onLoad(): void {
        this._build();
        input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this._onKeyUp, this);
        this._enterState(GameState.Title);
    }

    protected update(dt: number): void {
        const cappedDt = Math.min(dt, 0.05);
        if (this._state === GameState.Battle && this._run) {
            this._tickBattle(cappedDt);
            this._drawArena();
            this._drawJoystick();
            this._uiTimer += cappedDt;
            if (this._uiTimer >= 1 / MOBILE_PERFORMANCE_BUDGET.maxUiRefreshHz) {
                this._uiTimer = 0;
                this._renderHud();
            }
            return;
        }
        // Outside battle: still animate draft wave-clear badge / lingering VFX.
        if (this._waveClearBadgeTimer > 0) this._tickWaveClearBadge(cappedDt);
        if (this._activeVfxSprites.length > 0) this._tickVfx(cappedDt);
    }

    protected onDestroy(): void {
        this._startButton?.node.off(Button.EventType.CLICK, this._startRun, this);
        this._languageButtons.forEach((button, index) => button.node.off(Button.EventType.CLICK, this._languageHandlers[index], this));
        this._professionButtons.forEach((button, index) => button.node.off(Button.EventType.CLICK, this._professionHandlers[index], this));
        this._weaponButtons.forEach((button, index) => button.node.off(Button.EventType.CLICK, this._weaponHandlers[index], this));
        this._shieldButton?.node.off(Button.EventType.CLICK, this._onPrimaryAction, this);
        this._rerollButton?.node.off(Button.EventType.CLICK, this._rerollDraft, this);
        this._choiceButtons.forEach((button, index) => {
            button.node.off(Button.EventType.CLICK, this._choiceHandlers[index], this);
        });
        this._joystickBase?.off(Node.EventType.TOUCH_START, this._onJoystickStart, this);
        this._joystickBase?.off(Node.EventType.TOUCH_MOVE, this._onJoystickMove, this);
        this._joystickBase?.off(Node.EventType.TOUCH_END, this._onJoystickEnd, this);
        this._joystickBase?.off(Node.EventType.TOUCH_CANCEL, this._onJoystickEnd, this);
        input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this._onKeyUp, this);
    }

    private _build(): void {
        this._root = this._panel('RuntimeRoot', this.node, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0);

        this._menu = this._panel('MenuScreen', this._root, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0);
        this._block('MenuBg', this._menu, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0, new Color(10, 14, 24, 255));
        this._label('Title', this._menu, 'Mind Dungeon', 42, -200, 208, new Color(246, 249, 255, 255));
        this._label('Subtitle', this._menu, this._t('subtitle'), 14, -168, 172, new Color(170, 190, 218, 255));
        this._label('LanguageHint', this._menu, this._t('language'), 13, 294, 206, new Color(132, 164, 202, 255));
        const languages: RuntimeLanguage[] = ['en', 'zh'];
        languages.forEach((language, index) => {
            const button = this._button(`Language${language}`, this._menu!, language === 'en' ? 'EN' : '中文', 78, 38, 302 + index * 88, 170);
            const handler = () => this._pickLanguage(language);
            button.node.on(Button.EventType.CLICK, handler, this);
            this._languageButtons.push(button);
            this._languageHandlers.push(handler);
        });
        this._label('ProfessionHint', this._menu, this._t('loadouts'), 13, -318, 128, new Color(132, 164, 202, 255));

        // 16 personalities in 2 pages of 8 (2×4 grid each).
        const pageSize = 8;
        for (let i = 0; i < pageSize; i += 1) {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const x = -300 + col * 118;
            const y = 78 - row * 62;
            const button = this._button(`Profession${i}`, this._menu!, '—', 108, 52, x, y);
            const label = button.node.getChildByName(`Profession${i}Label`)?.getComponent(Label);
            if (label) {
                label.fontSize = 12;
                label.lineHeight = 15;
            }
            const frameNode = this._panel(`Profession${i}Frame`, button.node, 108, 52, 0, 0);
            const frameSprite = frameNode.addComponent(Sprite);
            frameSprite.sizeMode = Sprite.SizeMode.CUSTOM;
            frameNode.setSiblingIndex(0);
            frameNode.active = false;
            this._professionFrameSprites.push(frameSprite);
            const slot = i;
            const handler = () => this._pickProfessionSlot(slot);
            button.node.on(Button.EventType.CLICK, handler, this);
            this._professionButtons.push(button);
            this._professionHandlers.push(handler);
        }

        this._pageButton = this._button('PageButton', this._menu, 'NT/NF →', 100, 36, -60, 128);
        this._pageButton.node.on(Button.EventType.CLICK, this._cycleTitlePage, this);

        const previewNode = this._panel('LoadoutPreview', this._menu, 278, 266, 292, 0);
        this._loadoutPreviewGraphics = previewNode.addComponent(Graphics);
        this._loadoutPreviewSpriteNode = this._panel('LoadoutPreviewSprite', previewNode, 212, 212, -8, -14);
        this._loadoutPreviewSprite = this._loadoutPreviewSpriteNode.addComponent(Sprite);
        this._loadoutPreviewSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this._loadoutPreviewSpriteNode.active = false;
        // Bound weapon style icon on loadout card.
        const weaponIconNode = this._panel('WeaponPreviewIcon', previewNode, 48, 48, 100, -100);
        this._weaponPreviewSprite = weaponIconNode.addComponent(Sprite);
        this._weaponPreviewSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        weaponIconNode.active = false;

        this._menuInfoLabel = this._label('MenuInfo', this._menu, '', 13, -200, -48, new Color(210, 224, 248, 255));
        if (this._menuInfoLabel) {
            this._menuInfoLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
            const transform = this._menuInfoLabel.node.getComponent(UITransform);
            if (transform) transform.setContentSize(360, 90);
        }
        this._startButton = this._button('StartButton', this._menu, this._t('start'), 190, 48, -200, -168);
        this._startButton.node.on(Button.EventType.CLICK, this._startRun, this);
        this._refreshLoadoutButtons();

        this._game = this._panel('GameScreen', this._root, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0);
        this._block('GameBg', this._game, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0, new Color(8, 12, 20, 255));
        this._hudLabel = this._label('Hud', this._game, '', 16, 0, 244, new Color(230, 238, 255, 255));
        this._enemyLabel = this._label('Enemy', this._game, '', 14, 0, 219, new Color(255, 154, 154, 255));

        const arenaNode = this._panel('ArenaView', this._game, ARENA_WIDTH, ARENA_HEIGHT, 0, 34);
        this._arenaMapSpriteNode = this._panel('ArenaMap', arenaNode, ARENA_WIDTH, ARENA_HEIGHT, 0, 0);
        this._arenaMapSprite = this._arenaMapSpriteNode.addComponent(Sprite);
        this._arenaMapSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this._arenaMapSpriteNode.active = false;
        const arenaGraphicsNode = this._panel('ArenaGraphicsLayer', arenaNode, ARENA_WIDTH, ARENA_HEIGHT, 0, 0);
        this._arenaGraphics = arenaGraphicsNode.addComponent(Graphics);
        this._enemySpriteLayer = this._panel('EnemySpriteLayer', arenaNode, ARENA_WIDTH, ARENA_HEIGHT, 0, 0);
        this._vfxSpriteLayer = this._panel('VfxSpriteLayer', arenaNode, ARENA_WIDTH, ARENA_HEIGHT, 0, 0);
        this._arenaPlayerSpriteNode = this._panel('PlayerSprite', arenaNode, 76, 76, 0, 0);
        this._arenaPlayerSprite = this._arenaPlayerSpriteNode.addComponent(Sprite);
        this._arenaPlayerSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this._arenaPlayerSpriteNode.active = false;
        this._damageTextLayer = this._panel('DamageTextLayer', arenaNode, ARENA_WIDTH, ARENA_HEIGHT, 0, 0);

        this._statusLabel = this._label('Status', this._game, '', 13, 0, -166, new Color(255, 220, 130, 255));
        this._logLabel = this._label('Prompt', this._game, '', 12, 0, -190, new Color(190, 205, 230, 255));
        const resultBannerNode = this._panel('ResultBanner', this._game, 420, 160, 0, 36);
        this._resultBannerSprite = resultBannerNode.addComponent(Sprite);
        this._resultBannerSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        resultBannerNode.active = false;
        this._resultLabel = this._label('ResultSummary', this._game, '', 20, 0, 36, new Color(245, 250, 255, 255));
        if (this._resultLabel) this._resultLabel.node.active = false;

        this._joystickBase = this._panel('JoystickBase', this._game, 118, 118, -372, -184);
        this._joystickBaseGraphics = this._joystickBase.addComponent(Graphics);
        this._joystickBase.on(Node.EventType.TOUCH_START, this._onJoystickStart, this);
        this._joystickBase.on(Node.EventType.TOUCH_MOVE, this._onJoystickMove, this);
        this._joystickBase.on(Node.EventType.TOUCH_END, this._onJoystickEnd, this);
        this._joystickBase.on(Node.EventType.TOUCH_CANCEL, this._onJoystickEnd, this);
        this._joystickKnob = this._panel('JoystickKnob', this._joystickBase, 52, 52, 0, 0);
        this._joystickKnobGraphics = this._joystickKnob.addComponent(Graphics);

        this._shieldButton = this._button('ShieldButton', this._game, this._t('shield'), 132, 48, 246, -198);
        this._shieldButton.node.on(Button.EventType.CLICK, this._onPrimaryAction, this);
        // Ultimate icon sits on the ULT button (left of label).
        const ultIconNode = this._panel('UltimateIcon', this._shieldButton.node, 36, 36, -42, 0);
        this._ultimateIconSprite = ultIconNode.addComponent(Sprite);
        this._ultimateIconSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        ultIconNode.active = false;
        this._rerollButton = this._button('RerollButton', this._game, this._t('refresh'), 148, 48, 388, -198);
        this._rerollButton.node.on(Button.EventType.CLICK, this._rerollDraft, this);
        const rerollIconNode = this._panel('RerollIcon', this._rerollButton.node, 32, 32, -52, 0);
        this._rerollIconSprite = rerollIconNode.addComponent(Sprite);
        this._rerollIconSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        rerollIconNode.active = false;

        // Title ornament (behind logo area on title screen).
        const ornamentNode = this._panel('TitleOrnament', this._title, 220, 220, 0, 40);
        this._titleOrnamentSprite = ornamentNode.addComponent(Sprite);
        this._titleOrnamentSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        ornamentNode.active = false;
        // Wave-clear badge (shown briefly via status; kept as reusable node).
        const waveClearNode = this._panel('WaveClearBadge', this._game, 96, 96, 0, 40);
        this._waveClearBadgeSprite = waveClearNode.addComponent(Sprite);
        this._waveClearBadgeSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        waveClearNode.active = false;

        // Bitmap HP / energy chrome (M6); falls back to Graphics if frames missing.
        this._statusBarRoot = this._panel('StatusBars', arenaNode, 200, 36, -ARENA_HALF_WIDTH + 104, ARENA_HALF_HEIGHT - 28);
        this._statusBarRoot.active = false;
        const hpFrameNode = this._panel('HpBarFrame', this._statusBarRoot, this._statusBarWidth + 8, 14, 0, 6);
        this._hpBarFrameSprite = hpFrameNode.addComponent(Sprite);
        this._hpBarFrameSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        hpFrameNode.active = false;
        const hpFillNode = this._panel('HpBarFill', this._statusBarRoot, this._statusBarWidth, 8, 0, 6);
        this._hpBarFillSprite = hpFillNode.addComponent(Sprite);
        this._hpBarFillSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        hpFillNode.active = false;
        const energyFillNode = this._panel('EnergyBarFill', this._statusBarRoot, this._statusBarWidth, 6, 0, -6);
        this._energyBarFillSprite = energyFillNode.addComponent(Sprite);
        this._energyBarFillSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        energyFillNode.active = false;

        for (let i = 0; i < 4; i += 1) {
            const button = this._button(`HexChoice${i}`, this._game, 'HEX', 190, 72, -318 + i * 212, -112);
            // Card plate sits behind the choice content.
            const cardBgNode = this._panel(`HexChoice${i}CardBg`, button.node, 186, 70, 0, 0);
            const cardBgSprite = cardBgNode.addComponent(Sprite);
            cardBgSprite.sizeMode = Sprite.SizeMode.CUSTOM;
            cardBgNode.setSiblingIndex(0);
            cardBgNode.active = false;
            this._choiceCardBgSprites.push(cardBgSprite);
            const label = button.node.getChildByName(`HexChoice${i}Label`)?.getComponent(Label);
            if (label) {
                label.fontSize = 12;
                label.lineHeight = 16;
                label.node.setPosition(18, 0, 0);
                label.node.getComponent(UITransform)?.setContentSize(150, 64);
            }
            // Skill icon sits left of the rarity-tinted name.
            const iconNode = this._panel(`HexChoice${i}Icon`, button.node, 48, 48, -64, 0);
            const iconSprite = iconNode.addComponent(Sprite);
            iconSprite.sizeMode = Sprite.SizeMode.CUSTOM;
            iconNode.active = false;
            this._choiceIconSprites.push(iconSprite);
            // Lock badge (J-type) top-right of card.
            const lockNode = this._panel(`HexChoice${i}Lock`, button.node, 28, 28, 78, 22);
            const lockSprite = lockNode.addComponent(Sprite);
            lockSprite.sizeMode = Sprite.SizeMode.CUSTOM;
            lockNode.active = false;
            this._choiceLockSprites.push(lockSprite);
            const handler = () => this._pickChoice(i);
            button.node.on(Button.EventType.CLICK, handler, this);
            button.node.active = false;
            this._choiceButtons.push(button);
            this._choiceHandlers.push(handler);
            if (label) this._choiceLabels.push(label);
        }

        this._loadRuntimeAssets();
    }

    private _loadRuntimeAssets(): void {
        // Legacy fallback hero (kept until MBTI set is imported).
        resources.load('characters/knife_duelist/spriteFrame', SpriteFrame, (error, spriteFrame) => {
            if (error || !spriteFrame || !this.node.isValid) return;
            if (!this._heroSpriteFrames.has(this._selectedProfessionId)) {
                if (this._arenaPlayerSprite) this._arenaPlayerSprite.spriteFrame = spriteFrame;
                if (this._loadoutPreviewSprite) this._loadoutPreviewSprite.spriteFrame = spriteFrame;
            }
            this._drawLoadoutPreview();
            this._drawArena();
        });

        // 16 MBTI personality battle sprites.
        for (const profession of PROFESSIONS) {
            const path = `characters/${profession.id}/spriteFrame`;
            resources.load(path, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                this._heroSpriteFrames.set(profession.id, spriteFrame);
                if (profession.id === this._selectedProfessionId) {
                    this._applySelectedHeroSprite();
                    this._drawLoadoutPreview();
                    this._drawArena();
                }
            });
        }

        // 16 MBTI UI portraits (bust) for title loadout preview.
        for (const profession of PROFESSIONS) {
            resources.load(`portraits/${profession.id}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                this._portraitSpriteFrames.set(profession.id, spriteFrame);
                if (profession.id === this._selectedProfessionId) {
                    this._drawLoadoutPreview();
                }
            });
        }

        // Emotion / archetype enemies. Fall back to legacy void_chaser / core_tank names.
        const enemyAssetMap: Array<{ type: RuntimeEnemyType; path: string; legacy?: boolean }> = [
            { type: 'chaser', path: 'enemies/anxiety_spike' },
            { type: 'anxiety', path: 'enemies/anxiety_spike' },
            { type: 'doubt', path: 'enemies/doubt_orb' },
            { type: 'swarm', path: 'enemies/doubt_swarm' },
            { type: 'procrastination', path: 'enemies/delay_snail' },
            { type: 'dasher', path: 'enemies/anger_lance' },
            { type: 'spitter', path: 'enemies/comparison_shade' },
            { type: 'binder', path: 'enemies/bind_shell' },
            // Default boss art (Floor 1 Workplace Fear); floor map overrides below.
            { type: 'boss', path: 'enemies/workplace_fear' },
            // Perfection Statue elite tank; core_tank remains legacy fallback.
            { type: 'tank', path: 'enemies/perfection_statue' },
            { type: 'tank', path: 'enemies/core_tank', legacy: true },
            { type: 'chaser', path: 'enemies/void_chaser', legacy: true },
        ];
        for (const entry of enemyAssetMap) {
            resources.load(`${entry.path}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                // Prefer non-legacy emotion art when both exist.
                if (entry.legacy && this._enemySpriteFrames.has(entry.type)) return;
                this._enemySpriteFrames.set(entry.type, spriteFrame);
                if (entry.type === 'chaser') this._voidChaserSpriteFrame = spriteFrame;
                if (entry.type === 'tank') this._coreTankSpriteFrame = spriteFrame;
                this._drawArena();
            });
        }

        // Floor-specific boss portraits for waves 5/10/15/20.
        const bossFloorAssets: Array<{ floor: number; path: string }> = [
            { floor: 1, path: 'enemies/workplace_fear' },
            { floor: 2, path: 'enemies/social_fear' },
            { floor: 3, path: 'enemies/attachment_void' },
            { floor: 4, path: 'enemies/self_abyss' },
        ];
        for (const entry of bossFloorAssets) {
            resources.load(`${entry.path}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                this._bossSpriteByFloor.set(entry.floor, spriteFrame);
                if (entry.floor === 1 && !this._enemySpriteFrames.has('boss')) {
                    this._enemySpriteFrames.set('boss', spriteFrame);
                }
                this._drawArena();
            });
        }

        // Prefer Mind Abyss arena; fall back to Crash Site. Floor maps override in battle.
        const mapPaths = ['environment/mind_abyss_arena', 'environment/crash_site_arena'];
        let mapLoaded = false;
        for (const mapPath of mapPaths) {
            resources.load(`${mapPath}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid || mapLoaded) return;
                mapLoaded = true;
                if (this._arenaMapSprite) this._arenaMapSprite.spriteFrame = spriteFrame;
                this._drawArena();
            });
        }

        // Floor-themed arenas (F1-F4).
        const floorMaps: Array<{ floor: number; path: string }> = [
            { floor: 1, path: 'environment/floor1_workplace' },
            { floor: 2, path: 'environment/floor2_social' },
            { floor: 3, path: 'environment/floor3_attachment' },
            { floor: 4, path: 'environment/floor4_abyss' },
        ];
        for (const entry of floorMaps) {
            resources.load(`${entry.path}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                this._floorMapFrames.set(entry.floor, spriteFrame);
                this._applyFloorMap();
            });
        }

        // Hex skill icons for draft choices (72 core + 16 exclusives).
        for (const card of HEX_CARDS) {
            resources.load(`skills/${card.id}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                this._skillIconFrames.set(card.id, spriteFrame);
            });
        }

        // 16 ultimate ability icons.
        for (const profession of PROFESSIONS) {
            const ultId = profession.ultimateId;
            resources.load(`ultimates/${ultId}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                this._ultimateIconFrames.set(ultId, spriteFrame);
                if (profession.id === this._selectedProfessionId) this._syncUltimateButtonIcon();
            });
        }

        // Summon / ally battle sprites.
        const summons = [
            { key: 'turret', path: 'summons/turret' },
            { key: 'guard', path: 'summons/guard' },
            { key: 'element_sprite', path: 'summons/element_sprite' },
        ];
        for (const entry of summons) {
            resources.load(`${entry.path}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                this._summonSpriteFrames.set(entry.key, spriteFrame);
            });
        }

        // MBTI dimension passive icons.
        const dims: MbtiTrait[] = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
        for (const dim of dims) {
            resources.load(`dims/${dim.toLowerCase()}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                this._dimIconFrames.set(dim, spriteFrame);
            });
        }

        // Weapon style icons.
        const weapons: WeaponStyleId[] = ['blade', 'spear', 'gun', 'orb'];
        for (const weapon of weapons) {
            resources.load(`weapons/${weapon}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                this._weaponIconFrames.set(weapon, spriteFrame);
                this._syncWeaponPreviewIcon();
            });
        }

        // UI chrome + VFX keyframes (M4 base + M6 polish; safe if missing).
        const uiKeys = [
            'rarity_white', 'rarity_blue', 'rarity_purple', 'rarity_orange',
            'boss_warning', 'joystick_base', 'joystick_knob', 'logo_mark',
            'icon_heart', 'icon_coin', 'icon_energy', 'poster_title_vertical',
            // M6 UI skins
            'draft_card_bg', 'draft_lock', 'btn_primary', 'btn_danger',
            'btn_refresh', 'btn_ad_refresh', 'hp_bar_fill', 'hp_bar_frame',
            'energy_bar_fill', 'panel_dark', 'result_banner', 'wave_clear',
            'title_bg_ornament', 'prof_frame',
        ];
        for (const key of uiKeys) {
            resources.load(`ui/${key}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                this._uiIconFrames.set(key, spriteFrame);
                this._onUiIconLoaded(key, spriteFrame);
            });
        }
        const vfxKeys = [
            'slash', 'explosion', 'heal_ring', 'time_ripple', 'shockwave',
            // M6 combat VFX
            'hit_spark', 'crit_burst', 'dash_trail', 'dash_warning',
            'control_zone', 'boss_aura', 'boss_phase2', 'level_up',
            'pickup_glow', 'projectile_enemy',
        ];
        for (const key of vfxKeys) {
            resources.load(`vfx/${key}/spriteFrame`, SpriteFrame, (error, spriteFrame) => {
                if (error || !spriteFrame || !this.node.isValid) return;
                this._vfxFrames.set(key, spriteFrame);
            });
        }
    }

    private _onUiIconLoaded(key: string, frame: SpriteFrame): void {
        if (key === 'title_bg_ornament' && this._titleOrnamentSprite) {
            this._titleOrnamentSprite.spriteFrame = frame;
            this._titleOrnamentSprite.node.active = this._state === GameState.Title;
            this._titleOrnamentSprite.node.getComponent(UITransform)?.setContentSize(220, 220);
        }
        if (key === 'wave_clear' && this._waveClearBadgeSprite) {
            this._waveClearBadgeSprite.spriteFrame = frame;
        }
        if (key === 'draft_card_bg') {
            for (const sprite of this._choiceCardBgSprites) {
                sprite.spriteFrame = frame;
                sprite.node.getComponent(UITransform)?.setContentSize(186, 70);
            }
        }
        if (key === 'draft_lock') {
            for (const sprite of this._choiceLockSprites) {
                sprite.spriteFrame = frame;
                sprite.node.getComponent(UITransform)?.setContentSize(28, 28);
            }
        }
        if ((key === 'btn_refresh' || key === 'btn_ad_refresh') && this._rerollIconSprite) {
            this._syncRerollIcon();
        }
        if (key === 'joystick_base' && this._joystickBase) {
            let sprite = this._joystickBase.getComponent(Sprite);
            if (!sprite) sprite = this._joystickBase.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.spriteFrame = frame;
            this._joystickBase.getComponent(UITransform)?.setContentSize(118, 118);
            if (this._joystickBaseGraphics) this._joystickBaseGraphics.enabled = false;
        }
        if (key === 'joystick_knob' && this._joystickKnob) {
            let sprite = this._joystickKnob.getComponent(Sprite);
            if (!sprite) sprite = this._joystickKnob.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.spriteFrame = frame;
            this._joystickKnob.getComponent(UITransform)?.setContentSize(52, 52);
            if (this._joystickKnobGraphics) this._joystickKnobGraphics.enabled = false;
        }
        if (key === 'hp_bar_frame' && this._hpBarFrameSprite) {
            this._hpBarFrameSprite.spriteFrame = frame;
            this._hpBarFrameSprite.node.active = true;
            this._hpBarFrameSprite.node.getComponent(UITransform)?.setContentSize(this._statusBarWidth + 8, 14);
        }
        if (key === 'hp_bar_fill' && this._hpBarFillSprite) {
            this._hpBarFillSprite.spriteFrame = frame;
            this._hpBarFillSprite.node.active = true;
            this._hpBarFillSprite.node.getComponent(UITransform)?.setContentSize(this._statusBarWidth, 8);
        }
        if (key === 'energy_bar_fill' && this._energyBarFillSprite) {
            this._energyBarFillSprite.spriteFrame = frame;
            this._energyBarFillSprite.node.active = true;
            this._energyBarFillSprite.node.getComponent(UITransform)?.setContentSize(this._statusBarWidth, 6);
        }
        if (key === 'btn_primary' && this._startButton) {
            this._applyButtonSkin(this._startButton, frame, 190, 48);
        }
        if (key === 'btn_danger' && this._shieldButton) {
            this._applyButtonSkin(this._shieldButton, frame, 132, 48);
        }
        if (key === 'result_banner' && this._resultBannerSprite) {
            this._resultBannerSprite.spriteFrame = frame;
            this._resultBannerSprite.node.getComponent(UITransform)?.setContentSize(420, 160);
            this._resultBannerSprite.node.active = this._state === GameState.Result;
        }
        if (key === 'prof_frame') {
            for (const sprite of this._professionFrameSprites) {
                sprite.spriteFrame = frame;
                sprite.node.getComponent(UITransform)?.setContentSize(108, 52);
                sprite.node.active = this._state === GameState.Title;
            }
        }
        if (key === 'panel_dark' && this._menu) {
            // Soft dark plate behind loadout preview when available.
            const preview = this._menu.getChildByName('LoadoutPreview');
            if (preview) {
                let plate = preview.getChildByName('PanelDark');
                if (!plate) {
                    plate = this._panel('PanelDark', preview, 278, 266, 0, 0);
                    plate.setSiblingIndex(0);
                    const sprite = plate.addComponent(Sprite);
                    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                    sprite.spriteFrame = frame;
                    plate.getComponent(UITransform)?.setContentSize(278, 266);
                } else {
                    const sprite = plate.getComponent(Sprite);
                    if (sprite) sprite.spriteFrame = frame;
                }
            }
        }
    }

    private _applyButtonSkin(button: Button, frame: SpriteFrame, width: number, height: number): void {
        let sprite = button.node.getComponent(Sprite);
        if (!sprite) sprite = button.node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = frame;
        button.node.getComponent(UITransform)?.setContentSize(width, height);
    }

    private _syncRerollIcon(): void {
        if (!this._rerollIconSprite) return;
        const view = this._rollSystem.getViewModel();
        const useAd = view.freeRefreshesRemaining <= 0;
        const key = useAd ? 'btn_ad_refresh' : 'btn_refresh';
        const frame = this._uiIconFrames.get(key) ?? this._uiIconFrames.get('btn_refresh') ?? null;
        this._rerollIconSprite.node.active = !!frame && this._state === GameState.RollDraft;
        if (frame) {
            this._rerollIconSprite.spriteFrame = frame;
            this._rerollIconSprite.node.getComponent(UITransform)?.setContentSize(32, 32);
        }
    }

    private _syncUltimateButtonIcon(): void {
        const sprite = this._ultimateIconSprite;
        if (!sprite) return;
        const profession = PROFESSIONS.find((item) => item.id === this._selectedProfessionId) ?? PROFESSIONS[0];
        const frame = this._ultimateIconFrames.get(profession.ultimateId) ?? null;
        sprite.node.active = !!frame;
        if (frame) sprite.spriteFrame = frame;
    }

    private _syncWeaponPreviewIcon(): void {
        const sprite = this._weaponPreviewSprite;
        if (!sprite) return;
        const profession = PROFESSIONS.find((item) => item.id === this._selectedProfessionId) ?? PROFESSIONS[0];
        const frame = this._weaponIconFrames.get(profession.weaponStyle) ?? null;
        sprite.node.active = !!frame && this._state === GameState.Title;
        if (frame) sprite.spriteFrame = frame;
    }

    private _applyFloorMap(): void {
        if (!this._arenaMapSprite) return;
        const floor = this._run ? Math.min(4, Math.max(1, getWavePlan(this._run.wave.wave).floor)) : 1;
        const frame = this._floorMapFrames.get(floor)
            ?? this._floorMapFrames.get(1)
            ?? this._arenaMapSprite.spriteFrame;
        if (frame) {
            this._arenaMapSprite.spriteFrame = frame;
            if (this._arenaMapSpriteNode) this._arenaMapSpriteNode.active = true;
        }
    }

    private _summonKeyForUltimate(ult: UltimateId | null | undefined): string | null {
        if (ult === 'deploy_turret') return 'turret';
        if (ult === 'summon_guards') return 'guard';
        if (ult === 'element_sprites') return 'element_sprite';
        return null;
    }

    private _syncSummonSprites(): void {
        if (!this._run || !this._enemySpriteLayer) {
            this._summonSpriteNodes.forEach((node) => { node.active = false; });
            return;
        }
        const ult = this._run.player.activeUltimateId;
        const key = this._summonKeyForUltimate(ult);
        const frame = key ? this._summonSpriteFrames.get(key) ?? null : null;
        const active = this._state === GameState.Battle
            && !!frame
            && (this._run.player.ultimateTimer > 0);
        if (!active || !frame || !key) {
            this._summonSpriteNodes.forEach((node) => { node.active = false; });
            return;
        }
        const count = key === 'guard' ? 4 : key === 'element_sprite' ? 5 : 2;
        const size = key === 'turret' ? 56 : key === 'guard' ? 48 : 36;
        while (this._summonSpriteNodes.length < count) {
            const index = this._summonSpriteNodes.length;
            const node = this._panel(`SummonSprite${index}`, this._enemySpriteLayer, size, size, 0, 0);
            const sprite = node.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            node.active = false;
            this._summonSpriteNodes.push(node);
        }
        const elapsed = this._run.wave.elapsedSeconds;
        for (let i = 0; i < this._summonSpriteNodes.length; i += 1) {
            const node = this._summonSpriteNodes[i];
            if (i >= count) {
                node.active = false;
                continue;
            }
            const sprite = node.getComponent(Sprite);
            const angle = elapsed * (key === 'element_sprite' ? 2.2 : 1.1) + (i / count) * Math.PI * 2;
            const radius = key === 'turret' ? 52 : key === 'guard' ? 70 : 44;
            const x = this._playerX + Math.cos(angle) * radius;
            const y = this._playerY + Math.sin(angle) * radius * 0.72;
            node.active = true;
            node.setPosition(x, y, 0);
            node.setScale(1, 1, 1);
            if (sprite) {
                sprite.spriteFrame = frame;
                sprite.color = new Color(255, 255, 255, 235);
            }
        }
    }

    private _applySelectedHeroSprite(): void {
        let frame = this._heroSpriteFrames.get(this._selectedProfessionId) ?? null;
        if (!frame) {
            for (const value of this._heroSpriteFrames.values()) {
                frame = value;
                break;
            }
        }
        if (!frame) return;
        if (this._arenaPlayerSprite) this._arenaPlayerSprite.spriteFrame = frame;
        if (this._loadoutPreviewSprite) this._loadoutPreviewSprite.spriteFrame = frame;
    }

    private _enterState(state: GameState): void {
        this._state = state;
        if (this._menu) this._menu.active = state === GameState.Title;
        if (this._game) this._game.active = state !== GameState.Title;
        if (this._resultLabel) this._resultLabel.node.active = state === GameState.Result;
        if (this._resultBannerSprite) {
            this._resultBannerSprite.node.active = state === GameState.Result
                && !!this._resultBannerSprite.spriteFrame;
        }
        if (this._titleOrnamentSprite) {
            this._titleOrnamentSprite.node.active = state === GameState.Title
                && !!this._titleOrnamentSprite.spriteFrame;
        }
        if (this._statusBarRoot) this._statusBarRoot.active = state === GameState.Battle;
        if (state !== GameState.RollDraft && this._waveClearBadgeSprite && this._waveClearBadgeTimer <= 0) {
            this._waveClearBadgeSprite.node.active = false;
        }
        this._setChoiceButtons([]);
        this._setBattleControls(state === GameState.Battle);
        this._syncRerollIcon();
        this._syncWeaponPreviewIcon();
        this._refreshLanguageTexts();
        this._refreshLoadoutButtons();
        this._renderHud();
        this._drawArena();
        this._drawJoystick();
    }

    private _pickLanguage(language: RuntimeLanguage): void {
        this._language = language;
        this._refreshLanguageTexts();
        this._refreshLoadoutButtons();
        this._renderHud();
    }

    private _refreshLanguageTexts(): void {
        this._setNamedLabel(this._menu, 'Subtitle', this._t('subtitle'));
        this._setNamedLabel(this._menu, 'LanguageHint', this._t('language'));
        this._setNamedLabel(this._menu, 'ProfessionHint', this._t('loadouts'));
        this._setButtonText(this._startButton, this._t('start'));
        this._languageButtons.forEach((button) => {
            const selected = (button.node.name === 'Languageen' && this._language === 'en') || (button.node.name === 'Languagezh' && this._language === 'zh');
            const text = button.node.name === 'Languageen' ? 'EN' : '中文';
            this._setButtonText(button, selected ? `[${text}]` : text);
        });
    }

    private _cycleTitlePage(): void {
        this._titlePage = (this._titlePage + 1) % 2;
        this._refreshLoadoutButtons();
    }

    private _pickProfessionSlot(slot: number): void {
        const index = this._titlePage * 8 + slot;
        const profession = PROFESSIONS[index];
        if (!profession) return;

        this._selectedProfessionId = profession.id;
        this._applySelectedHeroSprite();
        this._syncUltimateButtonIcon();
        this._syncWeaponPreviewIcon();
        this._drawLoadoutPreview();
        this._selectedWeaponId = this._getLoadoutSpec().weaponId;
        this._refreshLoadoutButtons();
    }

    private _pickWeapon(index: number): void {
        const weaponId = WEAPON_ORDER[index];
        if (!weaponId) return;

        const lockedWeaponId = this._getLoadoutSpec().weaponId;
        this._selectedWeaponId = lockedWeaponId;
        if (weaponId !== lockedWeaponId) {
            const weapon = WEAPON_SPECS[lockedWeaponId];
            this._log(`Starting weapon is bound to this survivor: ${weapon.name}.`);
        }
        this._refreshLoadoutButtons();
    }

    private _refreshLoadoutButtons(): void {
        const pageSize = 8;
        const profFrame = this._uiIconFrames.get('prof_frame') ?? null;
        for (let i = 0; i < this._professionButtons.length; i += 1) {
            const profession = PROFESSIONS[this._titlePage * pageSize + i];
            const frameSprite = this._professionFrameSprites[i];
            if (!profession) {
                this._professionButtons[i].node.active = false;
                if (frameSprite) frameSprite.node.active = false;
                continue;
            }
            this._professionButtons[i].node.active = true;
            const selected = profession.id === this._selectedProfessionId;
            this._setButtonText(this._professionButtons[i], this._professionButtonText(profession.id, selected));
            if (frameSprite) {
                if (profFrame) frameSprite.spriteFrame = profFrame;
                frameSprite.node.active = !!profFrame && this._state === GameState.Title;
                // Slight dim for unselected slots.
                frameSprite.color = selected
                    ? new Color(255, 255, 255, 255)
                    : new Color(200, 210, 230, 180);
            }
        }

        if (this._pageButton) {
            this._setButtonText(this._pageButton, this._titlePage === 0
                ? (this._language === 'zh' ? 'NT/NF → SJ/SP' : 'NT/NF → SJ/SP')
                : (this._language === 'zh' ? 'SJ/SP → NT/NF' : 'SJ/SP → NT/NF'));
        }

        for (let i = 0; i < this._weaponButtons.length; i += 1) {
            const weaponId = WEAPON_ORDER[i];
            const weapon = WEAPON_SPECS[weaponId];
            const selected = weaponId === this._selectedWeaponId;
            this._weaponButtons[i].interactable = selected;
            this._setButtonText(this._weaponButtons[i], selected ? `[${weapon.shortName}]` : weapon.shortName);
        }

        if (this._state === GameState.Title) {
            const profession = PROFESSIONS.find((item) => item.id === this._selectedProfessionId) ?? PROFESSIONS[0];
            const weapon = WEAPON_SPECS[this._selectedWeaponId];
            const loadout = this._getLoadoutSpec();
            const name = this._language === 'zh' ? profession.nameZh : profession.name;
            const style = this._language === 'zh' ? profession.combatStyleZh : profession.combatStyle;
            const ult = this._language === 'zh' ? profession.ultimateNameZh : profession.ultimateName;
            const ultDesc = this._language === 'zh' ? profession.ultimateDescriptionZh : profession.ultimateDescription;
            const traits = profession.traits.map((t) => {
                const passive = DIMENSION_PASSIVES[t];
                return this._language === 'zh' ? `${t}:${passive.nameZh}` : `${t}:${passive.name}`;
            }).join(' · ');
            if (this._menuInfoLabel) {
                this._menuInfoLabel.string = [
                    `${profession.code} ${name} · ${style}`,
                    `ATK ${profession.baseAtk}  HP ${profession.baseHp}  SPD ${profession.baseSpd}  ${weapon.shortName}`,
                    `ULT ${ult}: ${ultDesc}`,
                    traits,
                ].join('\n');
            }
            this._log(`${profession.code} ${name} — ${loadout.roleTag}. ${weapon.description}`);
            this._drawLoadoutPreview();
        }
    }

    private _startRun(): void {
        this._selectedWeaponId = this._getLoadoutSpec().weaponId;
        this._rollSystem.reset(0, this._selectedProfessionId);
        this._run = createInitialRun({ professionId: this._selectedProfessionId, startingWave: 1 });
        this._applySelectedWeaponBaseStats();
        // Seed locked skill list for J types (filled as lockable skills are picked).
        if (this._run) {
            this._run.player.lockedSkillIds = this._rollSystem.getLockedSkillIds();
            this._run.player.energy = 35;
        }
        this._clearFloatingTexts();
        this._attackTraces.length = 0;
        this._projectiles.length = 0;
        this._vfxPulses.length = 0;
        this._controlZones.length = 0;
        this._impactShards.length = 0;
        const p = PROFESSIONS.find((item) => item.id === this._selectedProfessionId) ?? PROFESSIONS[0];
        this._log(this._language === 'zh'
            ? `以 ${p.code} ${p.nameZh} 进入意识深渊。`
            : `Entering the Mind Dungeon as ${p.code} ${p.name}.`);
        this._startWave(1);
    }

    private _applySelectedWeaponBaseStats(): void {
        if (!this._run) return;

        const weapon = this._getWeaponSpec();
        this._run = {
            ...this._run,
            player: {
                ...this._run.player,
                damage: Math.max(1, Math.round(this._run.player.damage * weapon.damageMultiplier)),
                attackRange: Math.max(45, this._run.player.attackRange + weapon.rangeBonus),
                attackCooldown: Math.max(0.18, this._run.player.attackCooldown * weapon.cooldownMultiplier),
                chainHits: Math.max(0, this._run.player.chainHits + weapon.targetBonus),
            },
        };
    }

    private _startWave(wave: number): void {
        if (!this._run) return;

        this._run = {
            ...this._run,
            wave: createWaveRuntime(wave, createRuntimeWaveEnemies(wave, MOBILE_PERFORMANCE_BUDGET.maxActiveEnemies)),
            draftChoices: [],
            selectedDraftChoiceId: null,
        };
        this._playerX = -240;
        this._playerY = 0;
        this._facingX = 1;
        this._facingY = 0;
        this._moveInput.set(0, 0);
        this._keyboardInput.set(0, 0);
        this._pressedKeys.clear();
        this._attackTimer = 0.15;
        this._shieldTimer = 0;
        this._weaponActionTimer = 0;
        this._weaponActionKind = 'none';
        this._spawnTimer = Math.min(1.2, this._getWaveSpawnInterval());
        this._spawnSerial = 0;
        this._clearFloatingTexts();
        this._attackTraces.length = 0;
        this._projectiles.length = 0;
        this._vfxPulses.length = 0;
        this._controlZones.length = 0;
        this._impactShards.length = 0;
        this._clearActiveVfxSprites();
        this._resetEnemyPositions();
        const plan = getWavePlan(wave);
        this._log(`${plan.title}: ${plan.goal}`);
        this._enterState(GameState.Battle);
    }

    private _tickBattle(dt: number): void {
        if (!this._run) return;

        this._run.wave.elapsedSeconds += dt;
        this._run.stats.timeSeconds += dt;
        this._perfFps = Math.round(1 / Math.max(0.001, dt));
        this._tickUltimate(dt);
        this._movePlayer(dt);
        this._moveEnemies(dt);
        this._resolveContactDamage(dt);
        this._tickProjectiles(dt);
        this._autoAttack(dt);
        this._tickFloatingTexts(dt);
        this._tickAttackTraces(dt);
        this._tickVfx(dt);
        this._tickControlZones(dt);
        this._tickWaveSpawns(dt);
        this._tickEnemyVisualState(dt);
        this._tickImpactShards(dt);
        this._tickWaveClearBadge(dt);
        this._weaponActionTimer = Math.max(0, this._weaponActionTimer - dt);
        if (this._weaponActionTimer <= 0) this._weaponActionKind = 'none';

        if (this._run.player.hp <= 0) {
            this._endRun();
            return;
        }

        if (this._run.wave.elapsedSeconds >= WAVE_DURATION_SECONDS) {
            this._run = {
                ...this._run,
                wave: { ...this._run.wave, cleared: true },
                stats: {
                    ...this._run.stats,
                    wavesCleared: this._run.stats.wavesCleared + 1,
                },
            };
            this._enterWaveClear();
        }
    }

    private _tickUltimate(dt: number): void {
        if (!this._run || this._run.player.ultimateTimer <= 0) return;

        const player = this._run.player;
        player.ultimateTimer = Math.max(0, player.ultimateTimer - dt);

        // ISFJ heal sanctuary: 8% HP/s
        if (player.activeUltimateId === 'heal_sanctuary') {
            const heal = player.maxHp * 0.08 * dt;
            player.hp = Math.min(player.maxHp, player.hp + heal);
        }

        // Orbiting sprite / guard ticks (ENFP / ESTJ) — light periodic AOE near player
        if (
            (player.activeUltimateId === 'element_sprites' || player.activeUltimateId === 'summon_guards' || player.activeUltimateId === 'deploy_turret')
            && Math.floor(player.ultimateTimer * 4) !== Math.floor((player.ultimateTimer + dt) * 4)
        ) {
            this._resolveUltimatePulseDamage();
        }

        if (player.ultimateTimer <= 0) {
            this._clearUltimateState();
        }
    }

    private _clearUltimateState(): void {
        if (!this._run) return;
        const p = this._run.player;
        p.activeUltimateId = null;
        p.ultimateDamageBonus = 0;
        p.ultimateMoveBonus = 0;
        p.ultimateCooldownMul = 1;
        p.damageTakenMul = 1;
        p.invulnerable = false;
        p.blockAllDamage = false;
        this._shieldTimer = 0;
    }

    private _resolveUltimatePulseDamage(): void {
        if (!this._run) return;
        const base = this._computeHitDamage(null).damage;
        const pulse = Math.max(1, Math.round(base * 0.35));
        let hits = 0;
        for (let i = 0; i < this._run.wave.enemies.length && hits < 4; i += 1) {
            const enemy = this._run.wave.enemies[i];
            if (!enemy.alive) continue;
            const pos = this._enemyPositions.get(enemy.id);
            if (!pos) continue;
            if (Math.hypot(pos.x - this._playerX, pos.y - this._playerY) > 110) continue;
            const dealt = this._damageEnemy(i, pulse);
            this._float(`-${dealt}`, pos.x, pos.y + 10, new Color(180, 220, 255, 255));
            hits += 1;
        }
    }

    private _computeHitDamage(enemy: RunEnemyModel | null) {
        if (!this._run) {
            return { damage: 1, isCritical: false, multipliers: [] as string[] };
        }
        const nearby = countNearbyEnemies(
            this._run.wave.enemies,
            this._enemyPositions,
            this._playerX,
            this._playerY,
            INTROVERT_RADIUS,
        );
        const result = resolvePlayerHitDamage({
            player: this._run.player,
            profession: this._run.profession,
            enemy,
            nearbyEnemyCount: nearby,
        });
        // Consume N post-dodge bonus after one hit calculation
        if (this._run.player.postDodgeBonus > 0) {
            this._run.player.postDodgeBonus = 0;
        }
        return result;
    }

    private _tickWaveSpawns(dt: number): void {
        if (!this._run) return;

        this._spawnTimer = Math.max(0, this._spawnTimer - dt);
        if (this._spawnTimer > 0) return;

        const alive = this._run.wave.enemies.filter((enemy) => enemy.alive).length;
        if (alive >= MOBILE_PERFORMANCE_BUDGET.maxActiveEnemies) {
            this._spawnTimer = 0.35;
            return;
        }

        this._spawnTimer = this._getWaveSpawnInterval();
        const type = this._pickContinuousEnemyType(this._run.wave.wave);
        this._spawnRuntimeEnemy(type);
    }

    private _movePlayer(dt: number): void {
        if (!this._run) return;

        const ultMove = 1 + (this._run.player.ultimateMoveBonus || 0);
        const speed = 132 * this._run.player.moveSpeed * ultMove * this._getControlSlowMultiplier();
        // Time dilation slows enemies, not the player — already handled in enemy step.
        const move = this._getMoveVector();
        if (move.length() > 0.01) {
            this._facingX = move.x;
            this._facingY = move.y;
        }
        this._playerX = this._clampX(this._playerX + move.x * speed * dt);
        this._playerY = this._clampY(this._playerY + move.y * speed * dt);
    }

    private _moveEnemies(dt: number): void {
        if (!this._run) return;

        for (const enemy of this._run.wave.enemies) {
            if (!enemy.alive) continue;

            const position = this._enemyPositions.get(enemy.id);
            if (!position) continue;

            if (position.type === 'dasher' && this._moveDasher(position, dt)) {
                continue;
            }

            if (position.type === 'spitter' && this._moveSpitter(position, dt)) {
                continue;
            }

            if (position.type === 'binder' && this._moveBinder(position, dt)) {
                continue;
            }

            if (position.type === 'boss' && this._moveBoss(enemy, position, dt)) {
                continue;
            }

            const dx = this._playerX - position.x;
            const dy = this._playerY - position.y;
            const distance = Math.max(1, Math.hypot(dx, dy));
            const archetype = ENEMY_ARCHETYPES[position.type];
            const waveSpeedBonus = Math.min(24, this._run.wave.wave * 2.2);
            // INTJ time dilation / convert stun: slow enemies while ultimate is active
            const ultSlow = this._run.player.activeUltimateId === 'time_dilation'
                ? 0.3
                : this._run.player.activeUltimateId === 'mind_convert'
                    ? 0.55
                    : 1;
            const step = (archetype.speed + waveSpeedBonus) * dt * ultSlow;

            if (distance > CONTACT_RANGE + archetype.radius * 0.3) {
                position.x = this._clampX(position.x + (dx / distance) * step);
                position.y = this._clampY(position.y + (dy / distance) * step);
            }
        }
    }

    private _moveDasher(position: EnemyPosition, dt: number): boolean {
        const dx = this._playerX - position.x;
        const dy = this._playerY - position.y;
        const distance = Math.max(1, Math.hypot(dx, dy));

        position.dashCooldown = Math.max(0, position.dashCooldown - dt);

        if (position.actionTimer > 0) {
            position.x = this._clampX(position.x + position.dashVx * dt);
            position.y = this._clampY(position.y + position.dashVy * dt);
            position.actionTimer = Math.max(0, position.actionTimer - dt);
            // Sparse trail while dashing.
            if (Math.random() < 0.22) {
                this._spawnVfxSprite('dash_trail', position.x, position.y, 28, 0.18);
            }
            if (position.actionTimer <= 0) {
                position.dashCooldown = 1.15;
            }
            return true;
        }

        if (position.windupTimer > 0) {
            position.windupTimer = Math.max(0, position.windupTimer - dt);
            position.warningTimer = position.windupTimer;
            if (position.windupTimer <= 0) {
                const speed = 245 + Math.min(80, (this._run?.wave.wave ?? 1) * 6);
                position.dashVx = (dx / distance) * speed;
                position.dashVy = (dy / distance) * speed;
                position.actionTimer = DASH_DURATION_SECONDS;
                this._spawnVfxSprite('dash_trail', position.x, position.y, 36, 0.28);
            }
            return true;
        }

        position.actionTimer = Math.max(0, position.actionTimer - dt);
        if (position.dashCooldown <= 0 && distance <= DASH_TRIGGER_RANGE) {
            position.windupTimer = DASH_WINDUP_SECONDS;
            position.warningTimer = DASH_WINDUP_SECONDS;
            this._pulse(
                position.x,
                position.y,
                8,
                28,
                DASH_WINDUP_SECONDS,
                new Color(255, 120, 90, 200),
                2,
                'dash_warning',
                40,
            );
            return true;
        }

        return false;
    }

    private _moveSpitter(position: EnemyPosition, dt: number): boolean {
        const dx = this._playerX - position.x;
        const dy = this._playerY - position.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const preferredDistance = 118;
        const archetype = ENEMY_ARCHETYPES.spitter;
        position.actionTimer = Math.max(0, position.actionTimer - dt);
        position.warningTimer = Math.max(0, position.warningTimer - dt);

        if (distance < preferredDistance - 18) {
            position.x = this._clampX(position.x - (dx / distance) * archetype.speed * dt);
            position.y = this._clampY(position.y - (dy / distance) * archetype.speed * dt);
        } else if (distance > preferredDistance + 36) {
            position.x = this._clampX(position.x + (dx / distance) * archetype.speed * dt);
            position.y = this._clampY(position.y + (dy / distance) * archetype.speed * dt);
        }

        if (distance <= 190 && position.actionTimer <= 0) {
            position.actionTimer = 1.45;
            position.warningTimer = 0.18;
            this._spawnEnemyProjectile(position, archetype.damage);
        }
        return true;
    }

    private _moveBoss(enemy: RunEnemyModel, position: EnemyPosition, dt: number): boolean {
        const dx = this._playerX - position.x;
        const dy = this._playerY - position.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const archetype = ENEMY_ARCHETYPES.boss;
        const phaseTwo = enemy.hp <= enemy.maxHp * 0.52;
        const floor = this._run ? Math.min(4, Math.max(1, getWavePlan(this._run.wave.wave).floor)) : 1;

        if (position.windupTimer > 0) {
            position.windupTimer = Math.max(0, position.windupTimer - dt);
            position.warningTimer = position.windupTimer;
            if (position.windupTimer <= 0) {
                this._spawnBossAttack(position, phaseTwo, floor);
                // Floor-tuned recovery: higher floors recover faster in phase 2.
                const recover = phaseTwo
                    ? (floor === 1 ? 1.75 : floor === 2 ? 1.55 : floor === 3 ? 1.4 : 1.25)
                    : (floor === 1 ? 2.35 : floor === 2 ? 2.15 : floor === 3 ? 2.0 : 1.85);
                position.actionTimer = recover;
            }
            return true;
        }

        position.actionTimer = Math.max(0, position.actionTimer - dt);
        position.warningTimer = Math.max(0, position.warningTimer - dt);

        // F1 keeps distance & radial; F2 kites mid-range; F3 orbits close; F4 aggressive chase.
        const preferredDistance = phaseTwo
            ? (floor === 1 ? 74 : floor === 2 ? 88 : floor === 3 ? 62 : 58)
            : (floor === 1 ? 92 : floor === 2 ? 108 : floor === 3 ? 78 : 70);
        const speedBonus = phaseTwo
            ? (floor === 1 ? 22 : floor === 2 ? 18 : floor === 3 ? 28 : 34)
            : (floor === 1 ? 8 : floor === 2 ? 10 : floor === 3 ? 14 : 18);
        const step = (archetype.speed + speedBonus) * dt;

        if (distance > preferredDistance + 18) {
            position.x = this._clampX(position.x + (dx / distance) * step);
            position.y = this._clampY(position.y + (dy / distance) * step);
        } else if (distance < preferredDistance - 18) {
            position.x = this._clampX(position.x - (dx / distance) * step * 0.65);
            position.y = this._clampY(position.y - (dy / distance) * step * 0.65);
        } else if (floor >= 3) {
            // Orbit laterally on F3/F4 so the boss never stands still.
            const orbit = step * (phaseTwo ? 0.85 : 0.55);
            position.x = this._clampX(position.x + (-dy / distance) * orbit);
            position.y = this._clampY(position.y + (dx / distance) * orbit);
        }

        const engageRange = floor === 4 ? 240 : floor === 3 ? 220 : 210;
        if (position.actionTimer <= 0 && distance <= engageRange) {
            const windup = phaseTwo
                ? (floor === 1 ? 0.38 : floor === 2 ? 0.34 : floor === 3 ? 0.3 : 0.26)
                : (floor === 1 ? 0.58 : floor === 2 ? 0.5 : floor === 3 ? 0.46 : 0.42);
            position.windupTimer = windup;
            position.warningTimer = windup;
            const warnColor = floor === 4
                ? new Color(160, 90, 255, 220)
                : floor === 3
                    ? new Color(255, 110, 180, 210)
                    : floor === 2
                        ? new Color(255, 140, 90, 210)
                        : new Color(255, 84, 132, 210);
            this._pulse(
                position.x,
                position.y,
                16,
                phaseTwo ? 62 : 48,
                windup,
                warnColor,
                4,
                phaseTwo ? 'boss_phase2' : 'boss_aura',
                phaseTwo ? 72 : 58,
            );
            this._log(this._bossWindupLog(floor, phaseTwo));
        }

        return true;
    }

    private _bossWindupLog(floor: number, phaseTwo: boolean): string {
        if (this._language === 'zh') {
            if (floor === 1) return phaseTwo ? '职场恐惧进入二阶段：文件风暴加速。' : '职场恐惧蓄力：放射文件风暴。';
            if (floor === 2) return phaseTwo ? '社交审判进入二阶段：扇形嘲讽。' : '社交审判蓄力：扇形评判。';
            if (floor === 3) return phaseTwo ? '依恋虚空进入二阶段：螺旋牵引。' : '依恋虚空蓄力：螺旋虚空。';
            return phaseTwo ? '自我深渊进入二阶段：十字存在风暴。' : '自我深渊蓄力：十字风暴。';
        }
        if (floor === 1) return phaseTwo ? 'Boss enraged: faster radial burst incoming.' : 'Boss charging radial burst.';
        if (floor === 2) return phaseTwo ? 'Social Fear enraged: denser fan judgment.' : 'Social Fear charging fan judgment.';
        if (floor === 3) return phaseTwo ? 'Attachment Void enraged: spiral pull.' : 'Attachment Void charging spiral void.';
        return phaseTwo ? 'Self Abyss enraged: cross-storm.' : 'Self Abyss charging cross-storm.';
    }

    /** Floor-specific boss projectile patterns (phase 1 / phase 2 at ≤52% HP). */
    private _spawnBossAttack(position: EnemyPosition, phaseTwo: boolean, floor: number): void {
        if (floor === 2) {
            this._spawnBossFan(position, phaseTwo);
        } else if (floor === 3) {
            this._spawnBossSpiral(position, phaseTwo);
        } else if (floor === 4) {
            this._spawnBossCross(position, phaseTwo);
        } else {
            this._spawnBossRadial(position, phaseTwo);
        }
    }

    /** F1 Workplace Fear — classic radial file storm. */
    private _spawnBossRadial(position: EnemyPosition, phaseTwo: boolean): void {
        const count = phaseTwo ? 12 : 8;
        const speed = phaseTwo ? 138 : 112;
        const damage = phaseTwo ? 12 : 9;
        const offset = phaseTwo ? Math.PI / 12 : 0;
        this._emitBossProjectiles(position, count, speed, damage, offset, 0, phaseTwo
            ? new Color(255, 92, 144, 230)
            : new Color(255, 178, 92, 225), phaseTwo);
        if (phaseTwo) {
            this._spawnControlZone(this._clampX(this._playerX), this._clampY(this._playerY), 8);
        }
        this._pulse(position.x, position.y, 22, phaseTwo ? 72 : 56, 0.38,
            phaseTwo ? new Color(255, 92, 144, 230) : new Color(255, 178, 92, 220), 4);
    }

    /** F2 Social Fear — fan toward player + side judgment shots. */
    private _spawnBossFan(position: EnemyPosition, phaseTwo: boolean): void {
        const dx = this._playerX - position.x;
        const dy = this._playerY - position.y;
        const base = Math.atan2(dy, dx);
        const count = phaseTwo ? 9 : 5;
        const spread = phaseTwo ? 0.95 : 0.72;
        const speed = phaseTwo ? 148 : 120;
        const damage = phaseTwo ? 11 : 8;
        const color = phaseTwo ? new Color(255, 150, 80, 235) : new Color(255, 190, 110, 225);
        for (let i = 0; i < count; i += 1) {
            const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
            const angle = base + t * spread;
            this._pushEnemyProjectile(
                position.x + Math.cos(angle) * 16,
                position.y + Math.sin(angle) * 16,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                damage,
                phaseTwo ? 6 : 5,
                phaseTwo ? 2.6 : 2.3,
                color,
            );
        }
        // Phase 2: extra reverse fan from boss flanks.
        if (phaseTwo) {
            for (const side of [-1, 1]) {
                const angle = base + side * (Math.PI * 0.55);
                this._pushEnemyProjectile(
                    position.x + Math.cos(angle) * 14,
                    position.y + Math.sin(angle) * 14,
                    Math.cos(angle) * (speed * 0.85),
                    Math.sin(angle) * (speed * 0.85),
                    damage - 1,
                    5,
                    2.2,
                    new Color(255, 120, 70, 220),
                );
            }
            this._spawnControlZone(this._clampX(this._playerX), this._clampY(this._playerY), 7);
        }
        this._pulse(position.x, position.y, 20, phaseTwo ? 68 : 52, 0.36, color, 4);
    }

    /** F3 Attachment Void — spiral arms that curve inward. */
    private _spawnBossSpiral(position: EnemyPosition, phaseTwo: boolean): void {
        const arms = phaseTwo ? 4 : 3;
        const perArm = phaseTwo ? 5 : 4;
        const baseSpeed = phaseTwo ? 126 : 102;
        const damage = phaseTwo ? 11 : 8;
        const color = phaseTwo ? new Color(255, 100, 190, 235) : new Color(220, 120, 200, 225);
        const spin = phaseTwo ? 0.55 : 0.38;
        for (let arm = 0; arm < arms; arm += 1) {
            const armBase = (Math.PI * 2 * arm) / arms;
            for (let k = 0; k < perArm; k += 1) {
                const angle = armBase + k * spin;
                const speed = baseSpeed + k * 14;
                this._pushEnemyProjectile(
                    position.x + Math.cos(angle) * (12 + k * 4),
                    position.y + Math.sin(angle) * (12 + k * 4),
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    damage,
                    phaseTwo ? 6 : 5,
                    phaseTwo ? 2.9 : 2.5,
                    color,
                );
            }
        }
        if (phaseTwo) {
            // Pull zone on player — attachment metaphor.
            this._spawnControlZone(this._clampX(this._playerX), this._clampY(this._playerY), 10);
            this._spawnControlZone(this._clampX(position.x), this._clampY(position.y), 6);
        }
        this._pulse(position.x, position.y, 24, phaseTwo ? 78 : 60, 0.4, color, 4);
    }

    /** F4 Self Abyss — cross storm + diagonal ring. */
    private _spawnBossCross(position: EnemyPosition, phaseTwo: boolean): void {
        const axes = phaseTwo
            ? [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4]
            : [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
        const perAxis = phaseTwo ? 4 : 3;
        const speed = phaseTwo ? 155 : 128;
        const damage = phaseTwo ? 13 : 10;
        const color = phaseTwo ? new Color(170, 100, 255, 240) : new Color(140, 120, 255, 230);
        for (const axis of axes) {
            for (let k = 0; k < perAxis; k += 1) {
                const s = speed + k * 18;
                this._pushEnemyProjectile(
                    position.x + Math.cos(axis) * (10 + k * 6),
                    position.y + Math.sin(axis) * (10 + k * 6),
                    Math.cos(axis) * s,
                    Math.sin(axis) * s,
                    damage,
                    phaseTwo ? 7 : 5,
                    phaseTwo ? 3.0 : 2.55,
                    color,
                );
            }
        }
        if (phaseTwo) {
            // Extra aimed shot at player + dual control zones.
            const dx = this._playerX - position.x;
            const dy = this._playerY - position.y;
            const dist = Math.max(1, Math.hypot(dx, dy));
            this._pushEnemyProjectile(
                position.x,
                position.y,
                (dx / dist) * 170,
                (dy / dist) * 170,
                14,
                7,
                2.4,
                new Color(200, 80, 255, 245),
            );
            this._spawnControlZone(this._clampX(this._playerX), this._clampY(this._playerY), 11);
            this._spawnControlZone(
                this._clampX(this._playerX + this._facingX * 40),
                this._clampY(this._playerY + this._facingY * 40),
                7,
            );
        }
        this._pulse(position.x, position.y, 26, phaseTwo ? 84 : 64, 0.42, color, 5);
    }

    private _emitBossProjectiles(
        position: EnemyPosition,
        count: number,
        speed: number,
        damage: number,
        offset: number,
        _unusedSpread: number,
        color: Color,
        phaseTwo: boolean,
    ): void {
        for (let i = 0; i < count; i += 1) {
            const angle = offset + (Math.PI * 2 * i) / count;
            this._pushEnemyProjectile(
                position.x + Math.cos(angle) * 18,
                position.y + Math.sin(angle) * 18,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                damage,
                phaseTwo ? 6 : 5,
                phaseTwo ? 2.8 : 2.45,
                color,
            );
        }
    }

    private _pushEnemyProjectile(
        x: number,
        y: number,
        vx: number,
        vy: number,
        damage: number,
        radius: number,
        ttl: number,
        color: Color,
    ): void {
        if (this._projectiles.length >= MOBILE_PERFORMANCE_BUDGET.maxActiveProjectiles) {
            this._projectiles.shift();
        }
        this._projectiles.push({
            x, y, vx, vy, damage, radius, ttl, color, owner: 'enemy',
        });
    }

    /** @deprecated kept as alias for any external call sites */
    private _spawnBossBurst(position: EnemyPosition, phaseTwo: boolean): void {
        this._spawnBossRadial(position, phaseTwo);
    }

    private _moveBinder(position: EnemyPosition, dt: number): boolean {
        const dx = this._playerX - position.x;
        const dy = this._playerY - position.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const preferredDistance = 96;
        const archetype = ENEMY_ARCHETYPES.binder;
        position.actionTimer = Math.max(0, position.actionTimer - dt);
        position.warningTimer = Math.max(0, position.warningTimer - dt);

        if (distance < preferredDistance - 18) {
            position.x = this._clampX(position.x - (dx / distance) * archetype.speed * dt);
            position.y = this._clampY(position.y - (dy / distance) * archetype.speed * dt);
        } else if (distance > preferredDistance + 28) {
            position.x = this._clampX(position.x + (dx / distance) * archetype.speed * dt);
            position.y = this._clampY(position.y + (dy / distance) * archetype.speed * dt);
        }

        if (distance <= 170 && position.actionTimer <= 0) {
            position.actionTimer = 2.9;
            position.warningTimer = 0.36;
            const leadX = this._playerX + this._facingX * 14;
            const leadY = this._playerY + this._facingY * 14;
            this._spawnControlZone(this._clampX(leadX), this._clampY(leadY), archetype.damage);
        }
        return true;
    }

    private _autoAttack(dt: number): void {
        if (!this._run) return;

        this._attackTimer -= dt;
        if (this._attackTimer > 0) return;

        const weapon = this._getWeaponSpec();
        const cooldownMul = Math.max(0.25, this._run.player.ultimateCooldownMul || 1);
        const cooldown = Math.max(0.12, this._run.player.attackCooldown * cooldownMul);
        this._attackTimer += cooldown;

        const hit = this._computeHitDamage(null);
        const damage = hit.damage;
        const isCritical = hit.isCritical;
        // Gain ultimate energy per attack
        this._run.player.energy = Math.min(
            MAX_ULTIMATE_ENERGY,
            this._run.player.energy + Math.max(4, this._run.player.energyPerAttack * 0.45),
        );

        if (weapon.id === 'blade') {
            this._resolveBladeSwing(damage, weapon, isCritical);
            return;
        }
        if (weapon.id === 'spear') {
            this._resolveSpearThrust(damage, weapon, isCritical);
            return;
        }

        const targets = this._getTargetsInRange();
        if (targets.length <= 0) {
            this._log(this._fmt('rangedSeek', { weapon: weapon.shortName }));
            return;
        }

        if (weapon.id === 'gun') {
            this._spawnTwinGunShots(targets[0], Math.max(1, Math.round(damage * 0.74)), weapon, isCritical);
            this._log(this._fmt('gunShot', { weapon: weapon.shortName }));
            return;
        }

        this._spawnPlayerProjectile(targets[0], Math.max(1, Math.round(damage * 0.9)), weapon, 0, 0, isCritical);
        this._triggerWeaponAction('orb', 0.28);
        this._log(this._fmt('orbShot', { weapon: weapon.shortName }));
    }

    private _resolveBladeSwing(damage: number, weapon: WeaponSpec, isCritical = false): void {
        if (!this._run) return;

        const primary = this._getNearestTargetWithin(Math.max(58, this._run.player.attackRange));
        if (!primary) {
            this._log(this._fmt('meleeSeek', { weapon: weapon.shortName }));
            return;
        }

        const primaryPosition = this._enemyPositions.get(primary.id);
        if (!primaryPosition) return;

        this._facePoint(primaryPosition.x, primaryPosition.y);
        const range = Math.max(62, Math.min(112, this._run.player.attackRange * 0.82));
        const maxHits = Math.max(1, 1 + this._run.player.bladeCount + this._run.player.chainHits + this._run.player.splitBlades);
        const targets = this._getEnemiesInForwardArc(range, Math.PI, maxHits);
        let kills = 0;

        targets.forEach((target, index) => {
            const enemyIndex = this._run!.wave.enemies.findIndex((enemy) => enemy.id === target.id && enemy.alive);
            if (enemyIndex < 0) return;
            const position = this._enemyPositions.get(target.id);
            if (!position) return;

            const dealt = this._damageEnemy(enemyIndex, Math.round(damage * (index === 0 ? 1 : 0.58)));
            if (isCritical && index === 0) {
                this._float('CRIT', position.x, position.y + 28, new Color(255, 220, 90, 255));
            }
            this._float(`-${dealt}`, position.x, position.y + 16, weapon.color);
            this._pulseHit(position.x, position.y, isCritical && index === 0, weapon.color);
            if (!this._run!.wave.enemies[enemyIndex].alive) {
                kills += 1;
                this._float('KO', position.x, position.y, new Color(255, 100, 100, 255));
                this._pulseKo(position.x, position.y);
            }
        });

        this._triggerWeaponAction('blade', 0.22);
        this._traceMeleeArc(range, Math.PI, weapon.color);
        const orbitHits = this._resolveOrbitBladeHits(Math.max(1, Math.round(damage * 0.42)));
        this._log(this._fmt('bladeSwing', { weapon: weapon.shortName, hits: targets.length + orbitHits, kills }));
    }

    private _resolveSpearThrust(damage: number, weapon: WeaponSpec, isCritical = false): void {
        if (!this._run) return;

        const primary = this._getNearestTargetWithin(Math.max(88, this._run.player.attackRange + 18));
        if (!primary) {
            this._log(this._fmt('meleeSeek', { weapon: weapon.shortName }));
            return;
        }

        const primaryPosition = this._enemyPositions.get(primary.id);
        if (!primaryPosition) return;

        this._facePoint(primaryPosition.x, primaryPosition.y);
        const range = Math.max(92, Math.min(152, this._run.player.attackRange + 24));
        const coneAngle = Math.PI * 0.48 + Math.min(0.38, this._run.player.fanAngle * 0.008);
        const maxHits = Math.max(3, 3 + this._run.player.chainHits + this._run.player.splitBlades + Math.floor(this._run.player.bladeCount * 0.5));
        const targets = this._getEnemiesInForwardArc(range, coneAngle, maxHits);
        let kills = 0;

        targets.forEach((target, index) => {
            const enemyIndex = this._run!.wave.enemies.findIndex((enemy) => enemy.id === target.id && enemy.alive);
            if (enemyIndex < 0) return;
            const position = this._enemyPositions.get(target.id);
            if (!position) return;

            const falloff = Math.max(0.48, 1 - index * 0.11);
            const dealt = this._damageEnemy(enemyIndex, Math.round(damage * falloff));
            if (isCritical && index === 0) {
                this._float('CRIT', position.x, position.y + 28, new Color(255, 220, 90, 255));
            }
            this._float(`-${dealt}`, position.x, position.y + 16, weapon.color);
            this._pulseHit(position.x, position.y, isCritical && index === 0, weapon.color);
            if (!this._run!.wave.enemies[enemyIndex].alive) {
                kills += 1;
                this._float('KO', position.x, position.y, new Color(255, 100, 100, 255));
                this._pulseKo(position.x, position.y);
            }
        });

        this._triggerWeaponAction('spear', 0.26);
        this._traceMeleeArc(range, coneAngle, weapon.color);
        this._traceShotgunPellets(range, coneAngle, weapon.color);
        this._log(this._fmt('spearThrust', { weapon: weapon.shortName, hits: targets.length, kills }));
    }

    private _spawnTwinGunShots(target: RunEnemyModel, damage: number, weapon: WeaponSpec, isCritical = false): void {
        const targetPosition = this._enemyPositions.get(target.id);
        if (!targetPosition) return;

        this._facePoint(targetPosition.x, targetPosition.y);
        const pelletCount = Math.max(2, 2 + Math.min(2, this._run?.player.splitBlades ?? 0));
        for (let i = 0; i < pelletCount; i += 1) {
            const side = i % 2 === 0 ? -1 : 1;
            const spread = pelletCount > 2 ? (i - (pelletCount - 1) / 2) * 0.035 : 0;
            this._spawnPlayerProjectile(target, damage, weapon, side * 9, spread, isCritical && i === 0);
        }
        this._triggerWeaponAction('gun', 0.16);
    }

    private _triggerWeaponAction(kind: WeaponActionKind, duration: number): void {
        this._weaponActionKind = kind;
        this._weaponActionDuration = Math.max(0.001, duration);
        this._weaponActionTimer = this._weaponActionDuration;
    }

    private _facePoint(x: number, y: number): void {
        const dx = x - this._playerX;
        const dy = y - this._playerY;
        const distance = Math.max(1, Math.hypot(dx, dy));
        this._facingX = dx / distance;
        this._facingY = dy / distance;
    }

    private _getNearestTargetWithin(range: number): RunEnemyModel | null {
        if (!this._run) return null;

        const target = this._run.wave.enemies
            .filter((enemy) => enemy.alive)
            .map((enemy) => ({ enemy, distance: this._distanceToEnemy(enemy.id) }))
            .filter((item) => item.distance <= range)
            .sort((a, b) => a.distance - b.distance)[0];
        return target?.enemy ?? null;
    }

    private _getEnemiesInForwardArc(range: number, arcRadians: number, maxHits: number): RunEnemyModel[] {
        if (!this._run) return [];

        const halfArc = arcRadians * 0.5;
        return this._run.wave.enemies
            .filter((enemy) => enemy.alive)
            .map((enemy) => {
                const position = this._enemyPositions.get(enemy.id);
                if (!position) return null;
                const dx = position.x - this._playerX;
                const dy = position.y - this._playerY;
                const distance = Math.max(1, Math.hypot(dx, dy));
                const angle = Math.acos(Math.max(-1, Math.min(1, (dx / distance) * this._facingX + (dy / distance) * this._facingY)));
                return { enemy, distance, angle };
            })
            .filter((item): item is { enemy: RunEnemyModel; distance: number; angle: number } => !!item && item.distance <= range && item.angle <= halfArc)
            .sort((a, b) => a.angle - b.angle || a.distance - b.distance)
            .slice(0, maxHits)
            .map((item) => item.enemy);
    }

    private _getEnemiesInThrustLane(range: number, halfWidth: number, maxHits: number): RunEnemyModel[] {
        if (!this._run) return [];

        const px = -this._facingY;
        const py = this._facingX;
        return this._run.wave.enemies
            .filter((enemy) => enemy.alive)
            .map((enemy) => {
                const position = this._enemyPositions.get(enemy.id);
                if (!position) return null;
                const dx = position.x - this._playerX;
                const dy = position.y - this._playerY;
                const forward = dx * this._facingX + dy * this._facingY;
                const lateral = Math.abs(dx * px + dy * py);
                return { enemy, forward, lateral };
            })
            .filter((item): item is { enemy: RunEnemyModel; forward: number; lateral: number } => !!item && item.forward > 0 && item.forward <= range && item.lateral <= halfWidth)
            .sort((a, b) => a.forward - b.forward)
            .slice(0, maxHits)
            .map((item) => item.enemy);
    }

    private _resolveContactDamage(dt: number): void {
        if (!this._run) return;

        const shielded = this._shieldTimer > 0 || this._run.player.blockAllDamage || this._run.player.invulnerable;
        this._shieldTimer = Math.max(0, this._shieldTimer - dt);
        let totalDamage = 0;

        for (const enemy of this._run.wave.enemies) {
            if (!enemy.alive) continue;

            const position = this._enemyPositions.get(enemy.id);
            if (!position) continue;

            position.contactCooldown = Math.max(0, position.contactCooldown - dt);
            if (position.contactCooldown > 0) continue;
            const archetype = ENEMY_ARCHETYPES[position.type] ?? ENEMY_ARCHETYPES.chaser;
            if (Math.hypot(position.x - this._playerX, position.y - this._playerY) > CONTACT_RANGE + archetype.radius * 0.2) continue;

            position.contactCooldown = archetype.contactCooldown;
            if (this._run.player.invulnerable || this._run.player.blockAllDamage) {
                this._float('BLOCK', this._playerX, this._playerY + 22, new Color(120, 224, 255, 255));
                // ISTP parry counter: retaliate
                if (this._run.player.activeUltimateId === 'perfect_parry') {
                    const counter = this._computeHitDamage(enemy).damage * 3;
                    const idx = this._run.wave.enemies.indexOf(enemy);
                    if (idx >= 0) {
                        const dealt = this._damageEnemy(idx, Math.round(counter));
                        this._float(`-${dealt}`, position.x, position.y + 16, new Color(255, 200, 80, 255));
                    }
                }
                continue;
            }
            if (this._tryDodge(position.x, position.y)) continue;

            const armorReduction = Math.min(0.7, this._run.player.armor / (this._run.player.armor + 100));
            const shieldReduction = shielded ? 0.62 + this._run.player.shieldReduction * 0.2 : 0;
            let damage = Math.max(1, Math.round(enemy.damage * (1 - armorReduction) * (1 - Math.min(0.85, shieldReduction))));
            damage = Math.max(1, Math.round(damage * (this._run.player.damageTakenMul || 1)));
            // ENFJ aura: enemies deal less
            if (this._run.player.activeUltimateId === 'aura_command') {
                damage = Math.max(1, Math.round(damage * 0.4));
            }
            this._run.player.hp = Math.max(0, this._run.player.hp - damage);
            this._run.stats.damageTaken += damage;
            totalDamage += damage;
            this._float(`-${damage}`, this._playerX, this._playerY + 20, new Color(255, 88, 88, 255));
            this._pulse(this._playerX, this._playerY, 8, shielded ? 30 : 20, 0.25, shielded ? new Color(120, 224, 255, 210) : new Color(255, 88, 88, 210), 3);
        }

        if (totalDamage > 0) {
            this._log(this._fmt(shielded ? 'shieldContact' : 'contactHit', { damage: totalDamage }));
        }
    }

    private _spawnEnemyProjectile(position: EnemyPosition, damage: number): void {
        const dx = this._playerX - position.x;
        const dy = this._playerY - position.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const speed = 112 + Math.min(40, (this._run?.wave.wave ?? 1) * 4);

        if (this._projectiles.length >= MOBILE_PERFORMANCE_BUDGET.maxActiveProjectiles) {
            this._projectiles.shift();
        }

        this._projectiles.push({
            x: position.x,
            y: position.y,
            vx: (dx / distance) * speed,
            vy: (dy / distance) * speed,
            damage,
            radius: 5,
            ttl: 2.2,
            color: new Color(128, 245, 162, 230),
            owner: 'enemy',
        });
    }

    private _spawnPlayerProjectile(
        target: RunEnemyModel,
        damage: number,
        weapon: WeaponSpec,
        sideOffset = 0,
        spreadRadians = 0,
        isCritical = false,
    ): void {
        const targetPosition = this._enemyPositions.get(target.id);
        if (!targetPosition) return;

        const dx = targetPosition.x - this._playerX;
        const dy = targetPosition.y - this._playerY;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const speed = weapon.id === 'gun' ? 310 : 178;
        const px = -dy / distance;
        const py = dx / distance;
        const cos = Math.cos(spreadRadians);
        const sin = Math.sin(spreadRadians);
        const aimX = (dx / distance) * cos - (dy / distance) * sin;
        const aimY = (dx / distance) * sin + (dy / distance) * cos;

        if (this._projectiles.length >= MOBILE_PERFORMANCE_BUDGET.maxActiveProjectiles) {
            this._projectiles.shift();
        }

        this._projectiles.push({
            x: this._playerX + (dx / distance) * 13 + px * sideOffset,
            y: this._playerY + (dy / distance) * 13 + py * sideOffset,
            vx: aimX * speed,
            vy: aimY * speed,
            damage,
            radius: weapon.id === 'orb' ? 7 : 4,
            ttl: weapon.id === 'orb' ? 2.4 : 1.25,
            color: weapon.id === 'orb' ? new Color(204, 154, 255, 235) : new Color(weapon.color.r, weapon.color.g, weapon.color.b, 240),
            owner: 'player',
            weaponId: weapon.id,
            pierceRemaining: weapon.id === 'orb' ? Math.max(1, 1 + (this._run?.player.chainHits ?? 0)) : 1,
            hitIds: [],
            blastRadius: weapon.id === 'orb' ? 34 + Math.min(18, (this._run?.player.chainHits ?? 0) * 4) : 0,
            isCritical,
        });
    }

    private _tickProjectiles(dt: number): void {
        if (!this._run) return;

        const shielded = this._shieldTimer > 0;
        for (let i = this._projectiles.length - 1; i >= 0; i -= 1) {
            const projectile = this._projectiles[i];
            if (projectile.owner === 'player' && projectile.weaponId === 'orb') {
                this._steerOrbProjectile(projectile, dt);
            }
            projectile.x += projectile.vx * dt;
            projectile.y += projectile.vy * dt;
            projectile.ttl -= dt;

            const outside = Math.abs(projectile.x) > ARENA_HALF_WIDTH + 16 || Math.abs(projectile.y) > ARENA_HALF_HEIGHT + 16;
            if (projectile.ttl <= 0 || outside) {
                this._projectiles.splice(i, 1);
                continue;
            }

            if (projectile.owner === 'player') {
                if (this._resolvePlayerProjectileHit(projectile)) {
                    this._projectiles.splice(i, 1);
                }
                continue;
            }

            if (Math.hypot(projectile.x - this._playerX, projectile.y - this._playerY) <= PLAYER_RADIUS + projectile.radius) {
                if (this._run.player.invulnerable || this._run.player.blockAllDamage) {
                    this._float('BLOCK', this._playerX, this._playerY + 18, new Color(120, 224, 255, 255));
                    this._projectiles.splice(i, 1);
                    continue;
                }
                const armorReduction = Math.min(0.7, this._run.player.armor / (this._run.player.armor + 100));
                const shieldReduction = shielded || this._run.player.blockAllDamage ? 0.66 + this._run.player.shieldReduction * 0.2 : 0;
                let damage = Math.max(1, Math.round(projectile.damage * (1 - armorReduction) * (1 - Math.min(0.85, shieldReduction))));
                damage = Math.max(1, Math.round(damage * (this._run.player.damageTakenMul || 1)));
                if (this._run.player.activeUltimateId === 'aura_command') damage = Math.max(1, Math.round(damage * 0.4));
                if (this._tryDodge(projectile.x, projectile.y)) {
                    this._projectiles.splice(i, 1);
                    continue;
                }
                this._run.player.hp = Math.max(0, this._run.player.hp - damage);
                this._run.stats.damageTaken += damage;
                this._float(`-${damage}`, this._playerX, this._playerY + 20, new Color(128, 245, 162, 255));
                this._pulse(this._playerX, this._playerY, 8, shielded ? 30 : 20, 0.25, shielded ? new Color(120, 224, 255, 210) : projectile.color, 3);
                this._projectiles.splice(i, 1);
                this._log(this._fmt(shielded ? 'shieldProjectile' : 'projectileHit', { damage }));
            }
        }
    }

    private _steerOrbProjectile(projectile: PlayerProjectile, dt: number): void {
        if (!this._run) return;

        const hitIds = projectile.hitIds ?? [];
        const target = this._run.wave.enemies
            .filter((enemy) => enemy.alive && hitIds.indexOf(enemy.id) < 0)
            .map((enemy) => ({ enemy, distance: Math.hypot((this._enemyPositions.get(enemy.id)?.x ?? 0) - projectile.x, (this._enemyPositions.get(enemy.id)?.y ?? 0) - projectile.y) }))
            .sort((a, b) => a.distance - b.distance)[0];
        if (!target) return;

        const position = this._enemyPositions.get(target.enemy.id);
        if (!position) return;

        const dx = position.x - projectile.x;
        const dy = position.y - projectile.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const speed = Math.max(70, Math.hypot(projectile.vx, projectile.vy));
        const steer = Math.min(1, dt * 5.5);
        projectile.vx = projectile.vx * (1 - steer) + (dx / distance) * speed * steer;
        projectile.vy = projectile.vy * (1 - steer) + (dy / distance) * speed * steer;
    }

    private _resolvePlayerProjectileHit(projectile: PlayerProjectile): boolean {
        if (!this._run) return true;

        const hitIds = projectile.hitIds ?? [];
        for (let i = 0; i < this._run.wave.enemies.length; i += 1) {
            const enemy = this._run.wave.enemies[i];
            if (!enemy.alive || hitIds.indexOf(enemy.id) >= 0) continue;

            const position = this._enemyPositions.get(enemy.id);
            if (!position) continue;

            const archetype = ENEMY_ARCHETYPES[position.type];
            if (Math.hypot(projectile.x - position.x, projectile.y - position.y) > projectile.radius + archetype.radius) continue;

            const dealt = this._damageEnemy(i, projectile.damage);
            if (projectile.isCritical) {
                this._float('CRIT', position.x, position.y + 28, new Color(255, 220, 90, 255));
            }
            this._float(`-${dealt}`, position.x, position.y + 16, projectile.color);
            this._traceAttack(position.x, position.y, projectile.weaponId === 'orb' ? 'chain' : 'blade');
            this._pulseHit(position.x, position.y, !!projectile.isCritical, projectile.color);
            projectile.isCritical = false;
            if (projectile.weaponId === 'orb' && (projectile.blastRadius ?? 0) > 0) {
                this._resolveOrbBlast(projectile, position.x, position.y, i);
            }

            if (!this._run.wave.enemies[i].alive) {
                this._float('KO', position.x, position.y, new Color(255, 100, 100, 255));
                this._pulseKo(position.x, position.y);
            }

            hitIds.push(enemy.id);
            projectile.hitIds = hitIds;
            projectile.pierceRemaining = (projectile.pierceRemaining ?? 1) - 1;
            return (projectile.pierceRemaining ?? 0) <= 0;
        }

        return false;
    }

    private _resolveOrbBlast(projectile: PlayerProjectile, x: number, y: number, directHitIndex: number): void {
        if (!this._run) return;

        const radius = projectile.blastRadius ?? 0;
        this._attackTraces.push({
            fromX: x,
            fromY: y,
            toX: x,
            toY: y,
            ttl: 0.28,
            duration: 0.28,
            color: new Color(projectile.color.r, projectile.color.g, projectile.color.b, 170),
            kind: 'burst',
            radius,
        });
        for (let i = 0; i < this._run.wave.enemies.length; i += 1) {
            if (i === directHitIndex) continue;
            const enemy = this._run.wave.enemies[i];
            if (!enemy.alive) continue;
            const position = this._enemyPositions.get(enemy.id);
            if (!position || Math.hypot(position.x - x, position.y - y) > radius + ENEMY_ARCHETYPES[position.type].radius) continue;

            const dealt = this._damageEnemy(i, Math.max(1, Math.round(projectile.damage * 0.42)));
            this._float(`-${dealt}`, position.x, position.y + 14, projectile.color);
            this._pulseHit(position.x, position.y, false, projectile.color);
            if (!this._run.wave.enemies[i].alive) {
                this._float('KO', position.x, position.y, new Color(255, 100, 100, 255));
                this._pulseKo(position.x, position.y);
            }
        }
    }

    private _activateShield(): void {
        // Legacy name — now fires personality ultimate.
        this._activateUltimate();
    }

    private _activateUltimate(): void {
        if (!this._run || this._state !== GameState.Battle) return;

        const profession = this._run.profession;
        const cost = profession.ultimateEnergyCost || MAX_ULTIMATE_ENERGY;
        if (this._run.player.energy < cost) {
            this._log(this._fmt('energyLow', { energy: Math.floor(this._run.player.energy) }));
            return;
        }
        if (this._run.player.ultimateTimer > 0) {
            this._log(this._language === 'zh' ? '大招仍在持续。' : 'Ultimate still active.');
            return;
        }

        this._run.player.energy = 0;
        this._run.player.activeUltimateId = profession.ultimateId;
        this._run.player.ultimateTimer = profession.ultimateDuration;
        const ultMul = Math.max(1, this._run.player.ultimateMultiplier || 1);
        const name = this._language === 'zh' ? profession.ultimateNameZh : profession.ultimateName;

        switch (profession.ultimateId) {
            case 'time_dilation':
                this._run.player.ultimateDamageBonus = 1.5 * ultMul;
                break;
            case 'chain_bomb':
                this._resolveScreenBurst(8 * ultMul);
                this._run.player.ultimateTimer = 0.4;
                break;
            case 'elite_mark':
                this._run.player.ultimateDamageBonus = 0.5;
                break;
            case 'mind_convert':
                this._weakenLivingEnemies(0.4);
                break;
            case 'screen_mark':
                this._run.player.ultimateDamageBonus = 2.0 * ultMul;
                break;
            case 'phoenix_form':
                this._run.player.invulnerable = true;
                this._run.player.ultimateDamageBonus = 1.5 * ultMul;
                this._shieldTimer = profession.ultimateDuration;
                break;
            case 'aura_command':
                this._run.player.ultimateDamageBonus = 0.8 * ultMul;
                this._run.player.damageTakenMul = 0.4;
                break;
            case 'element_sprites':
                this._run.player.ultimateDamageBonus = 0.3;
                break;
            case 'deploy_turret':
                this._run.player.ultimateDamageBonus = 0.2;
                break;
            case 'heal_sanctuary':
                this._run.player.damageTakenMul = 0.5;
                this._shieldTimer = profession.ultimateDuration;
                break;
            case 'summon_guards':
                this._run.player.ultimateDamageBonus = 0.25;
                break;
            case 'full_restore':
                this._run.player.hp = this._run.player.maxHp;
                this._run.player.ultimateDamageBonus = 0.8 * ultMul;
                break;
            case 'perfect_parry':
                this._run.player.blockAllDamage = true;
                this._shieldTimer = profession.ultimateDuration;
                break;
            case 'element_spread':
                this._resolveRadialBurst(12, 2.0 * ultMul);
                this._run.player.ultimateTimer = 0.5;
                break;
            case 'berserk_surge':
                this._run.player.ultimateCooldownMul = 1 / 3;
                this._run.player.ultimateMoveBonus = 0.6;
                this._run.player.ultimateDamageBonus = 0.35;
                break;
            case 'taunt_shockwave':
                this._pullEnemiesTowardPlayer();
                this._resolveScreenBurst(4.0 * ultMul);
                this._run.player.ultimateTimer = 0.8;
                break;
            default:
                this._run.player.ultimateDamageBonus = 0.5;
                break;
        }

        this._pulse(this._playerX, this._playerY, 20, 64, 0.55, new Color(180, 140, 255, 230), 4);
        this._float('ULT', this._playerX, this._playerY + 40, new Color(210, 170, 255, 255));
        this._log(this._fmt('ultimateUsed', { name }));
        this._renderHud();
    }

    private _resolveScreenBurst(damageMul: number): void {
        if (!this._run) return;
        const base = this._computeHitDamage(null).damage;
        const dmg = Math.max(1, Math.round(base * damageMul));
        for (let i = 0; i < this._run.wave.enemies.length; i += 1) {
            const enemy = this._run.wave.enemies[i];
            if (!enemy.alive) continue;
            const pos = this._enemyPositions.get(enemy.id);
            const dealt = this._damageEnemy(i, dmg);
            if (pos) {
                this._float(`-${dealt}`, pos.x, pos.y + 14, new Color(255, 180, 80, 255));
                this._pulse(pos.x, pos.y, 8, 28, 0.3, new Color(255, 160, 60, 220), 3);
            }
        }
    }

    private _resolveRadialBurst(count: number, damageMul: number): void {
        if (!this._run) return;
        const base = this._computeHitDamage(null).damage;
        const dmg = Math.max(1, Math.round(base * damageMul));
        const weapon = this._getWeaponSpec();
        const range = 130;
        const hitSet = new Set<string>();
        for (let i = 0; i < count; i += 1) {
            const angle = (Math.PI * 2 * i) / count;
            for (let e = 0; e < this._run.wave.enemies.length; e += 1) {
                const enemy = this._run.wave.enemies[e];
                if (!enemy.alive || hitSet.has(enemy.id)) continue;
                const pos = this._enemyPositions.get(enemy.id);
                if (!pos) continue;
                const dx = pos.x - this._playerX;
                const dy = pos.y - this._playerY;
                const dist = Math.hypot(dx, dy);
                if (dist > range) continue;
                const ang = Math.atan2(dy, dx);
                let delta = Math.abs(ang - angle);
                while (delta > Math.PI) delta = Math.abs(delta - Math.PI * 2);
                if (delta > 0.4) continue;
                hitSet.add(enemy.id);
                const dealt = this._damageEnemy(e, dmg);
                this._float(`-${dealt}`, pos.x, pos.y + 12, weapon.color);
            }
            this._attackTraces.push({
                fromX: this._playerX,
                fromY: this._playerY,
                toX: this._playerX + Math.cos(angle) * range,
                toY: this._playerY + Math.sin(angle) * range,
                ttl: 0.28,
                duration: 0.28,
                color: weapon.color,
                kind: 'line',
            });
        }
    }

    private _weakenLivingEnemies(ratio: number): void {
        if (!this._run) return;
        const living = this._run.wave.enemies.filter((e) => e.alive);
        const count = Math.max(1, Math.floor(living.length * ratio));
        for (let i = 0; i < count; i += 1) {
            const enemy = living[i];
            const idx = this._run.wave.enemies.findIndex((e) => e.id === enemy.id);
            if (idx < 0) continue;
            this._run.wave.enemies[idx] = {
                ...enemy,
                damage: Math.max(1, Math.round(enemy.damage * 0.35)),
                hp: Math.max(1, Math.round(enemy.hp * 0.7)),
            };
            const pos = this._enemyPositions.get(enemy.id);
            if (pos) this._float('CONV', pos.x, pos.y + 12, new Color(160, 255, 180, 255));
        }
    }

    private _pullEnemiesTowardPlayer(): void {
        if (!this._run) return;
        for (const enemy of this._run.wave.enemies) {
            if (!enemy.alive) continue;
            const pos = this._enemyPositions.get(enemy.id);
            if (!pos) continue;
            const dx = this._playerX - pos.x;
            const dy = this._playerY - pos.y;
            const dist = Math.max(1, Math.hypot(dx, dy));
            pos.x = this._clampX(pos.x + (dx / dist) * Math.min(90, dist * 0.55));
            pos.y = this._clampY(pos.y + (dy / dist) * Math.min(90, dist * 0.55));
        }
    }

    private _onPrimaryAction(): void {
        if (this._state === GameState.Result) {
            this._startRun();
            return;
        }

        this._activateUltimate();
    }

    private _enterWaveClear(): void {
        if (!this._run) return;

        this._rollSystem.grantWaveRewards(this._run.wave.wave);
        this._rollSystem.beginDraft(this._run.wave.wave);
        this._log(this._fmt('waveClear', { wave: this._run.wave.wave }));
        this._showWaveClearBadge();
        this._enterState(GameState.RollDraft);
        this._setChoiceButtons(this._rollSystem.getViewModel().choices);
        this._syncRerollIcon();
        this._renderHud();
    }

    private _showWaveClearBadge(): void {
        if (!this._waveClearBadgeSprite) return;
        const frame = this._uiIconFrames.get('wave_clear') ?? this._waveClearBadgeSprite.spriteFrame;
        if (!frame) return;
        this._waveClearBadgeSprite.spriteFrame = frame;
        this._waveClearBadgeSprite.node.active = true;
        this._waveClearBadgeSprite.node.setScale(1.05, 1.05, 1);
        this._waveClearBadgeSprite.node.getComponent(UITransform)?.setContentSize(110, 110);
        this._waveClearBadgeTimer = 1.35;
    }

    private _tickWaveClearBadge(dt: number): void {
        if (this._waveClearBadgeTimer <= 0) return;
        this._waveClearBadgeTimer = Math.max(0, this._waveClearBadgeTimer - dt);
        if (!this._waveClearBadgeSprite) return;
        const progress = 1 - this._waveClearBadgeTimer / 1.35;
        const scale = 1.05 + progress * 0.18;
        this._waveClearBadgeSprite.node.setScale(scale, scale, 1);
        if (this._waveClearBadgeTimer <= 0) {
            this._waveClearBadgeSprite.node.active = false;
        }
    }

    private _rerollDraft(): void {
        if (this._state !== GameState.RollDraft) return;

        const view = this._rollSystem.getViewModel();
        const message = view.rewardedAdRefreshPending
            ? this._rollSystem.completeRewardedRefresh(true)
            : this._rollSystem.rerollDraft();

        this._log(message === 'Rewarded ad refresh requested.'
            ? 'Rewarded ad hook requested. Preview grants it on the next WATCH AD tap.'
            : message);
        this._setChoiceButtons(this._rollSystem.getViewModel().choices);
        this._renderHud();
    }

    private _pickChoice(index: number): void {
        if (!this._run || this._state !== GameState.RollDraft) return;

        const result = this._rollSystem.selectChoice(index);
        if (!result.ok || !result.card) {
            this._log(result.message);
            return;
        }

        this._applyCard(result.card);
        this._startWave(this._run.wave.wave + 1);
    }

    private _endRun(): void {
        this._log(`Run ended at Wave ${this._run?.wave.wave ?? 1}. Tap RESTART.`);
        this._enterState(GameState.Result);
        this._renderResult();
        if (this._shieldButton) {
            this._shieldButton.node.active = true;
            this._setButtonText(this._shieldButton, this._t('restart'));
        }
    }

    private _resetEnemyPositions(): void {
        this._enemyPositions.clear();
        if (!this._run) return;

        for (let i = 0; i < this._run.wave.enemies.length; i += 1) {
            const enemy = this._run.wave.enemies[i];
            const type = enemyTypeFromConfig(enemy.configId);
            const column = i % 4;
            const row = Math.floor(i / 4);
            const side = i % 2 === 0 ? 1 : -1;
            this._enemyPositions.set(this._run.wave.enemies[i].id, {
                x: this._clampX(side * (190 + column * 46)),
                y: this._clampY(-112 + row * 48 + (column % 2) * 18),
                contactCooldown: 0.3 + i * 0.08,
                type,
                actionTimer: 0,
                windupTimer: 0,
                dashCooldown: type === 'dasher' ? 0.9 + i * 0.12 : 0,
                dashVx: 0,
                dashVy: 0,
                warningTimer: 0,
                hitFlashTimer: 0,
                spawnTimer: 0.32,
                deathTimer: 0,
            });
            const position = this._enemyPositions.get(this._run.wave.enemies[i].id);
            if (position) {
                const color = this._enemyColor(type);
                this._pulse(position.x, position.y, 8, ENEMY_ARCHETYPES[type].radius + 14, 0.38, color, 2);
            }
        }
    }

    private _spawnRuntimeEnemy(type: RuntimeEnemyType): void {
        if (!this._run) return;

        const archetype = ENEMY_ARCHETYPES[type];
        const waveScale = Math.max(0, this._run.wave.wave - 1);
        const bossScale = archetype.rank === 'boss' ? 1 + waveScale * 0.18 : 1 + waveScale * 0.14;
        const id = `w${this._run.wave.wave}_${type}_spawn_${this._spawnSerial++}`;
        const floor = Math.min(4, Math.max(1, getWavePlan(this._run.wave.wave).floor));
        const enemy = createEnemy({
            id,
            configId: type,
            name: archetype.rank === 'boss' ? this._bossDisplayName(floor) : archetype.name,
            rank: archetype.rank,
            maxHp: Math.round(archetype.hp * bossScale),
            damage: Math.round(archetype.damage * (1 + waveScale * 0.09)),
            armor: Math.round(archetype.armor + waveScale * (archetype.rank === 'boss' ? 1.2 : 0.45)),
            attackCooldown: archetype.contactCooldown,
        });
        this._run.wave.enemies.push(enemy);

        const edge = this._spawnSerial % 4;
        const spread = 0.78;
        const x = edge === 0 ? ARENA_HALF_WIDTH * spread : edge === 1 ? -ARENA_HALF_WIDTH * spread : (Math.random() * 2 - 1) * ARENA_HALF_WIDTH * spread;
        const y = edge === 2 ? ARENA_HALF_HEIGHT * spread : edge === 3 ? -ARENA_HALF_HEIGHT * spread : (Math.random() * 2 - 1) * ARENA_HALF_HEIGHT * spread;
        this._enemyPositions.set(id, {
            x: this._clampX(x),
            y: this._clampY(y),
            contactCooldown: 0.28,
            type,
            actionTimer: 0,
            windupTimer: 0,
            dashCooldown: type === 'dasher' ? 0.8 : 0,
            dashVx: 0,
            dashVy: 0,
            warningTimer: 0,
            hitFlashTimer: 0,
            spawnTimer: 0.34,
            deathTimer: 0,
        });
        const color = this._enemyColor(type);
        this._pulse(this._clampX(x), this._clampY(y), 6, ENEMY_ARCHETYPES[type].radius + 18, 0.34, color, 2);
    }

    private _getWaveSpawnInterval(): number {
        const wave = this._run?.wave.wave ?? 1;
        return Math.max(0.34, BASE_SPAWN_INTERVAL_SECONDS - wave * 0.045);
    }

    private _pickContinuousEnemyType(wave: number): RuntimeEnemyType {
        const pool: RuntimeEnemyType[] = ['chaser', 'chaser', 'swarm', 'anxiety'];
        if (wave >= 2) pool.push('tank', 'doubt');
        if (wave >= 3) pool.push('anxiety', 'swarm');
        if (wave >= 4) pool.push('dasher', 'procrastination');
        if (wave >= 6) pool.push('spitter');
        if (wave >= 8) pool.push('binder');
        // F3 self-judgment: denser control + doubt
        if (wave >= 11) pool.push('swarm', 'dasher', 'spitter', 'anxiety', 'doubt', 'binder');
        // F4 existential: heavy mixed pressure
        if (wave >= 16) pool.push('tank', 'dasher', 'spitter', 'binder', 'procrastination', 'swarm');
        return pool[Math.floor(Math.random() * pool.length)] ?? 'chaser';
    }

    private _bossDisplayName(floor: number): string {
        if (this._language === 'zh') {
            if (floor === 1) return '职场恐惧';
            if (floor === 2) return '社交审判';
            if (floor === 3) return '依恋虚空';
            return '自我深渊';
        }
        if (floor === 1) return 'Workplace Fear';
        if (floor === 2) return 'Social Judgment';
        if (floor === 3) return 'Attachment Void';
        return 'Self Abyss';
    }

    private _getTargetsInRange(): RunEnemyModel[] {
        if (!this._run) return [];

        const range = Math.max(52, this._run.player.attackRange);
        const extraBlades = Math.max(0, this._run.player.bladeCount - 1);
        const count = Math.max(1, 1 + this._run.player.chainHits + extraBlades + this._run.player.splitBlades);
        return this._run.wave.enemies
            .filter((enemy) => enemy.alive)
            .map((enemy) => ({
                enemy,
                distance: this._distanceToEnemy(enemy.id),
            }))
            .filter((item) => item.distance <= range)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, count)
            .map((item) => item.enemy);
    }

    private _getWeaponSpec(): WeaponSpec {
        return WEAPON_SPECS[this._selectedWeaponId];
    }

    private _getLoadoutSpec(): LoadoutSpec {
        return PROFESSION_LOADOUTS[this._selectedProfessionId] ?? PROFESSION_LOADOUTS.intj;
    }

    private _professionButtonText(professionId: ProfessionId, selected: boolean): string {
        const profession = PROFESSIONS.find((item) => item.id === professionId);
        const code = profession?.code ?? professionId.toUpperCase();
        const name = this._language === 'zh'
            ? (profession?.nameZh ?? code)
            : (profession?.name ?? code);
        const short = name.length > 8 ? code : `${code}`;
        const line2 = this._language === 'zh' ? (profession?.nameZh ?? '') : (profession?.name ?? '');
        return selected ? `[${short}]\n${line2}` : `${short}\n${line2}`;
    }

    private _applyCard(card: HexCardData): void {
        if (!this._run) return;

        const player = this._run.player;
        const bonus: CombatBonus = card.bonus ?? {};
        const nextMaxHp = Math.max(1, player.maxHp + (bonus.maxHp ?? 0));
        const hpGain = Math.max(0, nextMaxHp - player.maxHp);

        // Signature exclusive: light feedback when the matching hero picks it.
        if (card.exclusiveTo && card.exclusiveTo === this._selectedProfessionId) {
            const label = this._language === 'zh'
                ? `专属 · ${card.nameZh ?? card.name}`
                : `Signature · ${card.name}`;
            this._log(label);
        }

        this._run = {
            ...this._run,
            pickedCards: this._run.pickedCards.concat([card]),
            player: {
                ...player,
                maxHp: nextMaxHp,
                hp: Math.min(nextMaxHp, player.hp + hpGain),
                armor: Math.max(0, player.armor + (bonus.armor ?? 0)),
                dodge: Math.min(0.85, Math.max(0, player.dodge + (bonus.dodge ?? 0))),
                luck: player.luck + (bonus.luck ?? 0),
                moveSpeed: Math.min(1.85, Math.max(0.55, player.moveSpeed + (bonus.moveSpeed ?? 0))),
                damage: Math.max(0, player.damage + (bonus.damage ?? 0)),
                damagePercent: Math.max(-0.95, player.damagePercent + (bonus.damagePercent ?? 0)),
                attackRange: Math.max(40, player.attackRange + (bonus.attackRange ?? 0)),
                attackCooldown: Math.max(0.18, player.attackCooldown + (bonus.attackCooldown ?? 0)),
                energyPerAttack: Math.max(0, player.energyPerAttack + (bonus.energyPerAttack ?? 0)),
                ultimateMultiplier: Math.max(0, player.ultimateMultiplier + (bonus.ultimateMultiplier ?? 0)),
                shieldReduction: Math.min(0.9, Math.max(0, player.shieldReduction + (bonus.shieldReduction ?? 0))),
                bladeCount: Math.max(1, Math.floor(player.bladeCount + (bonus.bladeCount ?? 0))),
                orbitBladeCount: Math.max(0, Math.floor(player.orbitBladeCount + (bonus.orbitBladeCount ?? 0))),
                chainHits: Math.max(0, Math.floor(player.chainHits + (bonus.chainHits ?? 0))),
                splitBlades: Math.max(0, Math.floor(player.splitBlades + (bonus.splitBlades ?? 0))),
                fanAngle: Math.max(0, player.fanAngle + (bonus.fanAngle ?? 0)),
                critChance: Math.min(0.95, Math.max(0, player.critChance + (bonus.critChance ?? 0))),
                critMultiplier: Math.max(1.5, player.critMultiplier + (bonus.critMultiplier ?? 0)),
                lifesteal: Math.min(0.5, Math.max(0, player.lifesteal + (bonus.lifesteal ?? 0))),
                executeBonus: Math.max(0, player.executeBonus + (bonus.executeBonus ?? 0)),
                bossDamageBonus: Math.max(0, player.bossDamageBonus + (bonus.bossDamageBonus ?? 0)),
                lockedSkillIds: this._rollSystem.getLockedSkillIds(),
            },
        };
        const display = this._language === 'zh' && card.nameZh ? card.nameZh : card.name;
        this._log(this._fmt('picked', { card: display }));
    }

    private _damageEnemy(enemyIndex: number, rawDamage: number): number {
        if (!this._run) return 0;

        const enemy = this._run.wave.enemies[enemyIndex];
        if (!enemy || !enemy.alive) return 0;

        // Re-scale with full passive pipeline when raw is base-ish; callers already pass resolved damage often.
        const dealt = damageAfterArmor(rawDamage, enemy.armor);
        const nextEnemy = {
            ...enemy,
            hp: Math.max(0, enemy.hp - dealt),
        };
        nextEnemy.alive = nextEnemy.hp > 0;
        this._run.wave.enemies[enemyIndex] = nextEnemy;
        this._run.stats.damageDealt += dealt;

        // Lifesteal
        if (this._run.player.lifesteal > 0 && dealt > 0) {
            const heal = Math.max(1, Math.round(dealt * this._run.player.lifesteal));
            this._run.player.hp = Math.min(this._run.player.maxHp, this._run.player.hp + heal);
        }

        const position = this._enemyPositions.get(enemy.id);
        if (position) {
            position.hitFlashTimer = 0.14;
            this._spawnImpactShards(position.x, position.y, position.type, nextEnemy.alive ? 3 : 9);
        }
        if (!nextEnemy.alive) {
            this._run.stats.kills += 1;
            // E passive: kill stacks
            if (professionHasTrait(this._run.profession, 'E')) {
                this._run.player.killStacks = Math.min(15, this._run.player.killStacks + 1);
            }
            // F passive: every 8 kills heal 12%
            if (professionHasTrait(this._run.profession, 'F')) {
                this._run.player.feelKillCounter += 1;
                if (this._run.player.feelKillCounter >= 8) {
                    this._run.player.feelKillCounter = 0;
                    const heal = Math.round(this._run.player.maxHp * 0.12);
                    this._run.player.hp = Math.min(this._run.player.maxHp, this._run.player.hp + heal);
                    this._float(`+${heal}`, this._playerX, this._playerY + 28, new Color(120, 255, 160, 255));
                }
            }
            // Small energy refund on kill
            this._run.player.energy = Math.min(MAX_ULTIMATE_ENERGY, this._run.player.energy + 4);
            if (position) {
                const arch = ENEMY_ARCHETYPES[position.type] ?? ENEMY_ARCHETYPES.chaser;
                position.deathTimer = 0.28;
                this._pulse(
                    position.x,
                    position.y,
                    10,
                    arch.radius + 28,
                    0.28,
                    this._enemyColor(position.type),
                    3,
                    'explosion',
                    Math.max(36, arch.radius * 3),
                );
            }
            this._grantKillXp(enemy);
        }
        return dealt;
    }

    private _grantKillXp(enemy: RunEnemyModel): void {
        if (!this._run) return;

        const type = enemyTypeFromConfig(enemy.configId);
        let base = enemy.rank === 'boss' ? 38 : enemy.rank === 'elite' ? 8 : type === 'swarm' || type === 'anxiety' ? 2 : 4;
        // ENTJ elite mark ultimate: 3x XP
        if (this._run.player.activeUltimateId === 'elite_mark') {
            base *= 3;
        }
        // Infinite growth card: extra ATK% on level already handled via level-up path
        let xp = this._run.stats.xp + base;
        let level = this._run.stats.level;
        let xpToNext = this._run.stats.xpToNext;
        let levelUps = 0;

        while (xp >= xpToNext) {
            xp -= xpToNext;
            level += 1;
            levelUps += 1;
            xpToNext = Math.round(10 + level * 5.5);
        }

        if (levelUps > 0) {
            const hpGain = 3 * levelUps;
            const hasInfinite = this._run.pickedCards.some((card) => card.id === 'infinite_growth');
            this._run.player = {
                ...this._run.player,
                maxHp: this._run.player.maxHp + hpGain,
                hp: Math.min(this._run.player.maxHp + hpGain, this._run.player.hp + hpGain),
                damage: this._run.player.damage + levelUps,
                damagePercent: this._run.player.damagePercent + (hasInfinite ? 0.05 * levelUps : 0),
                moveSpeed: Math.min(1.85, this._run.player.moveSpeed + levelUps * 0.012),
                attackCooldown: Math.max(0.18, this._run.player.attackCooldown - levelUps * 0.008),
            };
            this._float(`LV ${level}`, this._playerX, this._playerY + 34, new Color(255, 218, 110, 255));
            this._pulse(this._playerX, this._playerY, 18, 54, 0.48, new Color(255, 218, 110, 220), 4, 'level_up', 72);
            this._spawnVfxSprite('pickup_glow', this._playerX, this._playerY + 12, 40, 0.4);
            this._log(this._fmt('levelUp', { level }));
        }

        this._run.stats = {
            ...this._run.stats,
            xp,
            level,
            xpToNext,
        };
    }

    private _resolveOrbitBladeHits(rawDamage: number): number {
        if (!this._run || this._run.player.orbitBladeCount <= 0) return 0;

        const radius = Math.min(96, 38 + this._run.player.orbitBladeCount * 12);
        const maxHits = Math.min(this._run.player.orbitBladeCount, 6);
        const weapon = this._getWeaponSpec();
        let hits = 0;

        for (let i = 0; i < this._run.wave.enemies.length && hits < maxHits; i += 1) {
            const enemy = this._run.wave.enemies[i];
            if (!enemy.alive) continue;

            const position = this._enemyPositions.get(enemy.id);
            if (!position) continue;
            if (Math.hypot(position.x - this._playerX, position.y - this._playerY) > radius + ENEMY_ARCHETYPES[position.type].radius) continue;

            const dealt = this._damageEnemy(i, rawDamage);
            this._float(`-${dealt}`, position.x, position.y + 13, new Color(204, 154, 255, 255));
            this._traceAttack(position.x, position.y, 'chain');
            this._pulseHit(position.x, position.y, false, weapon.color);
            if (!this._run.wave.enemies[i].alive) {
                this._float('KO', position.x, position.y, new Color(255, 100, 100, 255));
                this._pulseKo(position.x, position.y);
            }
            hits += 1;
        }

        return hits;
    }

    private _tryDodge(sourceX: number, sourceY: number): boolean {
        if (!this._run || this._run.player.dodge <= 0) return false;
        if (Math.random() >= this._run.player.dodge) return false;

        // N passive: after dodge, next hit +40%
        if (professionHasTrait(this._run.profession, 'N')) {
            this._run.player.postDodgeBonus = Math.max(this._run.player.postDodgeBonus, 0.4);
        }
        this._float('DODGE', this._playerX, this._playerY + 22, new Color(154, 226, 255, 255));
        this._traceAttack(sourceX, sourceY, 'chain');
        this._pulse(this._playerX, this._playerY, 10, 28, 0.24, new Color(154, 226, 255, 220), 2);
        this._log(this._language === 'zh' ? '闪避成功。' : 'Dodged incoming damage.');
        return true;
    }

    private _renderResult(): void {
        if (!this._run || !this._resultLabel) return;

        const minutes = Math.floor(this._run.stats.timeSeconds / 60);
        const secondsValue = Math.floor(this._run.stats.timeSeconds % 60);
        const seconds = secondsValue < 10 ? `0${secondsValue}` : `${secondsValue}`;
        const code = this._run.profession.code;
        const name = this._language === 'zh' ? this._run.profession.nameZh : this._run.profession.name;
        this._resultLabel.string = [
            this._t('runComplete'),
            `${code} ${name}`,
            `Wave ${this._run.wave.wave}  Cleared ${this._run.stats.wavesCleared}`,
            `Time ${minutes}:${seconds}  Lv ${this._run.stats.level}  Kills ${this._run.stats.kills}`,
            `Damage ${this._run.stats.damageDealt}  Taken ${this._run.stats.damageTaken}`,
        ].join('\n');
    }

    private _onJoystickStart(event: EventTouch): void {
        if (this._state !== GameState.Battle) return;

        this._joystickTouchId = event.getID();
        this._updateJoystickFromTouch(event);
    }

    private _onJoystickMove(event: EventTouch): void {
        if (this._joystickTouchId !== event.getID()) return;

        this._updateJoystickFromTouch(event);
    }

    private _onJoystickEnd(event: EventTouch): void {
        if (this._joystickTouchId !== event.getID()) return;

        this._joystickTouchId = null;
        this._moveInput.set(0, 0);
        this._drawJoystick();
    }

    private _updateJoystickFromTouch(event: EventTouch): void {
        if (!this._joystickBase) return;

        const location = event.getUILocation();
        const center = this._joystickBase.worldPosition;
        const raw = new Vec2(location.x - center.x, location.y - center.y);
        const length = raw.length();
        const clamped = length > JOYSTICK_RADIUS ? raw.multiplyScalar(JOYSTICK_RADIUS / length) : raw;
        this._moveInput.set(clamped.x / JOYSTICK_RADIUS, clamped.y / JOYSTICK_RADIUS);
        this._drawJoystick();
    }

    private _onKeyDown(event: EventKeyboard): void {
        this._pressedKeys.add(event.keyCode);
        if (event.keyCode === KeyCode.KEY_N && this._state === GameState.Battle) {
            this._debugClearWave();
            return;
        }
        if (event.keyCode === KeyCode.KEY_U && this._state === GameState.Battle) {
            this._activateUltimate();
            return;
        }
        // Debug fill ultimate energy
        if (event.keyCode === KeyCode.KEY_E && this._state === GameState.Battle && this._run) {
            this._run.player.energy = MAX_ULTIMATE_ENERGY;
            this._log(this._t('ultimateReady'));
            this._renderHud();
            return;
        }
        this._syncKeyboardInput();
    }

    private _onKeyUp(event: EventKeyboard): void {
        this._pressedKeys.delete(event.keyCode);
        this._syncKeyboardInput();
    }

    private _syncKeyboardInput(): void {
        let x = 0;
        let y = 0;
        if (this._pressedKeys.has(KeyCode.KEY_A) || this._pressedKeys.has(KeyCode.ARROW_LEFT)) x -= 1;
        if (this._pressedKeys.has(KeyCode.KEY_D) || this._pressedKeys.has(KeyCode.ARROW_RIGHT)) x += 1;
        if (this._pressedKeys.has(KeyCode.KEY_W) || this._pressedKeys.has(KeyCode.ARROW_UP)) y += 1;
        if (this._pressedKeys.has(KeyCode.KEY_S) || this._pressedKeys.has(KeyCode.ARROW_DOWN)) y -= 1;

        this._keyboardInput.set(x, y);
        if (this._keyboardInput.length() > 1) {
            this._keyboardInput.normalize();
        }
    }

    private _getMoveVector(): Vec2 {
        if (this._moveInput.length() > 0.01) {
            return this._moveInput;
        }
        return this._keyboardInput;
    }

    private _debugClearWave(): void {
        if (!this._run || this._state !== GameState.Battle) return;

        for (let i = 0; i < this._run.wave.enemies.length; i += 1) {
            const enemy = this._run.wave.enemies[i];
            if (!enemy.alive) continue;
            this._run.wave.enemies[i] = { ...enemy, hp: 0, alive: false };
        }
        this._run = {
            ...this._run,
            wave: { ...this._run.wave, cleared: true },
            stats: {
                ...this._run.stats,
                wavesCleared: this._run.stats.wavesCleared + 1,
            },
        };
        this._log(`Debug cleared Wave ${this._run.wave.wave}.`);
        this._enterWaveClear();
    }

    private _renderHud(): void {
        if (!this._run && this._state !== GameState.Title) return;

        const view = this._rollSystem.getViewModel();
        const alive = this._run?.wave.enemies.filter((enemy) => enemy.alive).length ?? 0;
        if (this._hudLabel && this._run) {
            const weapon = this._getWeaponSpec();
            const timeLeft = Math.max(0, Math.ceil(WAVE_DURATION_SECONDS - this._run.wave.elapsedSeconds));
            const plan = getWavePlan(this._run.wave.wave);
            const floorTheme = getFloorTheme(plan.floor);
            const floorName = this._language === 'zh' ? floorTheme.zh : floorTheme.en;
            const code = this._run.profession.code;
            const energy = Math.floor(this._run.player.energy);
            const stacks = this._run.player.killStacks > 0 ? ` E${this._run.player.killStacks}` : '';
            this._hudLabel.string = `${code}  F${plan.floor}:${floorName}  ${this._t('wave')} ${this._run.wave.wave} ${timeLeft}s  ${this._t('level')}${this._run.stats.level}  ${this._t('hp')} ${Math.ceil(this._run.player.hp)}/${this._run.player.maxHp}  ULT ${energy}/100  ${weapon.shortName}${stacks}  ${this._t('enemies')} ${alive}`;
        }
        if (this._enemyLabel && this._run) {
            const nearest = this._getNearestEnemySummary();
            this._enemyLabel.string = this._state === GameState.RollDraft ? this._t('draft') : nearest;
        }
        if (this._statusLabel && this._run) {
            const ult = this._run.player.ultimateTimer > 0
                ? `ULT ${this._run.player.ultimateTimer.toFixed(1)}s`
                : (this._run.player.energy >= (this._run.profession.ultimateEnergyCost || 100)
                    ? this._t('ultimateReady')
                    : `${this._t('shield')} ${Math.floor(this._run.player.energy)}%`);
            const perf = `FPS ${this._perfFps}`;
            this._statusLabel.string = this._state === GameState.RollDraft
                ? `${this._t('freeRefresh')} ${view.freeRefreshesRemaining}  ${this._t('pickUpgrade')}`
                : `${this._t('auto')} ${this._getTargetsInRange().length > 0 ? this._t('firing') : this._t('seeking')}  ${ult}  ${perf}`;
        }
        if (this._logLabel) this._logLabel.string = this._lastLog;

        this._setChoiceButtons(this._state === GameState.RollDraft ? view.choices : []);
        if (this._rerollButton) {
            this._rerollButton.node.active = this._state === GameState.RollDraft;
            this._setButtonText(this._rerollButton, view.rewardedAdRefreshPending ? this._t('watchAd') : `${this._t('refresh')} ${view.freeRefreshesRemaining}`);
        }
        if (this._shieldButton && this._state === GameState.Battle) {
            const ready = (this._run?.player.energy ?? 0) >= (this._run?.profession.ultimateEnergyCost ?? 100);
            this._setButtonText(this._shieldButton, ready ? `${this._t('shield')}!` : this._t('shield'));
        }
    }

    private _getNearestEnemySummary(): string {
        if (!this._run) return '';

        const nearest = this._run.wave.enemies
            .filter((enemy) => enemy.alive)
            .map((enemy) => ({ enemy, distance: this._distanceToEnemy(enemy.id) }))
            .sort((a, b) => a.distance - b.distance)[0];

        if (!nearest) return this._t('arenaClear');

        if (nearest.enemy.rank === 'boss') {
            const phase = nearest.enemy.hp <= nearest.enemy.maxHp * 0.52 ? this._t('phase2') : this._t('phase1');
            return `${nearest.enemy.name} ${phase}  ${nearest.enemy.hp}/${nearest.enemy.maxHp}`;
        }

        return `${nearest.enemy.name} ${nearest.enemy.hp}/${nearest.enemy.maxHp}  ${Math.round(nearest.distance)}px`;
    }

    private _drawArena(): void {
        const graphics = this._arenaGraphics;
        if (!graphics) return;

        if (this._arenaPlayerSpriteNode) this._arenaPlayerSpriteNode.active = false;
        this._hideEnemySprites();

        const usesArenaMap = this._syncArenaMapSprite();
        graphics.clear();
        if (usesArenaMap) {
            graphics.fillColor = new Color(6, 10, 18, 24);
            graphics.roundRect(-ARENA_HALF_WIDTH, -ARENA_HALF_HEIGHT, ARENA_WIDTH, ARENA_HEIGHT, 8);
            graphics.fill();
        } else {
            graphics.fillColor = new Color(22, 28, 42, 255);
            graphics.roundRect(-ARENA_HALF_WIDTH, -ARENA_HALF_HEIGHT, ARENA_WIDTH, ARENA_HEIGHT, 8);
            graphics.fill();
            graphics.fillColor = new Color(16, 22, 34, 255);
            graphics.roundRect(-ARENA_HALF_WIDTH + 8, -ARENA_HALF_HEIGHT + 8, ARENA_WIDTH - 16, 22, 6);
            graphics.roundRect(-ARENA_HALF_WIDTH + 8, ARENA_HALF_HEIGHT - 30, ARENA_WIDTH - 16, 22, 6);
            graphics.fill();
            graphics.fillColor = new Color(28, 36, 52, 120);
            for (let i = 0; i < 5; i += 1) {
                const y = -ARENA_HALF_HEIGHT + 20 + i * 40;
                graphics.roundRect(-ARENA_HALF_WIDTH + 8, y, ARENA_WIDTH - 16, 1.5, 1);
                graphics.fill();
            }
            graphics.strokeColor = new Color(58, 76, 106, 90);
            graphics.lineWidth = 1;
            for (let i = 0; i < 8; i += 1) {
                const x = -ARENA_HALF_WIDTH + 36 + i * 52;
                graphics.moveTo(x, -ARENA_HALF_HEIGHT + 10);
                graphics.lineTo(x, ARENA_HALF_HEIGHT - 10);
                graphics.stroke();
            }
            graphics.strokeColor = new Color(74, 92, 122, 80);
            graphics.lineWidth = 1;
            for (let i = 0; i < 10; i += 1) {
                const x = -ARENA_HALF_WIDTH + 44 + i * 92;
                graphics.moveTo(x - 24, -ARENA_HALF_HEIGHT + 26);
                graphics.lineTo(x + 24, -ARENA_HALF_HEIGHT + 26);
                graphics.moveTo(x + 24, ARENA_HALF_HEIGHT - 26);
                graphics.lineTo(x - 24, ARENA_HALF_HEIGHT - 26);
                graphics.stroke();
            }
        }
        graphics.strokeColor = new Color(68, 86, 118, 255);
        graphics.lineWidth = 2;
        graphics.roundRect(-ARENA_HALF_WIDTH, -ARENA_HALF_HEIGHT, ARENA_WIDTH, ARENA_HEIGHT, 8);
        graphics.stroke();

        if (!this._run || this._state === GameState.RollDraft || this._state === GameState.Title) return;

        graphics.strokeColor = new Color(66, 128, 170, 110);
        graphics.lineWidth = 1;
        graphics.circle(this._playerX, this._playerY, Math.max(40, this._run.player.attackRange));
        graphics.stroke();

        this._syncVoidChaserSprites();
        this._syncCoreTankSprites();
        this._syncTypedEnemySprites();
        this._syncSummonSprites();

        for (const trace of this._attackTraces) {
            const progress = 1 - trace.ttl / Math.max(0.001, trace.duration);
            const alpha = Math.max(0, Math.round(trace.color.a * (1 - progress)));
            graphics.strokeColor = trace.color;
            if (trace.kind === 'arc') {
                const radius = trace.radius ?? 72;
                const base = Math.atan2(trace.toY - trace.fromY, trace.toX - trace.fromX);
                const half = (trace.angle ?? Math.PI) * 0.5;
                graphics.strokeColor = new Color(trace.color.r, trace.color.g, trace.color.b, alpha);
                graphics.lineWidth = 5;
                let lastX = trace.fromX + Math.cos(base - half) * radius;
                let lastY = trace.fromY + Math.sin(base - half) * radius;
                for (let i = 1; i <= 12; i += 1) {
                    const t = i / 12;
                    const a = base - half + t * half * 2;
                    const x = trace.fromX + Math.cos(a) * radius;
                    const y = trace.fromY + Math.sin(a) * radius;
                    graphics.moveTo(lastX, lastY);
                    graphics.lineTo(x, y);
                    graphics.stroke();
                    lastX = x;
                    lastY = y;
                }
                graphics.lineWidth = 2;
                graphics.moveTo(trace.fromX, trace.fromY);
                graphics.lineTo(trace.fromX + Math.cos(base - half) * radius * 0.72, trace.fromY + Math.sin(base - half) * radius * 0.72);
                graphics.moveTo(trace.fromX, trace.fromY);
                graphics.lineTo(trace.fromX + Math.cos(base + half) * radius * 0.72, trace.fromY + Math.sin(base + half) * radius * 0.72);
                graphics.stroke();
            } else if (trace.kind === 'thrust') {
                const dx = trace.toX - trace.fromX;
                const dy = trace.toY - trace.fromY;
                const distance = Math.max(1, Math.hypot(dx, dy));
                const px = -dy / distance;
                const py = dx / distance;
                const width = trace.width ?? 20;
                graphics.strokeColor = new Color(trace.color.r, trace.color.g, trace.color.b, alpha);
                graphics.lineWidth = 5;
                graphics.moveTo(trace.fromX + px * width, trace.fromY + py * width);
                graphics.lineTo(trace.toX, trace.toY);
                graphics.lineTo(trace.fromX - px * width, trace.fromY - py * width);
                graphics.stroke();
            } else if (trace.kind === 'burst') {
                const radius = (trace.radius ?? 32) * (0.75 + progress * 0.25);
                graphics.strokeColor = new Color(trace.color.r, trace.color.g, trace.color.b, alpha);
                graphics.lineWidth = 3;
                graphics.circle(trace.fromX, trace.fromY, radius);
                graphics.stroke();
            } else {
                graphics.strokeColor = new Color(trace.color.r, trace.color.g, trace.color.b, alpha);
                graphics.lineWidth = 4;
                graphics.moveTo(trace.fromX, trace.fromY);
                graphics.lineTo(trace.toX, trace.toY);
                graphics.stroke();
            }
        }

        this._syncEnemyBoltSprites();
        for (const projectile of this._projectiles) {
            if (projectile.owner === 'enemy' && this._vfxFrames.has('projectile_enemy')) {
                continue; // drawn via bolt sprite pool
            }
            graphics.fillColor = projectile.color;
            if (projectile.owner === 'player' && projectile.weaponId === 'gun') {
                const speed = Math.max(1, Math.hypot(projectile.vx, projectile.vy));
                const nx = projectile.vx / speed;
                const ny = projectile.vy / speed;
                graphics.strokeColor = projectile.color;
                graphics.lineWidth = 4;
                graphics.moveTo(projectile.x - nx * 7, projectile.y - ny * 7);
                graphics.lineTo(projectile.x + nx * 8, projectile.y + ny * 8);
                graphics.stroke();
            } else {
                const speed = Math.max(1, Math.hypot(projectile.vx, projectile.vy));
                const nx = projectile.vx / speed;
                const ny = projectile.vy / speed;
                graphics.strokeColor = new Color(projectile.color.r, projectile.color.g, projectile.color.b, 100);
                graphics.lineWidth = projectile.owner === 'enemy' ? 2 : 3;
                graphics.moveTo(projectile.x - nx * (projectile.weaponId === 'orb' ? 18 : 12), projectile.y - ny * (projectile.weaponId === 'orb' ? 18 : 12));
                graphics.lineTo(projectile.x, projectile.y);
                graphics.stroke();
                graphics.circle(projectile.x, projectile.y, projectile.radius);
                graphics.fill();
                if (projectile.weaponId === 'orb') {
                    graphics.strokeColor = new Color(projectile.color.r, projectile.color.g, projectile.color.b, 145);
                    graphics.lineWidth = 1.4;
                    graphics.circle(projectile.x, projectile.y, projectile.radius + 5);
                    graphics.stroke();
                }
            }
        }

        for (const zone of this._controlZones) {
            const progress = 1 - zone.ttl / Math.max(0.001, zone.duration);
            const pulse = 1 + Math.sin(progress * Math.PI * 8) * 0.045;
            graphics.fillColor = new Color(zone.color.r, zone.color.g, zone.color.b, Math.max(28, Math.round(zone.color.a * 0.5)));
            graphics.circle(zone.x, zone.y, zone.radius * pulse);
            graphics.fill();
            graphics.strokeColor = new Color(210, 180, 255, 150);
            graphics.lineWidth = 2;
            graphics.circle(zone.x, zone.y, zone.radius * pulse);
            graphics.stroke();
        }

        for (const pulse of this._vfxPulses) {
            const progress = 1 - pulse.ttl / Math.max(0.001, pulse.duration);
            const radius = pulse.radius + (pulse.maxRadius - pulse.radius) * progress;
            const alpha = Math.max(0, Math.round(pulse.color.a * (1 - progress)));
            graphics.strokeColor = new Color(pulse.color.r, pulse.color.g, pulse.color.b, alpha);
            graphics.lineWidth = pulse.lineWidth;
            graphics.circle(pulse.x, pulse.y, radius);
            graphics.stroke();
        }

        for (const shard of this._impactShards) {
            const progress = 1 - shard.ttl / Math.max(0.001, shard.duration);
            const alpha = Math.max(0, Math.round(shard.color.a * (1 - progress)));
            graphics.fillColor = new Color(shard.color.r, shard.color.g, shard.color.b, alpha);
            this._diamond(graphics, shard.x, shard.y, shard.size * (1 + progress * 0.8), true);
        }

        this._drawPlayerStatusBars(graphics);
        this._drawBossHealthBar(graphics);

        for (const enemy of this._run.wave.enemies) {
            if (!enemy.alive) continue;

            const position = this._enemyPositions.get(enemy.id);
            if (!position) continue;

            const archetype = ENEMY_ARCHETYPES[position.type];
            this._drawEnemyWarning(graphics, position, archetype.radius);
            if (position.spawnTimer > 0) {
                const progress = 1 - position.spawnTimer / 0.34;
                graphics.strokeColor = new Color(180, 220, 255, Math.round(155 * (1 - progress)));
                graphics.lineWidth = 2;
                graphics.circle(position.x, position.y, archetype.radius + 18 - progress * 9);
                graphics.stroke();
            }

            const usesRuntimeSprite = this._enemySpriteFrames.has(position.type)
                || (position.type === 'chaser' && !!this._voidChaserSpriteFrame)
                || (position.type === 'tank' && !!this._coreTankSpriteFrame);
            if (usesRuntimeSprite) {
                this._drawEnemySpriteBacking(graphics, position, archetype.radius);
            } else {
                this._drawEnemyModel(graphics, position, archetype.radius, enemy);
            }
            this._drawEnemyHpBar(graphics, enemy, position, archetype.radius);
        }

        if (this._syncArenaPlayerSprite()) {
            this._drawPlayerSpriteBacking(graphics, this._playerX, this._playerY, this._shieldTimer > 0);
        } else {
            this._drawPlayerModel(graphics, this._playerX, this._playerY, 1.16, this._shieldTimer > 0);
        }

    }

    private _drawLoadoutPreview(): void {
        const graphics = this._loadoutPreviewGraphics;
        if (!graphics) return;

        graphics.clear();
        graphics.fillColor = new Color(14, 19, 32, 255);
        graphics.roundRect(-139, -133, 278, 266, 8);
        graphics.fill();
        graphics.fillColor = new Color(32, 42, 63, 155);
        graphics.roundRect(-118, -102, 236, 28, 6);
        graphics.fill();
        graphics.strokeColor = new Color(92, 120, 158, 190);
        graphics.lineWidth = 2;
        graphics.roundRect(-139, -133, 278, 266, 8);
        graphics.stroke();

        if (!this._syncLoadoutPreviewSprite()) {
            this._drawPlayerModel(graphics, -8, -22, 3.35, false);
        }
    }

    private _syncArenaPlayerSprite(): boolean {
        const node = this._arenaPlayerSpriteNode;
        const sprite = this._arenaPlayerSprite;
        const frame = this._heroSpriteFrames.get(this._selectedProfessionId) ?? sprite?.spriteFrame ?? null;
        const active = this._state === GameState.Battle
            && !!this._run
            && !!frame;

        if (!node) return false;
        node.active = active;
        if (!active) return false;

        if (sprite && frame) sprite.spriteFrame = frame;
        const actionProgress = this._weaponActionKind !== 'none'
            ? 1 - this._weaponActionTimer / Math.max(0.001, this._weaponActionDuration)
            : 1;
        const actionPower = this._weaponActionKind !== 'none'
            ? Math.sin(Math.min(1, Math.max(0, actionProgress)) * Math.PI)
            : 0;
        const scale = 1 + actionPower * 0.045;
        const facingScale = this._facingX < -0.08 ? -scale : scale;
        node.setPosition(this._playerX, this._playerY, 0);
        node.setScale(facingScale, scale, 1);
        return true;
    }

    private _syncLoadoutPreviewSprite(): boolean {
        const node = this._loadoutPreviewSpriteNode;
        const sprite = this._loadoutPreviewSprite;
        // Prefer bust portrait on the title loadout card; fall back to battle sprite.
        const frame = this._portraitSpriteFrames.get(this._selectedProfessionId)
            ?? this._heroSpriteFrames.get(this._selectedProfessionId)
            ?? sprite?.spriteFrame
            ?? null;
        const active = !!frame;

        if (!node) return false;
        node.active = active;
        if (active) {
            if (sprite && frame) sprite.spriteFrame = frame;
            node.setPosition(-8, -14, 0);
            node.setScale(1, 1, 1);
        }
        return active;
    }

    private _drawPlayerSpriteBacking(graphics: Graphics, x: number, y: number, shielded: boolean): void {
        graphics.fillColor = new Color(0, 0, 0, 72);
        graphics.ellipse(x - 1, y - 22, 25, 8);
        graphics.fill();

        if (shielded) {
            graphics.strokeColor = new Color(120, 224, 255, 190);
            graphics.lineWidth = 3;
            graphics.circle(x, y, PLAYER_RADIUS + 11);
            graphics.stroke();
        }
    }

    private _syncArenaMapSprite(): boolean {
        const node = this._arenaMapSpriteNode;
        const sprite = this._arenaMapSprite;
        // Prefer floor-themed map when in a run.
        if (sprite && this._run) {
            const floor = Math.min(4, Math.max(1, getWavePlan(this._run.wave.wave).floor));
            const floorFrame = this._floorMapFrames.get(floor) ?? this._floorMapFrames.get(1) ?? null;
            if (floorFrame) sprite.spriteFrame = floorFrame;
        }
        const active = !!sprite?.spriteFrame;

        if (!node) return false;
        node.active = active;
        if (active) {
            node.setPosition(0, 0, 0);
            node.setScale(1, 1, 1);
        }
        return active;
    }

    private _hideEnemySprites(): void {
        this._voidChaserSpriteNodes.forEach((node) => {
            node.active = false;
        });
        this._coreTankSpriteNodes.forEach((node) => {
            node.active = false;
        });
        this._enemySpritePools.forEach((nodes) => {
            nodes.forEach((node) => {
                node.active = false;
            });
        });
        this._summonSpriteNodes.forEach((node) => {
            node.active = false;
        });
    }

    private _bossSpriteForCurrentFloor(): SpriteFrame | null {
        if (!this._run) return this._enemySpriteFrames.get('boss') ?? null;
        const floor = Math.min(4, Math.max(1, getWavePlan(this._run.wave.wave).floor));
        return this._bossSpriteByFloor.get(floor)
            ?? this._bossSpriteByFloor.get(1)
            ?? this._enemySpriteFrames.get('boss')
            ?? null;
    }

    private _syncTypedEnemySprites(): void {
        if (!this._run || !this._enemySpriteLayer) return;

        // Types already handled by dedicated legacy pools.
        const skip = new Set<RuntimeEnemyType>(['chaser', 'tank']);
        const byType = new Map<RuntimeEnemyType, EnemyPosition[]>();
        for (const enemy of this._run.wave.enemies) {
            if (!enemy.alive) continue;
            const position = this._enemyPositions.get(enemy.id);
            if (!position || skip.has(position.type)) continue;
            const hasFrame = position.type === 'boss'
                ? !!this._bossSpriteForCurrentFloor()
                : this._enemySpriteFrames.has(position.type);
            if (!hasFrame) continue;
            const list = byType.get(position.type) ?? [];
            list.push(position);
            byType.set(position.type, list);
        }

        byType.forEach((positions, type) => {
            const frame = type === 'boss'
                ? this._bossSpriteForCurrentFloor()
                : this._enemySpriteFrames.get(type) ?? null;
            if (!frame) return;
            let pool = this._enemySpritePools.get(type);
            if (!pool) {
                pool = [];
                this._enemySpritePools.set(type, pool);
            }
            const size = type === 'boss' ? 110 : type === 'swarm' ? 42 : 72;
            while (pool.length < positions.length) {
                const index = pool.length;
                const node = this._panel(`EnemySprite_${type}_${index}`, this._enemySpriteLayer!, size, size, 0, 0);
                const sprite = node.addComponent(Sprite);
                sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                sprite.spriteFrame = frame;
                node.active = false;
                pool.push(node);
            }
            const elapsed = this._run!.wave.elapsedSeconds;
            positions.forEach((position, index) => {
                const node = pool![index];
                const sprite = node.getComponent(Sprite);
                const spawnScale = position.spawnTimer > 0 ? 0.8 + (1 - position.spawnTimer / 0.34) * 0.2 : 1;
                const pulse = 1 + Math.sin(elapsed * 5 + index) * 0.02;
                const scale = spawnScale * pulse * (type === 'boss' ? 1.15 : 1);
                const facingScale = this._playerX < position.x ? -scale : scale;
                const alpha = Math.round(255 * Math.max(0.25, spawnScale));
                node.active = true;
                node.setPosition(position.x, position.y, 0);
                node.setScale(facingScale, scale, 1);
                if (sprite) {
                    sprite.spriteFrame = frame;
                    sprite.color = position.hitFlashTimer > 0
                        ? new Color(255, 180, 190, alpha)
                        : new Color(255, 255, 255, alpha);
                }
            });
            for (let i = positions.length; i < pool.length; i += 1) {
                pool[i].active = false;
            }
        });
    }

    private _syncVoidChaserSprites(): void {
        if (!this._run || !this._enemySpriteLayer || !this._voidChaserSpriteFrame) return;

        const chasers = this._run.wave.enemies
            .filter((enemy) => enemy.alive)
            .map((enemy) => ({ enemy, position: this._enemyPositions.get(enemy.id) }))
            .filter((entry): entry is { enemy: RunEnemyModel; position: EnemyPosition } => !!entry.position && entry.position.type === 'chaser');

        while (this._voidChaserSpriteNodes.length < chasers.length) {
            const index = this._voidChaserSpriteNodes.length;
            const node = this._panel(`VoidChaserSprite${index}`, this._enemySpriteLayer, 62, 62, 0, 0);
            const sprite = node.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.spriteFrame = this._voidChaserSpriteFrame;
            node.active = false;
            this._voidChaserSpriteNodes.push(node);
        }

        const elapsed = this._run.wave.elapsedSeconds;
        chasers.forEach(({ position }, index) => {
            const node = this._voidChaserSpriteNodes[index];
            const sprite = node.getComponent(Sprite);
            const spawnScale = position.spawnTimer > 0 ? 0.8 + (1 - position.spawnTimer / 0.34) * 0.2 : 1;
            const pulse = 1 + Math.sin(elapsed * 8 + index * 1.7) * 0.025;
            const scale = spawnScale * pulse;
            const facingScale = this._playerX < position.x ? -scale : scale;
            const alpha = Math.round(255 * Math.max(0.25, spawnScale));

            node.active = true;
            node.setPosition(position.x, position.y, 0);
            node.setScale(facingScale, scale, 1);
            if (sprite) {
                sprite.spriteFrame = this._voidChaserSpriteFrame;
                sprite.color = position.hitFlashTimer > 0
                    ? new Color(255, 176, 190, alpha)
                    : new Color(255, 255, 255, alpha);
            }
        });
    }

    private _syncCoreTankSprites(): void {
        if (!this._run || !this._enemySpriteLayer || !this._coreTankSpriteFrame) return;

        const tanks = this._run.wave.enemies
            .filter((enemy) => enemy.alive)
            .map((enemy) => ({ enemy, position: this._enemyPositions.get(enemy.id) }))
            .filter((entry): entry is { enemy: RunEnemyModel; position: EnemyPosition } => !!entry.position && entry.position.type === 'tank');

        while (this._coreTankSpriteNodes.length < tanks.length) {
            const index = this._coreTankSpriteNodes.length;
            const node = this._panel(`CoreTankSprite${index}`, this._enemySpriteLayer, 90, 90, 0, 0);
            const sprite = node.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.spriteFrame = this._coreTankSpriteFrame;
            node.active = false;
            this._coreTankSpriteNodes.push(node);
        }

        const elapsed = this._run.wave.elapsedSeconds;
        tanks.forEach(({ position }, index) => {
            const node = this._coreTankSpriteNodes[index];
            const sprite = node.getComponent(Sprite);
            const spawnScale = position.spawnTimer > 0 ? 0.8 + (1 - position.spawnTimer / 0.34) * 0.2 : 1;
            const pulse = 1 + Math.sin(elapsed * 3.2 + index * 1.3) * 0.012;
            const scale = spawnScale * pulse;
            const facingScale = this._playerX < position.x ? -scale : scale;
            const alpha = Math.round(255 * Math.max(0.25, spawnScale));

            node.active = true;
            node.setPosition(position.x, position.y, 0);
            node.setScale(facingScale, scale, 1);
            if (sprite) {
                sprite.spriteFrame = this._coreTankSpriteFrame;
                sprite.color = position.hitFlashTimer > 0
                    ? new Color(255, 188, 170, alpha)
                    : new Color(255, 255, 255, alpha);
            }
        });
    }

    private _drawEnemySpriteBacking(graphics: Graphics, position: EnemyPosition, radius: number): void {
        const spawnScale = position.spawnTimer > 0 ? 0.8 + (1 - position.spawnTimer / 0.34) * 0.2 : 1;
        const visualRadius = this._enemyVisualRadius(position.type, radius) * spawnScale;
        graphics.fillColor = new Color(0, 0, 0, 58);
        graphics.ellipse(position.x, position.y - visualRadius * 0.95, visualRadius * 1.45, visualRadius * 0.32);
        graphics.fill();
    }

    private _drawPlayerModel(graphics: Graphics, x: number, y: number, scale: number, shielded: boolean): void {
        const loadout = this._getLoadoutSpec();
        const weapon = this._getWeaponSpec();
        const facingLength = Math.max(0.001, Math.hypot(this._facingX, this._facingY));
        const fx = this._facingX / facingLength;
        const fy = this._facingY / facingLength;
        const px = -fy;
        const py = fx;
        const bodyRadius = PLAYER_RADIUS * scale;
        const pulse = Math.sin((this._run?.wave.elapsedSeconds ?? this._uiTimer) * 4) * scale;
        const actionProgress = this._weaponActionKind === weapon.id
            ? 1 - this._weaponActionTimer / Math.max(0.001, this._weaponActionDuration)
            : 1;
        const actionPower = this._weaponActionKind === weapon.id ? Math.sin(Math.min(1, Math.max(0, actionProgress)) * Math.PI) : 0;
        const brace = actionPower * scale;

        if (shielded) {
            graphics.strokeColor = new Color(120, 224, 255, 190);
            graphics.lineWidth = 3;
            graphics.circle(x, y, bodyRadius + 8 * scale);
            graphics.stroke();
        }

        graphics.fillColor = new Color(0, 0, 0, 72);
        graphics.ellipse(x - 1 * scale, y - 19 * scale, 20 * scale, 7 * scale);
        graphics.fill();

        graphics.fillColor = new Color(7, 10, 18, 210);
        graphics.moveTo(x - 15 * scale, y + 3 * scale);
        graphics.lineTo(x - 26 * scale, y - 20 * scale);
        graphics.lineTo(x - 8 * scale, y - 27 * scale);
        graphics.lineTo(x, y - 14 * scale);
        graphics.lineTo(x + 8 * scale, y - 27 * scale);
        graphics.lineTo(x + 26 * scale, y - 20 * scale);
        graphics.lineTo(x + 15 * scale, y + 3 * scale);
        graphics.close();
        graphics.fill();

        this._drawWeaponModel(graphics, x, y, scale, fx, fy, px, py, weapon, actionPower);

        graphics.fillColor = new Color(9, 12, 20, 255);
        graphics.roundRect(x - 13 * scale, y - 17 * scale, 26 * scale, 34 * scale, 6 * scale);
        graphics.fill();

        graphics.fillColor = new Color(Math.max(0, loadout.bodyColor.r - 34), Math.max(0, loadout.bodyColor.g - 34), Math.max(0, loadout.bodyColor.b - 34), 255);
        graphics.roundRect(x - 9 * scale, y - 16 * scale, 18 * scale, 29 * scale, 5 * scale);
        graphics.fill();

        graphics.fillColor = new Color(Math.min(255, loadout.bodyColor.r + 18), Math.min(255, loadout.bodyColor.g + 18), Math.min(255, loadout.bodyColor.b + 18), 230);
        graphics.moveTo(x - 7 * scale, y + 11 * scale);
        graphics.lineTo(x, y + 16 * scale);
        graphics.lineTo(x + 7 * scale, y + 11 * scale);
        graphics.lineTo(x + 5 * scale, y - 13 * scale);
        graphics.lineTo(x, y - 16 * scale);
        graphics.lineTo(x - 5 * scale, y - 13 * scale);
        graphics.close();
        graphics.fill();

        graphics.fillColor = new Color(16, 20, 30, 245);
        graphics.roundRect(x - 11 * scale, y - 7 * scale, 22 * scale, 4.5 * scale, 2 * scale);
        graphics.fill();
        graphics.fillColor = loadout.trimColor;
        graphics.roundRect(x - 4 * scale, y - 7.5 * scale, 8 * scale, 5 * scale, 1.5 * scale);
        graphics.fill();

        graphics.strokeColor = new Color(8, 12, 20, 210);
        graphics.lineWidth = 3.2 * scale;
        graphics.moveTo(x - 11 * scale, y + 4 * scale);
        graphics.lineTo(x - 19 * scale + px * brace * 1.6, y - 9 * scale + py * brace * 1.6);
        graphics.moveTo(x + 11 * scale, y + 4 * scale);
        graphics.lineTo(x + 19 * scale - px * brace * 1.6, y - 9 * scale - py * brace * 1.6);
        graphics.stroke();
        graphics.strokeColor = loadout.trimColor;
        graphics.lineWidth = 1.2 * scale;
        graphics.moveTo(x - 14 * scale, y + 2 * scale);
        graphics.lineTo(x - 21 * scale + px * brace * 1.6, y - 10 * scale + py * brace * 1.6);
        graphics.moveTo(x + 14 * scale, y + 2 * scale);
        graphics.lineTo(x + 21 * scale - px * brace * 1.6, y - 10 * scale - py * brace * 1.6);
        graphics.stroke();

        graphics.strokeColor = new Color(236, 244, 255, 118);
        graphics.lineWidth = 1.1 * scale;
        graphics.moveTo(x - 7 * scale, y + 9 * scale);
        graphics.lineTo(x + 7 * scale, y + 9 * scale);
        graphics.moveTo(x - 8 * scale, y + 2 * scale);
        graphics.lineTo(x + 8 * scale, y + 2 * scale);
        graphics.moveTo(x - 6 * scale, y - 7 * scale);
        graphics.lineTo(x + 6 * scale, y - 7 * scale);
        graphics.stroke();

        graphics.fillColor = new Color(238, 244, 255, 235);
        graphics.roundRect(x - 7 * scale, y - 3 * scale, 14 * scale, 14 * scale, 3 * scale);
        graphics.fill();
        graphics.fillColor = loadout.trimColor;
        this._hex(graphics, x, y + 4 * scale, 4.5 * scale, true);

        if (loadout.silhouette === 'duelist') {
            graphics.roundRect(x - 17 * scale + fx * brace * 2, y - 7 * scale + fy * brace * 2, 34 * scale, 8 * scale, 3 * scale);
            graphics.fill();
            graphics.fillColor = new Color(22, 28, 42, 245);
            graphics.roundRect(x - 20 * scale + px * brace, y - 9 * scale + py * brace, 8 * scale, 15 * scale, 3 * scale);
            graphics.roundRect(x + 12 * scale - px * brace, y - 9 * scale - py * brace, 8 * scale, 15 * scale, 3 * scale);
            graphics.fill();
            graphics.fillColor = loadout.trimColor;
            graphics.roundRect(x - 5 * scale, y + 12 * scale, 10 * scale, 5 * scale, 2 * scale);
            graphics.fill();
            graphics.strokeColor = loadout.trimColor;
            graphics.lineWidth = 1.5 * scale;
            graphics.moveTo(x - 19 * scale, y + 2 * scale);
            graphics.lineTo(x - 29 * scale, y + 13 * scale);
            graphics.moveTo(x + 19 * scale, y + 2 * scale);
            graphics.lineTo(x + 29 * scale, y + 13 * scale);
            graphics.stroke();
            graphics.fillColor = new Color(138, 42, 48, 215);
            graphics.moveTo(x - 10 * scale, y - 14 * scale);
            graphics.lineTo(x - 24 * scale, y - 30 * scale);
            graphics.lineTo(x - 5 * scale, y - 24 * scale);
            graphics.close();
            graphics.moveTo(x + 10 * scale, y - 14 * scale);
            graphics.lineTo(x + 24 * scale, y - 30 * scale);
            graphics.lineTo(x + 5 * scale, y - 24 * scale);
            graphics.close();
            graphics.fill();
        } else if (loadout.silhouette === 'pirate') {
            graphics.fillColor = new Color(18, 32, 54, 245);
            graphics.moveTo(x - 23 * scale, y + 7 * scale);
            graphics.lineTo(x - 32 * scale, y - 25 * scale);
            graphics.lineTo(x - 8 * scale, y - 33 * scale);
            graphics.lineTo(x, y - 16 * scale);
            graphics.lineTo(x + 8 * scale, y - 33 * scale);
            graphics.lineTo(x + 32 * scale, y - 25 * scale);
            graphics.lineTo(x + 23 * scale, y + 7 * scale);
            graphics.close();
            graphics.fill();
            graphics.fillColor = new Color(128, 34, 42, 245);
            graphics.roundRect(x - 16 * scale, y + 10 * scale, 32 * scale, 5 * scale, 2 * scale);
            graphics.fill();
            graphics.fillColor = loadout.trimColor;
            for (let i = -2; i <= 2; i += 1) {
                graphics.circle(x + i * 6 * scale, y - 5 * scale, 2 * scale);
            }
            graphics.fill();
            graphics.strokeColor = loadout.trimColor;
            graphics.lineWidth = 1.5 * scale;
            graphics.moveTo(x - 22 * scale, y + 1 * scale);
            graphics.lineTo(x - 34 * scale, y + 11 * scale);
            graphics.moveTo(x + 22 * scale, y + 1 * scale);
            graphics.lineTo(x + 34 * scale, y + 11 * scale);
            graphics.stroke();
        } else if (loadout.silhouette === 'sharpshooter') {
            graphics.moveTo(x - 18 * scale - px * brace, y - 7 * scale - py * brace);
            graphics.lineTo(x - 4 * scale, y + 15 * scale);
            graphics.lineTo(x + 17 * scale + px * brace, y - 5 * scale + py * brace);
            graphics.lineTo(x + 5 * scale, y - 13 * scale);
            graphics.close();
            graphics.fill();
            graphics.fillColor = new Color(22, 28, 36, 240);
            graphics.roundRect(x - 10 * scale, y + 8 * scale, 20 * scale, 5 * scale, 2 * scale);
            graphics.fill();
            graphics.fillColor = loadout.trimColor;
            graphics.circle(x - 12 * scale, y - 1 * scale, 2.2 * scale);
            graphics.circle(x + 13 * scale, y - 3 * scale, 2.2 * scale);
            graphics.fill();
            graphics.strokeColor = new Color(220, 255, 226, 145);
            graphics.lineWidth = 1.2 * scale;
            graphics.moveTo(x - 22 * scale, y + 9 * scale);
            graphics.lineTo(x - 8 * scale, y + 17 * scale);
            graphics.moveTo(x + 22 * scale, y + 7 * scale);
            graphics.lineTo(x + 7 * scale, y + 17 * scale);
            graphics.stroke();
        } else {
            graphics.circle(x, y + 1 * scale, 15 * scale);
            graphics.fill();
            graphics.strokeColor = new Color(235, 224, 255, 180);
            graphics.lineWidth = 2 * scale;
            graphics.circle(x, y + 1 * scale, 21 * scale + pulse + actionPower * 5 * scale);
            graphics.stroke();
            graphics.strokeColor = loadout.trimColor;
            graphics.circle(x - 15 * scale, y + 11 * scale, 5 * scale);
            graphics.circle(x + 15 * scale, y + 8 * scale, 4 * scale);
            graphics.circle(x, y - 15 * scale, 3.5 * scale);
            graphics.stroke();
        }

        graphics.fillColor = new Color(238, 244, 255, 255);
        graphics.circle(x + fx * 4 * scale, y + 16 * scale + fy * 2 * scale, 7 * scale);
        graphics.fill();
        graphics.fillColor = new Color(16, 22, 34, 255);
        graphics.moveTo(x + fx * 4 * scale - 8 * scale, y + 18 * scale + fy * 2 * scale);
        graphics.lineTo(x + fx * 4 * scale, y + 27 * scale + fy * 3 * scale);
        graphics.lineTo(x + fx * 4 * scale + 8 * scale, y + 18 * scale + fy * 2 * scale);
        graphics.close();
        graphics.fill();
        graphics.fillColor = weapon.color;
        graphics.roundRect(x + fx * 4 * scale - 5 * scale, y + 15 * scale + fy * 2 * scale, 10 * scale, 3 * scale, 1 * scale);
        graphics.fill();

        graphics.fillColor = new Color(10, 14, 24, 255);
        graphics.roundRect(x - 12 * scale, y - 32 * scale, 7 * scale, 9 * scale, 2 * scale);
        graphics.roundRect(x + 5 * scale, y - 32 * scale, 7 * scale, 9 * scale, 2 * scale);
        graphics.fill();
        graphics.fillColor = loadout.trimColor;
        graphics.roundRect(x - 12 * scale, y - 25 * scale, 7 * scale, 2 * scale, 1 * scale);
        graphics.roundRect(x + 5 * scale, y - 25 * scale, 7 * scale, 2 * scale, 1 * scale);
        graphics.fill();

        graphics.strokeColor = new Color(238, 244, 255, 160);
        graphics.lineWidth = 1.2 * scale;
        graphics.moveTo(x - 7 * scale, y - 19 * scale);
        graphics.lineTo(x - 10 * scale, y - 31 * scale);
        graphics.moveTo(x + 7 * scale, y - 19 * scale);
        graphics.lineTo(x + 10 * scale, y - 31 * scale);
        graphics.stroke();
    }

    private _drawWeaponModel(
        graphics: Graphics,
        x: number,
        y: number,
        scale: number,
        fx: number,
        fy: number,
        px: number,
        py: number,
        weapon: WeaponSpec,
        actionPower: number,
    ): void {
        graphics.strokeColor = weapon.color;
        graphics.fillColor = weapon.color;
        if (weapon.id === 'blade') {
            const sweep = actionPower * 18 * scale;
            graphics.lineWidth = 5 * scale;
            graphics.moveTo(x + px * 9 * scale - fx * 4 * scale, y + py * 9 * scale - fy * 4 * scale);
            graphics.lineTo(x + fx * 36 * scale + px * (17 * scale + sweep), y + fy * 36 * scale + py * (17 * scale + sweep));
            graphics.moveTo(x - px * 8 * scale - fx * 4 * scale, y - py * 8 * scale - fy * 4 * scale);
            graphics.lineTo(x + fx * 30 * scale - px * (15 * scale + sweep * 0.72), y + fy * 30 * scale - py * (15 * scale + sweep * 0.72));
            graphics.stroke();
            if (actionPower > 0.05) {
                graphics.strokeColor = new Color(255, 246, 188, Math.round(180 * actionPower));
                graphics.lineWidth = 2.5 * scale;
                graphics.moveTo(x + fx * 15 * scale - px * 31 * scale, y + fy * 15 * scale - py * 31 * scale);
                graphics.lineTo(x + fx * 42 * scale + px * 31 * scale, y + fy * 42 * scale + py * 31 * scale);
                graphics.stroke();
            }
            graphics.fillColor = new Color(255, 246, 188, 210);
            this._diamond(graphics, x + fx * 34 * scale + px * (17 * scale + sweep), y + fy * 34 * scale + py * (17 * scale + sweep), 5 * scale, true);
            this._diamond(graphics, x + fx * 28 * scale - px * (15 * scale + sweep * 0.72), y + fy * 28 * scale - py * (15 * scale + sweep * 0.72), 4 * scale, true);
            return;
        }

        if (weapon.id === 'spear') {
            const recoil = actionPower * -8 * scale;
            const muzzle = actionPower * 10 * scale;
            graphics.strokeColor = new Color(35, 27, 23, 255);
            graphics.lineWidth = 9 * scale;
            graphics.moveTo(x - fx * 14 * scale + px * 6 * scale, y - fy * 14 * scale + py * 6 * scale);
            graphics.lineTo(x + fx * (42 * scale + recoil) + px * 6 * scale, y + fy * (42 * scale + recoil) + py * 6 * scale);
            graphics.stroke();
            graphics.strokeColor = new Color(212, 158, 76, 255);
            graphics.lineWidth = 4 * scale;
            graphics.moveTo(x - fx * 10 * scale + px * 6 * scale, y - fy * 10 * scale + py * 6 * scale);
            graphics.lineTo(x + fx * (36 * scale + recoil) + px * 6 * scale, y + fy * (36 * scale + recoil) + py * 6 * scale);
            graphics.stroke();
            graphics.fillColor = new Color(45, 56, 68, 255);
            graphics.roundRect(x + fx * (31 * scale + recoil) + px * 6 * scale - 6 * scale, y + fy * (31 * scale + recoil) + py * 6 * scale - 5 * scale, 14 * scale, 10 * scale, 3 * scale);
            graphics.fill();
            if (actionPower > 0.05) {
                graphics.strokeColor = new Color(255, 224, 132, Math.round(160 * actionPower));
                graphics.lineWidth = 2 * scale;
                graphics.moveTo(x + fx * 42 * scale + px * 2 * scale, y + fy * 42 * scale + py * 2 * scale);
                graphics.lineTo(x + fx * (64 * scale + muzzle) + px * 20 * scale, y + fy * (64 * scale + muzzle) + py * 20 * scale);
                graphics.moveTo(x + fx * 42 * scale + px * 2 * scale, y + fy * 42 * scale + py * 2 * scale);
                graphics.lineTo(x + fx * (68 * scale + muzzle) - px * 20 * scale, y + fy * (68 * scale + muzzle) - py * 20 * scale);
                graphics.moveTo(x + fx * 44 * scale + px * 2 * scale, y + fy * 44 * scale + py * 2 * scale);
                graphics.lineTo(x + fx * (76 * scale + muzzle), y + fy * (76 * scale + muzzle));
                graphics.stroke();
                graphics.fillColor = new Color(255, 246, 168, Math.round(220 * actionPower));
                this._diamond(graphics, x + fx * 50 * scale + px * 6 * scale, y + fy * 50 * scale + py * 6 * scale, 7 * scale, true);
            }
            graphics.strokeColor = new Color(238, 202, 116, 220);
            graphics.lineWidth = 1.2 * scale;
            graphics.circle(x - fx * 3 * scale + px * 6 * scale, y - fy * 3 * scale + py * 6 * scale, 4 * scale);
            graphics.stroke();
            return;
        }

        if (weapon.id === 'gun') {
            const recoil = actionPower * -6 * scale;
            const flash = actionPower > 0.05;
            graphics.strokeColor = weapon.color;
            graphics.lineWidth = 6 * scale;
            graphics.moveTo(x + fx * (5 * scale + recoil) - px * 7 * scale, y + fy * (5 * scale + recoil) - py * 7 * scale);
            graphics.lineTo(x + fx * (35 * scale + recoil) - px * 7 * scale, y + fy * (35 * scale + recoil) - py * 7 * scale);
            graphics.moveTo(x + fx * (5 * scale + recoil) + px * 7 * scale, y + fy * (5 * scale + recoil) + py * 7 * scale);
            graphics.lineTo(x + fx * (35 * scale + recoil) + px * 7 * scale, y + fy * (35 * scale + recoil) + py * 7 * scale);
            graphics.stroke();
            graphics.fillColor = new Color(222, 246, 230, 255);
            graphics.roundRect(x + fx * (13 * scale + recoil) - px * 7 * scale - 7 * scale, y + fy * (13 * scale + recoil) - py * 7 * scale - 4 * scale, 14 * scale, 8 * scale, 2 * scale);
            graphics.roundRect(x + fx * (13 * scale + recoil) + px * 7 * scale - 7 * scale, y + fy * (13 * scale + recoil) + py * 7 * scale - 4 * scale, 14 * scale, 8 * scale, 2 * scale);
            graphics.fill();
            if (flash) {
                graphics.fillColor = new Color(255, 246, 148, Math.round(230 * actionPower));
                this._diamond(graphics, x + fx * 43 * scale - px * 7 * scale, y + fy * 43 * scale - py * 7 * scale, 5 * scale, true);
                this._diamond(graphics, x + fx * 43 * scale + px * 7 * scale, y + fy * 43 * scale + py * 7 * scale, 5 * scale, true);
            }
            graphics.fillColor = weapon.color;
            graphics.circle(x - px * 15 * scale, y - py * 15 * scale, 4 * scale);
            graphics.circle(x - px * 21 * scale + fx * 2 * scale, y - py * 21 * scale + fy * 2 * scale, 3 * scale);
            graphics.fill();
            return;
        }

        graphics.strokeColor = weapon.color;
        graphics.lineWidth = 2.5 * scale;
        const orbPulse = actionPower * 8 * scale;
        graphics.circle(x + fx * 29 * scale, y + fy * 29 * scale, 11 * scale + orbPulse * 0.35);
        graphics.circle(x + fx * 29 * scale, y + fy * 29 * scale, 17 * scale + orbPulse);
        graphics.stroke();
        if (actionPower > 0.05) {
            graphics.strokeColor = new Color(238, 232, 255, Math.round(190 * actionPower));
            graphics.lineWidth = 1.5 * scale;
            graphics.circle(x + fx * 18 * scale - px * 15 * scale, y + fy * 18 * scale - py * 15 * scale, 6 * scale + orbPulse * 0.25);
            graphics.circle(x + fx * 18 * scale + px * 15 * scale, y + fy * 18 * scale + py * 15 * scale, 6 * scale + orbPulse * 0.25);
            graphics.stroke();
        }
        graphics.fillColor = new Color(238, 232, 255, 230);
        this._hex(graphics, x + fx * 29 * scale, y + fy * 29 * scale, 5 * scale, true);
        graphics.fill();
    }

    private _hex(graphics: Graphics, x: number, y: number, radius: number, fill: boolean): void {
        for (let i = 0; i < 6; i += 1) {
            const angle = Math.PI / 6 + (Math.PI * 2 * i) / 6;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) graphics.moveTo(px, py);
            else graphics.lineTo(px, py);
        }
        graphics.close();
        if (fill) graphics.fill();
        else graphics.stroke();
    }

    private _diamond(graphics: Graphics, x: number, y: number, radius: number, fill: boolean): void {
        graphics.moveTo(x, y + radius);
        graphics.lineTo(x + radius, y);
        graphics.lineTo(x, y - radius);
        graphics.lineTo(x - radius, y);
        graphics.close();
        if (fill) graphics.fill();
        else graphics.stroke();
    }

    private _drawEnemyHpBar(graphics: Graphics, enemy: RunEnemyModel, position: EnemyPosition, radius: number): void {
        if (enemy.rank === 'normal' && enemy.hp >= enemy.maxHp) return;

        const visualRadius = this._enemyVisualRadius(position.type, radius);
        const width = enemy.rank === 'boss' ? 96 : 38;
        const y = position.y + visualRadius + 10;
        const ratio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
        graphics.fillColor = new Color(38, 42, 54, 230);
        graphics.roundRect(position.x - width / 2, y, width, 4, 2);
        graphics.fill();
        graphics.fillColor = enemy.rank === 'boss' ? new Color(244, 63, 94, 240) : new Color(94, 234, 212, 230);
        graphics.roundRect(position.x - width / 2, y, width * ratio, 4, 2);
        graphics.fill();
    }

    private _drawBossHealthBar(graphics: Graphics): void {
        if (!this._run) return;

        const boss = this._run.wave.enemies.find((enemy) => enemy.alive && enemy.rank === 'boss');
        if (!boss) return;

        const ratio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
        const width = ARENA_WIDTH - 86;
        const x = -width / 2;
        const y = ARENA_HALF_HEIGHT - 15;
        graphics.fillColor = new Color(28, 20, 34, 235);
        graphics.roundRect(x, y, width, 8, 4);
        graphics.fill();
        graphics.fillColor = new Color(226, 66, 98, 245);
        graphics.roundRect(x, y, width * ratio, 8, 4);
        graphics.fill();
        graphics.strokeColor = new Color(255, 184, 202, 150);
        graphics.lineWidth = 1;
        graphics.roundRect(x, y, width, 8, 4);
        graphics.stroke();
    }

    private _drawPlayerStatusBars(graphics: Graphics): void {
        if (!this._run || this._state !== GameState.Battle) return;

        const hpRatio = Math.max(0, Math.min(1, this._run.player.hp / Math.max(1, this._run.player.maxHp)));
        const xpRatio = Math.max(0, Math.min(1, this._run.stats.xp / Math.max(1, this._run.stats.xpToNext)));
        const energyRatio = Math.max(0, Math.min(1, this._run.player.energy / MAX_ULTIMATE_ENERGY));
        const x = -ARENA_HALF_WIDTH + 20;
        const y = ARENA_HALF_HEIGHT - 34;
        const width = this._statusBarWidth;
        const hasHpSkin = !!(this._hpBarFillSprite?.spriteFrame);
        const hasEnergySkin = !!(this._energyBarFillSprite?.spriteFrame);

        if (this._statusBarRoot) this._statusBarRoot.active = true;
        if (hasHpSkin && this._hpBarFillSprite) {
            this._hpBarFillSprite.node.active = true;
            this._hpBarFillSprite.node.getComponent(UITransform)?.setContentSize(
                Math.max(4, width * hpRatio),
                8,
            );
            // Left-align fill under the frame center.
            this._hpBarFillSprite.node.setPosition(-(width * (1 - hpRatio)) / 2, 6, 0);
            if (this._hpBarFrameSprite?.spriteFrame) {
                this._hpBarFrameSprite.node.active = true;
            }
        }
        if (hasEnergySkin && this._energyBarFillSprite) {
            this._energyBarFillSprite.node.active = true;
            this._energyBarFillSprite.node.getComponent(UITransform)?.setContentSize(
                Math.max(3, width * energyRatio),
                6,
            );
            this._energyBarFillSprite.node.setPosition(-(width * (1 - energyRatio)) / 2, -6, 0);
            this._energyBarFillSprite.color = energyRatio >= 1
                ? new Color(255, 230, 255, 255)
                : new Color(210, 190, 255, 255);
        }

        // Always keep XP as graphics; HP/energy fall back to graphics when skins missing.
        graphics.fillColor = new Color(10, 14, 22, 210);
        graphics.roundRect(x - 8, y - 10, width + 16, 24, 6);
        graphics.fill();

        if (!hasHpSkin) {
            graphics.fillColor = new Color(52, 62, 78, 255);
            graphics.roundRect(x, y, width, 7, 3);
            graphics.fill();
            graphics.fillColor = new Color(255, 92, 116, 245);
            graphics.roundRect(x, y, width * hpRatio, 7, 3);
            graphics.fill();
        }

        graphics.fillColor = new Color(52, 62, 78, 210);
        graphics.roundRect(x, y - 8, width, 4, 2);
        graphics.fill();
        graphics.fillColor = new Color(255, 218, 110, 230);
        graphics.roundRect(x, y - 8, width * xpRatio, 4, 2);
        graphics.fill();

        if (!hasEnergySkin) {
            graphics.fillColor = new Color(52, 62, 78, 210);
            graphics.roundRect(x, y - 14, width, 4, 2);
            graphics.fill();
            graphics.fillColor = energyRatio >= 1
                ? new Color(210, 150, 255, 245)
                : new Color(140, 110, 220, 230);
            graphics.roundRect(x, y - 14, width * energyRatio, 4, 2);
            graphics.fill();
        }
    }

    private _drawEnemyWarning(graphics: Graphics, position: EnemyPosition, radius: number): void {
        if (position.warningTimer <= 0) return;

        const type = position.type;
        const warningTotal = type === 'dasher' ? DASH_WINDUP_SECONDS : type === 'boss' ? 0.68 : type === 'spitter' ? 0.18 : 0.36;
        const progress = 1 - position.warningTimer / Math.max(0.001, warningTotal);
        const dx = this._playerX - position.x;
        const dy = this._playerY - position.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const nx = dx / distance;
        const ny = dy / distance;
        const px = -ny;
        const py = nx;
        const alpha = Math.round(120 + progress * 100);

        if (type === 'dasher') {
            const laneLength = Math.min(distance + 44, 220);
            const laneWidth = radius * (1.2 + progress * 0.42);
            graphics.fillColor = new Color(255, 86, 126, 34 + Math.round(progress * 28));
            graphics.moveTo(position.x + px * laneWidth, position.y + py * laneWidth);
            graphics.lineTo(position.x + nx * laneLength + px * laneWidth * 0.35, position.y + ny * laneLength + py * laneWidth * 0.35);
            graphics.lineTo(position.x + nx * laneLength - px * laneWidth * 0.35, position.y + ny * laneLength - py * laneWidth * 0.35);
            graphics.lineTo(position.x - px * laneWidth, position.y - py * laneWidth);
            graphics.close();
            graphics.fill();
            graphics.strokeColor = new Color(255, 224, 120, alpha);
            graphics.lineWidth = 2;
            graphics.moveTo(position.x + px * laneWidth, position.y + py * laneWidth);
            graphics.lineTo(position.x + nx * laneLength, position.y + ny * laneLength);
            graphics.lineTo(position.x - px * laneWidth, position.y - py * laneWidth);
            graphics.stroke();
            return;
        }

        if (type === 'spitter') {
            graphics.strokeColor = new Color(128, 245, 162, alpha);
            graphics.lineWidth = 2;
            graphics.moveTo(position.x, position.y);
            graphics.lineTo(this._playerX, this._playerY);
            graphics.stroke();
            graphics.circle(this._playerX, this._playerY, 12 + progress * 8);
            graphics.stroke();
            graphics.moveTo(this._playerX - 18, this._playerY);
            graphics.lineTo(this._playerX - 7, this._playerY);
            graphics.moveTo(this._playerX + 7, this._playerY);
            graphics.lineTo(this._playerX + 18, this._playerY);
            graphics.moveTo(this._playerX, this._playerY - 18);
            graphics.lineTo(this._playerX, this._playerY - 7);
            graphics.moveTo(this._playerX, this._playerY + 7);
            graphics.lineTo(this._playerX, this._playerY + 18);
            graphics.stroke();
            return;
        }

        if (type === 'binder') {
            graphics.strokeColor = new Color(190, 145, 255, alpha);
            graphics.lineWidth = 2;
            graphics.circle(this._playerX, this._playerY, 28 + progress * 10);
            graphics.circle(this._playerX, this._playerY, 12 + progress * 8);
            graphics.stroke();
            return;
        }

        if (type === 'boss') {
            graphics.strokeColor = new Color(255, 178, 92, alpha);
            graphics.lineWidth = 3;
            graphics.circle(position.x, position.y, radius * (1.8 + progress * 0.45));
            graphics.stroke();
            graphics.lineWidth = 2;
            for (let i = 0; i < 6; i += 1) {
                const angle = (Math.PI * 2 * i) / 6 + progress * 0.35;
                const inner = radius * 1.2;
                const outer = radius * (1.72 + progress * 0.35);
                graphics.moveTo(position.x + Math.cos(angle) * inner, position.y + Math.sin(angle) * inner);
                graphics.lineTo(position.x + Math.cos(angle) * outer, position.y + Math.sin(angle) * outer);
            }
            graphics.stroke();
            return;
        }

        graphics.strokeColor = new Color(255, 210, 76, alpha);
        graphics.lineWidth = 2;
        graphics.moveTo(position.x, position.y);
        graphics.lineTo(this._playerX, this._playerY);
        graphics.stroke();
    }

    private _drawEnemyModel(graphics: Graphics, position: EnemyPosition, radius: number, enemy?: RunEnemyModel): void {
        const baseColor = this._enemyColor(position.type);
        const flash = position.hitFlashTimer > 0 ? Math.min(1, position.hitFlashTimer / 0.14) : 0;
        const color = flash > 0
            ? new Color(
                Math.min(255, Math.round(baseColor.r + (255 - baseColor.r) * flash * 0.72)),
                Math.min(255, Math.round(baseColor.g + (255 - baseColor.g) * flash * 0.72)),
                Math.min(255, Math.round(baseColor.b + (255 - baseColor.b) * flash * 0.72)),
                255,
            )
            : baseColor;
        const x = position.x;
        const y = position.y;
        const warningPulse = position.warningTimer > 0 ? 1.12 : 1;
        const spawnScale = position.spawnTimer > 0 ? 0.8 + (1 - position.spawnTimer / 0.34) * 0.2 : 1;
        radius = this._enemyVisualRadius(position.type, radius) * warningPulse * spawnScale;
        graphics.fillColor = color;
        graphics.strokeColor = new Color(20, 24, 34, 220);
        graphics.lineWidth = 2;

        graphics.fillColor = new Color(0, 0, 0, position.type === 'boss' ? 92 : 58);
        graphics.ellipse(x, y - radius * 0.82, radius * 1.05, radius * 0.28);
        graphics.fill();
        graphics.fillColor = color;

        if (position.type === 'tank') {
            graphics.roundRect(x - radius * 1.25, y - radius * 0.78, radius * 2.5, radius * 1.65, 5);
            graphics.fill();
            graphics.stroke();
            graphics.strokeColor = new Color(255, 228, 158, 100);
            graphics.lineWidth = 1.2;
            for (let i = -1; i <= 1; i += 1) {
                graphics.moveTo(x + i * radius * 0.42, y - radius * 0.72);
                graphics.lineTo(x + i * radius * 0.42, y + radius * 0.76);
            }
            graphics.stroke();
            graphics.fillColor = new Color(92, 54, 36, 230);
            graphics.roundRect(x - radius * 0.95, y - radius * 0.45, radius * 1.9, radius * 0.82, 3);
            graphics.fill();
            graphics.fillColor = new Color(255, 228, 158, 235);
            graphics.roundRect(x - radius * 0.52, y - 3, radius * 1.04, 6, 2);
            graphics.fill();
            graphics.strokeColor = new Color(255, 228, 158, 145);
            graphics.lineWidth = 1.5;
            this._hex(graphics, x - radius * 0.38, y + radius * 0.36, radius * 0.22, false);
            this._hex(graphics, x + radius * 0.38, y + radius * 0.36, radius * 0.22, false);
            graphics.stroke();
            graphics.fillColor = new Color(36, 24, 20, 255);
            graphics.circle(x - radius * 0.72, y - radius * 0.82, radius * 0.16);
            graphics.circle(x + radius * 0.72, y - radius * 0.82, radius * 0.16);
            graphics.fill();
            return;
        }

        if (position.type === 'dasher') {
            graphics.moveTo(x, y + radius * 1.22);
            graphics.lineTo(x + radius * 1.45, y - radius * 0.72);
            graphics.lineTo(x + radius * 0.25, y - radius * 0.28);
            graphics.lineTo(x, y - radius * 1.05);
            graphics.lineTo(x - radius * 0.25, y - radius * 0.28);
            graphics.lineTo(x - radius * 1.45, y - radius * 0.72);
            graphics.close();
            graphics.fill();
            graphics.stroke();
            graphics.fillColor = new Color(255, 226, 92, 230);
            graphics.roundRect(x - radius * 0.12, y - radius * 0.88, radius * 0.24, radius * 1.62, 2);
            graphics.fill();
            graphics.strokeColor = new Color(255, 208, 76, 170);
            graphics.lineWidth = 2;
            graphics.moveTo(x - radius * 1.3, y - radius * 0.55);
            graphics.lineTo(x - radius * 0.22, y + radius * 0.4);
            graphics.moveTo(x + radius * 1.3, y - radius * 0.55);
            graphics.lineTo(x + radius * 0.22, y + radius * 0.4);
            graphics.stroke();
            graphics.fillColor = new Color(28, 22, 36, 245);
            this._diamond(graphics, x, y + radius * 0.22, radius * 0.24, true);
            graphics.strokeColor = new Color(255, 86, 126, 160);
            graphics.lineWidth = 1.4;
            graphics.moveTo(x - radius * 0.42, y + radius * 0.72);
            graphics.lineTo(x, y + radius * 1.1);
            graphics.lineTo(x + radius * 0.42, y + radius * 0.72);
            graphics.stroke();
            return;
        }

        if (position.type === 'spitter') {
            graphics.roundRect(x - radius * 0.92, y - radius * 0.72, radius * 1.84, radius * 1.42, 8);
            graphics.fill();
            graphics.stroke();
            graphics.fillColor = new Color(28, 52, 40, 255);
            graphics.circle(x, y + radius * 0.08, radius * 0.55);
            graphics.fill();
            graphics.fillColor = new Color(128, 245, 162, 240);
            graphics.circle(x, y + radius * 0.08, radius * 0.28);
            graphics.fill();
            graphics.strokeColor = new Color(128, 245, 162, 140);
            graphics.lineWidth = 2;
            graphics.moveTo(x - radius * 0.78, y - radius * 0.32);
            graphics.lineTo(x - radius * 1.12, y - radius * 0.72);
            graphics.moveTo(x + radius * 0.78, y - radius * 0.32);
            graphics.lineTo(x + radius * 1.12, y - radius * 0.72);
            graphics.stroke();
            graphics.fillColor = new Color(64, 132, 88, 230);
            graphics.circle(x - radius * 0.46, y + radius * 0.6, radius * 0.16);
            graphics.circle(x + radius * 0.46, y + radius * 0.6, radius * 0.16);
            graphics.fill();
            graphics.strokeColor = new Color(128, 245, 162, 120);
            graphics.lineWidth = 1.4;
            this._hex(graphics, x, y + radius * 0.08, radius * 0.72, false);
            graphics.moveTo(x, y + radius * 0.63);
            graphics.lineTo(x, y + radius * 1.04);
            graphics.stroke();
            return;
        }

        if (position.type === 'swarm') {
            graphics.circle(x - radius * 0.42, y, radius * 0.7);
            graphics.circle(x + radius * 0.42, y, radius * 0.7);
            graphics.fill();
            graphics.fillColor = new Color(255, 236, 196, 230);
            graphics.circle(x - radius * 0.58, y + radius * 0.12, radius * 0.12);
            graphics.circle(x + radius * 0.58, y + radius * 0.12, radius * 0.12);
            graphics.fill();
            graphics.strokeColor = new Color(255, 190, 122, 160);
            graphics.lineWidth = 1.4;
            graphics.moveTo(x - radius * 0.92, y + radius * 0.52);
            graphics.lineTo(x - radius * 1.25, y + radius * 0.88);
            graphics.moveTo(x + radius * 0.92, y + radius * 0.52);
            graphics.lineTo(x + radius * 1.25, y + radius * 0.88);
            graphics.moveTo(x - radius * 0.78, y - radius * 0.46);
            graphics.lineTo(x - radius * 1.18, y - radius * 0.8);
            graphics.moveTo(x + radius * 0.78, y - radius * 0.46);
            graphics.lineTo(x + radius * 1.18, y - radius * 0.8);
            graphics.stroke();
            return;
        }

        if (position.type === 'binder') {
            graphics.roundRect(x - radius * 0.9, y - radius * 0.68, radius * 1.8, radius * 1.36, 7);
            graphics.fill();
            graphics.stroke();
            graphics.strokeColor = new Color(235, 214, 255, 210);
            graphics.lineWidth = 2.3;
            graphics.circle(x, y, radius * 0.72);
            graphics.circle(x, y, radius * 1.05);
            graphics.stroke();
            graphics.fillColor = new Color(35, 24, 50, 255);
            graphics.circle(x, y, radius * 0.32);
            graphics.fill();
            graphics.fillColor = new Color(235, 214, 255, 230);
            graphics.circle(x - radius * 0.95, y + radius * 0.35, radius * 0.12);
            graphics.circle(x + radius * 0.85, y - radius * 0.45, radius * 0.12);
            graphics.fill();
            graphics.strokeColor = new Color(190, 145, 255, 150);
            graphics.lineWidth = 1.5;
            graphics.moveTo(x - radius * 1.2, y);
            graphics.lineTo(x - radius * 1.48, y + radius * 0.28);
            graphics.lineTo(x - radius * 1.3, y + radius * 0.52);
            graphics.moveTo(x + radius * 1.2, y);
            graphics.lineTo(x + radius * 1.48, y - radius * 0.28);
            graphics.lineTo(x + radius * 1.3, y - radius * 0.52);
            graphics.stroke();
            return;
        }

        if (position.type === 'boss') {
            const phaseTwo = !!enemy && enemy.hp <= enemy.maxHp * 0.52;
            if (position.warningTimer > 0) {
                const charge = 1 - position.warningTimer / (phaseTwo ? 0.52 : 0.68);
                graphics.strokeColor = phaseTwo ? new Color(255, 224, 120, 190) : new Color(255, 178, 92, 175);
                graphics.lineWidth = 3;
                graphics.circle(x, y, radius * (1.55 + Math.max(0, charge) * 0.35));
                graphics.stroke();
            }
            graphics.fillColor = phaseTwo ? new Color(236, 54, 112, 255) : color;
            graphics.roundRect(x - radius * 1.42, y - radius * 0.98, radius * 2.84, radius * 2.18, 9);
            graphics.fill();
            graphics.stroke();
            graphics.fillColor = new Color(76, 28, 92, 240);
            graphics.moveTo(x - radius * 1.06, y + radius * 0.72);
            graphics.lineTo(x - radius * 0.72, y + radius * 1.82);
            graphics.lineTo(x - radius * 0.22, y + radius * 0.86);
            graphics.close();
            graphics.moveTo(x + radius * 1.06, y + radius * 0.72);
            graphics.lineTo(x + radius * 0.72, y + radius * 1.82);
            graphics.lineTo(x + radius * 0.22, y + radius * 0.86);
            graphics.close();
            graphics.moveTo(x - radius * 1.3, y - radius * 0.2);
            graphics.lineTo(x - radius * 1.82, y - radius * 0.72);
            graphics.lineTo(x - radius * 1.18, y - radius * 0.8);
            graphics.close();
            graphics.moveTo(x + radius * 1.2, y - radius * 0.18);
            graphics.lineTo(x + radius * 1.9, y - radius * 0.1);
            graphics.lineTo(x + radius * 1.2, y - radius * 0.68);
            graphics.close();
            graphics.fill();
            graphics.fillColor = new Color(255, 214, 246, 235);
            graphics.circle(x - radius * 0.42, y + radius * 0.24, phaseTwo ? 4.8 : 3.6);
            graphics.circle(x + radius * 0.42, y + radius * 0.24, phaseTwo ? 4.8 : 3.6);
            graphics.fill();
            graphics.strokeColor = phaseTwo ? new Color(255, 224, 120, 220) : new Color(224, 184, 255, 180);
            graphics.lineWidth = phaseTwo ? 3 : 2;
            this._hex(graphics, x, y - radius * 0.12, radius * 0.58, false);
            graphics.stroke();
            graphics.fillColor = phaseTwo ? new Color(255, 224, 120, 240) : new Color(255, 196, 246, 235);
            this._hex(graphics, x, y - radius * 0.12, phaseTwo ? 7 : 5.2, true);
            if (phaseTwo) {
                graphics.strokeColor = new Color(255, 224, 120, 185);
                graphics.lineWidth = 2;
                graphics.moveTo(x - radius * 0.82, y - radius * 0.48);
                graphics.lineTo(x - radius * 0.34, y + radius * 0.04);
                graphics.moveTo(x + radius * 0.52, y + radius * 0.02);
                graphics.lineTo(x + radius * 0.92, y - radius * 0.42);
                graphics.moveTo(x - radius * 0.08, y + radius * 0.54);
                graphics.lineTo(x + radius * 0.22, y + radius * 0.16);
                graphics.stroke();
            }
            graphics.fillColor = new Color(24, 14, 32, 245);
            graphics.roundRect(x - radius * 1.78, y - radius * 0.92, radius * 0.38, radius * 1.12, 4);
            graphics.roundRect(x + radius * 1.36, y - radius * 0.78, radius * 0.54, radius * 0.78, 4);
            graphics.fill();
            graphics.strokeColor = phaseTwo ? new Color(255, 224, 120, 180) : new Color(224, 184, 255, 130);
            graphics.lineWidth = 2;
            graphics.moveTo(x - radius * 1.72, y - radius * 0.26);
            graphics.lineTo(x - radius * 2.14, y - radius * 0.64);
            graphics.moveTo(x + radius * 1.82, y - radius * 0.34);
            graphics.lineTo(x + radius * 2.26, y - radius * 0.08);
            graphics.stroke();
            graphics.strokeColor = new Color(238, 210, 255, 150);
            graphics.lineWidth = 1.5;
            this._hex(graphics, x - radius * 1.08, y + radius * 0.28, radius * 0.2, false);
            this._hex(graphics, x + radius * 1.08, y + radius * 0.44, radius * 0.18, false);
            this._hex(graphics, x, y + radius * 0.82, radius * 0.22, false);
            graphics.stroke();
            return;
        }

        graphics.moveTo(x, y + radius * 1.05);
        graphics.lineTo(x + radius * 0.9, y + radius * 0.28);
        graphics.lineTo(x + radius * 0.62, y - radius * 0.85);
        graphics.lineTo(x, y - radius * 0.55);
        graphics.lineTo(x - radius * 0.62, y - radius * 0.85);
        graphics.lineTo(x - radius * 0.9, y + radius * 0.28);
        graphics.close();
        graphics.fill();
        graphics.stroke();
        graphics.fillColor = new Color(255, 214, 196, 235);
        graphics.circle(x - radius * 0.3, y + radius * 0.28, radius * 0.12);
        graphics.circle(x + radius * 0.3, y + radius * 0.28, radius * 0.12);
        graphics.fill();
        graphics.fillColor = new Color(255, 132, 112, 210);
        this._hex(graphics, x, y - radius * 0.18, radius * 0.22, true);
        graphics.strokeColor = new Color(48, 18, 24, 180);
        graphics.lineWidth = 1.4;
        graphics.moveTo(x - radius * 0.44, y + radius * 0.62);
        graphics.lineTo(x - radius * 0.12, y + radius * 0.18);
        graphics.lineTo(x - radius * 0.36, y - radius * 0.22);
        graphics.moveTo(x + radius * 0.44, y + radius * 0.62);
        graphics.lineTo(x + radius * 0.12, y + radius * 0.18);
        graphics.lineTo(x + radius * 0.36, y - radius * 0.22);
        graphics.stroke();
        graphics.fillColor = new Color(36, 18, 24, 235);
        graphics.circle(x, y + radius * 0.54, radius * 0.13);
        graphics.fill();
        graphics.strokeColor = new Color(255, 184, 170, 145);
        graphics.lineWidth = 1.3;
        graphics.moveTo(x - radius * 0.88, y + radius * 0.12);
        graphics.lineTo(x - radius * 1.18, y + radius * 0.46);
        graphics.moveTo(x + radius * 0.88, y + radius * 0.12);
        graphics.lineTo(x + radius * 1.18, y + radius * 0.46);
        graphics.moveTo(x - radius * 0.48, y - radius * 0.78);
        graphics.lineTo(x - radius * 0.72, y - radius * 1.08);
        graphics.moveTo(x + radius * 0.48, y - radius * 0.78);
        graphics.lineTo(x + radius * 0.72, y - radius * 1.08);
        graphics.stroke();
    }

    private _enemyVisualRadius(type: RuntimeEnemyType, radius: number): number {
        if (type === 'boss') return radius * 1.34;
        if (type === 'tank') return radius * 1.16;
        if (type === 'binder') return radius * 1.12;
        if (type === 'dasher') return radius * 1.08;
        if (type === 'swarm') return radius * 0.92;
        return radius * 1.05;
    }

    private _enemyColor(type: RuntimeEnemyType): Color {
        if (type === 'doubt') return new Color(160, 170, 190, 255);
        if (type === 'anxiety') return new Color(255, 92, 110, 255);
        if (type === 'procrastination') return new Color(120, 150, 90, 255);
        if (type === 'boss') return new Color(184, 82, 255, 255);
        if (type === 'tank') return new Color(255, 166, 82, 255);
        if (type === 'dasher') return new Color(255, 86, 126, 255);
        if (type === 'spitter') return new Color(120, 220, 150, 255);
        if (type === 'swarm') return new Color(255, 118, 92, 255);
        if (type === 'binder') return new Color(168, 122, 255, 255);
        return new Color(255, 96, 96, 255);
    }

    private _drawJoystick(): void {
        if (this._joystickBaseGraphics) {
            this._joystickBaseGraphics.clear();
            this._joystickBaseGraphics.fillColor = new Color(56, 66, 84, 135);
            this._joystickBaseGraphics.circle(0, 0, JOYSTICK_RADIUS);
            this._joystickBaseGraphics.fill();
            this._joystickBaseGraphics.strokeColor = new Color(132, 154, 188, 185);
            this._joystickBaseGraphics.lineWidth = 2;
            this._joystickBaseGraphics.circle(0, 0, JOYSTICK_RADIUS);
            this._joystickBaseGraphics.stroke();
        }

        if (this._joystickKnob) {
            this._joystickKnob.setPosition(this._moveInput.x * 38, this._moveInput.y * 38, 0);
        }
        if (this._joystickKnobGraphics) {
            this._joystickKnobGraphics.clear();
            this._joystickKnobGraphics.fillColor = new Color(238, 174, 72, 230);
            this._joystickKnobGraphics.circle(0, 0, 22);
            this._joystickKnobGraphics.fill();
        }
    }

    private _setBattleControls(active: boolean): void {
        if (this._joystickBase) this._joystickBase.active = active;
        if (this._shieldButton) {
            this._shieldButton.node.active = active || this._state === GameState.Result;
            this._setButtonText(this._shieldButton, this._state === GameState.Result ? this._t('restart') : this._t('shield'));
        }
        if (this._rerollButton) this._rerollButton.node.active = this._state === GameState.RollDraft;
    }

    private _setChoiceButtons(choices: HexChoiceView[]): void {
        const cardBgFrame = this._uiIconFrames.get('draft_card_bg') ?? null;
        const lockFrame = this._uiIconFrames.get('draft_lock') ?? null;
        for (let i = 0; i < this._choiceButtons.length; i += 1) {
            const choice = choices[i];
            const button = this._choiceButtons[i];
            button.node.active = !!choice;
            const icon = this._choiceIconSprites[i];
            const cardBg = this._choiceCardBgSprites[i];
            const lockSprite = this._choiceLockSprites[i];
            if (cardBg) {
                cardBg.node.active = !!choice && !!cardBgFrame;
                if (choice && cardBgFrame) cardBg.spriteFrame = cardBgFrame;
            }
            if (choice && this._choiceLabels[i]) {
                const name = this._language === 'zh' && choice.data.nameZh ? choice.data.nameZh : choice.data.name;
                const rarity = choice.data.rarity.toUpperCase();
                const isLocked = choice.locked
                    || (this._rollSystem.getLockedSkillIds().indexOf(choice.data.id) >= 0);
                // Prefer bitmap lock badge; keep text fallback when frame missing.
                const lock = isLocked && !lockFrame ? ' 🔒' : '';
                this._choiceLabels[i].string = `${name}${lock}\n${rarity}`;
                // Tint by rarity via label color
                const hex = rarityColorHex(choice.data.rarity);
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                this._choiceLabels[i].color = new Color(r, g, b, 255);
                const frame = this._skillIconFrames.get(choice.data.id) ?? null;
                if (icon) {
                    icon.node.active = !!frame;
                    if (frame) icon.spriteFrame = frame;
                }
                if (lockSprite) {
                    lockSprite.node.active = isLocked && !!lockFrame;
                    if (isLocked && lockFrame) lockSprite.spriteFrame = lockFrame;
                }
            } else {
                if (icon) icon.node.active = false;
                if (lockSprite) lockSprite.node.active = false;
            }
        }
        this._syncRerollIcon();
    }

    private _setButtonText(button: Button | null, text: string): void {
        if (!button) return;
        const label = button.node.children.find((child) => child.getComponent(Label))?.getComponent(Label);
        if (label) label.string = text;
    }

    private _setNamedLabel(parent: Node | null, name: string, text: string): void {
        const label = parent?.getChildByName(name)?.getComponent(Label);
        if (label) label.string = text;
    }

    private _t(key: string): string {
        return UI_TEXT[this._language][key] ?? UI_TEXT.en[key] ?? key;
    }

    private _fmt(key: string, values: Record<string, string | number>): string {
        let text = this._t(key);
        Object.keys(values).forEach((name) => {
            text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), `${values[name]}`);
        });
        return text;
    }

    private _tickFloatingTexts(dt: number): void {
        for (let i = this._floatingTexts.length - 1; i >= 0; i -= 1) {
            const text = this._floatingTexts[i];
            text.ttl -= dt;
            text.y += 18 * dt;
            const progress = 1 - text.ttl / Math.max(0.001, text.duration);
            const alpha = Math.max(0, Math.round(text.color.a * (1 - progress)));
            text.label.node.setPosition(text.x, text.y, 0);
            text.label.color = new Color(text.color.r, text.color.g, text.color.b, alpha);
            if (text.ttl <= 0) {
                const expired = this._floatingTexts.splice(i, 1)[0];
                this._releaseFloatingTextLabel(expired.label);
            }
        }
    }

    private _tickAttackTraces(dt: number): void {
        for (let i = this._attackTraces.length - 1; i >= 0; i -= 1) {
            this._attackTraces[i].ttl -= dt;
            if (this._attackTraces[i].ttl <= 0) {
                this._attackTraces.splice(i, 1);
            }
        }
    }

    private _tickVfx(dt: number): void {
        for (let i = this._vfxPulses.length - 1; i >= 0; i -= 1) {
            this._vfxPulses[i].ttl -= dt;
            if (this._vfxPulses[i].ttl <= 0) {
                this._vfxPulses.splice(i, 1);
            }
        }
        for (let i = this._activeVfxSprites.length - 1; i >= 0; i -= 1) {
            const item = this._activeVfxSprites[i];
            item.ttl -= dt;
            const progress = 1 - item.ttl / Math.max(0.001, item.duration);
            const scale = 0.85 + progress * 0.55;
            const size = item.baseSize * scale;
            item.node.setScale(scale, scale, 1);
            item.node.getComponent(UITransform)?.setContentSize(size, size);
            const alpha = Math.max(0, Math.round(255 * (1 - progress * 0.92)));
            item.sprite.color = new Color(255, 255, 255, alpha);
            if (item.ttl <= 0) {
                item.node.active = false;
                item.node.setScale(1, 1, 1);
                this._vfxSpritePool.push({ node: item.node, sprite: item.sprite });
                this._activeVfxSprites.splice(i, 1);
            }
        }
    }

    private _spawnVfxSprite(key: string, x: number, y: number, size: number, duration: number): void {
        const frame = this._vfxFrames.get(key);
        if (!frame || !this._vfxSpriteLayer) return;
        if (this._activeVfxSprites.length >= MOBILE_PERFORMANCE_BUDGET.maxActiveVfx) {
            const oldest = this._activeVfxSprites.shift();
            if (oldest) {
                oldest.node.active = false;
                this._vfxSpritePool.push({ node: oldest.node, sprite: oldest.sprite });
            }
        }
        let pooled = this._vfxSpritePool.pop();
        if (!pooled) {
            const node = this._panel('VfxSprite', this._vfxSpriteLayer, size, size, x, y);
            const sprite = node.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            pooled = { node, sprite };
        }
        pooled.sprite.spriteFrame = frame;
        pooled.sprite.color = new Color(255, 255, 255, 255);
        pooled.node.setPosition(x, y, 0);
        pooled.node.setScale(1, 1, 1);
        pooled.node.getComponent(UITransform)?.setContentSize(size, size);
        pooled.node.active = true;
        this._activeVfxSprites.push({
            node: pooled.node,
            sprite: pooled.sprite,
            ttl: duration,
            duration,
            baseSize: size,
        });
    }

    private _clearActiveVfxSprites(): void {
        while (this._activeVfxSprites.length > 0) {
            const item = this._activeVfxSprites.pop();
            if (!item) break;
            item.node.active = false;
            item.node.setScale(1, 1, 1);
            this._vfxSpritePool.push({ node: item.node, sprite: item.sprite });
        }
        for (const bolt of this._enemyBoltSprites) {
            bolt.node.active = false;
        }
    }

    private _syncEnemyBoltSprites(): void {
        const frame = this._vfxFrames.get('projectile_enemy') ?? null;
        const enemyBolts = frame
            ? this._projectiles.filter((p) => p.owner === 'enemy')
            : [];
        while (this._enemyBoltSprites.length < enemyBolts.length && this._vfxSpriteLayer) {
            const node = this._panel('EnemyBolt', this._vfxSpriteLayer, 18, 18, 0, 0);
            const sprite = node.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            node.active = false;
            this._enemyBoltSprites.push({ node, sprite });
        }
        for (let i = 0; i < this._enemyBoltSprites.length; i += 1) {
            const bolt = this._enemyBoltSprites[i];
            const projectile = enemyBolts[i];
            if (!projectile || !frame) {
                bolt.node.active = false;
                continue;
            }
            bolt.sprite.spriteFrame = frame;
            bolt.sprite.color = new Color(255, 255, 255, 235);
            bolt.node.setPosition(projectile.x, projectile.y, 0);
            bolt.node.getComponent(UITransform)?.setContentSize(18, 18);
            bolt.node.active = true;
        }
    }

    private _tickEnemyVisualState(dt: number): void {
        for (const position of this._enemyPositions.values()) {
            position.hitFlashTimer = Math.max(0, position.hitFlashTimer - dt);
            position.spawnTimer = Math.max(0, position.spawnTimer - dt);
            position.deathTimer = Math.max(0, position.deathTimer - dt);
        }
    }

    private _spawnImpactShards(x: number, y: number, type: RuntimeEnemyType, count: number): void {
        const color = this._enemyColor(type);
        while (this._impactShards.length > MOBILE_PERFORMANCE_BUDGET.maxActiveVfx * 2) {
            this._impactShards.shift();
        }
        for (let i = 0; i < count; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 42 + Math.random() * 68;
            const duration = 0.28 + Math.random() * 0.18;
            this._impactShards.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                ttl: duration,
                duration,
                size: 2 + Math.random() * 2.5,
                color: new Color(color.r, color.g, color.b, 220),
            });
        }
    }

    private _tickImpactShards(dt: number): void {
        for (let i = this._impactShards.length - 1; i >= 0; i -= 1) {
            const shard = this._impactShards[i];
            shard.ttl -= dt;
            shard.x += shard.vx * dt;
            shard.y += shard.vy * dt;
            shard.vx *= 0.92;
            shard.vy *= 0.92;
            if (shard.ttl <= 0) {
                this._impactShards.splice(i, 1);
            }
        }
    }

    private _spawnControlZone(x: number, y: number, damage: number): void {
        if (this._controlZones.length >= 5) {
            this._controlZones.shift();
        }

        const radius = 30 + Math.min(10, (this._run?.wave.wave ?? 1) * 0.8);
        this._controlZones.push({
            x,
            y,
            radius,
            ttl: 3.2,
            duration: 3.2,
            damageCooldown: 0.7,
            color: new Color(168, 122, 255, 150),
        });
        this._pulse(x, y, radius * 0.45, radius, 0.32, new Color(168, 122, 255, 190), 3, 'control_zone', radius * 2.2);
        this._log(`Gravity Binder dropped a slow zone for ${damage} pressure.`);
    }

    private _tickControlZones(dt: number): void {
        if (!this._run) return;

        for (let i = this._controlZones.length - 1; i >= 0; i -= 1) {
            const zone = this._controlZones[i];
            zone.ttl -= dt;
            zone.damageCooldown = Math.max(0, zone.damageCooldown - dt);

            const inside = Math.hypot(zone.x - this._playerX, zone.y - this._playerY) <= zone.radius + PLAYER_RADIUS * 0.5;
            if (inside && zone.damageCooldown <= 0) {
                zone.damageCooldown = 0.82;
                if (!this._tryDodge(zone.x, zone.y)) {
                    const rawDamage = 4 + Math.floor((this._run.wave.wave - 1) * 0.45);
                    const armorReduction = Math.min(0.7, this._run.player.armor / (this._run.player.armor + 100));
                    const damage = Math.max(1, Math.round(rawDamage * (1 - armorReduction)));
                    this._run.player.hp = Math.max(0, this._run.player.hp - damage);
                    this._run.stats.damageTaken += damage;
                    this._float(`-${damage}`, this._playerX, this._playerY + 20, new Color(190, 145, 255, 255));
                    this._pulse(this._playerX, this._playerY, 8, 20, 0.18, new Color(168, 122, 255, 210), 2);
                }
            }

            if (zone.ttl <= 0) {
                this._controlZones.splice(i, 1);
            }
        }
    }

    private _getControlSlowMultiplier(): number {
        if (this._controlZones.length <= 0) return 1;

        for (const zone of this._controlZones) {
            if (Math.hypot(zone.x - this._playerX, zone.y - this._playerY) <= zone.radius + PLAYER_RADIUS * 0.5) {
                return 0.58;
            }
        }
        return 1;
    }

    private _float(text: string, x: number, y: number, color: Color): void {
        if (this._floatingTexts.length >= MOBILE_PERFORMANCE_BUDGET.maxActiveDamageNumbers) {
            const oldest = this._floatingTexts.shift();
            if (oldest) this._releaseFloatingTextLabel(oldest.label);
        }
        const duration = DAMAGE_NUMBER_FEEDBACK.lifetimeMs / 1000;
        const label = this._acquireFloatingTextLabel();
        label.string = text;
        label.fontSize = text === 'KO' ? 15 : 13;
        label.lineHeight = label.fontSize + 5;
        label.color = color;
        label.node.setPosition(x, y, 0);
        label.node.active = true;
        this._floatingTexts.push({ text, x, y, ttl: duration, duration, color, label });
    }

    private _clearFloatingTexts(): void {
        while (this._floatingTexts.length > 0) {
            const text = this._floatingTexts.pop();
            if (text) this._releaseFloatingTextLabel(text.label);
        }
    }

    private _acquireFloatingTextLabel(): Label {
        const pooled = this._floatingTextPool.pop();
        if (pooled) return pooled;

        const parent = this._damageTextLayer ?? this._game ?? this.node;
        const node = this._panel('DamageText', parent, 80, 22, 0, 0);
        const label = node.addComponent(Label);
        label.fontSize = 13;
        label.lineHeight = 18;
        label.color = Color.WHITE;
        node.active = false;
        return label;
    }

    private _releaseFloatingTextLabel(label: Label): void {
        label.node.active = false;
        this._floatingTextPool.push(label);
    }

    private _pulse(
        x: number,
        y: number,
        radius: number,
        maxRadius: number,
        duration: number,
        color: Color,
        lineWidth: number,
        spriteKey?: string,
        spriteSize?: number,
    ): void {
        if (this._vfxPulses.length >= MOBILE_PERFORMANCE_BUDGET.maxActiveVfx) {
            this._vfxPulses.shift();
        }
        this._vfxPulses.push({
            x,
            y,
            ttl: duration,
            duration,
            radius,
            maxRadius,
            lineWidth,
            color,
            spriteKey,
            size: spriteSize,
        });
        if (spriteKey) {
            this._spawnVfxSprite(spriteKey, x, y, spriteSize ?? Math.max(28, maxRadius * 1.6), duration);
        }
    }

    /** Hit feedback: ring pulse + optional bitmap (crit uses crit_burst). */
    private _pulseHit(x: number, y: number, isCritical = false, color?: Color): void {
        if (isCritical) {
            this._pulse(x, y, 10, 36, 0.34, color ?? new Color(255, 210, 90, 240), 3, 'crit_burst', 56);
            return;
        }
        this._pulse(x, y, 5, 18, 0.22, color ?? new Color(255, 220, 180, 220), 2, 'hit_spark', 32);
    }

    private _pulseKo(x: number, y: number): void {
        this._pulse(x, y, 10, 32, 0.34, new Color(255, 104, 104, 230), 3, 'explosion', 48);
    }

    private _traceAttack(targetX: number, targetY: number, kind: 'blade' | 'chain'): void {
        const spec = ATTACK_TRAIL_FEEDBACK[kind];
        const weapon = this._getWeaponSpec();
        this._attackTraces.push({
            fromX: this._playerX,
            fromY: this._playerY,
            toX: targetX,
            toY: targetY,
            ttl: spec.durationMs / 1000,
            duration: spec.durationMs / 1000,
            color: kind === 'blade' ? new Color(weapon.color.r, weapon.color.g, weapon.color.b, 220) : this._colorFromHex(spec.color, 190),
            kind: 'line',
        });
        if (this._attackTraces.length > MOBILE_PERFORMANCE_BUDGET.maxActiveProjectiles) {
            this._attackTraces.shift();
        }
    }

    private _traceMeleeArc(radius: number, angle: number, color: Color): void {
        this._attackTraces.push({
            fromX: this._playerX,
            fromY: this._playerY,
            toX: this._playerX + this._facingX * radius,
            toY: this._playerY + this._facingY * radius,
            ttl: 0.18,
            duration: 0.18,
            color: new Color(color.r, color.g, color.b, 210),
            kind: 'arc',
            radius,
            angle,
        });
        if (this._attackTraces.length > MOBILE_PERFORMANCE_BUDGET.maxActiveProjectiles) {
            this._attackTraces.shift();
        }
    }

    private _traceThrust(range: number, halfWidth: number, color: Color): void {
        this._attackTraces.push({
            fromX: this._playerX,
            fromY: this._playerY,
            toX: this._playerX + this._facingX * range,
            toY: this._playerY + this._facingY * range,
            ttl: 0.16,
            duration: 0.16,
            color: new Color(color.r, color.g, color.b, 220),
            kind: 'thrust',
            width: halfWidth,
        });
        if (this._attackTraces.length > MOBILE_PERFORMANCE_BUDGET.maxActiveProjectiles) {
            this._attackTraces.shift();
        }
    }

    private _traceShotgunPellets(range: number, angle: number, color: Color): void {
        const pelletCount = 7;
        const base = Math.atan2(this._facingY, this._facingX);
        for (let i = 0; i < pelletCount; i += 1) {
            const t = pelletCount <= 1 ? 0.5 : i / (pelletCount - 1);
            const pelletAngle = base - angle * 0.5 + angle * t;
            const pelletRange = range * (0.7 + (i % 3) * 0.08);
            this._attackTraces.push({
                fromX: this._playerX + Math.cos(pelletAngle) * 18,
                fromY: this._playerY + Math.sin(pelletAngle) * 18,
                toX: this._playerX + Math.cos(pelletAngle) * pelletRange,
                toY: this._playerY + Math.sin(pelletAngle) * pelletRange,
                ttl: 0.14,
                duration: 0.14,
                color: new Color(color.r, color.g, color.b, 180),
                kind: 'line',
            });
        }
        while (this._attackTraces.length > MOBILE_PERFORMANCE_BUDGET.maxActiveProjectiles) {
            this._attackTraces.shift();
        }
    }

    private _log(message: string): void {
        this._lastLog = message;
        if (this._logLabel) this._logLabel.string = message;
    }

    private _colorFromHex(hex: string, alpha = 255): Color {
        const normalized = hex.replace('#', '');
        const value = Number.parseInt(normalized, 16);
        if (!Number.isFinite(value)) return new Color(255, 255, 255, alpha);
        return new Color((value >> 16) & 255, (value >> 8) & 255, value & 255, alpha);
    }

    private _distanceToEnemy(enemyId: string): number {
        const position = this._enemyPositions.get(enemyId);
        if (!position) return Number.MAX_SAFE_INTEGER;
        return Math.hypot(position.x - this._playerX, position.y - this._playerY);
    }

    private _clampX(value: number): number {
        return Math.max(-ARENA_HALF_WIDTH + PLAYER_RADIUS, Math.min(ARENA_HALF_WIDTH - PLAYER_RADIUS, value));
    }

    private _clampY(value: number): number {
        return Math.max(-ARENA_HALF_HEIGHT + PLAYER_RADIUS, Math.min(ARENA_HALF_HEIGHT - PLAYER_RADIUS, value));
    }

    private _panel(name: string, parent: Node, width: number, height: number, x: number, y: number): Node {
        const node = new Node(name);
        node.setParent(parent);
        node.setPosition(x, y, 0);
        node.layer = parent.layer;
        node.addComponent(UITransform).setContentSize(width, height);
        return node;
    }

    private _block(name: string, parent: Node, width: number, height: number, x: number, y: number, color: Color): Graphics {
        const node = this._panel(name, parent, width, height, x, y);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = color;
        graphics.roundRect(-width / 2, -height / 2, width, height, 8);
        graphics.fill();
        graphics.strokeColor = new Color(255, 255, 255, 26);
        graphics.lineWidth = 1;
        graphics.roundRect(-width / 2, -height / 2, width, height, 8);
        graphics.stroke();
        return graphics;
    }

    private _label(name: string, parent: Node, text: string, size: number, x: number, y: number, color: Color): Label {
        const node = this._panel(name, parent, SCREEN_WIDTH - 54, Math.max(28, size + 12), x, y);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.color = color;
        return label;
    }

    private _button(name: string, parent: Node, text: string, width: number, height: number, x: number, y: number): Button {
        this._block(`${name}Bg`, parent, width, height, x, y, new Color(232, 172, 76, 255));
        const node = parent.children[parent.children.length - 1];
        node.name = name;
        const button = node.addComponent(Button);
        button.transition = Button.Transition.COLOR;
        this._label(`${name}Label`, node, text, 15, 0, 0, new Color(24, 26, 36, 255));
        return button;
    }
}
