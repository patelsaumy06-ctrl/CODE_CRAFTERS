import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Login } from "../common/Login"
import { Signup } from "../common/Signup"
import { HeroPage } from "../pages/HeroPage"
import { Dashboard } from "../pages/Dashboard"
import { LiveIncident } from "../pages/LiveIncident"
import { AnalyticsReports } from "../pages/AnalyticsReports"
import { ProtectedRoute } from "../common/ProtectedRoute"

const router = createBrowserRouter([
  {
    path: "/",
    element: <HeroPage />,
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
    path: "/admin/incident",
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
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter