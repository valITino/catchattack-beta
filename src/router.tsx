
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import EmulationSettings from "./pages/EmulationSettings";
import SigmaGenerator from "./pages/SigmaGenerator";
import SiemIntegration from "./pages/SiemIntegration";
import InfrastructureAssessment from "./pages/InfrastructureAssessment";
import AutomationPipeline from "./pages/AutomationPipeline";
import CommunityMarketplace from "./pages/CommunityMarketplace";
import Settings from "./pages/Settings";
import Incidents from "./pages/Incidents";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />,
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
        path: "siem",
        element: <SiemIntegration />,
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
        path: "community",
        element: <CommunityMarketplace />,
      },
      {
        path: "incidents",
        element: <Incidents />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);

export default router;
