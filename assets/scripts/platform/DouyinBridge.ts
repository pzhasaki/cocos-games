export interface MotionSample {
  x: number;
  y: number;
  z: number;
  time: number;
}

export type MotionListener = (sample: MotionSample) => void;

type RewardHandler = (rewarded: boolean) => void;

export class MiniGameBridge {
  private get miniGameApi(): any {
    const globals = globalThis as any;
    return globals.TTMinis?.game || globals.tt;
  }

  get isTikTokMiniGame(): boolean {
    return !!(globalThis as any).TTMinis?.game;
  }

  get isDouyinMiniGame(): boolean {
    return !!(globalThis as any).tt && !this.isTikTokMiniGame;
  }

  get isMiniGameRuntime(): boolean {
    return !!this.miniGameApi;
  }

  login(onCode?: (code: string) => void): void {
    const api = this.miniGameApi;
    if (!api || !api.login) {
      return;
    }

    api.login({
      success: (result: any) => {
        const code = String(result?.code || '');
        if (code) {
          onCode?.(code);
        }
      },
      fail: () => {},
    });
  }

  getStorageItem(key: string): string | null {
    const api = this.miniGameApi;

    try {
      if (api && api.getStorageSync) {
        const value = api.getStorageSync(key);
        return value == null ? null : String(value);
      }
    } catch {
      // Fall through to web storage below.
    }

    try {
      const storage = (globalThis as any).localStorage;
      return storage ? storage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  setStorageItem(key: string, value: string): void {
    const api = this.miniGameApi;

    try {
      if (api && api.setStorageSync) {
        api.setStorageSync(key, value);
        return;
      }
    } catch {
      // Fall through to web storage below.
    }

    try {
      const storage = (globalThis as any).localStorage;
      if (storage) {
        storage.setItem(key, value);
      }
    } catch {
      // Storage may be unavailable in some preview environments.
    }
  }

  startAccelerometer(listener: MotionListener): () => void {
    const api = this.miniGameApi;

    if (api && api.startAccelerometer && api.onAccelerometerChange) {
      const handler = (res: any) => {
        listener({
          x: Number(res.x || 0),
          y: Number(res.y || 0),
          z: Number(res.z || 0),
          time: Date.now(),
        });
      };

      api.startAccelerometer({ interval: 'game' });
      api.onAccelerometerChange(handler);

      return () => {
        if (api.offAccelerometerChange) {
          api.offAccelerometerChange(handler);
        }
        if (api.stopAccelerometer) {
          api.stopAccelerometer();
        }
      };
    }

    const win = (globalThis as any).window;
    if (win && win.addEventListener) {
      const handler = (event: any) => {
        const acceleration = event.accelerationIncludingGravity || event.acceleration;
        if (!acceleration) {
          return;
        }

        listener({
          x: this.normalizeAcceleration(Number(acceleration.x || 0)),
          y: this.normalizeAcceleration(Number(acceleration.y || 0)),
          z: this.normalizeAcceleration(Number(acceleration.z || 0)),
          time: Date.now(),
        });
      };

      win.addEventListener('devicemotion', handler);
      return () => win.removeEventListener('devicemotion', handler);
    }

    return () => {};
  }

  showRewardedVideo(adUnitId: string, onClose: RewardHandler): void {
    const api = this.miniGameApi;

    if (!api || !api.createRewardedVideoAd) {
      onClose(!this.isMiniGameRuntime);
      return;
    }

    if (!adUnitId) {
      this.showToast('广告位未配置');
      onClose(!this.isMiniGameRuntime);
      return;
    }

    const videoAd = api.createRewardedVideoAd({ adUnitId });
    let settled = false;

    const finish = (rewarded: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      if (videoAd.offClose) {
        videoAd.offClose(closeHandler);
      }
      if (videoAd.offError) {
        videoAd.offError(errorHandler);
      }
      onClose(rewarded);
    };

    const closeHandler = (res: any) => {
      finish(!res || res.isEnded !== false);
    };
    const errorHandler = () => {
      this.showToast('广告暂时没准备好');
      finish(false);
    };

    if (videoAd.onClose) {
      videoAd.onClose(closeHandler);
    }
    if (videoAd.onError) {
      videoAd.onError(errorHandler);
    }

    const show = () => Promise.resolve(videoAd.show()).catch(errorHandler);
    if (videoAd.load) {
      Promise.resolve(videoAd.load()).then(show).catch(errorHandler);
    } else {
      show();
    }
  }

  vibrateShort(): void {
    const api = this.miniGameApi;
    if (api && api.vibrateShort) {
      api.vibrateShort({ type: 'light' });
      return;
    }

    const nav = (globalThis as any).navigator;
    if (nav && nav.vibrate) {
      nav.vibrate(30);
    }
  }

  showToast(title: string): void {
    const api = this.miniGameApi;
    if (api && api.showToast) {
      api.showToast({ title, icon: 'none', duration: 1500 });
    }
  }

  private normalizeAcceleration(value: number): number {
    if (Math.abs(value) > 2) {
      return value / 9.8;
    }
    return value;
  }
}

export const miniGameBridge = new MiniGameBridge();
export const douyinBridge = miniGameBridge;
