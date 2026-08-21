import React, { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { normalizeVerificationStatus, getConfidenceValue, extractIncidentSources } from "../../utils/intelligenceUtils"

/**
 * Interactive Tactical Disaster Map — DisasterLens AI Operational Console
 *
 * Uses Leaflet with OpenStreetMap tiles, custom SVG/HTML emergency markers,
 * structured popup intelligence hierarchy, and compact operational legend.
 */
export const DisasterMap = ({
  incidents = [],
  onSelectIncident,
  selectedIncidentId = null,
  height = "480px",
}) => {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersLayerRef = useRef(null)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.0, 0.0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      const markersLayer = L.layerGroup().addTo(map)
      markersLayerRef.current = markersLayer
      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update Markers when incidents change
  useEffect(() => {
    const map = mapInstanceRef.current
    const markersLayer = markersLayerRef.current
    if (!map || !markersLayer) return

    markersLayer.clearLayers()

    const validIncidents = incidents.filter((inc) => {
      const lat = Number(inc.location?.latitude ?? inc.latitude)
      const lon = Number(inc.location?.longitude ?? inc.longitude)
      return !Number.isNaN(lat) && !Number.isNaN(lon) && (lat !== 0 || lon !== 0) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
    })

    const bounds = []

    validIncidents.forEach((inc) => {
      const lat = Number(inc.location?.latitude ?? inc.latitude)
      const lon = Number(inc.location?.longitude ?? inc.longitude)
      bounds.push([lat, lon])

      const severity = (inc.severity || "medium").toLowerCase()
      const isCritical = severity === "critical"
      const isHigh = severity === "high"
      const isSelected = selectedIncidentId && (inc.id === selectedIncidentId || inc.source_event_id === selectedIncidentId)

      const color = isCritical ? "#dc2626" : isHigh ? "#ea580c" : severity === "medium" ? "#d97706" : "#2563eb"
      const disasterType = (inc.disasterType || "Incident").toUpperCase()
      const confidenceVal = getConfidenceValue(inc)
      const normVerification = normalizeVerificationStatus(inc)
      const sources = extractIncidentSources(inc)
      const evidenceCount = Array.isArray(inc.evidence) && inc.evidence.length > 0 ? inc.evidence.length : inc.sourceCount || sources.length
      const locationStr = inc.location?.address || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`
      const officialUrl = inc.source_url || inc.sourceUrl || ""

      const verificationBadgeHtml = normVerification === "VERIFIED"
        ? `<span style="display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: bold; background: #ecfdf5; color: #065f46; padding: 2px 6px; border-radius: 4px; border: 1px solid #6ee7b7;">✓ VERIFIED</span>`
        : normVerification === "CORROBORATED"
        ? `<span style="display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: bold; background: #eff6ff; color: #1e40af; padding: 2px 6px; border-radius: 4px; border: 1px solid #93c5fd;">◎ CORROBORATED</span>`
        : `<span style="display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: bold; background: #fffbeb; color: #92400e; padding: 2px 6px; border-radius: 4px; border: 1px solid #fcd34d;">? UNVERIFIED</span>`

      const customHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${isCritical ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(220, 38, 38, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ""}
          <div style="width: 22px; height: 22px; border-radius: 9999px; background: ${color}; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
            ${isCritical ? "!" : ""}
          </div>
        </div>
      `

      const customIcon = L.divIcon({
        html: customHtml,
        className: "disaster-map-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      })

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(markersLayer)

      // Step 3: Structured Popup Hierarchy
      const popupHtml = `
        <div style="font-family: inherit; min-width: 240px; max-width: 280px; padding: 4px; color: #1e293b;">
          <!-- 1. Header: Disaster Type & Severity -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; background: #f1f5f9; color: #001d36; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; text-transform: uppercase;">
              ${disasterType}
            </span>
            <span style="font-size: 10px; font-weight: 800; background: ${color}15; color: ${color}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${color}40; text-transform: uppercase;">
              ${severity}
            </span>
          </div>

          <!-- 2. Incident Title -->
          <div style="font-weight: 700; font-size: 13px; color: #001d36; margin-bottom: 4px; line-height: 1.3;">
            ${inc.title || "Disaster Event"}
          </div>

          <!-- 3. Location -->
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 4px;">
            <span>📍</span>
            <span style="word-break: break-word;">${locationStr}</span>
          </div>

          <!-- 4. Confidence & Verification Status -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; color: #64748b; font-weight: 600;">CONFIDENCE</span>
              <span style="font-family: monospace; font-weight: 700; color: #001d36;">
                ${confidenceVal !== null ? `${confidenceVal}%` : "Uncalculated"}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 10px; color: #64748b; font-weight: 600;">STATUS</span>
              ${verificationBadgeHtml}
            </div>
          </div>

          <!-- 5. Source & Evidence Count -->
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #475569; margin-bottom: 8px; padding: 0 2px;">
            <span>EVIDENCE: <b>${evidenceCount} ${evidenceCount === 1 ? 'SOURCE' : 'SOURCES'}</b></span>
            <span style="color: #64748b; font-family: monospace;">${sources.slice(0, 2).join(", ")}</span>
          </div>

          ${officialUrl ? `
            <div style="margin-bottom: 8px; font-size: 10px; text-align: right;">
              <a href="${officialUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 600;">
                Official Source Feed ↗
              </a>
            </div>
          ` : ""}

          <!-- 6. Action Button -->
          <button id="btn-inspect-${inc.id || inc.source_event_id}" style="width: 100%; background: #001d36; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.2s;">
            Inspect Incident Details →
          </button>
        </div>
      `

      marker.bindPopup(popupHtml)

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-inspect-${inc.id || inc.source_event_id}`)
        if (btn) {
          btn.onclick = () => {
            if (onSelectIncident) {
              onSelectIncident(inc)
            }
          }
        }
      })

      if (isSelected) {
        marker.openPopup()
      }
    })

    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 5)
      } else {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 })
      }
    }
  }, [incidents, selectedIncidentId, onSelectIncident])

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-[#E7DED2]">
      <div
        ref={mapContainerRef}
        style={{ height, width: "100%", zIndex: 1 }}
      />

      {/* Step 3: Compact Map Legend Overlay */}
      <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-xs border border-[#E7DED2] rounded-lg p-2.5 shadow-md text-[10px] space-y-2 pointer-events-auto max-w-[210px]">
        {/* Severity Legend */}
        <div>
          <div className="font-bold uppercase tracking-wider text-[#001d36] text-[9px] mb-1">
            Severity
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[#43474d]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
              <span>High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
              <span>Low</span>
            </div>
          </div>
        </div>

        {/* Verification Legend */}
        <div className="pt-1.5 border-t border-slate-200">
          <div className="font-bold uppercase tracking-wider text-[#001d36] text-[9px] mb-1">
            Verification
          </div>
          <div className="space-y-1 text-[#43474d]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-emerald-600 text-xs">✓</span>
              <span>Verified (Official/Sensor)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-blue-600 text-xs">◎</span>
              <span>Corroborated (2+ Sources)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-amber-600 text-xs">?</span>
              <span>Unverified (Single Source)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DisasterMap
