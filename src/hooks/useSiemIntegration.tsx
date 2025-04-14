
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/apiService";
import { SiemPlatform, DeployableRule } from "@/utils/siemUtils";

export const useSiemIntegration = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);

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

  // Set first platform as selected if none is selected
  useEffect(() => {
    if (siemPlatforms.length > 0 && !selectedPlatform) {
      const connectedPlatform = siemPlatforms.find(p => p.connected);
      if (connectedPlatform) {
        setSelectedPlatform(connectedPlatform.id);
      }
    }
  }, [siemPlatforms, selectedPlatform]);

  return {
    selectedPlatform,
    setSelectedPlatform,
    selectedRules,
    setSelectedRules,
    toggleRuleSelection,
    siemPlatforms,
    currentPlatform,
    sigmaRules,
    platformsLoading,
    rulesLoading,
    isPlatformConnected: !!currentPlatform?.connected
  };
};
