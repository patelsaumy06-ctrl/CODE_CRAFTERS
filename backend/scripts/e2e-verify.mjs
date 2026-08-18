/**
 * Extended E2E verification — run while backend is up on :4000
 */
const BASE = "http://127.0.0.1:4000";
const ADMIN_TOKEN = "demo-admin-token";
const USER_TOKEN = "demo-user-token";

async function req(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const start = Date.now();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json, ms: Date.now() - start };
}

const results = [];
function record(phase, name, ok, detail = "") {
  results.push({ phase, name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} [${phase}] ${name}${detail ? " — " + detail : ""}`);
}

async function main() {
  console.log("\n=== PHASE 2: Authentication ===\n");

  const noAuthInc = await req("POST", "/api/incidents", { title: "x" });
  record("Auth", "POST /api/incidents without token → 401", noAuthInc.status === 401, `status=${noAuthInc.status}`);

  const noAuthPatch = await req("PATCH", "/api/incidents/fake/status", { status: "closed" });
  record("Auth", "PATCH /api/incidents/:id/status without token → 401", noAuthPatch.status === 401);

  const noAuthAlert = await req("POST", "/api/alerts", { title: "x" });
  record("Auth", "POST /api/alerts without token → 401", noAuthAlert.status === 401);

  const viewerCreate = await req("POST", "/api/incidents", { title: "Viewer test", description: "test" }, USER_TOKEN);
  record("Auth", "Viewer cannot POST /api/incidents → 403", viewerCreate.status === 403, `status=${viewerCreate.status}`);

  const adminUsers = await req("GET", "/api/admin/users", null, ADMIN_TOKEN);
  record("Auth", "Admin GET /api/admin/users → 200", adminUsers.status === 200);

  const userAdmin = await req("GET", "/api/admin/users", null, USER_TOKEN);
  record("Auth", "Viewer cannot GET /api/admin/users → 403", userAdmin.status === 403, `status=${userAdmin.status}`);

  console.log("\n=== PHASE 3: Citizen Report Pipeline ===\n");

  const badCitizen = await req("POST", "/api/ingest/citizen", { title: "no desc" });
  record("Citizen", "Invalid citizen (no description) → 400", badCitizen.status === 400);

  const badCoords = await req("POST", "/api/ingest/citizen", {
    description: "Test flood",
    latitude: 999,
    longitude: 72.8777,
  });
  record("Citizen", "Invalid coordinates → 400", badCoords.status === 400);

  const citizen = await req("POST", "/api/ingest/citizen", {
    title: "Heavy flooding reported",
    description:
      "Heavy flooding reported near a residential area. Water level is rising rapidly and several roads are becoming inaccessible.",
    latitude: 19.076,
    longitude: 72.8777,
    timestamp: new Date().toISOString(),
    source: "E2E Test Citizen",
  });
  const incidentId = citizen.json?.data?.incidentId;
  record(
    "Citizen",
    "POST /api/ingest/citizen → 201 with incidentId",
    citizen.status === 201 && Boolean(incidentId),
    incidentId ? `id=${incidentId}, type=${citizen.json?.data?.classification?.disasterType}, severity=${citizen.json?.data?.severity}` : `status=${citizen.status}`
  );

  console.log("\n=== PHASE 4-5: Incidents ===\n");

  const incidents = await req("GET", "/api/incidents");
  record("Incidents", "GET /api/incidents → 200 with data", incidents.status === 200 && Array.isArray(incidents.json?.data));

  const floodFilter = await req("GET", "/api/incidents?disasterType=flood&severity=high");
  record("Incidents", "Filter by disasterType & severity", floodFilter.status === 200);

  if (incidentId) {
    const detail = await req("GET", `/api/incidents/${incidentId}`);
    const d = detail.json?.data;
    record(
      "Incidents",
      "GET /api/incidents/:id returns full detail",
      detail.status === 200 && d?.disasterType && d?.severity,
      `confidence=${d?.confidence}, sources=${detail.json?.sources?.length ?? 0}`
    );
  }

  const notFound = await req("GET", "/api/incidents/nonexistent-id-xyz");
  record("Errors", "GET nonexistent incident → 404", notFound.status === 404);

  console.log("\n=== PHASE 6: Status Workflow ===\n");

  let workflowId = incidentId;
  if (!workflowId) {
    const created = await req(
      "POST",
      "/api/incidents",
      {
        title: "E2E Workflow Incident",
        description: "Status workflow test",
        disasterType: "flood",
        severity: "medium",
        location: { latitude: 19.07, longitude: 72.87, address: "Test" },
      },
      ADMIN_TOKEN
    );
    workflowId = created.json?.data?.id;
    record("Workflow", "Admin POST /api/incidents → 201", created.status === 201 && Boolean(workflowId));
  }

  if (workflowId) {
    const statusPatch = await req("PATCH", `/api/incidents/${workflowId}/status`, { status: "investigating" }, ADMIN_TOKEN);
    record("Workflow", "PATCH status → investigating", statusPatch.status === 200 && statusPatch.json?.data?.status === "investigating");

    const fullPatch = await req("PATCH", `/api/incidents/${workflowId}`, { severity: "high" }, ADMIN_TOKEN);
    record("Workflow", "PATCH /api/incidents/:id", fullPatch.status === 200);
  }

  console.log("\n=== PHASE 7: Alerts ===\n");

  const alertsList = await req("GET", "/api/alerts");
  record("Alerts", "GET /api/alerts → 200", alertsList.status === 200);

  const newAlert = await req(
    "POST",
    "/api/alerts",
    {
      title: "E2E Test Alert",
      message: "Test broadcast for verification",
      severity: "High",
      target: "Sector 4 Responders",
    },
    ADMIN_TOKEN
  );
  const alertId = newAlert.json?.data?.id;
  record("Alerts", "POST /api/alerts (admin) → 201", newAlert.status === 201 && Boolean(alertId));

  if (alertId) {
    const alertPatch = await req("PATCH", `/api/alerts/${alertId}`, { status: "Resolved" }, ADMIN_TOKEN);
    record("Alerts", "PATCH /api/alerts/:id status", alertPatch.status === 200);
  }

  console.log("\n=== PHASE 8-9: Intelligence & Search ===\n");

  const feed = await req("GET", "/api/intelligence/feed");
  record("Intelligence", "GET /api/intelligence/feed → 200", feed.status === 200);

  for (const q of ["flood", "fire", "earthquake", "rescue"]) {
    const search = await req("GET", `/api/search?q=${q}`);
    record("Search", `GET /api/search?q=${q}`, search.status === 200);
  }

  const emptySearch = await req("GET", "/api/search");
  record("Search", "Empty search → 400", emptySearch.status === 400);

  console.log("\n=== PHASE 10: Analytics ===\n");

  for (const path of [
    "/api/analytics/overview",
    "/api/analytics/trends",
    "/api/analytics/categories",
    "/api/analytics/severity",
    "/api/analytics/sources",
  ]) {
    const r = await req("GET", path);
    record("Analytics", `GET ${path}`, r.status === 200);
  }

  console.log("\n=== PHASE 11: Admin ===\n");

  const audit = await req("GET", "/api/admin/audit-logs", null, ADMIN_TOKEN);
  record("Admin", "GET /api/admin/audit-logs", audit.status === 200);

  const health = await req("GET", "/api/admin/system-health", null, ADMIN_TOKEN);
  record("Admin", "GET /api/admin/system-health", health.status === 200);

  console.log("\n=== PHASE 12: Geo ===\n");

  const nearby = await req("GET", "/api/incidents/nearby?lat=19.076&lon=72.8777&radiusKm=50");
  record("Geo", "GET /api/incidents/nearby valid coords", nearby.status === 200);

  const badNearby = await req("GET", "/api/incidents/nearby?lat=abc&lon=72");
  record("Geo", "Invalid nearby coords → 400", badNearby.status === 400);

  console.log("\n=== PHASE 17: Performance (approx ms) ===\n");

  for (const [label, path] of [
    ["health", "/api/health"],
    ["incidents", "/api/incidents"],
    ["nearby", "/api/incidents/nearby?lat=19.076&lon=72.8777&radiusKm=10"],
    ["alerts", "/api/alerts"],
    ["feed", "/api/intelligence/feed"],
    ["search", "/api/search?q=flood"],
    ["analytics", "/api/analytics/overview"],
  ]) {
    const r = await req("GET", path);
    console.log(`  ${label}: ${r.ms}ms (${r.status})`);
  }

  console.log("\n=== Summary ===\n");
  const failed = results.filter((r) => !r.ok);
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    console.log("Failed:");
    for (const f of failed) console.log(`  - [${f.phase}] ${f.name}: ${f.detail}`);
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
