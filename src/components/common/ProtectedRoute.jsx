import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation()
  const { currentUser, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F3EC] p-6 text-center">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl border border-[#E7DED2] shadow-sm">
          <span className="w-5 h-5 border-2 border-[#D98B3A] border-t-transparent rounded-full animate-spin"></span>
          <span className="text-sm font-semibold text-[#001d36]">Verifying Security Credentials...</span>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    // Redirect to login page if user is not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // User does not have required role
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F3EC] p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#E7DED2] max-w-md w-full">
          <span className="material-symbols-outlined text-[64px] text-red-500 mb-4">
            gpp_bad
          </span>
          <h2 className="text-2xl font-bold text-[#001d36] mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You do not have permission to view this page. Your role is <span className="font-bold uppercase text-amber-600">{userRole}</span>. Required role(s): <span className="font-semibold">{allowedRoles.join(', ')}</span>.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
            >
              Go Back
            </button>
            <a
              href="/login"
              className="px-4 py-2 bg-[#001d36] hover:bg-opacity-90 text-white font-semibold rounded-lg transition-colors"
            >
              Switch Account
            </a>
          </div>
        </div>
      </div>
    )
  }

  return children
}
