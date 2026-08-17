import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Login } from "../common/Login"
import { Signup } from "../common/Signup"
import { ProtectedRoute } from "../common/ProtectedRoute"

import { HeroPage } from "../pages/HeroPage"
import { Dashboard } from "../pages/Dashboard"
import { AdminControlCenter } from "../pages/AdminControlCenter"
import { LiveIncident } from "../pages/LiveIncident"
import { AnalyticsReports } from "../pages/AnalyticsReports"
import { AlertsNotifications } from "../pages/AlertsNotifications"
import { LiveIntelligenceFeed } from "../pages/LiveIntelligenceFeed"
import { SearchIntelligence } from "../pages/SearchIntelligence"
import { HowItWorks } from "../pages/HowItWorks"
import { SupportOnboarding } from "../pages/SupportOnboarding"

const router = createBrowserRouter([
  {
    path: "/",
    element: <HeroPage />,
  },
  {
    path: "/how-it-works",
    element: <HowItWorks />,
  },
  {
    path: "/support",
    element: <SupportOnboarding />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin", "commander", "responder"]}>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/control-center",
    element: (
      <ProtectedRoute allowedRoles={["admin", "commander"]}>
        <AdminControlCenter />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/incident",
    element: (
      <ProtectedRoute allowedRoles={["admin", "commander", "responder"]}>
        <LiveIncident />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/incident/:id",
    element: (
      <ProtectedRoute allowedRoles={["admin", "commander", "responder"]}>
        <LiveIncident />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/analytics",
    element: (
      <ProtectedRoute allowedRoles={["admin", "commander"]}>
        <AnalyticsReports />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/notifications",
    element: (
      <ProtectedRoute allowedRoles={["admin", "commander", "responder"]}>
        <AlertsNotifications />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/intelligence-feed",
    element: (
      <ProtectedRoute allowedRoles={["admin", "commander", "responder"]}>
        <LiveIntelligenceFeed />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/search",
    element: (
      <ProtectedRoute allowedRoles={["admin", "commander", "responder"]}>
        <SearchIntelligence />
      </ProtectedRoute>
    ),
  },
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter