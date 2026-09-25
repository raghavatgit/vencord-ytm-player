import { describe, it, expect, beforeEach } from "vitest";
import { ArtworkCacheManager } from "./artwork_cache_manager";

describe("ArtworkCacheManager", () => {
  let cache: ArtworkCacheManager;

  beforeEach(() => {
    cache = new ArtworkCacheManager(2);
  });

  it("stores and retrieves artwork URLs", () => {
    cache.put("url1", "blob:url1");
    expect(cache.get("url1")).toBe("blob:url1");
  });

  it("evicts oldest entry when exceeding max size", () => {
    cache.put("url1", "blob:url1");
    cache.put("url2", "blob:url2");
    cache.put("url3", "blob:url3");

    expect(cache.size()).toBe(2);
    expect(cache.get("url1")).toBeNull();
    expect(cache.get("url2")).toBe("blob:url2");
    expect(cache.get("url3")).toBe("blob:url3");
  });

  it("refreshes LRU on access", () => {
    cache.put("url1", "blob:url1");
    cache.put("url2", "blob:url2");
    // Access url1 to make it most recently used
    cache.get("url1");
    // Inserting url3 should evict url2
    cache.put("url3", "blob:url3");

    expect(cache.get("url1")).toBe("blob:url1");
    expect(cache.get("url2")).toBeNull();
    expect(cache.get("url3")).toBe("blob:url3");
  });
});
