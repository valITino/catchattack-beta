
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/apiService";
import { DeployableRule } from "@/utils/siemUtils";
import RuleFilters from "./RuleFilters";
import RuleActions from "./RuleActions";
import RulesContent from "./RulesContent";

interface DeployableRulesSectionProps {
  rules: DeployableRule[];
  selectedRules: string[];
  onToggleRuleSelection: (ruleId: string) => void;
  selectedPlatform: string | null;
  isPlatformConnected: boolean;
  isLoading: boolean;
}

const DeployableRulesSection = ({
  rules,
  selectedRules,
  onToggleRuleSelection,
  selectedPlatform,
  isPlatformConnected,
  isLoading
}: DeployableRulesSectionProps) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

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
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['sigmaRules'] });
      queryClient.invalidateQueries({ queryKey: ['siemPlatforms'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Deployment Failed",
        description: `Failed to deploy rules: ${error.message}`,
        variant: "destructive",
      });
    }
  });

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

    deployRulesMutation.mutate({
      ruleIds: selectedRules,
      platformId: selectedPlatform
    });
  };

  // Filter rules based on search and filters
  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const matchesSearch = searchQuery === "" || 
        rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSeverity = selectedSeverities.length === 0 || 
        selectedSeverities.includes(rule.severity);
      
      const matchesSource = selectedSources.length === 0 || 
        selectedSources.includes(rule.source);
      
      return matchesSearch && matchesSeverity && matchesSource;
    });
  }, [rules, searchQuery, selectedSeverities, selectedSources]);

  return (
    <Card className="cyber-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Deployable Rules</CardTitle>
            <CardDescription>Sigma rules ready for deployment</CardDescription>
          </div>
          {selectedRules.length > 0 && selectedPlatform && isPlatformConnected && (
            <RuleActions
              selectedCount={selectedRules.length}
              isPending={deployRulesMutation.isPending}
              onBulkDeploy={handleBulkDeploy}
            />
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
          
          <RulesContent
            rules={filteredRules}
            isLoading={isLoading}
            selectedRules={selectedRules}
            selectedPlatform={selectedPlatform}
            isPlatformConnected={isPlatformConnected}
            onToggleRuleSelection={onToggleRuleSelection}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DeployableRulesSection;
