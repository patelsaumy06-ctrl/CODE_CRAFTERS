import { test, before } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.API_BASE || "http://127.0.0.1:4000";
let serverUp = false;

before(async () => {
  try {
    const res = await fetch(`${BASE}/api/health`);
    serverUp = res.ok;
  } catch {
    serverUp = false;
  }
});

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

test("GET /api/health returns service status", { skip: !serverUp && "Backend not running on :4000" }, async () => {
  const { status, json } = await get("/api/health");
  assert.equal(status, 200);
  assert.ok(json.service);
  assert.ok("firebase" in json);
});

test("GET /api returns endpoint documentation", { skip: !serverUp && "Backend not running" }, async () => {
  const { status, json } = await get("/api");
  assert.equal(status, 200);
  assert.ok(json.endpoints?.incidents);
});

test("POST /api/incidents without token returns 401", { skip: !serverUp && "Backend not running" }, async () => {
  const res = await fetch(`${BASE}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "test" }),
  });
  assert.equal(res.status, 401);
});

test("GET /api/admin/users without token returns 401", { skip: !serverUp && "Backend not running" }, async () => {
  const { status } = await get("/api/admin/users");
  assert.equal(status, 401);
});

test("GET /api/search without query returns 400", { skip: !serverUp && "Backend not running" }, async () => {
  const { status, json } = await get("/api/search");
  assert.equal(status, 400);
  assert.equal(json.error, "MISSING_QUERY");
});
