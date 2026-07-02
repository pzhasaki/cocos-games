/**
 * PlatformDef.ts — 平台抽象定义层
 *
 * 职责:
 *   - 检测当前平台（抖音小游戏 / TikTok / H5 / 未知）
 *   - 提供统一平台接口调用
 *   - 条件分支隔离: 游戏业务代码只依赖本模块
 *
 * 使用方式:
 *   - PlatformDef.init() 在 GameCtrl.onLoad 时调用
 *   - PlatformDef.isDouyin / PlatformDef.isTT 判断平台
 *   - PlatformDef.showToast / PlatformDef.vibrate 等统一调用
 *
 * 抖音小游戏 vs TikTok 条件分支:
 *   同一套工程，通过 PlatformDef 做接口抽象，双平台各自实现
 */
import { _decorator, Component } from 'cc';
import { DouyinAdapter } from './DouyinAdapter';
import { H5FallbackAdapter, TTAdapter } from './TTAdapter';

const { ccclass } = _decorator;

/** 平台枚举 */
export enum EPlatform {
    UNKNOWN = 'UNKNOWN',
    /** H5 浏览器 */
    H5 = 'H5',
    /** 抖音小游戏 (国内) */
    DOUYIN = 'DOUYIN',
    /** TikTok 小游戏 (海外) */
    TT = 'TT',
}

/**
 * 平台接口定义
 * 抖音 和 TikTok 各自实现此接口
 */
export interface IPlatformAPI {
    /** 平台名 */
    readonly name: string;

    /** 初始化 */
    init(): void;

    /** 显示Toast */
    showToast(msg: string): void;

    /** 短震动 */
    vibrateShort(): void;

    /** 长震动 */
    vibrateLong(): void;

    /** 显示插屏广告 */
    showInterstitialAd(): Promise<boolean>;

    /** 显示激励视频广告 */
    showRewardedAd(): Promise<boolean>;

    /** 登录 */
    login(): Promise<{ userId: string; token: string }>;

    /** 云存档写入 */
    saveCloudData(key: string, data: any): Promise<void>;

    /** 云存档读取 */
    loadCloudData(key: string): Promise<any>;

    /** 分享 */
    share(imageUrl?: string): Promise<void>;

    /** 健康游戏忠告文本 */
    getHealthNotice(): string;

    /** 陀螺仪是否始终需要权限 */
    needGyroPermission(): boolean;

    /** 请求陀螺仪权限 */
    requestGyroPermission(): Promise<boolean>;
}

/* ======================== 实现注册 ======================== */

/** 已注册的平台实现 */
let _impl: IPlatformAPI | null = null;
let _platform: EPlatform = EPlatform.UNKNOWN;

/* ======================== 公开API ======================== */

export class PlatformDef {
    /** 检测当前平台并初始化适配层 */
    static init(): void {
        if (_impl) return; // 已初始化

        _platform = PlatformDef._detectPlatform();
        console.log(`[PlatformDef] 检测到平台: ${_platform}`);

        switch (_platform) {
            case EPlatform.DOUYIN:
                try {
                    _impl = new DouyinAdapter();
                } catch (e) {
                    console.warn('[PlatformDef] 抖音适配加载失败，使用默认', e);
                    _impl = PlatformDef._createDefaultImpl();
                }
                break;
            case EPlatform.TT:
                try {
                    _impl = new TTAdapter();
                } catch (e) {
                    console.warn('[PlatformDef] TikTok适配加载失败，使用默认', e);
                    _impl = PlatformDef._createDefaultImpl();
                }
                break;
            default:
                _impl = PlatformDef._createDefaultImpl();
                break;
        }

        const impl = _impl ?? PlatformDef._createDefaultImpl();
        _impl = impl;
        impl.init();
    }

    /** 获取当前平台 */
    static get platform(): EPlatform {
        return _platform;
    }

    /** 是否抖音小游戏 */
    static get isDouyin(): boolean {
        return _platform === EPlatform.DOUYIN;
    }

    /** 是否 TikTok 小游戏 */
    static get isTT(): boolean {
        return _platform === EPlatform.TT;
    }

    /** 是否 H5 环境 */
    static get isH5(): boolean {
        return _platform === EPlatform.H5;
    }

    /** 获取当前实现 */
    static get impl(): IPlatformAPI {
        if (!_impl) {
            PlatformDef.init();
        }
        return _impl!;
    }

    /* ---- 快捷调用 ---- */

    static showToast(msg: string): void { PlatformDef.impl.showToast(msg); }
    static vibrateShort(): void { PlatformDef.impl.vibrateShort(); }
    static vibrateLong(): void { PlatformDef.impl.vibrateLong(); }
    static showInterstitialAd(): Promise<boolean> { return PlatformDef.impl.showInterstitialAd(); }
    static showRewardedAd(): Promise<boolean> { return PlatformDef.impl.showRewardedAd(); }
    static login(): Promise<{ userId: string; token: string }> { return PlatformDef.impl.login(); }
    static saveCloudData(key: string, data: any): Promise<void> { return PlatformDef.impl.saveCloudData(key, data); }
    static loadCloudData(key: string): Promise<any> { return PlatformDef.impl.loadCloudData(key); }
    static share(imageUrl?: string): Promise<void> { return PlatformDef.impl.share(imageUrl); }
    static getHealthNotice(): string { return PlatformDef.impl.getHealthNotice(); }
    static needGyroPermission(): boolean { return PlatformDef.impl.needGyroPermission(); }
    static requestGyroPermission(): Promise<boolean> { return PlatformDef.impl.requestGyroPermission(); }

    /* ======================== 内部 ======================== */

    /** 平台检测逻辑 */
    private static _detectPlatform(): EPlatform {
        if (PlatformDef._isTTEnvironment()) {
            // 进一步区分抖音 vs TikTok
            // 抖音特有: tt.pay / tt.getSystemInfoSync().platform === 'ios' / android
            const tt = PlatformDef._getTT();
            try {
                const sysInfo = tt?.getSystemInfoSync?.();
                // TikTok 的 appId 以 'tt' 开头且不包含 douyin 特征
                if (sysInfo && (sysInfo as any).appId) {
                    const appId = (sysInfo as any).appId as string;
                    if (PlatformDef._isDouyinAppId(appId)) {
                        return EPlatform.DOUYIN;
                    }
                }
                // 可以通过 language 判断: 抖音中文, TikTok 其他
                const lang = (sysInfo as any).language as string;
                if (lang && lang.startsWith('zh')) {
                    return EPlatform.DOUYIN;
                }
            } catch (_) {
                // 无法获取 sysInfo，通过全局变量特征再判断
                const ttGlobal = PlatformDef._getTT();
                if (ttGlobal) {
                    if (ttGlobal.pay || ttGlobal.requestSubscribeMessage) {
                        return EPlatform.DOUYIN;
                    }
                }
            }
            return EPlatform.TT; // 默认识别为海外版
        }

        // 浏览器 H5
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            return EPlatform.H5;
        }

        return EPlatform.UNKNOWN;
    }

    /** 检测是否字节小游戏环境 */
    private static _isTTEnvironment(): boolean {
        return PlatformDef._getTT() !== null;
    }

    private static _getTT(): any | null {
        return (globalThis as { tt?: any }).tt ?? null;
    }

    /** 简单判断是否抖音appId（以实际规则为准） */
    private static _isDouyinAppId(appId: string): boolean {
        // 抖音小游戏 appId 通常以 tt + 数字
        // TikTok 以 tiktok + 数字
        return appId.startsWith('tt') && !appId.startsWith('tiktok');
    }

    /** 创建默认实现 (H5 fallback) */
    private static _createDefaultImpl(): IPlatformAPI {
        return new H5FallbackAdapter();
    }
}
