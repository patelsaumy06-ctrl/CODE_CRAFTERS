# DisasterLens AI — External API Integration Documentation

This document describes the external disaster, weather, news, and humanitarian API integrations implemented in the DisasterLens AI backend.

---

## Data Sources Overview

| Data Source | Type | Endpoint / Base URL | API Key Required? | Access Pattern / Schedule | Reliability Weight |
|---|---|---|---|---|---|
| **USGS Earthquake** | Official | `https://earthquake.usgs.gov/fdsnws/event/1/` | No | Background Worker (**5 min**) | `0.95` |
| **GDACS** | Official | `https://www.gdacs.org/xml/rss.xml` | No | Background Worker (**5 min**) | `0.95` |
| **NASA EONET** | Official | `https://eonet.gsfc.nasa.gov/api/v3/events` | No | Background Worker (**10 min**) | `0.95` |
| **GDELT News** | Unverified News | `https://api.gdeltproject.org/api/v2/doc/doc` | No | Background Worker (**15 min**) | `0.50` |
| **ReliefWeb** | Trusted Humanitarian | `https://api.reliefweb.int/v2/reports` | No | Background Worker (**30 min**) | `0.85` |
| **Open-Meteo Forecast** | Telemetry | `https://api.open-meteo.com/v1/forecast` | No | **On-demand** (Cached 15m) | `0.90` |
| **Open-Meteo Flood** | Telemetry | `https://flood-api.open-meteo.com/v1/flood` | No | **On-demand** (Cached 60m) | `0.90` |

---

## 1. Background Ingestion Worker (Phase 4)

The background worker (`backend/src/workers/ingestionWorker.js`) periodically polls external disaster APIs and passes raw events through the canonical Golden Processing Pipeline (`processingPipeline.js`).

### Polling Schedule & Settings
```text
USGS        → Every 5 minutes  (USGS_INTERVAL_MS=300000)
GDACS       → Every 5 minutes  (GDACS_INTERVAL_MS=300000)
NASA EONET  → Every 10 minutes (EONET_INTERVAL_MS=600000)
GDELT       → Every 15 minutes (GDELT_INTERVAL_MS=900000)
ReliefWeb   → Every 30 minutes (RELIEFWEB_INTERVAL_MS=1800000)
```

### Worker Architecture & Resilience

```text
SCHEDULE TIMER TICK
       ↓
Overlap Prevention Lock Check (Skip if previous run is still active)
       ↓
Execute External API Fetcher (with Exponential Backoff Retries on 5xx/429/timeouts)
       ↓
Batch Processing (Process each item via processingPipeline; isolated errors do not halt batch)
       ↓
Update Service State (lastSuccess, lastFailure, successCount, eventsProcessed)
       ↓
Release Overlap Lock & Compute nextRun
```

- **Overlap Prevention**: Per-service mutex locks prevent simultaneous execution of the same provider if a previous query is still running.
- **Service Isolation**: If one provider times out or fails (e.g. GDELT timeout or ReliefWeb 403), other providers execute independently without crashing the backend.
- **Retry & Backoff**: Transient errors (timeouts, 429 rate limits, 500/502/503/504 server errors) are retried up to 3 times with exponential backoff (`baseDelay * 2^(attempt-1)`). Permanent client errors (400, 401, 403) fail fast without wasteful retries.
- **Graceful Shutdown**: Listens to `SIGTERM` and `SIGINT` to clear timers and allow in-flight pipeline transactions to complete before closing the process.
- **Worker Toggle**: Can be disabled via `INGESTION_WORKER_ENABLED=false` for tests or isolated workers.

---

## 2. Weather & Flood Telemetry Correlation (Phase 2)

Open-Meteo is queried **on-demand** for specific coordinates:
```text
Incident Detected / User Query → (lat, lon) → MemoryCache Check → Open-Meteo → weatherCorrelationService → Risk/Confidence
```

- **Weather Parameters**: Temperature, Precipitation, Rain, Wind Speed, Weather Code, Soil Moisture.
- **Flood Parameters**: River Discharge, Peak River Discharge.
- **Cache**: 15m for weather forecast, 60m for river discharge.

---

## 3. Unstructured News & Humanitarian Intelligence (Phase 3)

### Verification Status Lifecycle
1. **`unverified`**: Single news source (e.g. GDELT only) or unconfirmed social post.
2. **`corroborated`**: 2+ independent sources agree (e.g. GDELT + ReliefWeb) or confidence >= 65%.
3. **`verified`**: 3+ independent sources, or official source (USGS/GDACS/EONET/Sensor) + supporting evidence.

---

## API Endpoints

### `GET /api/health`
Includes real-time health metrics for the server, Firestore connection, and the Background Ingestion Worker.

```json
{
  "status": "ok",
  "worker": {
    "running": true,
    "enabled": true,
    "startedAt": "2026-08-19T04:57:47.021Z",
    "services": {
      "usgs": { "status": "idle", "intervalMs": 300000, "successCount": 1, "failureCount": 0, "eventsProcessed": 62 },
      "gdacs": { "status": "idle", "intervalMs": 300000, "successCount": 1, "failureCount": 0, "eventsProcessed": 397 },
      "eonet": { "status": "idle", "intervalMs": 600000, "successCount": 1, "failureCount": 0, "eventsProcessed": 30 },
      "gdelt": { "status": "idle", "intervalMs": 900000, "successCount": 1, "failureCount": 0, "eventsProcessed": 0 },
      "reliefweb": { "status": "idle", "intervalMs": 1800000, "successCount": 1, "failureCount": 0, "eventsProcessed": 0 }
    }
  }
}
```

### `GET /api/disasters/news`
Returns combined and normalized disaster news and humanitarian reports (`?query=`, `?location=`, `?limit=`).

### `POST /api/ai/verify`
Runs AI extraction and verification reasoning on input text and evidence sources.

### `POST /api/risk/analyze`
Correlates coordinates with Open-Meteo weather and river telemetry.
