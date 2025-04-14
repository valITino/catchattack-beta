
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { detectionService } from "@/services/detectionService";
import { useQuery } from '@tanstack/react-query';
import { apiService } from "@/services/apiService";
import { EmulationResult } from "@/types/backend";

export function useDetectionCenter() {
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

  return {
    selectedTab,
    setSelectedTab,
    selectedTechniques,
    setSelectedTechniques,
    handleTechniqueSelect,
    coveredTechniques,
    detectedAnomalies,
    gapAnalysis,
    emulationResults,
    isLoading,
    performGapAnalysis
  };
}
