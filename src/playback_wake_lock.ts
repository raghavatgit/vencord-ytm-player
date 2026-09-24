// Web Screen Wake Lock Manager
// Prevents device display and system sleep when playback is actively running.

export class PlaybackWakeLock {
    private wakeLock: any = null;

    public async requestLock(): Promise<void> {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await (navigator as any).wakeLock.request('screen');
                this.wakeLock.addEventListener('release', () => {
                    this.wakeLock = null;
                });
            } catch (err) {
                console.warn('Wake Lock request rejected:', err);
            }
        }
    }

    public releaseLock(): void {
        if (this.wakeLock) {
            this.wakeLock.release().catch(() => {});
            this.wakeLock = null;
        }
    }
}
