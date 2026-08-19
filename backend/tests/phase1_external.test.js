import { describe, it } from "node:test";
import assert from "node:assert";
import { externalNormalizer } from "../src/ingestion/external/externalNormalizer.js";
import { parseGdacsRssXml } from "../src/ingestion/external/gdacsService.js";
import { pipeline } from "../src/services/processingPipeline.js";

describe("Phase 1 — Core Official Data Sources (USGS, EONET, GDACS)", () => {
  it("normalizes USGS earthquake feature correctly", () => {
    const feature = {
      id: "us7000test",
      properties: {
        mag: 6.2,
        place: "35 km S of Fier, Albania",
        time: 1787111300000,
        alert: "yellow",
        tsunami: 1,
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000test",
      },
      geometry: {
        type: "Point",
        coordinates: [19.5, 40.8, 10],
      },
    };

    const normalized = externalNormalizer.normalizeUsgs(feature);
    assert.strictEqual(normalized.sourceType, "usgs");
    assert.strictEqual(normalized.sourceId, "us7000test");
    assert.strictEqual(normalized.location.latitude, 40.8);
    assert.strictEqual(normalized.location.longitude, 19.5);
    assert.strictEqual(normalized.metadata.magnitude, 6.2);
    assert.strictEqual(normalized.metadata.depthKm, 10);
    assert.strictEqual(normalized.metadata.tsunami, true);
  });

  it("normalizes NASA EONET event correctly", () => {
    const eonetEvent = {
      id: "EONET_9999",
      title: "Wildfire - Test Forest",
      description: "Active forest fire tracked by satellite.",
      categories: [{ id: "wildfires", title: "Wildfires" }],
      geometries: [
        {
          date: "2026-08-19T00:00:00Z",
          type: "Point",
          coordinates: [-121.5, 38.5],
        },
      ],
      sources: [{ id: "PDC", url: "https://example.com/pdc" }],
    };

    const normalized = externalNormalizer.normalizeEonet(eonetEvent);
    assert.strictEqual(normalized.sourceType, "nasa_eonet");
    assert.strictEqual(normalized.sourceId, "EONET_9999");
    assert.strictEqual(normalized.location.latitude, 38.5);
    assert.strictEqual(normalized.location.longitude, -121.5);
    assert.strictEqual(normalized.metadata.category, "Wildfires");
  });

  it("parses and normalizes GDACS RSS XML correctly", () => {
    const sampleXml = `
      <rss version="2.0">
        <channel>
          <item>
            <title>Orange alert for Flood in Bangladesh</title>
            <description>Severe flood warning issued for Sylhet region.</description>
            <link>https://www.gdacs.org/report.aspx?eventid=1001&amp;eventtype=FL</link>
            <pubDate>Wed, 19 Aug 2026 08:00:00 GMT</pubDate>
            <geo:lat>24.9</geo:lat>
            <geo:long>91.8</geo:long>
            <gdacs:eventtype>FL</gdacs:eventtype>
            <gdacs:alertlevel>Orange</gdacs:alertlevel>
            <gdacs:eventid>1001</gdacs:eventid>
          </item>
        </channel>
      </rss>
    `;

    const parsedItems = parseGdacsRssXml(sampleXml);
    assert.strictEqual(parsedItems.length, 1);
    assert.strictEqual(parsedItems[0].id, "1001");
    assert.strictEqual(parsedItems[0].alertLevel, "orange");

    const normalized = externalNormalizer.normalizeGdacs(parsedItems[0]);
    assert.strictEqual(normalized.sourceType, "gdacs");
    assert.strictEqual(normalized.location.latitude, 24.9);
    assert.strictEqual(normalized.location.longitude, 91.8);
    assert.strictEqual(normalized.metadata.alertLevel, "orange");
  });

  it("processes USGS earthquake through Golden Pipeline and creates incident with evidence", async () => {
    const usgsFeature = {
      id: "us7000pipe",
      properties: {
        mag: 5.8,
        place: "Off coast of Northern California",
        time: Date.now(),
        alert: "green",
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000pipe",
      },
      geometry: {
        type: "Point",
        coordinates: [-124.5, 40.5, 12],
      },
    };

    const result = await pipeline.process("usgs", usgsFeature);
    assert.strictEqual(result.success, true);
    assert.ok(result.incidentId);
    assert.strictEqual(result.classification.disasterType, "earthquake");
  });
});
