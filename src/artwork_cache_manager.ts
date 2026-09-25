/**
 * Artwork Cache Manager
 * Bounded memory cache storing track album thumbnails as ObjectURLs with LRU eviction.
 */

export class ArtworkCacheManager {
  private cache: Map<string, string>; // url -> blobObjectUrl
  private maxItems: number;

  constructor(maxItems = 30) {
    this.maxItems = maxItems;
    this.cache = new Map();
  }

  public get(url: string): string | null {
    if (!this.cache.has(url)) return null;
    // Refresh LRU order
    const objUrl = this.cache.get(url)!;
    this.cache.delete(url);
    this.cache.set(url, objUrl);
    return objUrl;
  }

  public put(url: string, blobUrl: string): void {
    if (this.cache.has(url)) {
      this.cache.delete(url);
    } else if (this.cache.size >= this.maxItems) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        const oldBlob = this.cache.get(oldestKey);
        if (oldBlob && typeof URL !== "undefined" && URL.revokeObjectURL) {
          URL.revokeObjectURL(oldBlob);
        }
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(url, blobUrl);
  }

  public clear(): void {
    if (typeof URL !== "undefined" && URL.revokeObjectURL) {
      for (const blobUrl of this.cache.values()) {
        URL.revokeObjectURL(blobUrl);
      }
    }
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}
