/**
 * Live API verification script — run while backend is up on :4000
 */
const BASE = "http://127.0.0.1:4000";

async function req(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

const results = [];

function record(name, status, detail, expectStatus) {
  const expected = expectStatus ?? (status >= 200 && status < 300);
  const ok = Array.isArray(expectStatus) ? expectStatus.includes(status) : (expectStatus !== undefined ? status === expectStatus : expected);
  results.push({ name, status, detail, ok });
  console.log(`${ok ? "✓" : "✗"} ${name} → ${status}`, detail ? JSON.stringify(detail).slice(0, 200) : "");
}

async function main() {
  console.log("\n=== STEP 1: Health ===\n");
  record("GET /api/health", (await req("GET", "/api/health")).status, (await req("GET", "/api/health")).json?.status);
  record("GET /api", (await req("GET", "/api")).status);

  console.log("\n=== STEP 3: Auth ===\n");
  record("POST /api/incidents (no token)", (await req("POST", "/api/incidents", { title: "test" })).status, null, 401);
  record("POST /api/incidents (invalid token)", (await req("POST", "/api/incidents", { title: "test" }, "invalid-token")).status, null, 401);
  record("GET /api/admin/users (no token)", (await req("GET", "/api/admin/users")).status, null, 401);

  console.log("\n=== STEP 4: Routes ===\n");
  for (const [name, path] of [
    ["GET /api/incidents", "/api/incidents"],
    ["GET /api/incidents/nearby", "/api/incidents/nearby?lat=19.076&lon=72.8777&radiusKm=10"],
    ["GET /api/ingest/stats", "/api/ingest/stats"],
    ["GET /api/intelligence/feed", "/api/intelligence/feed"],
    ["GET /api/search?q=flood", "/api/search?q=flood"],
    ["GET /api/analytics/overview", "/api/analytics/overview"],
    ["GET /api/analytics/trends", "/api/analytics/trends"],
    ["GET /api/analytics/categories", "/api/analytics/categories"],
    ["GET /api/analytics/severity", "/api/analytics/severity"],
    ["GET /api/analytics/sources", "/api/analytics/sources"],
    ["GET /api/alerts", "/api/alerts"],
  ]) {
    const r = await req("GET", path);
    const detail = r.json?.error ?? r.json?.data?.length ?? r.json?.meta;
    record(name, r.status, detail);
  }

  console.log("\n=== STEP 5: SIH Pipeline ===\n");
  const sensor = await req("POST", "/api/ingest/sensor", {
    stationId: "SIH-DEMO-001",
    sensorType: "water_level",
    value: 7.8,
    threshold: 5,
    unit: "meters",
    latitude: 19.076,
    longitude: 72.8777,
    description: "Water level rising rapidly. Flood stage exceeded.",
  });
  record("POST /api/ingest/sensor", sensor.status, sensor.json?.data);

  const citizen = await req("POST", "/api/ingest/citizen", {
    title: "[DEMO] Severe flooding",
    description: "Water rising rapidly. Roads are submerged and people need evacuation assistance.",
    latitude: 19.075,
    longitude: 72.878,
    affectedPeople: 500,
  });
  record("POST /api/ingest/citizen", citizen.status, citizen.json?.data);

  const news = await req("POST", "/api/ingest/news", {
    headline: "[DEMO] Major flooding confirmed",
    body: "Emergency flooding reported in Sector 4. Authorities are deploying rescue teams.",
    latitude: 19.076,
    longitude: 72.878,
    source: "SIH Demo News",
  });
  record("POST /api/ingest/news", news.status, news.json?.data);

  const social = await req("POST", "/api/ingest/social", {
    platform: "X",
    handle: "@sector4",
    text: "Flood emergency sector 4 water rising",
    latitude: 19.075,
    longitude: 72.878,
  });
  record("POST /api/ingest/social", social.status, social.json?.data);

  console.log("\n=== STEP 6: Correlation ===\n");
  const incidentIds = [sensor, citizen, news, social]
    .map((r) => r.json?.data?.incidentId)
    .filter(Boolean);
  const uniqueIds = [...new Set(incidentIds)];
  console.log("Incident IDs:", incidentIds);
  console.log("Unique incidents:", uniqueIds.length);
  console.log("Merged events:", incidentIds.length - uniqueIds.length);

  if (uniqueIds[0]) {
    const detail = await req("GET", `/api/incidents/${uniqueIds[0]}`);
    record("GET /api/incidents/:id", detail.status, {
      sourceCount: detail.json?.data?.sourceCount,
      confidence: detail.json?.data?.confidence,
      severity: detail.json?.data?.severity,
      sources: detail.json?.sources?.length,
      recommendations: detail.json?.recommendations?.length,
    });
  }

  const stats = await req("GET", "/api/ingest/stats");
  console.log("\nPipeline stats:", stats.json?.data);

  console.log("\n=== Summary ===\n");
  const failed = results.filter((r) => !r.ok);
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length) console.log("Failed:", failed.map((f) => `${f.name} (${f.status})`).join(", "));
}

main().catch(console.error);
