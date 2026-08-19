/**
 * In-Memory TTL Cache Utility — DisasterLens AI
 *
 * Simple, efficient TTL cache for coordinate-based weather responses
 * and external API query caching.
 */
export class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  /**
   * Set a key with value and TTL in milliseconds.
   *
   * @param {string} key
   * @param {any} value
   * @param {number} ttlMs - Time to live in milliseconds (default: 15 minutes)
   */
  set(key, value, ttlMs = 15 * 60 * 1000) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Get value for key. Returns null if expired or missing.
   *
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Check if a valid (non-expired) key exists.
   *
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a key from cache.
   *
   * @param {string} key
   * @returns {boolean}
   */
  delete(key) {
    return this.store.delete(key);
  }

  /**
   * Clear all items from cache.
   */
  clear() {
    this.store.clear();
  }

  /**
   * Generate a rounded, coordinate-aware cache key.
   * Rounds lat/lon to 2 decimal places (~1.1 km resolution).
   *
   * @param {string} prefix - e.g. "weather" or "flood"
   * @param {number} lat
   * @param {number} lon
   * @returns {string} e.g. "weather:18.52:73.86"
   */
  getCoordKey(prefix, lat, lon) {
    const rLat = Number(lat).toFixed(2);
    const rLon = Number(lon).toFixed(2);
    return `${prefix}:${rLat}:${rLon}`;
  }
}

export const cache = new MemoryCache();
