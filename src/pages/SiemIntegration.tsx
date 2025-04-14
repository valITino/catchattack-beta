
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Cloud } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import PlatformCard from "@/components/siem/PlatformCard";
import PlatformSettings from "@/components/siem/PlatformSettings";
import DeployableRuleCard from "@/components/siem/DeployableRuleCard";
import RuleFilters from "@/components/siem/RuleFilters";
import { SiemPlatform, DeployableRule } from "@/utils/siemUtils";
import TenantHeader from "@/components/layout/TenantHeader";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from "@/services/apiService";

const SiemIntegration = () => {
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  // Fetch SIEM platforms
  const { 
    data: siemPlatforms = [],
    isLoading: platformsLoading 
  } = useQuery({
    queryKey: ['siemPlatforms'],
    queryFn: () => apiService.getSiemPlatforms(),
  });

  // Fetch Sigma rules
  const {
    data: sigmaRules = [],
    isLoading: rulesLoading
  } = useQuery({
    queryKey: ['sigmaRules'],
    queryFn: () => apiService.getSigmaRules(),
    // Transform to DeployableRule format
    select: (data) => data.map(rule => ({
      id: rule.id,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      source: rule.source,
      deployedTo: rule.deployedTo || [],
      dateCreated: rule.dateCreated
    } as DeployableRule))
  });

  // Deploy rules mutation
  const deployRulesMutation = useMutation({
    mutationFn: (deployRequest: { ruleIds: string[], platformId: string }) => 
      apiService.deploySigmaRules(deployRequest),
    onSuccess: (data) => {
      const successCount = data.deployedRules.filter(r => r.status === 'success').length;
      const failedCount = data.deployedRules.filter(r => r.status === 'failure').length;
      
      toast({
        title: "Deployment Complete",
        description: `Successfully deployed ${successCount} rules${
          failedCount > 0 ? `, ${failedCount} failed` : ""
        }`,
      });
      
      // Clear selection
      setSelectedRules([]);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['sigmaRules'] });
      queryClient.invalidateQueries({ queryKey: ['siemPlatforms'] });
    },
    onError: (error: Error, variables) => {
      const platformName = siemPlatforms.find(p => p.id === variables.platformId)?.name || "selected platform";
      
      toast({
        title: "Deployment Failed",
        description: `Failed to deploy rules to ${platformName}: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Get current platform details
  const currentPlatform = useMemo(() => {
    if (!selectedPlatform) return null;
    return siemPlatforms.find(platform => platform.id === selectedPlatform) || null;
  }, [selectedPlatform, siemPlatforms]);

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

    deployRulesMutation.mutate({
      ruleIds: selectedRules,
      platformId: selectedPlatform
    });
  };

  // Filter rules based on search and filters
  const filteredRules = useMemo(() => {
    return sigmaRules.filter(rule => {
      const matchesSearch = searchQuery === "" || 
        rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSeverity = selectedSeverities.length === 0 || 
        selectedSeverities.includes(rule.severity);
      
      const matchesSource = selectedSources.length === 0 || 
        selectedSources.includes(rule.source);
      
      return matchesSearch && matchesSeverity && matchesSource;
    });
  }, [sigmaRules, searchQuery, selectedSeverities, selectedSources]);

  // Set first platform as selected if none is selected
  useEffect(() => {
    if (siemPlatforms.length > 0 && !selectedPlatform) {
      const connectedPlatform = siemPlatforms.find(p => p.connected);
      if (connectedPlatform) {
        setSelectedPlatform(connectedPlatform.id);
      }
    }
  }, [siemPlatforms, selectedPlatform]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">SIEM Integration</h1>
        <TenantHeader />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="cyber-card">
            <CardHeader className="pb-2">
              <CardTitle>SIEM Platforms</CardTitle>
              <CardDescription>Connected security platforms</CardDescription>
            </CardHeader>
            <CardContent>
              {platformsLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-pulse space-y-3 w-full">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-md" />
                    ))}
                  </div>
                </div>
              ) : (
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
              )}
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
                    disabled={deployRulesMutation.isPending}
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    {deployRulesMutation.isPending 
                      ? `Deploying (${selectedRules.length})...` 
                      : `Deploy Selected (${selectedRules.length})`
                    }
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
                
                {rulesLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
                    ))}
                  </div>
                ) : (
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
                )}
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
