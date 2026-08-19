import { describe, it } from "node:test";
import assert from "node:assert";
import { externalNormalizer } from "../src/ingestion/external/externalNormalizer.js";
import { analyzeDisasterEvent } from "../src/ai/llmService.js";
import { pipeline } from "../src/services/processingPipeline.js";

describe("Phase 3 — GDELT News + ReliefWeb Humanitarian Intelligence + AI Verification", () => {
  // ─── 1. GDELT Normalization Tests ───
  describe("GDELT Normalization", () => {
    it("normalizes GDELT news article and preserves unverified status", () => {
      const article = {
        url: "https://example.com/news/flood-mumbai-2026",
        title: "Heavy monsoons trigger severe flooding in Mumbai suburbs",
        domain: "timesofindia.indiatimes.com",
        seendate: "20260819T043000Z",
        socialimage: "https://example.com/images/flood.jpg",
        language: "English",
        sourcecountry: "India",
        latitude: 19.076,
        longitude: 72.8777,
      };

      const normalized = externalNormalizer.normalizeGdelt(article);
      assert.strictEqual(normalized.sourceType, "gdelt");
      assert.strictEqual(normalized.sourceId, "https://example.com/news/flood-mumbai-2026");
      assert.strictEqual(normalized.location.latitude, 19.076);
      assert.strictEqual(normalized.location.longitude, 72.8777);
      assert.strictEqual(normalized.metadata.verified, false);
      assert.strictEqual(normalized.metadata.domain, "timesofindia.indiatimes.com");
    });
  });

  // ─── 2. ReliefWeb Normalization Tests ───
  describe("ReliefWeb Normalization", () => {
    it("normalizes ReliefWeb humanitarian report with trusted classification", () => {
      const report = {
        id: 405991,
        fields: {
          id: 405991,
          title: "India: Monsoon Floods - Situation Report No. 2",
          body: "Over 50,000 residents relocated to emergency relief camps as river water overflows embankments.",
          date: { created: "2026-08-19T05:00:00+00:00" },
          source: [{ name: "UN Office for the Coordination of Humanitarian Affairs", shortname: "OCHA" }],
          primary_country: { name: "India", iso3: "ind", location: { lat: 19.07, lon: 72.87 } },
          disaster: [{ name: "India: Floods - Aug 2026", type: [{ name: "Flood" }] }],
          url: "https://reliefweb.int/report/india/monsoon-floods-sitrep-2",
        },
      };

      const normalized = externalNormalizer.normalizeReliefWeb(report);
      assert.strictEqual(normalized.sourceType, "reliefweb");
      assert.strictEqual(normalized.sourceId, "405991");
      assert.strictEqual(normalized.location.latitude, 19.07);
      assert.strictEqual(normalized.location.longitude, 72.87);
      assert.strictEqual(normalized.metadata.sourceOrg, "UN Office for the Coordination of Humanitarian Affairs");
      assert.strictEqual(normalized.metadata.verified, false);
    });
  });

  // ─── 3. AI Verification & Deterministic Fallback ───
  describe("AI Analysis & Deterministic Fallback", () => {
    it("analyzes disaster text using LLM abstraction with fallback", async () => {
      const event = {
        title: "Flash Flood Warning",
        text: "Dangerous rising flood waters submerging low-lying residential roads and bridges.",
        location: { latitude: 19.076, longitude: 72.8777, address: "Mumbai" },
      };

      const analysis = await analyzeDisasterEvent(event);
      assert.ok(analysis);
      assert.strictEqual(analysis.disasterType, "flood");
      assert.ok(typeof analysis.confidence === "number");
      assert.ok(["critical", "high", "moderate", "low"].includes(analysis.urgency));
      assert.ok(analysis.reasoning);
    });
  });

  // ─── 4. Evidence Aggregation & Incident Matching ───
  describe("Evidence Aggregation & Verification Progression", () => {
    it("ingests GDELT and ReliefWeb into a single incident with aggregated evidence", async () => {
      // 1. Ingest initial official sensor/event
      const event1 = {
        title: "Sensor Alert: Flood water level at Mumb-River-01",
        description: "Water level sensor 2.4m above critical flood threshold.",
        latitude: 19.076,
        longitude: 72.8777,
        timestamp: new Date().toISOString(),
      };
      const res1 = await pipeline.process("sensor", event1);
      assert.strictEqual(res1.success, true);
      const incidentId = res1.incidentId;

      // 2. Ingest GDELT news article at same location
      const gdeltArticle = {
        url: "https://example.com/news/mumbai-floods-update",
        title: "Water level rising flood in Mumbai area",
        domain: "news-wire.com",
        latitude: 19.076,
        longitude: 72.8777,
        seendate: new Date().toISOString(),
      };
      const res2 = await pipeline.process("gdelt", gdeltArticle);
      assert.strictEqual(res2.success, true);
      assert.strictEqual(res2.incidentId, incidentId); // Merged into same incident!
      assert.strictEqual(res2.isNew, false);

      // 3. Ingest ReliefWeb report at same location
      const rwReport = {
        id: 998877,
        fields: {
          id: 998877,
          title: "Mumbai Flood Relief Assistance Activated",
          body: "Emergency flood rescue teams deployed to affected sectors.",
          primary_country: { name: "India", location: { lat: 19.076, lon: 72.8777 } },
          date: { created: new Date().toISOString() },
        },
      };
      const res3 = await pipeline.process("reliefweb", rwReport);
      assert.strictEqual(res3.success, true);
      assert.strictEqual(res3.incidentId, incidentId); // Merged into same incident!
      assert.strictEqual(res3.isNew, false);
    });
  });
});
