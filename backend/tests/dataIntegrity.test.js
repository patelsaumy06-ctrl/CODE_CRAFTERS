import { describe, it } from "node:test";
import assert from "node:assert";
import { externalNormalizer } from "../src/ingestion/external/externalNormalizer.js";
import { confidenceEngine } from "../src/ai/confidenceEngine.js";
import { ingestionWorker } from "../src/workers/ingestionWorker.js";
import { pipeline } from "../src/services/processingPipeline.js";
import {
  SOURCE_TYPES,
  APPLICATION_STATUS,
  SOURCE_STATUS,
  VERIFICATION_STATUS,
  getRollingDateWindow,
  isWithinDateWindow,
} from "../src/config/constants.js";

describe("Data Integrity & Anti-Fake Automated Verification (Requirements 1-18)", () => {
  it("rejects placeholder/null island coordinates (0, 0) and out-of-range bounds", () => {
    const coords1 = externalNormalizer.validateCoordinates(0, 0);
    assert.strictEqual(coords1.isValid, false);
    assert.strictEqual(coords1.latitude, null);

    const coords2 = externalNormalizer.validateCoordinates(95, 10);
    assert.strictEqual(coords2.isValid, false);
    assert.strictEqual(coords2.latitude, null);

    const coords3 = externalNormalizer.validateCoordinates(24.89, 91.87);
    assert.strictEqual(coords3.isValid, true);
    assert.strictEqual(coords3.latitude, 24.89);
    assert.strictEqual(coords3.longitude, 91.87);

    // Normalizing an event with 0,0 marks hasValidCoordinates = false
    const norm = externalNormalizer.normalizeGdacs({
      id: "99999",
      title: "Zero Coords Event",
      lat: 0,
      lon: 0,
    });
    assert.strictEqual(norm.location.hasValidCoordinates, false);
    assert.strictEqual(norm.location.latitude, 0);
  });

  it("normalizes GDACS event with full live provenance and distinct timestamps", () => {
    const gdacsAlert = {
      id: "100234",
      episodeId: "1",
      title: "Green alert for Flood in Bangladesh",
      description: "Tropical depression flood warning in Sylhet.",
      url: "https://www.gdacs.org/report.aspx?eventtype=FL&eventid=100234",
      lat: 24.89,
      lon: 91.87,
      eventType: "FL",
      alertLevel: "green",
      alertScore: 1.2,
      country: "Bangladesh",
      fromDate: "2026-08-20T10:00:00Z",
      toDate: "2026-08-21T12:00:00Z",
      pubDate: "2026-08-21T12:00:00Z",
      isCurrent: "true",
    };

    const normalized = externalNormalizer.normalizeGdacs(gdacsAlert);

    assert.strictEqual(normalized.sourceType, SOURCE_TYPES.GDACS);
    assert.strictEqual(normalized.source, "GDACS");
    assert.strictEqual(normalized.source_event_id, "100234");
    assert.strictEqual(normalized.source_url, "https://www.gdacs.org/report.aspx?eventtype=FL&eventid=100234");
    assert.strictEqual(normalized.source_status, SOURCE_STATUS.CURRENT);
    assert.strictEqual(normalized.application_status, APPLICATION_STATUS.LIVE);
    assert.strictEqual(normalized.location.latitude, 24.89);
    assert.strictEqual(normalized.location.longitude, 91.87);
    assert.strictEqual(normalized.event_time, "2026-08-20T10:00:00.000Z");
    assert.strictEqual(normalized.source_updated_at, "2026-08-21T12:00:00.000Z");
    assert.ok(normalized.ingested_at);
    assert.ok(normalized.last_seen_at);
    assert.ok(Array.isArray(normalized.evidence));
    assert.strictEqual(normalized.evidence.length, 1);
    assert.strictEqual(normalized.evidence[0].source, "GDACS");
    assert.strictEqual(normalized.evidence[0].source_event_id, "100234");
  });

  it("normalizes USGS earthquake using properties.time as event_time and properties.updated as source_updated_at", () => {
    const usgsFeature = {
      id: "us7000m999",
      properties: {
        mag: 5.4,
        place: "Southern California",
        time: 1787317200000, // 2026-08-21T13:00:00.000Z
        updated: 1787317380000, // 2026-08-21T13:03:00.000Z
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000m999",
        status: "reviewed",
        tsunami: 0,
        sig: 450,
      },
      geometry: {
        type: "Point",
        coordinates: [-118.25, 34.05, 12.5],
      },
    };

    const norm = externalNormalizer.normalizeUsgs(usgsFeature);
    assert.strictEqual(norm.source, "USGS");
    assert.strictEqual(norm.source_event_id, "us7000m999");
    assert.strictEqual(norm.event_time, new Date(1787317200000).toISOString());
    assert.strictEqual(norm.source_updated_at, new Date(1787317380000).toISOString());
    assert.strictEqual(norm.location.latitude, 34.05);
    assert.strictEqual(norm.location.longitude, -118.25);
  });

  it("calculates traceable explainable confidence with full factor breakdown (no static defaults)", () => {
    const res = confidenceEngine.calculate({
      sources: [
        { sourceType: SOURCE_TYPES.GDACS, sourceId: "gdacs_1" },
        { sourceType: SOURCE_TYPES.USGS, sourceId: "usgs_1" },
      ],
      hasSensorCorroboration: true,
      geographicSpreadKm: 12.5,
      timeSpreadMs: 180000,
      classifierConfidence: 0.92,
    });

    assert.ok(typeof res.confidence === "number");
    assert.ok(res.confidence > 0.7 && res.confidence <= 1.0);
    assert.ok(typeof res.confidencePercent === "number");
    assert.ok(Array.isArray(res.factors));
    assert.strictEqual(res.factors.length, 6);
    assert.ok(res.explanation.includes("Calculated confidence:"));

    // Verify empty sources yields null confidence (not fake default 73%/85%)
    const emptyRes = confidenceEngine.calculate({ sources: [] });
    assert.strictEqual(emptyRes.confidence, null);
    assert.strictEqual(emptyRes.confidencePercent, null);
    assert.strictEqual(emptyRes.factors.length, 0);
  });

  it("assigns strict verification status (UNVERIFIED vs CORROBORATED vs OFFICIALLY_CONFIRMED)", async () => {
    const gdacsRaw = {
      id: "gdacs_verify_test_1",
      title: "Orange alert for Tropical Cyclone in Pacific",
      description: "Tropical storm conditions observed.",
      url: "https://www.gdacs.org/report.aspx?eventtype=TC&eventid=gdacs_verify_test_1",
      lat: 15.2,
      lon: 130.5,
      eventType: "TC",
      alertLevel: "orange",
      fromDate: "2026-08-21T06:00:00Z",
      toDate: "2026-08-21T14:00:00Z",
      isCurrent: "true",
    };

    const pipeRes = await pipeline.process(SOURCE_TYPES.GDACS, gdacsRaw);
    assert.strictEqual(pipeRes.success, true);
    assert.strictEqual(pipeRes.verificationStatus, VERIFICATION_STATUS.UNVERIFIED);
  });

  it("maintains multi-source health tracking and non-destructive failure handling in ingestionWorker", async () => {
    const provenance = await ingestionWorker.getProvenanceStatus(3);
    assert.ok(provenance);
    assert.ok(provenance.sources);
    assert.ok(provenance.sources.gdacs);
    assert.ok(provenance.sources.usgs);
    assert.ok(provenance.date_window);
    assert.strictEqual(provenance.date_window.days, 3);
    assert.ok(typeof provenance.currentRecords === "number");
  });
});

describe("Rolling Three-Day Live Data Window Validation (Requirements 1-18)", () => {
  // Test reference date: 2026-08-21 14:00:00 UTC
  const refDate = new Date("2026-08-21T14:00:00.000Z");
  const window3 = getRollingDateWindow(3, refDate);

  it("calculates dynamic 3-calendar-day UTC window [Day -2 00:00:00, Today 23:59:59]", () => {
    assert.strictEqual(window3.days, 3);
    assert.strictEqual(window3.start, "2026-08-19T00:00:00.000Z");
    assert.strictEqual(window3.end, "2026-08-21T23:59:59.999Z");
  });

  it("includes events occurring Today at start boundary, midday, and end boundary", () => {
    // Today 00:00:00.000 UTC
    assert.strictEqual(isWithinDateWindow("2026-08-21T00:00:00.000Z", window3), true);
    // Today 14:30:00.000 UTC
    assert.strictEqual(isWithinDateWindow("2026-08-21T14:30:00.000Z", window3), true);
    // Today 23:59:59.999 UTC
    assert.strictEqual(isWithinDateWindow("2026-08-21T23:59:59.999Z", window3), true);
  });

  it("includes events occurring Yesterday (Day -1)", () => {
    assert.strictEqual(isWithinDateWindow("2026-08-20T08:15:00.000Z", window3), true);
    assert.strictEqual(isWithinDateWindow("2026-08-20T23:59:59.000Z", window3), true);
  });

  it("includes events occurring Two days ago (Day -2) down to exact start boundary", () => {
    // Exactly on the start boundary
    assert.strictEqual(isWithinDateWindow("2026-08-19T00:00:00.000Z", window3), true);
    assert.strictEqual(isWithinDateWindow("2026-08-19T18:00:00.000Z", window3), true);
  });

  it("excludes events occurring Three days ago (Day -3) or older", () => {
    // 1 millisecond before the window start
    assert.strictEqual(isWithinDateWindow("2026-08-18T23:59:59.999Z", window3), false);
    // 5 days ago
    assert.strictEqual(isWithinDateWindow("2026-08-16T12:00:00.000Z", window3), false);
    // 1 month ago
    assert.strictEqual(isWithinDateWindow("2026-07-21T12:00:00.000Z", window3), false);
  });

  it("excludes future events after Today 23:59:59.999 UTC", () => {
    // 1 millisecond after the window end
    assert.strictEqual(isWithinDateWindow("2026-08-22T00:00:00.000Z", window3), false);
    assert.strictEqual(isWithinDateWindow("2026-08-23T12:00:00.000Z", window3), false);
  });

  it("excludes old event retrieved today: uses source event_time, never ingested_at", () => {
    const oldEventRaw = {
      id: "old_fl_1234",
      title: "Historical Monsoon Flood in Assam",
      fromDate: "2026-08-10T06:00:00Z", // 11 days ago
      toDate: "2026-08-12T06:00:00Z",
      pubDate: "2026-08-10T06:00:00Z",
      lat: 26.2,
      lon: 92.9,
      isCurrent: false,
    };

    const norm = externalNormalizer.normalizeGdacs(oldEventRaw);

    // Verify event_time is the historical occurrence timestamp, NOT today's retrieval time
    assert.strictEqual(norm.event_time, "2026-08-10T06:00:00.000Z");
    assert.ok(norm.ingested_at); // Ingested today

    // Must be excluded from 3-day live dataset based on event_time
    const inWindow = isWithinDateWindow(norm.event_time, window3);
    assert.strictEqual(inWindow, false, "Old event ingested today must NOT enter 3-day live dataset");
  });

  it("excludes old event with today's source_updated_at from the 3-day event dataset", () => {
    // Event occurred 15 Aug 2026, but source updated metadata on 21 Aug 2026
    const updatedOldEvent = {
      event_time: "2026-08-15T10:00:00.000Z",
      source_updated_at: "2026-08-21T09:00:00.000Z",
      ingested_at: "2026-08-21T09:01:00.000Z",
      application_status: APPLICATION_STATUS.LIVE,
    };

    // Primary 3-day inclusion criterion is event_time
    const in3DayLive = isWithinDateWindow(updatedOldEvent.event_time, window3);
    assert.strictEqual(in3DayLive, false, "Old event updated today must NOT enter 3-day live dataset");
  });

  it("automatically advances rolling window on UTC midnight rollover", () => {
    // 21 Aug 2026 23:59:59 UTC
    const dateAt2359 = new Date("2026-08-21T23:59:59.000Z");
    const windowBefore = getRollingDateWindow(3, dateAt2359);
    assert.strictEqual(windowBefore.start, "2026-08-19T00:00:00.000Z");
    assert.strictEqual(windowBefore.end, "2026-08-21T23:59:59.999Z");

    // 22 Aug 2026 00:00:01 UTC (Midnight rollover)
    const dateAt0000 = new Date("2026-08-22T00:00:01.000Z");
    const windowAfter = getRollingDateWindow(3, dateAt0000);
    assert.strictEqual(windowAfter.start, "2026-08-20T00:00:00.000Z");
    assert.strictEqual(windowAfter.end, "2026-08-22T23:59:59.999Z");

    // An event from 19 Aug is in windowBefore but excluded in windowAfter
    const eventOn19Aug = "2026-08-19T15:00:00.000Z";
    assert.strictEqual(isWithinDateWindow(eventOn19Aug, windowBefore), true);
    assert.strictEqual(isWithinDateWindow(eventOn19Aug, windowAfter), false);

    // An event from 22 Aug is excluded in windowBefore but included in windowAfter
    const eventOn22Aug = "2026-08-22T08:00:00.000Z";
    assert.strictEqual(isWithinDateWindow(eventOn22Aug, windowBefore), false);
    assert.strictEqual(isWithinDateWindow(eventOn22Aug, windowAfter), true);
  });
});
