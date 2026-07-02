
/**
 * GyroManager.ts — 陀螺仪输入管理器（体感核心）
 *
 * 设计要点:
 *   - 基于 DeviceMotionEvent 的 accelerationIncludingGravity
 *   - 低通滤波 + 角度阈值过滤 → 静置不误触发
 *   - 垂直摇晃(Y轴加速度变化) → 攻击 / 必杀
 *   - 水平摇晃(X轴加速度变化) → 格挡
 *   - 可调节灵敏度（公开 sensitivity 属性）
 *   - PC 调试回退：按住鼠标左键模拟攻击，右键模拟格挡
 *   - 手机震动反馈: attack / shield / ultimate 三种模式
 *
 * 场景挂载: GameScene 下的 GyroManager 节点（或 GameCtrl 同节点）
 */
import { _decorator, Component, game } from 'cc';
import { GameCtrl, GameEvent } from '../core/GameCtrl';
import { PlatformDef } from '../platform/PlatformDef';

const { ccclass, property } = _decorator;

/** 震动模式 */
export enum VibePattern {
    /** 普通攻击 — 短促 */
    ATTACK = 30,
    /** 格挡 — 中短两次 */
    SHIELD = '50,30,50',
    /** 必杀技 — 长强震三次递增 */
    ULTIMATE = '100,50,150,50,200',
}

@ccclass('GyroManager')
export class GyroManager extends Component {
    /* ---- 公开参数（面板可调） ---- */

    @property({ tooltip: '陀螺仪灵敏度 (0.1~3.0)，越大越灵敏', min: 0.1, max: 3.0, slide: true })
    public sensitivity: number = 1.0;

    @property({ tooltip: '垂直(Y轴)摇动触发阈值 (m/s² 变化率)', min: 2, max: 30 })
    public verticalThreshold: number = 12;

    @property({ tooltip: '水平(X轴)摇动触发阈值 (m/s² 变化率)', min: 2, max: 30 })
    public horizontalThreshold: number = 10;

    @property({ tooltip: '普通攻击冷却 (ms)' })
    public attackCooldown: number = 250;

    @property({ tooltip: '必杀技冷却 (ms)' })
    public ultimateCooldown: number = 1000;

    @property({ tooltip: '格挡持续时长 (ms)' })
    public shieldDuration: number = 500;

    @property({ tooltip: '启用手机震动反馈' })
    public vibrationEnabled: boolean = true;

    @property({ tooltip: '启用PC调试回退(鼠标模拟)' })
    public pcDebugFallback: boolean = true;

    /* ---- 内部状态 ---- */

    private _active: boolean = false;
    private _initialized: boolean = false;
    private _hasPermission: boolean = false;

    // 低通滤波数据
    private _filteredX: number = 0;
    private _filteredY: number = 0;
    private _filteredZ: number = 0;
    private readonly _filterFactor: number = 0.3; // 低通系数 (越小越平滑)

    // 冷却计时
    private _lastAttackTime: number = 0;
    private _lastUltimateTime: number = 0;
    private _lastShieldEndTime: number = 0;
    private _isShielding: boolean = false;
    private _shieldTimer: number = 0;

    // 原始数据（用于调试显示）
    private _rawX: number = 0;
    private _rawY: number = 0;
    private _rawZ: number = 0;
    private _changeRateX: number = 0;
    private _changeRateY: number = 0;

    /* ---- PC 调试回退 ---- */
    private _mouseDown: boolean = false;
    private _keyDown: Set<string> = new Set();

    /* ======================== 生命周期 ======================== */

    protected start(): void {
        this._tryInitGyroscope();
        this._setupPcFallback();
    }

    protected update(dt: number): void {
        if (!this._active && !this.pcDebugFallback) return;

        // 盾牌持续时间管理
        if (this._isShielding) {
            this._shieldTimer -= dt * 1000;
            if (this._shieldTimer <= 0) {
                this._endShield();
            }
        }

        // PC 调试回退轮询
        if (this.pcDebugFallback && !this._initialized) {
            this._pollPcInput();
        }
    }

    protected onDestroy(): void {
        this._teardownGyroscope();
        this._teardownPcFallback();
    }

    /* ======================== 公开接口 ======================== */

    /** 启用/禁用陀螺仪响应 */
    public setActive(active: boolean): void {
        this._active = active;
        if (!active) {
            this._endShield(); // 退出时强制结束格挡状态
        }
    }

    /** 获取当前是否在格挡中 */
    public get isShielding(): boolean {
        return this._isShielding;
    }

    /** 获取原始加速度数据（调试用） */
    public get debugData(): { x: number; y: number; z: number; rateX: number; rateY: number } {
        return {
            x: this._rawX,
            y: this._rawY,
            z: this._rawZ,
            rateX: this._changeRateX,
            rateY: this._changeRateY,
        };
    }

    /** 检查陀螺仪是否可用 */
    public get isAvailable(): boolean {
        return this._initialized;
    }

    /** 重新请求权限（用户手势后调用） */
    public requestPermission(): Promise<boolean> {
        return this._requestPermissionInternal();
    }

    /* ======================== 陀螺仪初始化 ======================== */

    private _tryInitGyroscope(): void {
        // 检查平台是 Douyin / TT（使用 tt 全局对象）
        if (this._getTT()) {
            // 小游戏平台使用 tt.onAccelerometerChange
            this._initTTAccelerometer();
            return;
        }

        // H5 环境使用 DeviceMotionEvent
        if (typeof DeviceMotionEvent !== 'undefined') {
            this._initH5DeviceMotion();
        } else {
            console.warn('[GyroManager] 当前环境不支持陀螺仪，使用PC调试回退');
            this._initialized = false;
        }
    }

    /** 抖音/抖音小游戏加速度计 API */
    private _initTTAccelerometer(): void {
        const tt = this._getTT();
        if (!tt) return;

        try {
            // 字节小游戏加速度计
            tt.startAccelerometer({
                interval: 'game', // game / ui / normal
                success: () => {
                    this._initialized = true;
                    this._hasPermission = true;
                    console.log('[GyroManager] TT加速计启动成功');

                    // 注册加速度变化回调
                    tt.onAccelerometerChange((res: { x: number; y: number; z: number }) => {
                        this._processRawData(res.x, res.y, res.z);
                    });
                },
                fail: (err: any) => {
                    console.warn('[GyroManager] TT加速计启动失败', err);
                    this._initialized = false;
                },
            });
        } catch (e) {
            console.warn('[GyroManager] TT加速计 API 异常', e);
            this._initialized = false;
        }
    }

    /** H5 DeviceMotion API */
    private _initH5DeviceMotion(): void {
        const handler = (event: DeviceMotionEvent) => {
            const acc = event.accelerationIncludingGravity;
            if (acc && acc.x !== null && acc.y !== null) {
                this._processRawData(acc.x, acc.y, acc.z ?? 0);
            }
        };

        // iOS 13+ 需要用户手势触发权限请求
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            // 等用户交互后调用 requestPermission
            this._initialized = false;
            // 保存 handler 后续启用
            (this as any)._deviceMotionHandler = handler;
        } else {
            window.addEventListener('devicemotion', handler);
            this._initialized = true;
            this._hasPermission = true;
        }
    }

    private _requestPermissionInternal(): Promise<boolean> {
        return new Promise((resolve) => {
            if (this._hasPermission) {
                resolve(true);
                return;
            }

            if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                (DeviceMotionEvent as any)
                    .requestPermission()
                    .then((state: string) => {
                        if (state === 'granted') {
                            const handler = (this as any)._deviceMotionHandler;
                            if (handler) {
                                window.addEventListener('devicemotion', handler);
                            }
                            this._initialized = true;
                            this._hasPermission = true;
                            resolve(true);
                        } else {
                            console.warn('[GyroManager] 用户拒绝陀螺仪权限');
                            resolve(false);
                        }
                    })
                    .catch((err: any) => {
                        console.error('[GyroManager] 权限请求失败', err);
                        resolve(false);
                    });
            } else {
                // 非 iOS 13+，直接可用
                this._initialized = true;
                this._hasPermission = true;
                resolve(true);
            }
        });
    }

    private _teardownGyroscope(): void {
        const tt = this._getTT();
        if (tt) {
            try {
                tt.stopAccelerometer();
                tt.offAccelerometerChange();
            } catch (_) { /* ignore */ }
        } else {
            // 浏览器环境，没有简单移除方式，按需处理
        }
    }

    /* ======================== 核心数据处理 ======================== */

    /**
     * 处理原始加速度数据
     *   - 低通滤波去除高频噪声
     *   - 计算变化率（一阶差分）
     *   - 阈值比较 → 触发事件
     */
    private _processRawData(rawX: number, rawY: number, rawZ: number): void {
        // 存储原始值
        this._rawX = rawX;
        this._rawY = rawY;
        this._rawZ = rawZ;

        // 低通滤波: new = filter * raw + (1 - filter) * old
        const f = this._filterFactor;
        const prevX = this._filteredX;
        const prevY = this._filteredY;
        this._filteredX = f * rawX + (1 - f) * prevX;
        this._filteredY = f * rawY + (1 - f) * prevY;
        this._filteredZ = f * rawZ + (1 - f) * this._filteredZ;

        // 变化率（一阶差分）
        this._changeRateX = Math.abs(this._filteredX - prevX);
        this._changeRateY = Math.abs(this._filteredY - prevY);

        // 应用灵敏度
        const vertThreshold = this.verticalThreshold / this.sensitivity;
        const horizThreshold = this.horizontalThreshold / this.sensitivity;

        // 未激活时不触发战斗事件
        if (!this._active) return;

        const now = performance.now();

        // ---- 垂直摇晃检测 (Y轴变化率) → 攻击/必杀 ----
        if (this._changeRateY > vertThreshold) {
            // 能量满 → 必杀
            if (this._canUltimate(now)) {
                this._triggerUltimate(now);
            }
            // 普通攻击
            else if (this._canAttack(now)) {
                this._triggerAttack(now);
            }
        }

        // ---- 水平摇晃检测 (X轴变化率) → 格挡 ----
        if (this._changeRateX > horizThreshold) {
            if (!this._isShielding) {
                this._startShield(now);
            }
        }
    }

    /* ======================== 动作触发 ======================== */

    private _canAttack(now: number): boolean {
        return now - this._lastAttackTime >= this.attackCooldown;
    }

    private _canUltimate(now: number): boolean {
        return now - this._lastUltimateTime >= this.ultimateCooldown;
    }

    private _triggerAttack(now: number): void {
        this._lastAttackTime = now;
        this._vibrate(VibePattern.ATTACK);
        GameCtrl.emit(GameEvent.GYRO_ATTACK);
    }

    /** 由 Player 在能量满时调用，通知 GyroManager 下次攻击变为必杀 */
    public triggerUltimate(): void {
        const now = performance.now();
        if (this._canUltimate(now)) {
            this._triggerUltimate(now);
        }
    }

    private _triggerUltimate(now: number): void {
        this._lastUltimateTime = now;
        this._vibrate(VibePattern.ULTIMATE);
        GameCtrl.emit(GameEvent.GYRO_ULTIMATE);
    }

    private _startShield(now: number): void {
        this._isShielding = true;
        this._shieldTimer = this.shieldDuration;
        this._lastShieldEndTime = now + this.shieldDuration;

        this._vibrate(VibePattern.SHIELD);
        GameCtrl.emit(GameEvent.GYRO_SHIELD);
    }

    private _endShield(): void {
        if (this._isShielding) {
            this._isShielding = false;
            this._shieldTimer = 0;
            GameCtrl.emit(GameEvent.GYRO_SHIELD_END);
        }
    }

    /* ======================== 震动反馈 ======================== */

    private _vibrate(pattern: VibePattern | string): void {
        if (!this.vibrationEnabled) return;

        try {
            const tt = this._getTT();
            if (tt?.vibrateShort) {
                // 抖音小游戏
                if (pattern === VibePattern.ULTIMATE) {
                    tt.vibrateLong({ fail: () => {} });
                } else {
                    tt.vibrateShort({ type: 'medium', fail: () => {} });
                }
            } else if (navigator.vibrate) {
                // H5 标准 vibration API
                const duration = typeof pattern === 'number' ? pattern : pattern.split(',').map(Number);
                navigator.vibrate(duration as any);
            }
        } catch (_) {
            // 静默失败（某些环境禁止 vibrate）
        }
    }

    private _getTT(): any | null {
        return (globalThis as { tt?: any }).tt ?? null;
    }

    /* ======================== PC 调试回退 ======================== */

    private _setupPcFallback(): void {
        if (!this.pcDebugFallback) return;

        // 鼠标模拟
        game.canvas!.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button === 0) this._mouseDown = true;
        });
        game.canvas!.addEventListener('mouseup', (e: MouseEvent) => {
            if (e.button === 0) this._mouseDown = false;
        });
        game.canvas!.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
        });

        // 键盘模拟
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            this._keyDown.add(e.key.toLowerCase());
        });
        window.addEventListener('keyup', (e: KeyboardEvent) => {
            this._keyDown.delete(e.key.toLowerCase());
        });
    }

    private _teardownPcFallback(): void {
        // 清理工作（非必须，组件销毁时随场景清理）
    }

    private _pollPcInput(): void {
        if (!this._active) return;
        const now = performance.now();

        // 空格键模拟垂直摇晃 → 攻击
        if (this._keyDown.has(' ') || this._mouseDown) {
            if (this._canAttack(now)) {
                // 模拟 Y 轴变化率超阈值
                this._changeRateY = this.verticalThreshold + 1;
                this._triggerAttack(now);
            }
        }

        // Shift 键模拟水平摇晃 → 格挡
        if (this._keyDown.has('shift')) {
            if (!this._isShielding) {
                this._startShield(now);
            }
        } else {
            if (this._isShielding) {
                this._endShield();
            }
        }
    }
}
