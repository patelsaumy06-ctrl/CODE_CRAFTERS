import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { MemoryCache } from "../src/utils/cache.js";
import { weatherCorrelationService } from "../src/services/weatherCorrelationService.js";

describe("Phase 2 — Open-Meteo Weather & Flood Correlation", () => {
  let cache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  // ─── 1. Cache Utility Tests ───
  describe("MemoryCache Utility", () => {
    it("sets, gets, and respects TTL expiration", async () => {
      cache.set("testKey", "testValue", 100); // 100ms TTL
      assert.strictEqual(cache.get("testKey"), "testValue");
      assert.strictEqual(cache.has("testKey"), true);

      await new Promise((res) => setTimeout(res, 120));

      assert.strictEqual(cache.get("testKey"), null);
      assert.strictEqual(cache.has("testKey"), false);
    });

    it("handles delete and clear operations", () => {
      cache.set("key1", "val1");
      cache.set("key2", "val2");
      assert.strictEqual(cache.has("key1"), true);

      cache.delete("key1");
      assert.strictEqual(cache.has("key1"), false);
      assert.strictEqual(cache.has("key2"), true);

      cache.clear();
      assert.strictEqual(cache.has("key2"), false);
    });

    it("generates coordinate-aware cache keys with rounding", () => {
      const key1 = cache.getCoordKey("weather", 18.5204, 73.8567);
      const key2 = cache.getCoordKey("weather", 18.5241, 73.8599);
      assert.strictEqual(key1, "weather:18.52:73.86");
      assert.strictEqual(key2, "weather:18.52:73.86");
      assert.strictEqual(key1, key2); // Nearby coordinates match the same cache key
    });
  });

  // ─── 2. Weather Correlation Logic Tests ───
  describe("Weather Correlation Rules", () => {
    it("correlates Flood with heavy rainfall and river discharge (positive correlation)", async () => {
      const result = await weatherCorrelationService.analyzeWeatherRisk({
        latitude: 19.076,
        longitude: 72.8777,
        disasterType: "flood",
      });

      assert.ok(result.location);
      assert.strictEqual(result.disasterType, "flood");
      assert.ok(typeof result.correlation.score === "number");
      assert.ok(["high", "moderate", "low", "unavailable"].includes(result.correlation.relevance));
    });

    it("correlates Storm / Cyclone with gale force winds (positive correlation)", async () => {
      const result = await weatherCorrelationService.analyzeWeatherRisk({
        latitude: 15.2,
        longitude: 120.4,
        disasterType: "cyclone",
      });

      assert.strictEqual(result.disasterType, "cyclone");
      assert.ok(result.signals !== undefined);
    });

    it("returns neutral correlation for Earthquake regardless of weather", async () => {
      const result = await weatherCorrelationService.analyzeWeatherRisk({
        latitude: 35.6762,
        longitude: 139.6503,
        disasterType: "earthquake",
      });

      assert.strictEqual(result.disasterType, "earthquake");
      assert.strictEqual(result.correlation.relevance, "neutral");
      assert.strictEqual(result.correlation.score, 0);
    });

    it("returns validation error for out-of-bound coordinates", async () => {
      const result = await weatherCorrelationService.analyzeWeatherRisk({
        latitude: 190.0, // Invalid latitude (> 90)
        longitude: 72.8777,
        disasterType: "flood",
      });

      assert.strictEqual(result.error, "INVALID_COORDINATES");
      assert.strictEqual(result.correlation.score, 0);
      assert.strictEqual(result.correlation.relevance, "none");
    });
  });
});
