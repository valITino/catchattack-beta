
import { useState, useMemo } from "react";
import { DeployableRule } from "@/utils/siemUtils";

export const useRuleFilters = (rules: DeployableRule[]) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

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

  return {
    searchQuery,
    setSearchQuery,
    selectedSeverities,
    toggleSeverityFilter,
    selectedSources,
    toggleSourceFilter,
    clearAllFilters,
    filteredRules
  };
};
