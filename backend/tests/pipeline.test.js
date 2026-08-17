import { test } from "node:test";
import assert from "node:assert/strict";
import { classifier } from "../src/ai/classifier.js";
import { normalizer } from "../src/ingestion/normalizer.js";
import { confidenceEngine } from "../src/ai/confidenceEngine.js";
import { severityEngine } from "../src/ai/severityEngine.js";
import { recommendationEngine } from "../src/recommendations/recommendationEngine.js";
import { clusterService } from "../src/clustering/clusterService.js";
import { SOURCE_TYPES, DISASTER_TYPES } from "../src/config/constants.js";

test("normalizer: sensor event produces exceedance metadata", () => {
  const event = normalizer.normalize(SOURCE_TYPES.SENSOR, {
    stationId: "SIH-DEMO-001",
    sensorType: "water_level",
    value: 7.8,
    threshold: 5,
    unit: "meters",
    latitude: 19.076,
    longitude: 72.8777,
    description: "Water level rising rapidly. Flood stage exceeded.",
  });

  assert.equal(event.sourceType, SOURCE_TYPES.SENSOR);
  assert.ok(event.metadata.exceedance > 0);
  assert.equal(event.location.latitude, 19.076);
});

test("classifier: flood keywords detected in sensor text", () => {
  const event = normalizer.normalize(SOURCE_TYPES.SENSOR, {
    stationId: "SIH-DEMO-001",
    sensorType: "water_level",
    value: 7.8,
    threshold: 5,
    description: "Water level rising rapidly flood stage exceeded",
  });
  const result = classifier.classify(event);
  assert.equal(result.disasterType, DISASTER_TYPES.FLOOD);
  assert.ok(result.confidence > 0.4);
});

test("classifier: citizen flooding report classified as high urgency", () => {
  const event = normalizer.normalize(SOURCE_TYPES.CITIZEN, {
    title: "[DEMO] Severe flooding",
    description: "Water rising rapidly. Roads submerged. Evacuation assistance needed.",
    latitude: 19.075,
    longitude: 72.878,
    affectedPeople: 500,
  });
  const result = classifier.classify(event);
  assert.equal(result.disasterType, DISASTER_TYPES.FLOOD);
  assert.ok(["high", "critical", "moderate"].includes(result.urgency));
});

test("confidenceEngine: multi-source with sensor increases confidence", () => {
  const single = confidenceEngine.calculate({
    sources: [{ sourceType: SOURCE_TYPES.CITIZEN }],
    hasSensorCorroboration: false,
    geographicSpreadKm: 0.5,
    timeSpreadMs: 60000,
    classifierConfidence: 0.7,
  });
  const multi = confidenceEngine.calculate({
    sources: [
      { sourceType: SOURCE_TYPES.CITIZEN },
      { sourceType: SOURCE_TYPES.SENSOR },
      { sourceType: SOURCE_TYPES.NEWS },
    ],
    hasSensorCorroboration: true,
    geographicSpreadKm: 0.5,
    timeSpreadMs: 120000,
    classifierConfidence: 0.7,
  });
  assert.ok(multi.confidence > single.confidence);
  assert.equal(multi.factors.length, 6);
});

test("severityEngine: high affected population raises severity", () => {
  const low = severityEngine.calculate({ affectedPopulation: 10, sourceCount: 1 });
  const high = severityEngine.calculate({
    affectedPopulation: 8000,
    sourceCount: 5,
    sensorExceedance: 0.8,
    infrastructureDamage: 0.7,
    rateOfChange: 0.8,
  });
  assert.ok(["high", "critical"].includes(high.severity));
  assert.ok(severityEngine.calculate({ currentSeverity: "critical", affectedPopulation: 0 }).severity === "critical");
  assert.ok(high.score > low.score);
});

test("recommendationEngine: flood critical generates evacuation actions", () => {
  const result = recommendationEngine.generate({
    disasterType: DISASTER_TYPES.FLOOD,
    severity: "critical",
    location: { latitude: 19.076, longitude: 72.8777 },
    confidence: 0.85,
    sourceCount: 3,
  });
  assert.ok(result.recommendations.length >= 3);
  assert.ok(result.recommendations.some((r) => r.action.toLowerCase().includes("evacuat") || r.category === "EVACUATION"));
  assert.ok(result.disclaimer.includes("DECISION SUPPORT"));
});

test("clusterService: geo-temporal match score for nearby events", () => {
  const event = {
    title: "Severe flooding near bridge",
    text: "Water rising rapidly flooding roads submerged",
    location: { latitude: 19.075, longitude: 72.878 },
    timestamp: new Date(),
    classification: { disasterType: DISASTER_TYPES.FLOOD },
  };
  const incident = {
    title: "Sensor Alert: water_level",
    description: "Water level rising flood",
    location: { latitude: 19.076, longitude: 72.8777 },
    createdAt: { toMillis: () => Date.now() - 60000 },
    disasterType: DISASTER_TYPES.FLOOD,
  };
  const score = clusterService._calculateMatchScore(event, incident);
  assert.ok(score >= 0.3, `Expected match score >= 0.3, got ${score}`);
});
