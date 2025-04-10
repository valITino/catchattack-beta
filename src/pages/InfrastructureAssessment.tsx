
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ScanSearch, Upload, Server } from "lucide-react";

import InfrastructureForm from "@/components/emulation/InfrastructureForm";
import VirtualizedEnvironment, { VirtualEnvironment } from "@/components/emulation/VirtualizedEnvironment";

// Mock data for a sample environment
const sampleEnvironment: VirtualEnvironment = {
  id: "env-1",
  name: "Corporate Network Simulation",
  description: "Simulated enterprise environment with common services and security controls",
  created: new Date(),
  status: "ready",
  complexity: "medium",
  vms: [
    {
      id: "vm-1",
      name: "DC-01",
      type: "server",
      os: "Windows Server 2019",
      services: ["Active Directory", "DNS", "DHCP"],
      vulnerabilities: 3,
      status: "running",
    },
    {
      id: "vm-2",
      name: "WEB-01",
      type: "server",
      os: "Ubuntu 20.04 LTS",
      services: ["Apache", "MySQL", "PHP"],
      vulnerabilities: 2,
      status: "running",
    },
    {
      id: "vm-3",
      name: "CLIENT-01",
      type: "client",
      os: "Windows 10",
      services: ["Office 365", "Chrome", "Outlook"],
      vulnerabilities: 5,
      status: "running",
    },
    {
      id: "vm-4",
      name: "FILE-01",
      type: "server",
      os: "Windows Server 2019",
      services: ["SMB", "FTP"],
      vulnerabilities: 4,
      status: "running",
    },
  ],
  networks: [
    {
      id: "net-1",
      name: "Corporate LAN",
      devices: ["DC-01", "FILE-01", "CLIENT-01"],
      trafficVolume: 250,
      securityControls: ["Firewall", "IPS", "NAC"],
    },
    {
      id: "net-2",
      name: "DMZ",
      devices: ["WEB-01"],
      trafficVolume: 120,
      securityControls: ["WAF", "Reverse Proxy"],
    }
  ],
  dataSources: [
    {
      id: "ds-1",
      name: "Windows Event Logs",
      type: "System Logs",
      format: "EVTX",
      sampleAvailable: true,
    },
    {
      id: "ds-2",
      name: "Apache Access Logs",
      type: "Web Server Logs",
      format: "Combined Log Format",
      sampleAvailable: true,
    },
    {
      id: "ds-3",
      name: "Firewall Logs",
      type: "Network Logs",
      format: "Syslog",
      sampleAvailable: true,
    },
    {
      id: "ds-4",
      name: "DNS Query Logs",
      type: "Service Logs",
      format: "Custom",
      sampleAvailable: true,
    }
  ]
};

const InfrastructureAssessment = () => {
  const [activeTab, setActiveTab] = useState<string>("assessment");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [environment, setEnvironment] = useState<VirtualEnvironment | undefined>(undefined);

  const handleFormSubmit = (formData: any) => {
    toast({
      title: "Assessment Submitted",
      description: "Generating virtual environment based on your infrastructure details"
    });
    
    setActiveTab("environment");
    setIsGenerating(true);
    
    // Simulate progress for environment generation
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 10) + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsGenerating(false);
          setEnvironment({
            ...sampleEnvironment,
            name: `${formData.organizationName} Environment`,
            description: `Virtual environment for ${formData.organizationName} based on ${formData.environmentType} infrastructure`,
          });
          toast({
            title: "Environment Ready",
            description: "Virtual environment has been successfully created"
          });
        }, 1000);
      }
      setProgress(currentProgress);
    }, 1000);
  };

  const handleAgentUpload = () => {
    toast({
      title: "Agent Upload",
      description: "Please download and deploy the assessment agent on a system within your network"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Infrastructure Assessment & Virtualization</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="environment">Virtual Environment</TabsTrigger>
        </TabsList>

        <TabsContent value="assessment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfrastructureForm onSubmit={handleFormSubmit} />

            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-cyber-primary" />
                  Deploy Assessment Agent
                </CardTitle>
                <CardDescription>
                  Automate infrastructure discovery by deploying our secure agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <p className="mb-4">
                    For more accurate environment simulation, deploy our lightweight assessment agent to automatically discover:
                  </p>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>Network topology and segmentation</li>
                    <li>Operating systems and installed software</li>
                    <li>Security controls and configurations</li>
                    <li>Available data sources and log formats</li>
                    <li>Potential vulnerabilities and attack paths</li>
                  </ul>
                </div>
                <div className="p-3 bg-cyber-primary/10 border border-cyber-primary/30 rounded-md text-sm">
                  <p>
                    The assessment agent runs with minimal privileges and doesn't store or transmit any sensitive data. All findings are encrypted and only accessible through your account.
                  </p>
                </div>
                <Button 
                  onClick={handleAgentUpload}
                  className="w-full mt-4 bg-cyber-primary hover:bg-cyber-primary/90"
                >
                  <Server className="mr-2 h-4 w-4" /> Download Assessment Agent
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          <VirtualizedEnvironment 
            environment={environment} 
            isGenerating={isGenerating} 
            progress={progress} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InfrastructureAssessment;
