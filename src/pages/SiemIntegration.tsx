import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, Check, ChevronRight, Cloud, Copy, Download, FileCode2, Link, LinkOff, RefreshCw, Server, Settings, Shield, Unlink } from "lucide-react";

// Mock data for SIEM platforms
const siemPlatforms = [
  {
    id: "splunk",
    name: "Splunk",
    description: "Splunk Enterprise Security",
    connected: true,
    lastSync: "2025-04-10T14:30:00Z",
    rulesDeployed: 24,
    status: "healthy"
  },
  {
    id: "elastic",
    name: "Elastic Security",
    description: "Elastic SIEM",
    connected: true,
    lastSync: "2025-04-10T12:15:00Z",
    rulesDeployed: 18,
    status: "healthy"
  },
  {
    id: "qradar",
    name: "IBM QRadar",
    description: "IBM QRadar SIEM",
    connected: false,
    lastSync: null,
    rulesDeployed: 0,
    status: "disconnected"
  },
  {
    id: "sentinel",
    name: "Microsoft Sentinel",
    description: "Azure Sentinel",
    connected: true,
    lastSync: "2025-04-09T18:45:00Z",
    rulesDeployed: 15,
    status: "warning"
  },
  {
    id: "sumo",
    name: "Sumo Logic",
    description: "Sumo Logic Cloud SIEM",
    connected: false,
    lastSync: null,
    rulesDeployed: 0,
    status: "disconnected"
  }
];

// Mock data for deployable rules
const deployableRules = [
  {
    id: "rule-001",
    title: "PowerShell Execution with Encoded Command",
    description: "Detects PowerShell execution with encoded command parameter",
    severity: "high",
    source: "windows",
    deployedTo: ["splunk", "elastic"],
    dateCreated: "2025-04-10T12:34:56Z"
  },
  {
    id: "rule-002",
    title: "Service Creation with Binary Path Manipulation",
    description: "Detects service creation with suspicious binary paths",
    severity: "critical",
    source: "windows",
    deployedTo: ["splunk"],
    dateCreated: "2025-04-10T13:45:23Z"
  },
  {
    id: "rule-003",
    title: "Suspicious API Access Patterns",
    description: "Detects unusual API access patterns indicating data exfiltration",
    severity: "medium",
    source: "api",
    deployedTo: ["elastic", "sentinel"],
    dateCreated: "2025-04-10T09:12:35Z"
  },
  {
    id: "rule-004",
    title: "Linux Privilege Escalation via SUID Binary",
    description: "Detects potential privilege escalation via SUID binary execution",
    severity: "high",
    source: "linux",
    deployedTo: [],
    dateCreated: "2025-04-10T15:22:18Z"
  },
  {
    id: "rule-005",
    title: "Windows Registry Persistence Mechanism",
    description: "Detects modifications to registry keys used for persistence",
    severity: "medium",
    source: "windows",
    deployedTo: ["splunk", "sentinel"],
    dateCreated: "2025-04-09T11:05:42Z"
  }
];

const SiemIntegration = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [autoDeployRules, setAutoDeployRules] = useState<boolean>(false);

  // Handle platform selection
  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatform(platformId);
  };

  // Toggle rule selection
  const toggleRuleSelection = (ruleId: string) => {
    if (selectedRules.includes(ruleId)) {
      setSelectedRules(selectedRules.filter(id => id !== ruleId));
    } else {
      setSelectedRules([...selectedRules, ruleId]);
    }
  };

  // Toggle severity filter
  const toggleSeverityFilter = (severity: string) => {
    if (selectedSeverities.includes(severity)) {
      setSelectedSeverities(selectedSeverities.filter(s => s !== severity));
    } else {
      setSelectedSeverities([...selectedSeverities, severity]);
    }
  };

  // Toggle source filter
  const toggleSourceFilter = (source: string) => {
    if (selectedSources.includes(source)) {
      setSelectedSources(selectedSources.filter(s => s !== source));
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  };

  // Handle connecting to a SIEM platform
  const handleConnectPlatform = (platformId: string) => {
    // In a real implementation, this would open a configuration modal
    // or redirect to a connection setup page
    toast({
      title: "Connection Initiated",
      description: `Setting up connection to ${siemPlatforms.find(p => p.id === platformId)?.name}`,
    });
  };

  // Handle rule deployment
  const handleDeployRule = (ruleId: string) => {
    // In a real implementation, this would call an API to deploy
    // the sigma rule to the configured SIEM systems
    toast({
      title: "Deployment Started",
      description: "Deploying sigma rule to selected SIEM platforms",
    });
    
    // Simulate successful deployment after a delay
    setTimeout(() => {
      toast({
        title: "Rule Deployed",
        description: "Sigma rule has been successfully deployed to selected SIEM platforms",
      });
    }, 2000);
  };

  // Handle bulk rule deployment
  const handleBulkDeploy = () => {
    if (selectedRules.length === 0) {
      toast({
        title: "No Rules Selected",
        description: "Please select at least one rule to deploy",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPlatform) {
      toast({
        title: "No Platform Selected",
        description: "Please select a SIEM platform to deploy to",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bulk Deployment Started",
      description: `Deploying ${selectedRules.length} rules to ${siemPlatforms.find(p => p.id === selectedPlatform)?.name}`,
    });

    // Simulate successful deployment after a delay
    setTimeout(() => {
      toast({
        title: "Bulk Deployment Complete",
        description: `Successfully deployed ${selectedRules.length} rules`,
      });
      setSelectedRules([]);
    }, 3000);
  };

  // Filter rules based on search and filters
  const filteredRules = deployableRules.filter(rule => {
    const matchesSearch = searchQuery === "" || 
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = selectedSeverities.length === 0 || 
      selectedSeverities.includes(rule.severity);
    
    const matchesSource = selectedSources.length === 0 || 
      selectedSources.includes(rule.source);
    
    return matchesSearch && matchesSeverity && matchesSource;
  });

  // Get platform details
  const getPlatformDetails = () => {
    if (!selectedPlatform) return null;
    return siemPlatforms.find(platform => platform.id === selectedPlatform);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-cyber-success";
      case "warning":
        return "text-cyber-warning";
      case "error":
        return "text-cyber-danger";
      default:
        return "text-gray-400";
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-cyber-danger/20 text-cyber-danger border-cyber-danger";
      case "high":
        return "bg-red-900/20 text-red-400 border-red-900";
      case "medium":
        return "bg-cyber-warning/20 text-cyber-warning border-cyber-warning";
      case "low":
        return "bg-cyber-info/20 text-cyber-info border-cyber-info";
      default:
        return "bg-gray-600/20 text-gray-400 border-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SIEM Integration</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="cyber-card">
            <CardHeader className="pb-2">
              <CardTitle>SIEM Platforms</CardTitle>
              <CardDescription>Connected security platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {siemPlatforms.map(platform => (
                  <div
                    key={platform.id}
                    className={`p-3 border rounded-md cursor-pointer ${
                      selectedPlatform === platform.id
                        ? "border-cyber-primary bg-cyber-primary/10"
                        : "border-cyber-primary/20 hover:border-cyber-primary/50"
                    }`}
                    onClick={() => handleSelectPlatform(platform.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{platform.name}</h3>
                        <p className="text-xs text-gray-400">{platform.description}</p>
                      </div>
                      {platform.connected ? (
                        <Badge className="bg-cyber-success/20 text-cyber-success border-cyber-success">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400">
                          Disconnected
                        </Badge>
                      )}
                    </div>
                    
                    {platform.connected && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Rules: </span>
                          <span>{platform.rulesDeployed}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Status: </span>
                          <span className={getStatusColor(platform.status)}>
                            {platform.status.charAt(0).toUpperCase() + platform.status.slice(1)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400">Last Sync: </span>
                          <span>
                            {platform.lastSync 
                              ? new Date(platform.lastSync).toLocaleString() 
                              : "Never"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {selectedPlatform && (
            <Card className="cyber-card">
              <CardHeader className="pb-2">
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Configure integration options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getPlatformDetails()?.connected ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-deploy">Auto-Deploy Rules</Label>
                        <p className="text-sm text-gray-400">
                          Automatically deploy new rules
                        </p>
                      </div>
                      <Switch 
                        id="auto-deploy"
                        checked={autoDeployRules}
                        onCheckedChange={setAutoDeployRules}
                        className="data-[state=checked]:bg-cyber-primary"
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="rule-format">Rule Format</Label>
                      <Select defaultValue="native">
                        <SelectTrigger id="rule-format" className="bg-cyber-darker border-cyber-primary/20">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="native">Native Format</SelectItem>
                          <SelectItem value="sigma">Sigma Format</SelectItem>
                          <SelectItem value="custom">Custom Mapping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="pt-2 flex justify-between">
                      <Button variant="outline" className="border-cyber-danger text-cyber-danger hover:bg-cyber-danger/10">
                        <Unlink className="h-4 w-4 mr-2" /> Disconnect
                      </Button>
                      <Button variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" /> Sync Now
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-4">
                      <LinkOff className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                      <h3 className="font-medium">Not Connected</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        This SIEM platform is not currently connected
                      </p>
                      <Button 
                        onClick={() => handleConnectPlatform(selectedPlatform)}
                        className="bg-cyber-primary hover:bg-cyber-primary/90"
                      >
                        <Link className="h-4 w-4 mr-2" /> Connect Platform
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <Card className="cyber-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Deployable Rules</CardTitle>
                  <CardDescription>Sigma rules ready for deployment</CardDescription>
                </div>
                {selectedRules.length > 0 && selectedPlatform && getPlatformDetails()?.connected && (
                  <Button 
                    onClick={handleBulkDeploy}
                    className="bg-cyber-primary hover:bg-cyber-primary/90"
                  >
                    <Cloud className="h-4 w-4 mr-2" /> Deploy Selected ({selectedRules.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Search rules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-cyber-darker border-cyber-primary/20"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-400">Filters</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setSelectedSeverities([]);
                      setSelectedSources([]);
                      setSearchQuery("");
                    }}
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div>
                    <Label className="text-xs text-gray-400 mb-2 block">Severity</Label>
                    <div className="flex flex-wrap gap-2">
                      {["low", "medium", "high", "critical"].map(severity => (
                        <Badge
                          key={severity}
                          variant={selectedSeverities.includes(severity) ? "default" : "outline"}
                          className={`cursor-pointer ${getSeverityColor(severity)}`}
                          onClick={() => toggleSeverityFilter(severity)}
                        >
                          {severity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-400 mb-2 block">Source</Label>
                    <div className="flex flex-wrap gap-2">
                      {["windows", "linux", "api", "web"].map(source => (
                        <Badge
                          key={source}
                          variant={selectedSources.includes(source) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleSourceFilter(source)}
                        >
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="h-[400px] pr-3 -mr-3">
                  <div className="space-y-3">
                    {filteredRules.length > 0 ? (
                      filteredRules.map(rule => {
                        const isDeployed = selectedPlatform && rule.deployedTo.includes(selectedPlatform);
                        
                        return (
                          <div
                            key={rule.id}
                            className="p-3 border border-cyber-primary/20 rounded-md"
                          >
                            <div className="flex items-start">
                              {selectedPlatform && getPlatformDetails()?.connected && (
                                <div className="pt-1 pr-3">
                                  <Checkbox 
                                    id={rule.id} 
                                    checked={selectedRules.includes(rule.id)}
                                    onCheckedChange={() => toggleRuleSelection(rule.id)}
                                    className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                                    disabled={isDeployed}
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium">{rule.title}</h3>
                                    <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={getSeverityColor(rule.severity)}>
                                      {rule.severity}
                                    </Badge>
                                    {isDeployed && (
                                      <Badge className="bg-cyber-success/20 text-cyber-success border-cyber-success">
                                        Deployed
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">{rule.source}</Badge>
                                    <span className="text-xs text-gray-400">
                                      Created: {new Date(rule.dateCreated).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  {selectedPlatform && getPlatformDetails()?.connected && !isDeployed && (
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleDeployRule(rule.id)}
                                      className="bg-cyber-primary hover:bg-cyber-primary/90"
                                    >
                                      <Cloud className="h-3 w-3 mr-1" /> Deploy
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center p-4 text-gray-400">
                        No rules match the current filters
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
          
          {!selectedPlatform && (
            <div className="flex items-center p-3 rounded-md bg-cyber-primary/10 border border-cyber-primary/20">
              <AlertCircle className="h-5 w-5 text-cyber-info mr-2" />
              <span className="text-sm">
                Select a SIEM platform from the left panel to manage rule deployments
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiemIntegration;
