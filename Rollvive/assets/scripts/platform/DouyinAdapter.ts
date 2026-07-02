/**
 * DouyinAdapter.ts — 抖音小游戏平台适配实现
 *
 * 为抖音小游戏提供完整的平台接口实现:
 *   - 登录
 *   - 支付
 *   - 广告
 *   - 陀螺仪
 *   - 云存档
 *   - 分享
 *   - 健康游戏忠告
 *
 * 编译条件: 通过 PlatformDef.ts 的条件分支加载
 * Cocos 构建时: 在抖音构建模板中正常打包，无需额外配置
 */
import { _decorator } from 'cc';
import { IPlatformAPI, PlatformDef } from './PlatformDef';

declare const tt: any; // 抖音小游戏全局对象

export class DouyinAdapter implements IPlatformAPI {
    public readonly name: string = 'Douyin';

    init(): void {
        console.log('[DouyinAdapter] 抖音小游戏适配初始化完成');

        // 生命周期监听
        this._registerLifecycle();
    }

    /* ---- 生命周期 ---- */

    private _registerLifecycle(): void {
        if (typeof tt === 'undefined') return;

        try {
            // 前景/后台切换
            tt.onShow(() => {
                console.log('[DouyinAdapter] 游戏回到前台');
            });
            tt.onHide(() => {
                console.log('[DouyinAdapter] 游戏进入后台');
            });

            // 错误监控
            tt.onError((err: any) => {
                console.error('[DouyinAdapter] 运行时错误:', err);
            });
        } catch (e) {
            console.warn('[DouyinAdapter] 生命周期注册失败', e);
        }
    }

    /* ---- Toast ---- */

    showToast(msg: string): void {
        if (typeof tt === 'undefined') return;
        try {
            tt.showToast({
                title: msg,
                icon: 'none',
                duration: 2000,
            });
        } catch (_) { /* ignore */ }
    }

    /* ---- 震动 ---- */

    vibrateShort(): void {
        if (typeof tt === 'undefined') return;
        try {
            tt.vibrateShort({ type: 'medium' });
        } catch (_) { /* ignore */ }
    }

    vibrateLong(): void {
        if (typeof tt === 'undefined') return;
        try {
            tt.vibrateLong();
        } catch (_) { /* ignore */ }
    }

    /* ---- 广告 ---- */

    async showInterstitialAd(): Promise<boolean> {
        if (typeof tt === 'undefined') return false;
        return new Promise((resolve) => {
            try {
                const ad = tt.createInterstitialAd({
                    adUnitId: '', // 替换为真实广告位
                });
                ad.show().then(() => resolve(true)).catch(() => resolve(false));
            } catch (_) {
                resolve(false);
            }
        });
    }

    async showRewardedAd(): Promise<boolean> {
        if (typeof tt === 'undefined') return false;
        return new Promise((resolve) => {
            try {
                const ad = tt.createRewardedVideoAd({
                    adUnitId: '', // 替换为真实广告位
                });
                ad.onClose((res: any) => {
                    resolve(res.isEnded ?? false);
                });
                ad.show().catch(() => resolve(false));
            } catch (_) {
                resolve(false);
            }
        });
    }

    /* ---- 登录 ---- */

    async login(): Promise<{ userId: string; token: string }> {
        if (typeof tt === 'undefined') {
            return { userId: 'debug_user', token: 'debug_token' };
        }
        return new Promise((resolve, reject) => {
            tt.login({
                force: true,
                success: (res: any) => {
                    resolve({
                        userId: res.code ?? '',
                        token: res.anonymousCode ?? '',
                    });
                },
                fail: (err: any) => {
                    console.warn('[DouyinAdapter] 登录失败', err);
                    resolve({ userId: '', token: '' });
                },
            });
        });
    }

    /* ---- 云存档 ---- */

    async saveCloudData(key: string, data: any): Promise<void> {
        if (typeof tt === 'undefined') {
            // H5 fallback 用 localStorage
            localStorage.setItem(key, JSON.stringify(data));
            return;
        }
        return new Promise((resolve, reject) => {
            tt.setCloudStorage({
                KVDataList: [{ key, value: JSON.stringify(data) }],
                success: () => resolve(),
                fail: (err: any) => {
                    console.warn('[DouyinAdapter] 云存档保存失败', err);
                    resolve();
                },
            });
        });
    }

    async loadCloudData(key: string): Promise<any> {
        if (typeof tt === 'undefined') {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        }
        return new Promise((resolve) => {
            tt.getCloudStorage({
                keyList: [key],
                success: (res: any) => {
                    const item = res.KVDataList?.find((d: any) => d.key === key);
                    resolve(item ? JSON.parse(item.value) : null);
                },
                fail: () => resolve(null),
            });
        });
    }

    /* ---- 分享 ---- */

    async share(imageUrl?: string): Promise<void> {
        if (typeof tt === 'undefined') return;
        try {
            tt.shareAppMessage({
                title: 'Roll命 — 抽到神装，割草无双！',
                imageUrl: imageUrl ?? '',
                query: 'from=share',
            });
        } catch (_) { /* ignore */ }
    }

    /* ---- 健康游戏忠告 ---- */

    getHealthNotice(): string {
        return '健康游戏忠告：抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。';
    }

    /* ---- 陀螺仪权限 ---- */

    needGyroPermission(): boolean {
        return false; // 抖音小游戏不需要额外权限
    }

    async requestGyroPermission(): Promise<boolean> {
        return true; // 直接可用
    }
}
