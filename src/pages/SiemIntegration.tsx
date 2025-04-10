
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Cloud } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import PlatformCard from "@/components/siem/PlatformCard";
import PlatformSettings from "@/components/siem/PlatformSettings";
import DeployableRuleCard from "@/components/siem/DeployableRuleCard";
import RuleFilters from "@/components/siem/RuleFilters";
import { SiemPlatform, DeployableRule, bulkDeployRules } from "@/utils/siemUtils";

// Mock data for SIEM platforms
const siemPlatforms: SiemPlatform[] = [
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
const deployableRules: DeployableRule[] = [
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

  // Get current platform details
  const currentPlatform = useMemo(() => {
    if (!selectedPlatform) return null;
    return siemPlatforms.find(platform => platform.id === selectedPlatform) || null;
  }, [selectedPlatform]);

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

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedSeverities([]);
    setSelectedSources([]);
    setSearchQuery("");
  };

  // Handle bulk rule deployment
  const handleBulkDeploy = async () => {
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

    const platformName = currentPlatform?.name || "selected platform";
    
    const result = await bulkDeployRules(selectedRules, selectedPlatform, platformName);
    
    if (result.success) {
      toast({
        title: "Bulk Deployment Complete",
        description: `Successfully deployed ${result.deployedCount} rules${
          result.failedCount > 0 ? `, ${result.failedCount} failed` : ""
        }`,
      });
      setSelectedRules([]);
    } else {
      toast({
        title: "Bulk Deployment Failed",
        description: `Failed to deploy rules to ${platformName}`,
        variant: "destructive",
      });
    }
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
                  <PlatformCard 
                    key={platform.id}
                    platform={platform}
                    isSelected={selectedPlatform === platform.id}
                    onSelect={setSelectedPlatform}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {selectedPlatform && (
            <PlatformSettings selectedPlatform={currentPlatform} />
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
                {selectedRules.length > 0 && 
                 selectedPlatform && 
                 currentPlatform?.connected && (
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
                <RuleFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedSeverities={selectedSeverities}
                  toggleSeverityFilter={toggleSeverityFilter}
                  selectedSources={selectedSources}
                  toggleSourceFilter={toggleSourceFilter}
                  clearAllFilters={clearAllFilters}
                />
                
                <ScrollArea className="h-[400px] pr-3 -mr-3">
                  <div className="space-y-3">
                    {filteredRules.length > 0 ? (
                      filteredRules.map(rule => (
                        <DeployableRuleCard
                          key={rule.id}
                          rule={rule}
                          selectedPlatformId={selectedPlatform}
                          isConnected={!!currentPlatform?.connected}
                          isSelected={selectedRules.includes(rule.id)}
                          onToggleSelect={toggleRuleSelection}
                        />
                      ))
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
