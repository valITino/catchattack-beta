
import { createBrowserRouter, Navigate, RouteObject } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Rules from "./pages/Rules";
import Incidents from "./pages/Incidents";
import NotFound from "./pages/NotFound";
import SiemIntegration from "./pages/SiemIntegration";
import EmulationSettings from "./pages/EmulationSettings";
import SigmaGenerator from "./pages/SigmaGenerator";
import InfrastructureAssessment from "./pages/InfrastructureAssessment";
import AutomationPipeline from "./pages/AutomationPipeline";
import CommunityMarketplace from "./pages/CommunityMarketplace";
import DetectionCenter from "./pages/DetectionCenter";

// Define routes using a more structured approach
const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "detection",
        element: <DetectionCenter />,
      },
      {
        path: "rules",
        element: <Rules />,
      },
      {
        path: "incidents",
        element: <Incidents />,
      },
      {
        path: "siem",
        element: <SiemIntegration />,
      },
      {
        path: "emulation",
        element: <EmulationSettings />,
      },
      {
        path: "sigma",
        element: <SigmaGenerator />,
      },
      {
        path: "infrastructure",
        element: <InfrastructureAssessment />,
      },
      {
        path: "automation",
        element: <AutomationPipeline />,
      },
      {
        path: "marketplace",
        element: <CommunityMarketplace />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      // Redirect legacy routes if needed
      {
        path: "dashboard",
        element: <Navigate to="/" replace />,
      }
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

// Create and export the router
export const router = createBrowserRouter(routes);

// Default export of the router
export default router;
