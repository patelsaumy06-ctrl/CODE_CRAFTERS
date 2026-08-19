import { describe, it } from "node:test";
import assert from "node:assert";
import { pipeline } from "../src/services/processingPipeline.js";
import { SOURCE_TYPES } from "../src/config/constants.js";
import { weatherCorrelationService } from "../src/services/weatherCorrelationService.js";
import { classifier } from "../src/ai/classifier.js";
import { confidenceEngine } from "../src/ai/confidenceEngine.js";
import { ingestionWorker } from "../src/workers/ingestionWorker.js";

describe("Phase 5 — End-to-End System Integration & Contract Validation", () => {
  // ─── 1. End-to-End Multi-Source Ingestion & Evidence Aggregation ───
  describe("E2E Multi-Source Ingestion Flow", () => {
    it("ingests USGS earthquake, aggregates with GDACS and GDELT, and maintains single incident", async () => {
      const targetLat = 37.7749;
      const targetLon = -122.4194;
      const now = new Date();

      // 1. Ingest official USGS earthquake
      const usgsRaw = {
        id: "usgs_sf_001",
        properties: {
          mag: 6.2,
          place: "San Francisco Bay Area",
          time: now.getTime(),
          url: "https://earthquake.usgs.gov/earthquakes/eventpage/usgs_sf_001",
        },
        geometry: {
          type: "Point",
          coordinates: [targetLon, targetLat, 10],
        },
      };

      const res1 = await pipeline.process(SOURCE_TYPES.USGS, usgsRaw);
      assert.strictEqual(res1.success, true);
      assert.strictEqual(res1.isNew, true);
      const incidentId = res1.incidentId;
      assert.ok(incidentId);

      // 2. Ingest official GDACS event at the same geo-temporal location
      const gdacsRaw = {
        title: "GDACS Earthquake Alert San Francisco M6.2",
        link: "https://www.gdacs.org/report.aspx?eventid=gdacs_sf_001",
        pubDate: now.toISOString(),
        description: "Earthquake M6.2 reported in San Francisco area.",
        "geo:lat": `${targetLat}`,
        "geo:long": `${targetLon}`,
      };

      const res2 = await pipeline.process(SOURCE_TYPES.GDACS, gdacsRaw);
      assert.strictEqual(res2.success, true);
      assert.strictEqual(res2.isNew, false); // Merged into existing!
      assert.strictEqual(res2.incidentId, incidentId);

      // 3. Ingest GDELT unstructured news report for the same event
      const gdeltRaw = {
        url: "https://news.example.com/sf-earthquake-m6",
        title: "Strong earthquake shakes Northern California buildings",
        seendate: now.toISOString(),
        domain: "news.example.com",
        language: "English",
        sourcecountry: "United States",
      };

      const res3 = await pipeline.process(SOURCE_TYPES.GDELT, gdeltRaw);
      assert.strictEqual(res3.success, true);
      assert.ok(res3.incidentId);
    });
  });

  // ─── 2. On-Demand Weather Telemetry Correlation ───
  describe("Open-Meteo Weather Correlation Contract", () => {
    it("correlates weather signals without continuous polling", async () => {
      const analysis = await weatherCorrelationService.analyzeWeatherRisk({
        latitude: 19.076,
        longitude: 72.8777,
        disasterType: "flood",
      });

      assert.ok(analysis);
      assert.ok(analysis.weather);
      assert.ok(analysis.flood);
      assert.ok(analysis.correlation);
      assert.strictEqual(typeof analysis.correlation.score, "number");
      assert.ok(["high", "moderate", "low", "neutral", "unavailable"].includes(analysis.correlation.relevance));
    });
  });

  // ─── 3. AI Verification & Deterministic Fallback Contract ───
  describe("AI Verification Contract", () => {
    it("returns structured classification, confidence factors, and reasoning", async () => {
      const text = "Emergency rescue needed! Severe flooding and river breach submerged homes.";
      const classification = classifier.classify({ title: text, text });

      assert.ok(classification);
      assert.strictEqual(classification.disasterType, "flood");
      assert.ok(["high", "critical"].includes(classification.urgency));
      assert.strictEqual(typeof classification.confidence, "number");

      // Verify confidence factors engine
      const res = confidenceEngine.calculate({
        sources: [
          { sourceType: "usgs", confidence: 0.95, timestamp: new Date() },
          { sourceType: "gdacs", confidence: 0.95, timestamp: new Date() },
          { sourceType: "gdelt", confidence: 0.50, timestamp: new Date() },
        ],
        classifierConfidence: classification.confidence,
      });

      assert.ok(res.confidence > 0.5);
      assert.ok(Array.isArray(res.factors));
      assert.strictEqual(res.factors.length, 6);
    });
  });

  // ─── 4. Ingestion Worker Health & Status Contract ───
  describe("Worker Health Contract", () => {
    it("exposes all 5 scheduled services and status metrics", () => {
      const status = ingestionWorker.getStatus();
      assert.ok(status);
      assert.strictEqual(typeof status.running, "boolean");
      assert.ok(status.services.usgs);
      assert.ok(status.services.gdacs);
      assert.ok(status.services.eonet);
      assert.ok(status.services.gdelt);
      assert.ok(status.services.reliefweb);
    });
  });

  // ─── 5. Error & Edge Case Contract ───
  describe("Error & Edge Case Resilience", () => {
    it("handles missing coordinates and empty data gracefully", async () => {
      const emptyItem = {
        title: "Unlocalized Incident Report",
        description: "No coordinates provided.",
      };

      const res = await pipeline.process(SOURCE_TYPES.CITIZEN, emptyItem);
      assert.strictEqual(res.success, true);
      assert.ok(res.incidentId);
    });
  });
});
