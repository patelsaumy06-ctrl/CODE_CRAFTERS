/**
 * DisasterLens AI — Demo Scenario Runner
 *
 * Simulates the full SIH demonstration flow:
 * 1. Sensor reading (water gauge spike)
 * 2. Citizen report (flooding near bridge)
 * 3. Social media report (panic about rising water)
 * 4. News report (media confirms flooding)
 * 5. Second sensor (power grid failure)
 * 6. Citizen report (structural damage)
 *
 * Each ingestion triggers the full pipeline:
 * Normalize → Classify → Cluster → Confidence → Severity → Alert → Recommend
 *
 * Run: node backend/src/workers/demoRunner.js
 */

import "dotenv/config";
import { initFirebase } from "../config/firebase.js";
import { pipeline } from "../services/processingPipeline.js";
import { SOURCE_TYPES } from "../config/constants.js";

const DEMO_SCENARIOS = [
  {
    delay: 0,
    sourceType: SOURCE_TYPES.SENSOR,
    label: "🔴 SENSOR: Water gauge spike detected",
    data: {
      stationId: "NOAA-WG-402",
      stationName: "NOAA Gauge Station #402 — Riverside Sector 4",
      sensorType: "water_level",
      value: 7.8,
      threshold: 5.0,
      unit: "meters",
      latitude: 19.0760,
      longitude: 72.8777,
      description: "Water level rising rapidly — flood stage exceeded at gauge station 402.",
      timestamp: new Date().toISOString(),
    },
  },
  {
    delay: 3000,
    sourceType: SOURCE_TYPES.CITIZEN,
    label: "📱 CITIZEN: Flooding report near 4th Street Bridge",
    data: {
      title: "[DEMO] Severe flooding near 4th Street Bridge",
      description: "Water level rising fast near 4th street bridge! Roads completely impassable. Multiple cars stranded. Water entering ground floor shops. Need immediate evacuation assistance!",
      latitude: 19.0748,
      longitude: 72.8790,
      address: "4th Street Bridge, Riverside, Sector 4",
      casualties: 0,
      affectedPeople: 500,
      userId: "demo_citizen_01",
      verified: false,
    },
  },
  {
    delay: 5000,
    sourceType: SOURCE_TYPES.SOCIAL,
    label: "🐦 SOCIAL: Twitter panic about rising water",
    data: {
      platform: "X/Twitter",
      handle: "@sector4_resident",
      text: "URGENT! Water level rising dangerously near Sector 4 bridge! Saw people trapped on rooftops. Fire brigade not yet arrived. Someone please call for help! #FloodAlert #DisasterRelief #EmergencyEvacuation",
      latitude: 19.0755,
      longitude: 72.8782,
      locationText: "Near Sector 4 Bridge, Riverside",
      likes: 1240,
      retweets: 890,
      followers: 5200,
      timestamp: new Date().toISOString(),
    },
  },
  {
    delay: 8000,
    sourceType: SOURCE_TYPES.NEWS,
    label: "📰 NEWS: Media confirms catastrophic flooding",
    data: {
      headline: "[DEMO] Catastrophic Flooding in Sector 4 — Emergency Evacuation Ordered",
      body: "Breaking: Massive flooding has inundated the Sector 4 area following a levee breach near the Riverside Bridge. Water levels have surged 2.8 meters above normal. Authorities have issued immediate evacuation orders for all residents within a 3km radius. NDRF teams are being deployed. An estimated 2,000 people are affected with reports of structural damage to multiple buildings. Power grid failure reported across 5 sub-stations.",
      source: "National Disaster News Network",
      publisher: "NDNN",
      url: "https://ndnn.gov.in/breaking/sector4-flood-emergency",
      author: "Emergency Correspondent",
      latitude: 19.0760,
      longitude: 72.8780,
      locationText: "Sector 4, Riverside District",
      publishedAt: new Date().toISOString(),
    },
  },
  {
    delay: 11000,
    sourceType: SOURCE_TYPES.SENSOR,
    label: "⚡ SENSOR: Power grid failure detected",
    data: {
      stationId: "GRID-SUB-B",
      stationName: "Sub-Station B — Sector 4 Power Grid",
      sensorType: "power_grid",
      value: 0,
      threshold: 220,
      unit: "volts",
      latitude: 19.0770,
      longitude: 72.8795,
      description: "Complete power grid failure at Sub-station B. Electric pole collapse reported near flooded area. Blackout across 5 blocks.",
      timestamp: new Date().toISOString(),
    },
  },
  {
    delay: 14000,
    sourceType: SOURCE_TYPES.CITIZEN,
    label: "🏚️ CITIZEN: Building structural damage report",
    data: {
      title: "[DEMO] Building collapse risk — Sector 4 flood damage",
      description: "Emergency! The old apartment building on River Road is showing major cracks from water damage. Foundation is compromised. At least 12 families still inside. Immediate evacuation and structural assessment needed! Building may collapse.",
      latitude: 19.0742,
      longitude: 72.8770,
      address: "River Road Apartments, Sector 4",
      casualties: 2,
      affectedPeople: 48,
      userId: "demo_citizen_02",
      verified: false,
    },
  },
];

async function runDemo() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        DisasterLens AI — SIH Demo Scenario Runner          ║
║        PS-SW-005 Multi-Source Intelligence Demo             ║
╠══════════════════════════════════════════════════════════════╣
║  Simulating: Sector 4 Flood Emergency                      ║
║  Events: ${DEMO_SCENARIOS.length} multi-source intelligence reports              ║
║  Pipeline: Normalize→Classify→Cluster→Score→Alert→Recommend║
╚══════════════════════════════════════════════════════════════╝
  `);

  // Initialize Firebase
  console.log("⏳ Initializing Firebase Admin SDK...\n");
  initFirebase();

  for (let i = 0; i < DEMO_SCENARIOS.length; i++) {
    const scenario = DEMO_SCENARIOS[i];

    // Delay for dramatic effect during demo
    if (scenario.delay > 0) {
      console.log(`\n⏳ Waiting ${scenario.delay / 1000}s for next event...\n`);
      await sleep(scenario.delay);
    }

    console.log(`\n${"═".repeat(60)}`);
    console.log(`EVENT ${i + 1}/${DEMO_SCENARIOS.length}: ${scenario.label}`);
    console.log(`${"═".repeat(60)}`);

    const result = await pipeline.process(scenario.sourceType, scenario.data);

    if (result.success) {
      console.log(`✅ Processed in ${result.processingTimeMs}ms`);
      console.log(`   📍 Incident: ${result.incidentId} (${result.isNew ? "NEW" : "MERGED"})`);
      console.log(`   🎯 Classification: ${result.classification.disasterType} (${(result.classification.confidence * 100).toFixed(1)}%)`);
      console.log(`   🔥 Severity: ${result.severity.severity.toUpperCase()}${result.severity.escalated ? " ⬆️ ESCALATED!" : ""}`);
      console.log(`   📊 Confidence: ${(result.confidence.confidence * 100).toFixed(1)}%`);

      if (result.alert?.shouldAlert) {
        console.log(`   🚨 ALERT TRIGGERED: ${result.alert.reason}`);
      }

      if (result.recommendations) {
        console.log(`   📋 ${result.recommendations.recommendations.length} recommendations generated`);
      }
    } else {
      console.log(`❌ Pipeline error: ${result.error}`);
    }
  }

  // Final summary
  const stats = pipeline.getStats();
  console.log(`\n\n${"═".repeat(60)}`);
  console.log("📊 DEMO COMPLETE — Pipeline Summary");
  console.log(`${"═".repeat(60)}`);
  console.log(`   Total Processed: ${stats.processed}`);
  console.log(`   New Incidents: ${stats.incidents_created}`);
  console.log(`   Merged Events: ${stats.incidents_merged}`);
  console.log(`   Alerts Triggered: ${stats.alerts_triggered}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`\n✅ Demo scenario complete. Check Firebase console and frontend dashboard.\n`);

  process.exit(0);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

runDemo().catch((error) => {
  console.error("Demo runner fatal error:", error);
  process.exit(1);
});
