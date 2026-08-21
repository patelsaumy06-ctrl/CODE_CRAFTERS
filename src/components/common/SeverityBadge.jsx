import React from 'react'

/**
 * SeverityBadge — DisasterLens AI
 *
 * Distinctive operational severity indicator:
 * CRITICAL (pulsing red)
 * HIGH (deep orange)
 * MEDIUM (amber/slate)
 * LOW (muted slate/green)
 */
export const SeverityBadge = ({ severity = 'medium', size = 'sm', pulse = false }) => {
  const sev = (severity || 'medium').toLowerCase()

  const sizeClasses = size === 'xs'
    ? 'text-[9px] px-1.5 py-0.5'
    : size === 'lg'
    ? 'text-xs px-3 py-1 font-bold tracking-wider'
    : 'text-[10px] px-2 py-0.5 font-bold tracking-wide'

  if (sev === 'critical') {
    return (
      <span className="relative inline-flex items-center">
        {(pulse || true) && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1 rounded uppercase font-bold bg-red-50 text-red-800 border border-red-300 shadow-xs ${sizeClasses}`}
          title="Critical Severity: Immediate danger to life and critical infrastructure"
        >
          <span>CRITICAL</span>
        </span>
      </span>
    )
  }

  if (sev === 'high') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded uppercase font-bold bg-orange-50 text-orange-800 border border-orange-300 ${sizeClasses}`}
        title="High Severity: Serious threat requiring urgent response"
      >
        <span>HIGH</span>
      </span>
    )
  }

  if (sev === 'medium') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded uppercase font-bold bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}
        title="Medium Severity: Moderate impact under monitoring"
      >
        <span>MEDIUM</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded uppercase font-bold bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}
      title="Low Severity: Minor or localized event"
    >
      <span>LOW</span>
    </span>
  )
}

export default SeverityBadge
