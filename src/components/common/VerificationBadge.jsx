import React from 'react'
import { normalizeVerificationStatus } from '../../utils/intelligenceUtils'

/**
 * VerificationBadge — DisasterLens AI
 *
 * Clearly distinguishes:
 * ? UNVERIFIED
 * ◎ CORROBORATED
 * ✓ VERIFIED
 */
export const VerificationBadge = ({ status, incident, size = 'sm', showIcon = true }) => {
  const normStatus = incident ? normalizeVerificationStatus(incident) : (
    status === 'OFFICIALLY_CONFIRMED' || status === 'VERIFIED' ? 'VERIFIED' :
    status === 'CORROBORATED' ? 'CORROBORATED' : 'UNVERIFIED'
  )

  const sizeClasses = size === 'xs' 
    ? 'text-[9px] px-1.5 py-0.5' 
    : size === 'lg' 
    ? 'text-xs px-3 py-1 font-bold' 
    : 'text-[10px] px-2 py-0.5 font-bold'

  if (normStatus === 'VERIFIED') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded uppercase tracking-wider font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}
        title="Verified: Confirmed by authoritative agency or sensor network"
      >
        {showIcon && <span className="font-bold text-emerald-700">✓</span>}
        <span>VERIFIED</span>
      </span>
    )
  }

  if (normStatus === 'CORROBORATED') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded uppercase tracking-wider font-bold bg-blue-50 text-blue-800 border border-blue-300 ${sizeClasses}`}
        title="Corroborated: Supported by 2+ independent sources"
      >
        {showIcon && <span className="font-bold text-blue-600">◎</span>}
        <span>CORROBORATED</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded uppercase tracking-wider font-bold bg-amber-50 text-amber-900 border border-amber-300 ${sizeClasses}`}
      title="Unverified: Single or unconfirmed source"
    >
      {showIcon && <span className="font-bold text-amber-700">?</span>}
      <span>UNVERIFIED</span>
    </span>
  )
}

export default VerificationBadge
