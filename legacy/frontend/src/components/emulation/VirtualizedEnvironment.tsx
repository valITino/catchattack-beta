import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Play, Shield, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import GenerationProgress from "./environment/GenerationProgress";
import StatisticsSection from "./environment/StatisticsSection";
import VirtualMachineList from "./environment/VirtualMachineList";
import NetworksList from "./environment/NetworksList";
import DataSourcesList from "./environment/DataSourcesList";

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
    return <GenerationProgress progress={progress} />;
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
            <StatisticsSection environment={environment} />
            
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
            <VirtualMachineList
              vms={environment.vms}
              showVulnerabilities={showVulnerabilities}
              onToggleVulnerabilities={() => setShowVulnerabilities(!showVulnerabilities)}
            />
          </TabsContent>
          
          <TabsContent value="network" className="space-y-4">
            <NetworksList networks={environment.networks} />
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4">
            <DataSourcesList dataSources={environment.dataSources} />
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
