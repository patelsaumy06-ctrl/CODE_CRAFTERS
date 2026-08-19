# 🚨 DisasterLens AI – AI-Powered Multi-Source Emergency Intelligence Platform

> **SIH Problem Statement PS-SW-005** | *Real-Time Multi-Source Disaster Telemetry, Event Clustering, Weather Correlation & AI Verification Platform*

DisasterLens AI continuously aggregates, classifies, clusters, and verifies multi-source disaster intelligence in real-time from official global networks, telemetry APIs, citizen streams, and media feeds — providing incident commanders with actionable, ground-truth data in under 30 seconds.

---

## 🌟 Architecture & Data Flow

```text
       OFFICIAL FEEDS (USGS / GDACS / NASA EONET)
                          │
       UNSTRUCTURED NEWS (GDELT / ReliefWeb)
                          │
       CITIZEN & IOT SENSORS (Sensors / Social)
                          │
                          ▼
            BACKGROUND INGESTION WORKER
     (5m / 10m / 15m / 30m with Overlap Locks & Backoff)
                          │
                          ▼
             CANONICAL PROCESSING PIPELINE
  (Normalize → Classify → Cluster → Confidence → Severity → Evidence)
                          │
                          ▼
               FIRESTORE / IN-MEMORY STORE
                          │
                          ▼
                  EXPRESS REST API
   (/api/incidents, /api/risk, /api/ai, /api/disasters/news)
                          │
                          ▼
              REACT 19 FRONTEND + LEAFLET
         (Tactical GIS Threat Map & Command Center)
```

---

## 📡 Integrated Data Sources

| Data Source | Type | Schedule / Access | Reliability Weight | Free / Open-Access Policy |
|---|---|---|---|---|
| **USGS Earthquake** | Official Seismic | 5 min Polling | `0.95` | Open Data (FDSNWS GeoJSON) |
| **GDACS Global Alerts** | Official Multi-Hazard | 5 min Polling | `0.95` | Open Data (RSS XML / JSON) |
| **NASA EONET** | Official Natural Events | 10 min Polling | `0.95` | Open NASA Open API v3 |
| **Open-Meteo Forecast** | Weather Telemetry | **On-Demand** (15m Cache) | `0.90` | Open-Meteo Non-commercial/Open |
| **Open-Meteo Flood** | Hydrological Telemetry | **On-Demand** (60m Cache) | `0.90` | Open-Meteo Global Flood API |
| **ReliefWeb** | Trusted Humanitarian | 30 min Polling | `0.85` | UN OCHA Open API v2 |
| **GDELT DOC API** | Global News Monitor | 15 min Polling | `0.50` | GDELT Project v2 |

---

## 🗺️ Interactive Tactical GIS Threat Map
- **Provider**: Leaflet + OpenStreetMap Carto tiles (100% free & open-source).
- **Markers**: Plotted with real incident latitude/longitude, pulsing critical warning beacons, confidence scores, and multi-source evidence counts.
- **Interactivity**: Zoom, pan, cluster view, and click-to-inspect detail navigation.

---

## 🧠 AI Verification & Confidence Engine
- **Verification Lifecycle**: `unverified` (single news item) &rarr; `corroborated` (2+ independent sources) &rarr; `verified` (3+ sources or official feed).
- **Explainable Factors**: Transparent scoring breakdown across Source Reliability, Corroboration Count, Sensor Exceedance, Geographic Proximity, Temporal Consistency, and AI Classifier Confidence.
- **Deterministic Authoritative Fallback**: Authoritative keyword classification ensures zero downtime when external LLMs are unconfigured.

---

## 🚀 Quick Start Guide

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at `http://localhost:4000`.

### 2. Start Frontend
```bash
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 🧪 Verification & Test Commands

```bash
# Run all 39 unit & integration tests
cd backend && npm test

# Verify all REST API routes
node scripts/verify-api.mjs

# Run full End-to-End verification scenario
node scripts/e2e-verify.mjs

# Verify frontend production build
npm run build
```
