
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { 
  Shield, AlertTriangle, Play
} from "lucide-react";
import MitreMatrix from "@/components/mitre/MitreMatrix";
import { detectionService } from "@/services/detectionService";
import TenantHeader from "@/components/layout/TenantHeader";
import { EmulationResult } from "@/types/backend";
import { useQuery } from '@tanstack/react-query';
import { apiService } from "@/services/apiService";

// Import our new components
import CoverageAnalysis from "@/components/detection/CoverageAnalysis";
import DetectionRules from "@/components/detection/DetectionRules";
import AnomalyDisplay from "@/components/detection/AnomalyDisplay";
import SimulationPanel from "@/components/detection/SimulationPanel";

const DetectionCenter = () => {
  const [selectedTab, setSelectedTab] = useState<string>("coverage");
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [coveredTechniques, setCoveredTechniques] = useState<string[]>([]);
  const [detectedAnomalies, setDetectedAnomalies] = useState<any[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<{
    coveredTechniques: string[];
    uncoveredTechniques: string[];
    recommendations: Array<{
      techniqueId: string;
      recommendation: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  } | null>(null);

  // Fetch recent emulation results
  const { 
    data: emulationResults = [], 
    isLoading,
    error,
    refetch: refetchEmulations
  } = useQuery({
    queryKey: ['emulationResults'],
    queryFn: () => apiService.getEmulationResults(),
  });

  // Handle technique selection
  const handleTechniqueSelect = (techniqueId: string) => {
    if (selectedTechniques.includes(techniqueId)) {
      setSelectedTechniques(selectedTechniques.filter(id => id !== techniqueId));
    } else {
      setSelectedTechniques([...selectedTechniques, techniqueId]);
    }
  };

  // Use the most recent emulation result to determine coverage
  useEffect(() => {
    const analyzeLatestEmulation = async () => {
      if (emulationResults.length === 0) return;
      
      try {
        // Get the most recent emulation result
        const latestEmulation = emulationResults[0];
        
        // Extract technique IDs from logs
        const detectedTechniqueIds = latestEmulation.logs.map(log => log.techniqueId);
        
        // Set covered techniques
        setCoveredTechniques(detectedTechniqueIds);
        
        // Perform anomaly detection
        const anomalyResult = await detectionService.analyzeLogs(latestEmulation.logs);
        setDetectedAnomalies(anomalyResult.anomalies);
        
        toast({
          title: "Analysis Complete",
          description: `Analyzed ${anomalyResult.processedLogsCount} logs and found ${anomalyResult.anomalies.length} potential anomalies.`,
        });
      } catch (error) {
        console.error("Error analyzing emulation:", error);
        toast({
          title: "Analysis Error",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
    };
    
    analyzeLatestEmulation();
  }, [emulationResults]);

  // Perform gap analysis when both covered techniques and MITRE framework data are available
  const performGapAnalysis = async () => {
    try {
      // Fetch MITRE techniques
      const mitreData = await apiService.getMitreTechniques();
      
      if (!mitreData || !mitreData.techniques) {
        throw new Error("Failed to fetch MITRE techniques");
      }
      
      // Get the most recent emulation logs
      const latestEmulationLogs = emulationResults.length > 0 ? emulationResults[0].logs : [];
      
      // Perform gap analysis
      const analysis = await detectionService.performGapAnalysis(
        latestEmulationLogs,
        mitreData.techniques
      );
      
      // Update state with analysis results
      setGapAnalysis(analysis);
      
      toast({
        title: "Gap Analysis Complete",
        description: `Found ${analysis.uncoveredTechniques.length} techniques without coverage.`,
      });
    } catch (error) {
      console.error("Gap analysis error:", error);
      toast({
        title: "Gap Analysis Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Run gap analysis when the coverage tab is selected
  useEffect(() => {
    if (selectedTab === "coverage" && coveredTechniques.length > 0) {
      performGapAnalysis();
    }
  }, [selectedTab, coveredTechniques]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Detection Center</h1>
        <TenantHeader />
      </div>
      
      <Tabs defaultValue="coverage" value={selectedTab} onValueChange={setSelectedTab}>
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
        <TabsContent value="coverage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CoverageAnalysis 
              isLoading={isLoading}
              emulationResults={emulationResults}
              coveredTechniques={coveredTechniques}
              gapAnalysis={gapAnalysis}
            />
            
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>MITRE ATT&CK Coverage</CardTitle>
                <CardHeader>Visualization of covered techniques in the MITRE ATT&CK framework</CardHeader>
              </CardHeader>
              <CardContent>
                <MitreMatrix 
                  selectedTechniques={selectedTechniques}
                  onTechniqueSelect={handleTechniqueSelect}
                  coveredTechniques={coveredTechniques}
                  isInteractive={true}
                />
              </CardContent>
            </Card>
          </div>
          
          <DetectionRules isLoading={isLoading} />
        </TabsContent>
        
        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <AnomalyDisplay anomalies={detectedAnomalies} />
        </TabsContent>
        
        {/* Simulation Tab */}
        <TabsContent value="simulate" className="space-y-4">
          <SimulationPanel
            selectedTechniques={selectedTechniques}
            onTechniqueSelect={handleTechniqueSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetectionCenter;
