import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Login } from "../common/Login"
import { Signup } from "../common/Signup"
import { HeroPage } from "../pages/HeroPage"
import { Dashboard } from "../pages/Dashboard"
import { LiveIncident } from "../pages/LiveIncident"
import { AnalyticsReports } from "../pages/AnalyticsReports"

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
    element: <Dashboard />,
  },
  {
    path: "/admin/incident",
    element: <LiveIncident />,
  },
  {
    path: "/admin/analytics",
    element: <AnalyticsReports />,
  },
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter