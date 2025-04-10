
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Play, EyeOff, Eye, Server, Shield, Database, Check, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types for the virtual environment
export interface VirtualMachine {
  id: string;
  name: string;
  type: string;
  os: string;
  services: string[];
  vulnerabilities: number;
  status: "running" | "stopped" | "error";
}

export interface NetworkSegment {
  id: string;
  name: string;
  devices: string[];
  trafficVolume: number;
  securityControls: string[];
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  format: string;
  sampleAvailable: boolean;
}

export interface VirtualEnvironment {
  id: string;
  name: string;
  description: string;
  created: Date;
  status: "creating" | "ready" | "running" | "error";
  vms: VirtualMachine[];
  networks: NetworkSegment[];
  dataSources: DataSource[];
  complexity: "low" | "medium" | "high";
}

interface VirtualizedEnvironmentProps {
  environment?: VirtualEnvironment;
  isGenerating?: boolean;
  progress?: number;
}

const VirtualizedEnvironment = ({ 
  environment,
  isGenerating = false, 
  progress = 0 
}: VirtualizedEnvironmentProps) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showVulnerabilities, setShowVulnerabilities] = useState<boolean>(false);

  const handleStartEmulation = () => {
    toast({
      title: "Emulation Started",
      description: "Virtual environment is now running emulation scenarios",
    });
  };

  const handleGenerateRules = () => {
    toast({
      title: "Rule Generation Started",
      description: "Generating sigma rules from vulnerability data",
    });
    
    // Simulate rule generation
    setTimeout(() => {
      toast({
        title: "Rules Generated",
        description: "New sigma rules have been created and added to the repository",
      });
    }, 2000);
  };

  const handleDownloadReport = () => {
    toast({
      title: "Downloading Report",
      description: "Environment configuration report is being prepared",
    });
  };

  if (isGenerating) {
    return (
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle>Environment Generation</CardTitle>
          <CardDescription>Creating your virtualized environment based on the provided infrastructure details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-cyber-success" />
              <span className="text-sm">Analyzing infrastructure data</span>
            </div>
            {progress > 20 && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyber-success" />
                <span className="text-sm">Creating network topology</span>
              </div>
            )}
            {progress > 40 && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyber-success" />
                <span className="text-sm">Provisioning virtual machines</span>
              </div>
            )}
            {progress > 60 && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyber-success" />
                <span className="text-sm">Configuring security controls</span>
              </div>
            )}
            {progress > 80 && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyber-success" />
                <span className="text-sm">Preparing data sources</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!environment) {
    return (
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle>No Environment</CardTitle>
          <CardDescription>Submit the infrastructure assessment form to generate a virtual environment</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="cyber-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{environment.name}</CardTitle>
            <CardDescription>{environment.description}</CardDescription>
          </div>
          <Badge className={
            environment.complexity === "low" 
              ? "bg-green-500/10 text-green-500 border-green-500" 
              : environment.complexity === "medium"
                ? "bg-amber-500/10 text-amber-500 border-amber-500"
                : "bg-red-500/10 text-red-500 border-red-500"
          }>
            {environment.complexity.toUpperCase()} Complexity
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="systems">Systems</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="data">Data Sources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-cyber-primary/20 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4 text-cyber-primary" />
                  <h3 className="font-medium">Virtual Machines</h3>
                </div>
                <div className="text-2xl font-bold">{environment.vms.length}</div>
                <p className="text-sm text-gray-400">Active systems</p>
              </div>
              
              <div className="border border-cyber-primary/20 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-cyber-primary" />
                  <h3 className="font-medium">Data Sources</h3>
                </div>
                <div className="text-2xl font-bold">{environment.dataSources.length}</div>
                <p className="text-sm text-gray-400">Log providers</p>
              </div>
              
              <div className="border border-cyber-primary/20 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-cyber-primary" />
                  <h3 className="font-medium">Vulnerabilities</h3>
                </div>
                <div className="text-2xl font-bold">
                  {environment.vms.reduce((sum, vm) => sum + vm.vulnerabilities, 0)}
                </div>
                <p className="text-sm text-gray-400">Detected issues</p>
              </div>
            </div>
            
            <div className="border border-cyber-primary/20 rounded-md p-4">
              <h3 className="font-medium mb-2">Environment Status</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  environment.status === "ready" ? "bg-green-500" : 
                  environment.status === "error" ? "bg-red-500" : 
                  "bg-amber-500"
                }`}></div>
                <span className="capitalize">{environment.status}</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Created on {environment.created.toLocaleDateString()}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="systems" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Virtual Machines</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowVulnerabilities(!showVulnerabilities)}
                className="text-xs"
              >
                {showVulnerabilities ? (
                  <><EyeOff className="h-3 w-3 mr-1" /> Hide Vulnerabilities</>
                ) : (
                  <><Eye className="h-3 w-3 mr-1" /> Show Vulnerabilities</>
                )}
              </Button>
            </div>
            
            <div className="space-y-2">
              {environment.vms.map((vm) => (
                <div key={vm.id} className="border border-cyber-primary/20 rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{vm.name}</h4>
                      <p className="text-sm text-gray-400">{vm.os}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        vm.status === "running" ? "bg-green-500/10 text-green-500 border-green-500" :
                        vm.status === "error" ? "bg-red-500/10 text-red-500 border-red-500" :
                        "bg-gray-500/10 text-gray-500 border-gray-500"
                      }
                    >
                      {vm.status}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-gray-400">Services:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {vm.services.map((service, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {showVulnerabilities && (
                    <div className="mt-2 pt-2 border-t border-cyber-primary/10">
                      <div className="text-xs text-gray-400">Vulnerabilities:</div>
                      <div className="mt-1">
                        <Badge className="bg-red-500/10 text-red-500 border-red-500">
                          {vm.vulnerabilities} detected
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="network" className="space-y-4">
            <div className="space-y-2">
              {environment.networks.map((network) => (
                <div key={network.id} className="border border-cyber-primary/20 rounded-md p-3">
                  <h4 className="font-medium">{network.name}</h4>
                  <div className="mt-2">
                    <div className="text-xs text-gray-400">Connected Devices:</div>
                    <p className="text-sm">{network.devices.join(", ")}</p>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-gray-400">Security Controls:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {network.securityControls.map((control, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {control}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4">
            <div className="space-y-2">
              {environment.dataSources.map((source) => (
                <div key={source.id} className="border border-cyber-primary/20 rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{source.name}</h4>
                      <p className="text-sm text-gray-400">{source.type}</p>
                    </div>
                    {source.sampleAvailable && (
                      <Badge className="bg-cyber-success/10 text-cyber-success border-cyber-success">
                        Sample Available
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-gray-400">Format:</div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {source.format}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between gap-4 flex-wrap">
        <Button 
          onClick={handleStartEmulation} 
          className="bg-cyber-primary hover:bg-cyber-primary/90"
        >
          <Play className="mr-2 h-4 w-4" /> Run Emulation
        </Button>
        <Button 
          onClick={handleGenerateRules} 
          variant="outline"
        >
          <Shield className="mr-2 h-4 w-4" /> Generate Detection Rules
        </Button>
        <Button 
          onClick={handleDownloadReport} 
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" /> Download Report
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VirtualizedEnvironment;
