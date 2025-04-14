
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, Play } from "lucide-react";
import CoverageTabContent from "./CoverageTabContent";
import AnomalyDisplay from "@/components/detection/AnomalyDisplay";
import SimulationPanel from "@/components/detection/SimulationPanel";
import { EmulationResult } from "@/types/backend";

interface DetectionCenterTabsProps {
  selectedTab: string;
  onTabChange: (value: string) => void;
  isLoading: boolean;
  emulationResults: EmulationResult[];
  coveredTechniques: string[];
  gapAnalysis: {
    coveredTechniques: string[];
    uncoveredTechniques: string[];
    recommendations: Array<{
      techniqueId: string;
      recommendation: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  } | null;
  selectedTechniques: string[];
  onTechniqueSelect: (techniqueId: string) => void;
  anomalies: any[];
}

const DetectionCenterTabs = ({
  selectedTab,
  onTabChange,
  isLoading,
  emulationResults,
  coveredTechniques,
  gapAnalysis,
  selectedTechniques,
  onTechniqueSelect,
  anomalies
}: DetectionCenterTabsProps) => {
  return (
    <Tabs defaultValue="coverage" value={selectedTab} onValueChange={onTabChange}>
      <TabsList className="grid grid-cols-3 w-[400px]">
        <TabsTrigger value="coverage">
          <Shield className="h-4 w-4 mr-2" />
          Coverage
        </TabsTrigger>
        <TabsTrigger value="anomalies">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Anomalies
        </TabsTrigger>
        <TabsTrigger value="simulate">
          <Play className="h-4 w-4 mr-2" />
          Simulate
        </TabsTrigger>
      </TabsList>
      
      {/* Coverage Analysis Tab */}
      <TabsContent value="coverage">
        <CoverageTabContent 
          isLoading={isLoading}
          emulationResults={emulationResults}
          coveredTechniques={coveredTechniques}
          gapAnalysis={gapAnalysis}
          selectedTechniques={selectedTechniques}
          onTechniqueSelect={onTechniqueSelect}
        />
      </TabsContent>
      
      {/* Anomalies Tab */}
      <TabsContent value="anomalies" className="space-y-4">
        <AnomalyDisplay anomalies={anomalies} />
      </TabsContent>
      
      {/* Simulation Tab */}
      <TabsContent value="simulate" className="space-y-4">
        <SimulationPanel
          selectedTechniques={selectedTechniques}
          onTechniqueSelect={onTechniqueSelect}
        />
      </TabsContent>
    </Tabs>
  );
};

export default DetectionCenterTabs;
