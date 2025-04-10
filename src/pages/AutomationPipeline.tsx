
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { 
  Settings, PlusCircle, BarChart3, Clock, GitBranch, Webhook,
  LineChart, CheckCircle2, FileCode2, Database, Play, AlertCircle
} from "lucide-react";

import RandomEmulationGenerator, { EmulationConfig } from "@/components/emulation/RandomEmulationGenerator";
import PipelineStatus, { PipelineBuild } from "@/components/automation/PipelineStatus";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Mock data for pipelines
const initialPipelines: PipelineBuild[] = [
  {
    id: "pipeline-001",
    status: "running",
    startTime: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    emulationName: "Daily APT Simulation",
    techniques: 7,
    tactics: ["TA0001", "TA0002", "TA0004", "TA0007"],
    logs: [
      "[2025-04-10 08:30:22] Pipeline started",
      "[2025-04-10 08:30:24] Creating virtualized environment",
      "[2025-04-10 08:31:05] Environment ready",
      "[2025-04-10 08:31:10] Executing Initial Access techniques",
      "[2025-04-10 08:32:35] Executing Execution techniques",
      "[2025-04-10 08:34:12] Executing Privilege Escalation techniques",
      "[2025-04-10 08:35:40] Collecting telemetry data",
      "[2025-04-10 08:36:01] Generating detection rules...",
    ]
  },
  {
    id: "pipeline-002",
    status: "completed",
    startTime: new Date(Date.now() - 4 * 3600000), // 4 hours ago
    endTime: new Date(Date.now() - 3.5 * 3600000), // 3.5 hours ago
    emulationName: "Weekly Ransomware Simulation",
    techniques: 12,
    tactics: ["TA0001", "TA0002", "TA0003", "TA0005", "TA0008", "TA0040"],
    rulesGenerated: 8,
    rulesDeployed: 8,
    targets: ["elastic", "splunk"],
    logs: [
      "[2025-04-10 05:00:03] Pipeline started",
      "[2025-04-10 05:00:15] Creating virtualized environment",
      "[2025-04-10 05:01:22] Environment ready",
      "[2025-04-10 05:01:35] Executing Initial Access techniques",
      "[2025-04-10 05:03:10] Executing Execution techniques",
      "[2025-04-10 05:05:25] Executing Persistence techniques",
      "[2025-04-10 05:07:40] Executing Defense Evasion techniques",
      "[2025-04-10 05:09:15] Executing Lateral Movement techniques",
      "[2025-04-10 05:12:30] Executing Impact techniques",
      "[2025-04-10 05:15:45] Collecting telemetry data",
      "[2025-04-10 05:18:30] Generating detection rules",
      "[2025-04-10 05:20:15] 8 rules generated successfully",
      "[2025-04-10 05:21:10] Deploying rules to Elastic Security",
      "[2025-04-10 05:22:05] Rules deployed to Elastic Security",
      "[2025-04-10 05:22:30] Deploying rules to Splunk",
      "[2025-04-10 05:23:45] Rules deployed to Splunk",
      "[2025-04-10 05:24:00] Pipeline completed successfully"
    ]
  },
  {
    id: "pipeline-003",
    status: "failed",
    startTime: new Date(Date.now() - 12 * 3600000), // 12 hours ago
    endTime: new Date(Date.now() - 11.8 * 3600000), // 11.8 hours ago
    emulationName: "Supply Chain Attack Simulation",
    techniques: 9,
    tactics: ["TA0001", "TA0002", "TA0003", "TA0005", "TA0008"],
    rulesGenerated: 5,
    rulesDeployed: 0,
    targets: ["sentinel", "qradar"],
    errors: [
      "Failed to deploy rules to Microsoft Sentinel: Authentication error",
      "Failed to deploy rules to IBM QRadar: Connection timed out"
    ],
    logs: [
      "[2025-04-09 21:00:10] Pipeline started",
      "[2025-04-09 21:00:25] Creating virtualized environment",
      "[2025-04-09 21:01:40] Environment ready",
      "[2025-04-09 21:02:05] Executing Initial Access techniques",
      "[2025-04-09 21:04:30] Executing Execution techniques",
      "[2025-04-09 21:06:45] Executing Persistence techniques",
      "[2025-04-09 21:09:10] Executing Defense Evasion techniques",
      "[2025-04-09 21:12:25] Executing Lateral Movement techniques",
      "[2025-04-09 21:15:15] Collecting telemetry data",
      "[2025-04-09 21:17:40] Generating detection rules",
      "[2025-04-09 21:19:30] 5 rules generated successfully",
      "[2025-04-09 21:20:15] Deploying rules to Microsoft Sentinel",
      "[2025-04-09 21:20:45] ERROR: Authentication error with Microsoft Sentinel",
      "[2025-04-09 21:21:10] Deploying rules to IBM QRadar",
      "[2025-04-09 21:21:50] ERROR: Connection timed out for IBM QRadar",
      "[2025-04-09 21:22:05] Pipeline failed with errors"
    ]
  }
];

// Mock data for metrics
const metrics = {
  emulationsRun: 27,
  rulesGenerated: 134,
  rulesDeployed: 112,
  detectionRate: 76,
  meanTimeToDetect: "4.2",
  falsePositives: 12,
};

const AutomationPipeline = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [pipelines, setPipelines] = useState<PipelineBuild[]>(initialPipelines);
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineBuild | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

  const handleNewPipeline = (config: EmulationConfig) => {
    // Create a new pipeline based on the configuration
    const newPipeline: PipelineBuild = {
      id: `pipeline-${Date.now()}`,
      status: "waiting",
      startTime: new Date(),
      emulationName: `Automated ${config.complexity.toUpperCase()} Emulation`,
      techniques: config.techniqueCount,
      tactics: config.tactics,
      logs: [
        `[${new Date().toLocaleString()}] Pipeline created`,
        `[${new Date().toLocaleString()}] Scheduled to run ${config.frequency}`
      ]
    };
    
    setPipelines([newPipeline, ...pipelines]);
    toast({
      title: "Pipeline Created",
      description: `New automated pipeline will run ${config.frequency}`,
    });
  };

  const handleTogglePipeline = (pipelineId: string, running: boolean) => {
    setPipelines(pipelines.map(pipeline => {
      if (pipeline.id === pipelineId) {
        return {
          ...pipeline,
          status: running ? "running" : (pipeline.status === "running" ? "waiting" : pipeline.status)
        };
      }
      return pipeline;
    }));

    toast({
      title: running ? "Pipeline Started" : "Pipeline Paused",
      description: `Pipeline ${pipelineId} has been ${running ? 'started' : 'paused'}`,
    });
  };

  const handleViewDetails = (pipeline: PipelineBuild) => {
    setSelectedPipeline(pipeline);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Automated CI/CD Pipeline</h1>
        <Button 
          onClick={() => setActiveTab("create")} 
          className="bg-cyber-primary hover:bg-cyber-primary/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> New Pipeline
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="dashboard">
            <BarChart3 className="mr-2 h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="pipelines">
            <Clock className="mr-2 h-4 w-4" /> Pipelines
          </TabsTrigger>
          <TabsTrigger value="create">
            <Settings className="mr-2 h-4 w-4" /> Create
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cyber-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Emulations</CardTitle>
                <CardDescription>Total emulation runs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold">{metrics.emulationsRun}</div>
                    <p className="text-xs text-cyber-primary">+3 this week</p>
                  </div>
                  <Play className="h-8 w-8 text-cyber-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="cyber-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Rules Generated</CardTitle>
                <CardDescription>Total detection rules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold">{metrics.rulesGenerated}</div>
                    <p className="text-xs text-cyber-primary">+12 this week</p>
                  </div>
                  <FileCode2 className="h-8 w-8 text-cyber-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="cyber-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Rules Deployed</CardTitle>
                <CardDescription>Rules in production</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold">{metrics.rulesDeployed}</div>
                    <p className="text-xs text-cyber-primary">+8 this week</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-cyber-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="cyber-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-cyber-primary" />
                    Pipeline Performance
                  </CardTitle>
                  <CardDescription>
                    Weekly runs and detection metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        Placeholder for performance chart showing detection rates and rule generation metrics
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="cyber-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-cyber-primary" />
                    Detection Metrics
                  </CardTitle>
                  <CardDescription>
                    Current detection performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">Detection Rate</div>
                      <Badge className="bg-cyber-success">{metrics.detectionRate}%</Badge>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-cyber-success h-2 rounded-full" 
                        style={{ width: `${metrics.detectionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">Mean Time to Detect</div>
                        <div className="text-sm font-medium">{metrics.meanTimeToDetect} min</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">False Positives (30 days)</div>
                        <div className="text-sm font-medium">{metrics.falsePositives}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Report Generated",
                          description: "Detection performance report has been generated and exported"
                        });
                      }}
                    >
                      Export Performance Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-cyber-primary" />
                  Latest Builds
                </CardTitle>
                <CardDescription>
                  Most recent pipeline executions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-cyber-primary/20">
                  {pipelines.slice(0, 3).map((pipeline) => (
                    <div key={pipeline.id} className="flex items-center justify-between p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {pipeline.status === "running" ? (
                            <RefreshCw className="h-4 w-4 text-cyber-primary animate-spin" />
                          ) : pipeline.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-cyber-success" />
                          ) : pipeline.status === "failed" ? (
                            <AlertCircle className="h-4 w-4 text-cyber-danger" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="font-medium">{pipeline.emulationName}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {pipeline.startTime.toLocaleString()}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => handleViewDetails(pipeline)}
                      >
                        Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-cyber-primary" />
                  CI/CD Integration
                </CardTitle>
                <CardDescription>
                  Connect to CI/CD systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input 
                    id="webhook-url" 
                    placeholder="https://jenkins.example.com/webhook/trigger" 
                    className="bg-cyber-darker border-cyber-primary/20"
                  />
                  <p className="text-xs text-gray-400">
                    Configure a webhook to trigger pipeline runs from external CI/CD systems
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="integration-type">Integration Type</Label>
                  <Select defaultValue="jenkins">
                    <SelectTrigger id="integration-type" className="bg-cyber-darker border-cyber-primary/20">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jenkins">Jenkins</SelectItem>
                      <SelectItem value="github">GitHub Actions</SelectItem>
                      <SelectItem value="gitlab">GitLab CI</SelectItem>
                      <SelectItem value="azure">Azure DevOps</SelectItem>
                      <SelectItem value="circle">CircleCI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Integration Saved",
                        description: "CI/CD integration has been configured"
                      });
                    }}
                  >
                    Save Integration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="pipelines" className="space-y-4">
          <PipelineStatus 
            pipelines={pipelines}
            onTogglePipeline={handleTogglePipeline}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4">
          <RandomEmulationGenerator onGenerate={handleNewPipeline} automated={true} />
        </TabsContent>
      </Tabs>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        {selectedPipeline && (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Pipeline Details</DialogTitle>
              <DialogDescription>
                Information about the selected pipeline run
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedPipeline.emulationName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={
                    selectedPipeline.status === "running" ? "bg-cyber-primary/20 text-cyber-primary border-cyber-primary" :
                    selectedPipeline.status === "completed" ? "bg-cyber-success/20 text-cyber-success border-cyber-success" :
                    selectedPipeline.status === "failed" ? "bg-cyber-danger/20 text-cyber-danger border-cyber-danger" :
                    "bg-gray-500/20 text-gray-400 border-gray-500"
                  }>
                    {selectedPipeline.status.charAt(0).toUpperCase() + selectedPipeline.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-400">
                    {selectedPipeline.techniques} techniques · {selectedPipeline.tactics.length} tactics
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Started</p>
                  <p>{selectedPipeline.startTime.toLocaleString()}</p>
                </div>
                {selectedPipeline.endTime && (
                  <div>
                    <p className="text-sm text-gray-400">Completed</p>
                    <p>{selectedPipeline.endTime.toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              {selectedPipeline.rulesGenerated !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Rules Generated</p>
                    <p>{selectedPipeline.rulesGenerated}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Rules Deployed</p>
                    <p>{selectedPipeline.rulesDeployed}</p>
                  </div>
                </div>
              )}
              
              {selectedPipeline.targets && selectedPipeline.targets.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400">Deployment Targets</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedPipeline.targets.map(target => (
                      <Badge key={target} variant="outline">
                        {target === "elastic" ? "Elastic Security" :
                         target === "splunk" ? "Splunk" :
                         target === "sentinel" ? "Microsoft Sentinel" :
                         target === "qradar" ? "IBM QRadar" : target}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-400">Execution Logs</p>
                <Textarea 
                  value={selectedPipeline.logs.join("\n")}
                  readOnly
                  className="font-mono text-xs h-[200px] bg-cyber-darker border-cyber-primary/20 mt-1"
                />
              </div>
              
              {selectedPipeline.errors && selectedPipeline.errors.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 text-cyber-danger">Errors</p>
                  <div className="bg-cyber-danger/10 border border-cyber-danger/20 rounded-md p-3 text-xs mt-1">
                    {selectedPipeline.errors.map((error, i) => (
                      <div key={i} className="py-0.5 text-cyber-danger">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              {selectedPipeline.status === "failed" && (
                <Button variant="outline" onClick={() => {
                  setDetailsOpen(false);
                  toast({
                    title: "Pipeline Restarted",
                    description: "The failed pipeline has been restarted",
                  });
                }}>
                  Retry Pipeline
                </Button>
              )}
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default AutomationPipeline;
