// Progressive Audio Chunk Preloader
// Pre-fetches subsequent track audio buffers into memory to achieve gapless transitions.

export class TrackPreloader {
    private cache: Map<string, ArrayBuffer> = new Map();
    private activeRequests: Map<string, AbortController> = new Map();

    public async preloadTrack(url: string): Promise<void> {
        if (this.cache.has(url) || this.activeRequests.has(url)) return;

        const controller = new AbortController();
        this.activeRequests.set(url, controller);

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const buffer = await response.arrayBuffer();
            this.cache.set(url, buffer);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error(`Preload failed for ${url}:`, err);
            }
        } finally {
            this.activeRequests.delete(url);
        }
    }

    public getPreloadedBuffer(url: string): ArrayBuffer | undefined {
        return this.cache.get(url);
    }

    public evict(url: string): void {
        this.cache.delete(url);
    }
}
