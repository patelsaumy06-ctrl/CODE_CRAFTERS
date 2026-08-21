import React from 'react'
import { getConfidenceValue } from '../../utils/intelligenceUtils'

/**
 * ConfidenceIndicator — DisasterLens AI
 *
 * Displays clear quantitative intelligence confidence:
 * e.g., 87% CONFIDENCE with calibrated indicator colors.
 */
export const ConfidenceIndicator = ({ incident, value, showBar = false, size = 'sm' }) => {
  const conf = value !== undefined && value !== null 
    ? Math.round(Number(value) <= 1 ? Number(value) * 100 : Number(value))
    : getConfidenceValue(incident)

  if (conf === null || isNaN(conf)) {
    return (
      <span className="text-[11px] font-mono text-[#74777e] italic">
        Unscored
      </span>
    )
  }

  const colorClass = conf >= 85
    ? 'text-emerald-700 font-bold'
    : conf >= 65
    ? 'text-blue-700 font-semibold'
    : conf >= 45
    ? 'text-amber-700 font-semibold'
    : 'text-red-700 font-semibold'

  const barColor = conf >= 85
    ? 'bg-emerald-500'
    : conf >= 65
    ? 'bg-blue-500'
    : conf >= 45
    ? 'bg-amber-500'
    : 'bg-red-500'

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
      <span className={colorClass}>
        {conf}% CONFIDENCE
      </span>
      {showBar && (
        <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden inline-block">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(5, conf))}%` }}
          ></div>
        </div>
      )}
    </div>
  )
}

export default ConfidenceIndicator
