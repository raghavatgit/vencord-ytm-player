/**
 * LRU Artwork and Audio Stream Cache
 * Bounded memory cache retaining image blob URLs with size-tiered eviction.
 */

export class BoundedLRUCache<K, V> {
  private map: Map<K, V> = new Map();

  constructor(private readonly maxEntries: number = 50) {}

  public get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    // Re-insert to mark as recently used
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  public set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      // Evict oldest entry (first key in iteration order)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
  }

  public clear(): void {
    this.map.clear();
  }

  public size(): number {
    return this.map.size;
  }
}
