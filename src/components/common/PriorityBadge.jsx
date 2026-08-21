import React from 'react'

/**
 * Standardized Operational Priority Badge — DisasterLens AI
 *
 * Renders priority levels: CRITICAL, HIGH, MEDIUM, LOW
 */
export const PriorityBadge = ({ priority = "MEDIUM", size = "normal" }) => {
  const p = String(priority || "MEDIUM").toUpperCase()

  const config = {
    CRITICAL: {
      bg: "bg-[#b3261e]/15 text-[#b3261e] border-[#b3261e]/30",
      dot: "bg-[#b3261e]",
      pulse: true,
      label: "CRITICAL PRIORITY",
    },
    HIGH: {
      bg: "bg-[#D98B3A]/15 text-[#9a5b15] border-[#D98B3A]/30",
      dot: "bg-[#D98B3A]",
      pulse: false,
      label: "HIGH PRIORITY",
    },
    MEDIUM: {
      bg: "bg-[#00558f]/15 text-[#00558f] border-[#00558f]/30",
      dot: "bg-[#00558f]",
      pulse: false,
      label: "MEDIUM PRIORITY",
    },
    LOW: {
      bg: "bg-gray-200 text-gray-700 border-gray-300",
      dot: "bg-gray-500",
      pulse: false,
      label: "LOW PRIORITY",
    },
  }

  const current = config[p] || config.MEDIUM
  const sizeClasses = size === "small" 
    ? "text-[10px] px-2 py-0.5" 
    : "text-xs px-2.5 py-1"

  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-bold tracking-wider rounded-md border uppercase ${current.bg} ${sizeClasses}`}
    >
      <span className="relative flex h-2 w-2">
        {current.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${current.dot} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`} />
      </span>
      {current.label}
    </span>
  )
}

export default PriorityBadge
