import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { IngestionWorker } from "../src/workers/ingestionWorker.js";

describe("Phase 4 — Background Ingestion Worker", () => {
  let worker;

  beforeEach(() => {
    worker = new IngestionWorker();
  });

  afterEach(() => {
    worker.stop();
  });

  // ─── 1. Lifecycle & Scheduling Tests ───
  describe("Lifecycle & Scheduling", () => {
    it("starts and registers all 5 service intervals", () => {
      worker.start({ initialRun: false });
      assert.strictEqual(worker.running, true);
      assert.ok(worker.startedAt);
      assert.strictEqual(worker.timers.size, 5);

      const status = worker.getStatus();
      assert.strictEqual(status.running, true);
      assert.strictEqual(status.services.usgs.intervalMs, 300000);
      assert.strictEqual(status.services.gdacs.intervalMs, 300000);
      assert.strictEqual(status.services.eonet.intervalMs, 600000);
      assert.strictEqual(status.services.gdelt.intervalMs, 30000);
      assert.strictEqual(status.services.reliefweb.intervalMs, 1800000);
    });

    it("stops cleanly and clears all timers", () => {
      worker.start({ initialRun: false });
      assert.strictEqual(worker.running, true);

      worker.stop();
      assert.strictEqual(worker.running, false);
      assert.strictEqual(worker.timers.size, 0);

      const status = worker.getStatus();
      assert.strictEqual(status.running, false);
      assert.strictEqual(status.services.usgs.status, "stopped");
    });
  });

  // ─── 2. Overlap Prevention & Service Isolation ───
  describe("Overlap Prevention & Service Isolation", () => {
    it("prevents overlapping executions of the same service", async () => {
      // Simulate long-running service lock
      worker.locks.set("usgs", true);

      const result = await worker._executeService("usgs");
      assert.strictEqual(result.skipped, true);
      assert.strictEqual(result.reason, "Overlap prevention lock active");

      // Release lock
      worker.locks.set("usgs", false);
    });

    it("isolates service failures so other services continue normally", async () => {
      // Mock failing fetcher for GDELT
      worker.services.gdelt.fetcher = async () => {
        throw new Error("HTTP 503 Service Unavailable");
      };

      // Mock successful fetcher for USGS
      worker.services.usgs.fetcher = async () => {
        return [
          {
            id: "us_mock_1",
            properties: { mag: 4.5, place: "Test Region", time: Date.now() },
            geometry: { type: "Point", coordinates: [100.0, 15.0, 10] },
          },
        ];
      };

      // Run failing service
      const failRes = await worker._executeService("gdelt");
      assert.strictEqual(failRes.success, false);
      assert.ok(failRes.error.includes("503"));
      assert.strictEqual(worker.services.gdelt.failureCount, 1);

      // Run healthy service — should succeed independently!
      const okRes = await worker._executeService("usgs");
      assert.strictEqual(okRes.success, true);
      assert.strictEqual(okRes.processed, 1);
      assert.strictEqual(worker.services.usgs.successCount, 1);
    });

    it("processes batches gracefully even if individual items fail", async () => {
      worker.services.usgs.fetcher = async () => [
        {
          id: "us_valid_1",
          properties: { mag: 5.1, place: "California", time: Date.now() },
          geometry: { type: "Point", coordinates: [-120.0, 36.0, 8] },
        },
        null, // Malformed item
        {
          id: "us_valid_2",
          properties: { mag: 4.8, place: "Nevada", time: Date.now() },
          geometry: { type: "Point", coordinates: [-119.0, 37.0, 10] },
        },
      ];

      const res = await worker._executeService("usgs");
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.processed >= 1, true);
    });
  });

  // ─── 3. Disabled Worker Configuration ───
  describe("Disabled Worker Setting", () => {
    it("does not start timers when enabled is false", () => {
      worker.config.enabled = false;
      worker.start({ initialRun: false });
      assert.strictEqual(worker.running, false);
      assert.strictEqual(worker.timers.size, 0);
    });
  });
});
