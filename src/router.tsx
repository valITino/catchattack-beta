
import { createBrowserRouter, Navigate } from "react-router-dom";

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

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
      {
        path: "/detection",
        element: <DetectionCenter />,
      },
      {
        path: "/rules",
        element: <Rules />,
      },
      {
        path: "/incidents",
        element: <Incidents />,
      },
      {
        path: "/siem",
        element: <SiemIntegration />,
      },
      {
        path: "/emulation",
        element: <EmulationSettings />,
      },
      {
        path: "/sigma",
        element: <SigmaGenerator />,
      },
      {
        path: "/infrastructure",
        element: <InfrastructureAssessment />,
      },
      {
        path: "/automation",
        element: <AutomationPipeline />,
      },
      {
        path: "/marketplace",
        element: <CommunityMarketplace />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
