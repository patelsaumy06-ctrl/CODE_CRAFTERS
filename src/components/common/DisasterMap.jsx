import React, { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

/**
 * Interactive Tactical Disaster Map — Live Data Only
 *
 * Uses OpenStreetMap tiles with custom SVG/HTML markers displaying
 * real incident coordinates, severity indicators, traceable confidence, and source provenance.
 */
export const DisasterMap = ({
  incidents = [],
  onSelectIncident,
  selectedIncidentId = null,
  height = "460px",
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
      const isSelected = selectedIncidentId && inc.id === selectedIncidentId

      const color = isCritical ? "#dc2626" : isHigh ? "#ea580c" : "#2563eb"
      const disasterType = (inc.disasterType || "Incident").toUpperCase()
      const confidenceVal = inc.confidencePercent ?? (inc.confidence !== null && inc.confidence !== undefined ? Math.round(Number(inc.confidence) <= 1 ? Number(inc.confidence) * 100 : Number(inc.confidence)) : null)
      const verificationStatus = (inc.verificationStatus || (inc.verified ? "OFFICIALLY_CONFIRMED" : "UNVERIFIED")).toUpperCase()
      const officialUrl = inc.source_url || inc.sourceUrl || ""
      const sourceName = inc.source || "GDACS"

      const customHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${isCritical ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(220, 38, 38, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ""}
          <div style="width: 22px; height: 22px; border-radius: 9999px; background: ${color}; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
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

      const popupHtml = `
        <div style="font-family: inherit; min-width: 220px; padding: 3px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: bold; background: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${color}40;">
              ${disasterType}
            </span>
            <span style="font-size: 10px; font-weight: bold; color: ${
              verificationStatus === "OFFICIALLY_CONFIRMED" || verificationStatus === "VERIFIED" ? "#16a34a" :
              verificationStatus === "CORROBORATED" ? "#2563eb" : "#ca8a04"
            };">
              ${verificationStatus}
            </span>
          </div>
          <div style="font-weight: bold; font-size: 13px; color: #001d36; margin-bottom: 4px; line-height: 1.2;">
            ${inc.title || "Disaster Event"}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            📍 ${inc.location?.address || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #334155; background: #f8fafc; padding: 4px 6px; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 6px;">
            <span>Source: <b>${sourceName}</b></span>
            <span>Confidence: <b>${confidenceVal !== null ? `${confidenceVal}%` : "Not calculated"}</b></span>
          </div>
          ${officialUrl ? `
            <div style="margin-bottom: 6px; font-size: 10px; text-align: right;">
              <a href="${officialUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: bold;">
                Official Source Report ↗
              </a>
            </div>
          ` : ""}
          <button id="btn-inspect-${inc.id || inc.source_event_id}" style="width: 100%; background: #001d36; color: white; border: none; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">
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
    <div
      ref={mapContainerRef}
      style={{ height, width: "100%", zIndex: 1 }}
      className="rounded-lg overflow-hidden border border-[#E7DED2]"
    />
  )
}

export default DisasterMap
