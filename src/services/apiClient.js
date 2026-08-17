import { auth } from "../firebase/firebase"

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:4000"

export class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.data = data
  }
}

async function getIdToken() {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

/**
 * Authenticated fetch wrapper for backend /api/* routes.
 */
export async function apiRequest(path, { method = "GET", body, auth: requireAuth = false } = {}) {
  const headers = { "Content-Type": "application/json" }
  const token = await getIdToken()

  if (requireAuth && !token) {
    throw new ApiError("Authentication required.", { status: 401, code: "UNAUTHENTICATED" })
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError("Network error — backend may be unreachable.", { status: 0, code: "NETWORK_ERROR" })
  }

  let json = null
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    try {
      json = await response.json()
    } catch {
      json = null
    }
  }

  if (response.status === 401) {
    throw new ApiError(json?.message || "Unauthorized.", { status: 401, code: json?.error || "UNAUTHENTICATED", data: json })
  }

  if (response.status === 403) {
    throw new ApiError(json?.message || "Forbidden.", { status: 403, code: json?.error || "FORBIDDEN", data: json })
  }

  if (!response.ok) {
    throw new ApiError(json?.message || `Request failed (${response.status})`, {
      status: response.status,
      code: json?.error || "REQUEST_FAILED",
      data: json,
    })
  }

  return json
}

export const api = {
  get: (path, opts) => apiRequest(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => apiRequest(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => apiRequest(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => apiRequest(path, { ...opts, method: "DELETE" }),
}

export default api
