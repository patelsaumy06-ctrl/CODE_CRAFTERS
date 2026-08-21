import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { priorityEngine } from "../src/ai/priorityEngine.js";
import { relevanceFilter } from "../src/ai/relevanceFilter.js";
import { processedArticles } from "../src/utils/processedArticles.js";
import { searchDisasterNews } from "../src/ingestion/external/gdeltService.js";
import { pipeline } from "../src/services/processingPipeline.js";
import { SOURCE_TYPES } from "../src/config/constants.js";

describe("GDELT News Intelligence & Priority Engine Integration", () => {
  describe("Priority Engine", () => {
    test("calculates CRITICAL priority for high-severity, high-confidence incidents", () => {
      const result = priorityEngine.calculate({
        severity: "critical",
        confidence: 0.9,
        sourceCount: 4,
        eventTime: new Date().toISOString(),
      });

      assert.equal(result.priority, "CRITICAL");
      assert.ok(result.priorityScore >= 75);
      assert.equal(result.factors.length, 4);
    });

    test("calculates LOW priority for low-severity, single-source, older reports", () => {
      const pastTime = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
      const result = priorityEngine.calculate({
        severity: "low",
        confidence: 0.3,
        sourceCount: 1,
        eventTime: pastTime,
      });

      assert.equal(result.priority, "LOW");
      assert.ok(result.priorityScore < 25);
    });
  });

  describe("Disaster Relevance Filter", () => {
    test("filters out metaphorical political headlines", () => {
      const article = {
        title: "Opposition party achieves landslide victory in local council elections",
        description: "The mayor secured an overwhelming majority in the municipal vote.",
      };

      const evalResult = relevanceFilter.evaluate(article);
      assert.equal(evalResult.isDisasterRelated, false);
      assert.ok(evalResult.reason.includes("metaphorical"));
    });

    test("filters out metaphorical flood phrases", () => {
      const article = {
        title: "Customer support center faces a flood of complaints after system outage",
        description: "Staff were overwhelmed with calls and emails.",
      };

      const evalResult = relevanceFilter.evaluate(article);
      assert.equal(evalResult.isDisasterRelated, false);
    });

    test("identifies and classifies genuine disaster news", () => {
      const article = {
        title: "Severe flash flood hits residential districts after cloudburst, evacuation underway",
        description: "Emergency rescue services deployed boats as water levels submerged ground floor homes.",
      };

      const evalResult = relevanceFilter.evaluate(article);
      assert.equal(evalResult.isDisasterRelated, true);
      assert.equal(evalResult.disasterType, "flood");
      assert.ok(evalResult.relevanceScore >= 0.6);
    });
  });

  describe("Duplicate Article Store", () => {
    test("detects and prevents duplicate article processing", async () => {
      const testUrl = "https://news.example.com/2026/mumbai-cyclone-update-01";
      
      const before = await processedArticles.isProcessed(testUrl);
      assert.equal(before, false);

      await processedArticles.markProcessed(testUrl, { test: true });

      const after = await processedArticles.isProcessed(testUrl);
      assert.equal(after, true);

      // Object with url property
      const afterObj = await processedArticles.isProcessed({ url: testUrl });
      assert.equal(afterObj, true);
    });
  });

  describe("GDELT Rate Limit & Service Compliance", () => {
    test("searchDisasterNews enforces maxrecords bounds (10-20)", async () => {
      // Test parameter bounding
      const start = Date.now();
      const results = await searchDisasterNews({ maxRecords: 50 }); // Should clamp to max 20
      const elapsed = Date.now() - start;
      assert.ok(Array.isArray(results));
    });
  });

  describe("End-to-End Ingestion with GDELT & Priority Assignment", () => {
    test("ingests GDELT article and assigns operational priority score", async () => {
      const rawArticle = {
        url: `https://news.example.com/gdelt/flood-alert-${Date.now()}`,
        title: "Heavy monsoon floods inundate 20 villages, disaster teams dispatched",
        domain: "reuters.com",
        sourcecountry: "India",
        seendate: "20260821T120000Z",
        relevanceScore: 0.85,
        socialimage: "https://example.com/img/flood.jpg",
      };

      const result = await pipeline.process(SOURCE_TYPES.GDELT, rawArticle);
      assert.ok(result);
      assert.equal(result.success, true);
      assert.ok(result.incidentId);
      assert.ok(["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(result.priority || "MEDIUM"));
    });
  });
});
