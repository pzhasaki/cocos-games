import { _decorator, Color, Component, instantiate, Node, Prefab, Sprite, v3, Vec3 } from 'cc';
import { Bullet } from '../core/Bullet';
import { GameCtrl, GameEvent } from '../core/GameCtrl';
import { MonsterAI, MonsterType } from '../core/MonsterAI';

const { ccclass, property } = _decorator;

interface WaveConfig {
    monsterCount: number;
    eliteCount: number;
    bossCount: number;
    hpMultiplier: number;
    speedMultiplier: number;
    spawnInterval: number;
}

@ccclass('WaveManager')
export class WaveManager extends Component {
    @property({ type: Prefab })
    public normalMonsterPrefab: Prefab | null = null;

    @property({ type: Prefab })
    public eliteMonsterPrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: 'Falls back to elite prefab when empty.' })
    public bossMonsterPrefab: Prefab | null = null;

    @property({ type: Prefab })
    public bulletPrefab: Prefab | null = null;

    @property({ type: Prefab })
    public dropCoinPrefab: Prefab | null = null;

    @property({ type: Node })
    public monsterRoot: Node | null = null;

    @property({ type: Node })
    public bulletRoot: Node | null = null;

    @property({ type: Node })
    public dropRoot: Node | null = null;

    @property
    public baseMonsterCount: number = 4;

    @property
    public incrementPerWave: number = 1;

    @property
    public hpGrowth: number = 0.1;

    @property
    public speedGrowth: number = 0.025;

    @property
    public endlessMode: boolean = true;

    private _currentWave = 0;
    private _activeMonsters: Node[] = [];
    private _activeBullets: Node[] = [];
    private _spawnTimer = 0;
    private _totalToSpawn = 0;
    private _spawned = 0;
    private _isSpawning = false;
    private _isWaveActive = false;
    private _monsterPool: Node[] = [];
    private _bulletPool: Node[] = [];
    private _dropPool: Node[] = [];

    protected update(dt: number): void {
        if (!this._isWaveActive) return;

        if (this._isSpawning) {
            this._spawnTimer -= dt;
            if (this._spawnTimer <= 0) {
                this._spawnNextMonster();
            }
        }

        if (!this._isSpawning && this._activeMonsters.length === 0) {
            this._onWaveClear();
        }
    }

    public startWave(waveNumber: number): void {
        this._currentWave = waveNumber;
        const config = this._buildWaveConfig(waveNumber);

        this._totalToSpawn = config.monsterCount + config.eliteCount + config.bossCount;
        this._spawned = 0;
        this._spawnTimer = 0.45;
        this._isSpawning = true;
        this._isWaveActive = true;

        console.log(`[WaveManager] Wave ${waveNumber} start, enemies: ${this._totalToSpawn}`);
        GameCtrl.emit(GameEvent.WAVE_UPDATE, waveNumber);
    }

    public clearAllMonsters(): void {
        this._isWaveActive = false;
        this._isSpawning = false;

        for (const node of [...this._activeMonsters]) {
            this.recycleMonster(node);
        }

        for (const node of [...this._activeBullets]) {
            this.recycleBullet(node);
        }
    }

    public recycleMonster(node: Node): void {
        const ai = node.getComponent(MonsterAI);
        ai?.deactivate();

        const idx = this._activeMonsters.indexOf(node);
        if (idx >= 0) this._activeMonsters.splice(idx, 1);

        node.parent = null;
        this._monsterPool.push(node);
    }

    public recycleBullet(node: Node): void {
        const bullet = node.getComponent(Bullet);
        bullet?.recycle();

        const idx = this._activeBullets.indexOf(node);
        if (idx >= 0) this._activeBullets.splice(idx, 1);

        node.parent = null;
        this._bulletPool.push(node);
    }

    public getBulletFromPool(): Node | null {
        let node: Node | null = null;

        if (this._bulletPool.length > 0) {
            node = this._bulletPool.pop()!;
        } else if (this.bulletPrefab) {
            node = instantiate(this.bulletPrefab);
        }

        if (node) {
            node.parent = this.bulletRoot ?? this.node;
            this._activeBullets.push(node);
            node.active = false;
        }

        return node;
    }

    public damageMonstersInRange(center: Vec3, radius: number, damage: number, isUltimate: boolean): number {
        let hitCount = 0;

        for (const node of [...this._activeMonsters]) {
            if (!node.active) continue;
            if (Vec3.distance(center, node.position) > radius) continue;

            const ai = node.getComponent(MonsterAI);
            if (!ai || !ai.isAlive) continue;

            ai.takeDamage(damage);
            if (!ai.isAlive) {
                GameCtrl.instance.player?.addKill();
            }
            hitCount++;
        }

        return hitCount;
    }

    public damageAllMonsters(damage: number): number {
        let hitCount = 0;

        for (const node of [...this._activeMonsters]) {
            if (!node.active) continue;
            const ai = node.getComponent(MonsterAI);
            if (!ai || !ai.isAlive) continue;

            ai.takeDamage(damage);
            if (!ai.isAlive) {
                GameCtrl.instance.player?.addKill();
            }
            hitCount++;
        }

        return hitCount;
    }

    public spawnDrop(position: Vec3, amount: number): void {
        let coin: Node | null = null;

        if (this._dropPool.length > 0) {
            coin = this._dropPool.pop()!;
        } else if (this.dropCoinPrefab) {
            coin = instantiate(this.dropCoinPrefab);
        }

        if (!coin) {
            GameCtrl.emit(GameEvent.COIN_COLLECTED, amount);
            return;
        }

        coin.position = position;
        coin.parent = this.dropRoot ?? this.node;
        coin.active = true;

        this.scheduleOnce(() => {
            this._flyToPlayer(coin!, amount);
        }, 0.3);
    }

    public get activeMonsterCount(): number {
        return this._activeMonsters.length;
    }

    public get currentWave(): number {
        return this._currentWave;
    }

    private _buildWaveConfig(waveNumber: number): WaveConfig {
        const bossCount = waveNumber % 5 === 0 ? 1 : 0;
        const baseCount = this.baseMonsterCount + Math.floor((waveNumber - 1) * this.incrementPerWave);
        const monsterCount = bossCount > 0 ? Math.max(4, Math.floor(baseCount * 0.75)) : baseCount;
        const eliteCount = bossCount > 0 ? Math.floor(waveNumber / 10) : (waveNumber >= 4 && waveNumber % 3 === 0 ? 1 : 0);

        return {
            monsterCount,
            eliteCount,
            bossCount,
            hpMultiplier: 1 + (waveNumber - 1) * this.hpGrowth,
            speedMultiplier: 1 + (waveNumber - 1) * this.speedGrowth,
            spawnInterval: Math.max(0.22, 0.72 - waveNumber * 0.018),
        };
    }

    private _spawnNextMonster(): void {
        if (this._spawned >= this._totalToSpawn) {
            this._isSpawning = false;
            return;
        }

        const config = this._buildWaveConfig(this._currentWave);
        const type = this._getSpawnType(config);
        const node = this._getMonsterFromPool(type);

        this._spawned++;
        this._spawnTimer = config.spawnInterval;

        if (!node) return;

        node.position = this._getSpawnPosition();
        node.parent = this.monsterRoot ?? this.node;
        this._configureMonster(node, type, config);
        this._activeMonsters.push(node);
    }

    private _getSpawnType(config: WaveConfig): MonsterType {
        if (this._spawned < config.monsterCount) return MonsterType.NORMAL;
        if (this._spawned < config.monsterCount + config.eliteCount) return MonsterType.ELITE;
        return MonsterType.BOSS;
    }

    private _getSpawnPosition(): Vec3 {
        const screenWidth = 480;
        const screenHeight = 320;
        const side = Math.random() < 0.5 ? -1 : 1;
        return v3(
            side * (screenWidth / 2 + 50 + Math.random() * 80),
            (Math.random() - 0.5) * screenHeight * 0.7,
            0,
        );
    }

    private _configureMonster(node: Node, type: MonsterType, config: WaveConfig): void {
        const ai = node.getComponent(MonsterAI);
        if (!ai) return;

        ai.monsterType = type;
        if (type === MonsterType.BOSS) {
            ai.maxHp = Math.floor((420 + this._currentWave * 95) * config.hpMultiplier);
            ai.speed = 45 * config.speedMultiplier;
            ai.chargeSpeed = 220 * config.speedMultiplier;
            ai.chargeDamage = 16 + this._currentWave * 2;
            ai.rangedDamage = 10 + this._currentWave;
            ai.goldDrop = 10 + Math.floor(this._currentWave / 5) * 3;
            this._tintMonster(node, new Color(255, 110, 70));
        } else if (type === MonsterType.ELITE) {
            ai.maxHp = Math.floor(115 * config.hpMultiplier);
            ai.speed = 65 * config.speedMultiplier;
            ai.chargeSpeed = 250 * config.speedMultiplier;
            ai.chargeDamage = 11 + this._currentWave;
            ai.rangedDamage = 7 + Math.floor(this._currentWave * 0.6);
            ai.goldDrop = 4;
            this._tintMonster(node, new Color(200, 100, 255));
        } else {
            ai.maxHp = Math.floor(42 * config.hpMultiplier);
            ai.speed = 82 * config.speedMultiplier;
            ai.chargeSpeed = 330 * config.speedMultiplier;
            ai.chargeDamage = 6 + Math.floor(this._currentWave * 0.45);
            ai.rangedDamage = 5 + Math.floor(this._currentWave * 0.35);
            ai.goldDrop = 1;
            this._tintMonster(node, new Color(255, 255, 255));
        }

        ai.activate();
    }

    private _tintMonster(node: Node, color: Color): void {
        const sprite = node.getComponentInChildren(Sprite);
        if (sprite) {
            sprite.color = color;
        }
    }

    private _getMonsterFromPool(type: MonsterType): Node | null {
        for (let i = 0; i < this._monsterPool.length; i++) {
            const node = this._monsterPool[i];
            const ai = node.getComponent(MonsterAI);
            if (ai?.actorType === type) {
                this._monsterPool.splice(i, 1);
                return node;
            }
        }

        const prefab = this._getPrefabForType(type);
        return prefab ? instantiate(prefab) : null;
    }

    private _getPrefabForType(type: MonsterType): Prefab | null {
        if (type === MonsterType.BOSS) return this.bossMonsterPrefab ?? this.eliteMonsterPrefab ?? this.normalMonsterPrefab;
        if (type === MonsterType.ELITE) return this.eliteMonsterPrefab ?? this.normalMonsterPrefab;
        return this.normalMonsterPrefab;
    }

    private _flyToPlayer(coin: Node, amount: number): void {
        const player = GameCtrl.instance.player;
        if (!player) return;

        const target = player.node.position;
        const dir = new Vec3();
        Vec3.subtract(dir, target, coin.position);

        if (dir.length() < 50) {
            coin.active = false;
            coin.parent = null;
            this._dropPool.push(coin);
            GameCtrl.emit(GameEvent.COIN_COLLECTED, amount);
            return;
        }

        dir.normalize().multiplyScalar(400 * 0.016);
        coin.position = coin.position.add(dir);

        this.scheduleOnce(() => {
            if (coin.active) this._flyToPlayer(coin, amount);
        }, 0.016);
    }

    private _onWaveClear(): void {
        this._isWaveActive = false;
        console.log(`[WaveManager] Wave ${this._currentWave} clear`);
        GameCtrl.instance.onWaveClear();
    }
}
