import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, AlertTriangle, CheckCircle, Play, Bell, Upload, 
  RefreshCw, Filter, Calendar, ChevronRight
} from "lucide-react";
import MitreMatrix from "@/components/mitre/MitreMatrix";
import { detectionService } from "@/services/detectionService";
import TenantHeader from "@/components/layout/TenantHeader";
import { EmulationResult, EmulationLog } from "@/types/backend";
import { useQuery } from '@tanstack/react-query';
import { apiService } from "@/services/apiService";

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

  // Function to get severity badge variant based on severity level
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'secondary';
      default: return 'outline';
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
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-500" />
                  Coverage Summary
                </CardTitle>
                <CardDescription>Detection coverage analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                ) : emulationResults.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="mb-2">No emulation results found</div>
                    <p className="text-sm text-muted-foreground">
                      Run an emulation to analyze detection coverage
                    </p>
                    <Button variant="outline" size="sm" className="mt-4">
                      <Play className="h-4 w-4 mr-2" />
                      Run New Emulation
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-xl font-bold">
                        {coveredTechniques.length} Techniques
                      </div>
                      <div className="text-sm text-muted-foreground">
                        detected in last emulation
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Latest Emulation</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(emulationResults[0].timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {gapAnalysis && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Coverage Gaps</div>
                        <div className="flex items-center text-amber-500">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          <span>
                            {gapAnalysis.uncoveredTechniques.length} techniques without coverage
                          </span>
                        </div>
                        
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {gapAnalysis.recommendations.slice(0, 5).map((rec, i) => (
                              <div key={i} className="text-sm p-2 rounded-md bg-muted">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs">{rec.techniqueId}</span>
                                  <Badge 
                                    variant={rec.priority === 'high' ? 'destructive' : 'outline'}
                                    className="text-xs"
                                  >
                                    {rec.priority}
                                  </Badge>
                                </div>
                                <p className="mt-1">{rec.recommendation}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>MITRE ATT&CK Coverage</CardTitle>
                <CardDescription>
                  Visualization of covered techniques in the MITRE ATT&CK framework
                </CardDescription>
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
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Detection Rules</CardTitle>
              <CardDescription>Manage and deploy detection rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Button variant="outline" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Deploy Rules
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                {isLoading ? (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No detection rules generated yet
                    </p>
                    <Button variant="outline" className="mt-4">
                      Generate Rules from Latest Emulation
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Detected Anomalies</CardTitle>
              <CardDescription>AI-detected anomalies from recent emulations</CardDescription>
            </CardHeader>
            <CardContent>
              {detectedAnomalies.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No Anomalies Detected</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No anomalies were detected in the most recent emulation data
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {detectedAnomalies.map((anomaly, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium mb-1 flex items-center">
                              <span>Anomaly in </span>
                              <Badge className="ml-2 font-mono" variant="outline">
                                {anomaly.techniqueId}
                              </Badge>
                            </h4>
                            <p className="text-sm">{anomaly.description}</p>
                            <div className="flex items-center mt-2 space-x-2">
                              <Badge variant={getSeverityVariant(anomaly.severity)}>
                                {anomaly.severity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Confidence: {Math.round(anomaly.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Simulation Tab */}
        <TabsContent value="simulate" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Simulation</CardTitle>
                <CardDescription>Test detection capabilities with simulated attacks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Selected Techniques</h3>
                    <div className="flex flex-wrap gap-2 min-h-10">
                      {selectedTechniques.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No techniques selected
                        </div>
                      ) : (
                        selectedTechniques.map(technique => (
                          <Badge key={technique} variant="secondary" className="font-mono">
                            {technique}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Simulation Options</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded-md bg-muted">
                        <div className="flex items-center">
                          <Bell className="h-4 w-4 mr-2" />
                          <span className="text-sm">Generate alerts</span>
                        </div>
                        <div className="text-sm text-muted-foreground">Enabled</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 border rounded-md bg-muted">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="text-sm">Schedule</span>
                        </div>
                        <div className="text-sm text-muted-foreground">Run immediately</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      className="w-full"
                      disabled={selectedTechniques.length === 0}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Simulation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Technique Selection</CardTitle>
                <CardDescription>Select techniques to include in simulation</CardDescription>
              </CardHeader>
              <CardContent>
                <MitreMatrix 
                  selectedTechniques={selectedTechniques} 
                  onTechniqueSelect={handleTechniqueSelect}
                  isInteractive={true}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetectionCenter;
