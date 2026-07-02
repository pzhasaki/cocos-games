/**
 * TTAdapter.ts — TikTok小游戏 + H5回退适配实现
 *
 * 提供:
 *   1. TikTok 小游戏平台实现 (TTAdapter)
 *   2. H5 浏览器回退实现 (H5FallbackAdapter)
 *
 * 与 DouyinAdapter 共享同一 IPlatformAPI 接口，业务代码无缝切换
 */
import { _decorator } from 'cc';
import { IPlatformAPI } from './PlatformDef';

/* ===================================================================
 * 1. TikTok 小游戏适配
 * =================================================================== */

declare const tt: any;

export class TTAdapter implements IPlatformAPI {
    public readonly name: string = 'TikTok';

    init(): void {
        console.log('[TTAdapter] TikTok小游戏适配初始化完成');
        if (typeof tt !== 'undefined') {
            try {
                tt.onShow(() => {});
                tt.onHide(() => {});
                tt.onError((err: any) => console.error('[TTAdapter] error:', err));
            } catch (_) { /* ignore */ }
        }
    }

    showToast(msg: string): void {
        if (typeof tt === 'undefined') return;
        try { tt.showToast({ title: msg, icon: 'none', duration: 2000 }); } catch (_) {}
    }

    vibrateShort(): void {
        if (typeof tt === 'undefined') return;
        try { tt.vibrateShort(); } catch (_) {}
    }

    vibrateLong(): void {
        if (typeof tt === 'undefined') return;
        try { tt.vibrateLong(); } catch (_) {}
    }

    async showInterstitialAd(): Promise<boolean> {
        if (typeof tt === 'undefined') return false;
        return new Promise((resolve) => {
            try {
                // TikTok 插屏广告命名空间与抖音一致
                const ad = tt.createInterstitialAd({ adUnitId: '' });
                ad.show().then(() => resolve(true)).catch(() => resolve(false));
            } catch (_) { resolve(false); }
        });
    }

    async showRewardedAd(): Promise<boolean> {
        if (typeof tt === 'undefined') return false;
        return new Promise((resolve) => {
            try {
                const ad = tt.createRewardedVideoAd({ adUnitId: '' });
                ad.onClose((res: any) => resolve(res?.isEnded ?? false));
                ad.show().catch(() => resolve(false));
            } catch (_) { resolve(false); }
        });
    }

    async login(): Promise<{ userId: string; token: string }> {
        if (typeof tt === 'undefined') {
            return { userId: 'tt_debug', token: 'tt_debug_token' };
        }
        return new Promise((resolve) => {
            tt.login({
                success: (res: any) => resolve({ userId: res.code ?? '', token: '' }),
                fail: () => resolve({ userId: '', token: '' }),
            });
        });
    }

    async saveCloudData(key: string, data: any): Promise<void> {
        if (typeof tt === 'undefined') {
            localStorage.setItem(key, JSON.stringify(data));
            return;
        }
        return new Promise((resolve) => {
            tt.setCloudStorage({
                KVDataList: [{ key, value: JSON.stringify(data) }],
                success: () => resolve(),
                fail: () => resolve(),
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

    async share(imageUrl?: string): Promise<void> {
        if (typeof tt === 'undefined') return;
        try {
            tt.shareAppMessage({
                title: 'Rollvive - Roll to Survive!',
                imageUrl: imageUrl ?? '',
            });
        } catch (_) {}
    }

    getHealthNotice(): string {
        // TikTok 海外版不需要健康游戏忠告，返回空或简版
        return '';
    }

    needGyroPermission(): boolean {
        // TikTok 海外版在 iOS 13+ 也需要权限
        return typeof DeviceMotionEvent !== 'undefined'
            && typeof (DeviceMotionEvent as any).requestPermission === 'function';
    }

    async requestGyroPermission(): Promise<boolean> {
        if (!this.needGyroPermission()) return true;
        try {
            const state = await (DeviceMotionEvent as any).requestPermission();
            return state === 'granted';
        } catch {
            return false;
        }
    }
}

/* ===================================================================
 * 2. H5 浏览器回退实现
 * =================================================================== */

export class H5FallbackAdapter implements IPlatformAPI {
    public readonly name: string = 'H5';

    init(): void {
        console.log('[H5FallbackAdapter] H5回退模式');
    }

    showToast(msg: string): void {
        // H5 无原生 toast，用 console 模拟
        console.log(`[Toast] ${msg}`);
    }

    vibrateShort(): void {
        try {
            if (navigator.vibrate) navigator.vibrate(30);
        } catch (_) {}
    }

    vibrateLong(): void {
        try {
            if (navigator.vibrate) navigator.vibrate(100);
        } catch (_) {}
    }

    async showInterstitialAd(): Promise<boolean> { return false; }
    async showRewardedAd(): Promise<boolean> { return false; }

    async login(): Promise<{ userId: string; token: string }> {
        return { userId: 'h5_user', token: 'h5_token' };
    }

    async saveCloudData(key: string, data: any): Promise<void> {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (_) {}
    }

    async loadCloudData(key: string): Promise<any> {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    async share(_imageUrl?: string): Promise<void> {
        // H5 无原生分享
        console.log('[H5FallbackAdapter] 分享功能在H5不可用');
    }

    getHealthNotice(): string {
        // H5 展示简版注意
        return '适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。';
    }

    needGyroPermission(): boolean {
        return typeof DeviceMotionEvent !== 'undefined'
            && typeof (DeviceMotionEvent as any).requestPermission === 'function';
    }

    async requestGyroPermission(): Promise<boolean> {
        if (!this.needGyroPermission()) return true;
        try {
            const state = await (DeviceMotionEvent as any).requestPermission();
            return state === 'granted';
        } catch {
            return false;
        }
    }
}
