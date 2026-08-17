import { test, before } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

const BASE = process.env.API_BASE || "http://127.0.0.1:4000";
let serverUp = false;

function get(path) {
  return new Promise((resolve, reject) => {
    http
      .get(`${BASE}${path}`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, json: null });
          }
        });
      })
      .on("error", reject);
  });
}

before(async () => {
  try {
    const res = await get("/api/health");
    serverUp = res.status === 200;
  } catch {
    serverUp = false;
  }
});

test("GET /api/health returns service status", async (t) => {
  if (!serverUp) return t.skip("Backend not running on :4000");
  const { status, json } = await get("/api/health");
  assert.equal(status, 200);
  assert.ok(json.service);
  assert.ok("firebase" in json);
});

test("GET /api returns endpoint documentation", async (t) => {
  if (!serverUp) return t.skip("Backend not running");
  const { status, json } = await get("/api");
  assert.equal(status, 200);
  assert.ok(json.endpoints?.incidents);
});

test("POST /api/incidents without token returns 401", async (t) => {
  if (!serverUp) return t.skip("Backend not running");
  const req = http.request(`${BASE}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const res = await new Promise((resolve) => {
    req.on("response", resolve);
    req.end(JSON.stringify({ title: "test" }));
  });
  assert.equal(res.statusCode, 401);
});

test("GET /api/admin/users without token returns 401", async (t) => {
  if (!serverUp) return t.skip("Backend not running");
  const { status } = await get("/api/admin/users");
  assert.equal(status, 401);
});

test("GET /api/search without query returns 400", async (t) => {
  if (!serverUp) return t.skip("Backend not running");
  const { status, json } = await get("/api/search");
  assert.equal(status, 400);
  assert.equal(json.error, "MISSING_QUERY");
});
