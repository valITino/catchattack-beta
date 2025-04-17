
import { useState } from "react";
import { SigmaRule } from "@/utils/mitreAttackUtils";

export const useRuleFilters = (rules: SigmaRule[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTactics, setSelectedTactics] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "date" | "severity">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Toggle tactic filter handler
  const toggleTacticFilter = (tactic: string) => {
    if (selectedTactics.includes(tactic)) {
      setSelectedTactics(selectedTactics.filter(t => t !== tactic));
    } else {
      setSelectedTactics([...selectedTactics, tactic]);
    }
  };
  
  // Severity filter handler
  const toggleSeverityFilter = (severity: string) => {
    if (selectedSeverities.includes(severity)) {
      setSelectedSeverities(selectedSeverities.filter(s => s !== severity));
    } else {
      setSelectedSeverities([...selectedSeverities, severity]);
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedTactics([]);
    setSelectedSeverities([]);
    setSearchQuery("");
  };

  // Filter and sort rules
  const filteredRules = rules.filter(rule => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.technique.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tactic filter
    const matchesTactic = selectedTactics.length === 0 || 
      selectedTactics.includes(rule.technique.tactic);
    
    // Severity filter
    const matchesSeverity = selectedSeverities.length === 0 || 
      selectedSeverities.includes(rule.level);
    
    return matchesSearch && matchesTactic && matchesSeverity;
  })
  .sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortBy === "severity") {
      const severityOrder = { "critical": 4, "high": 3, "medium": 2, "low": 1, "informational": 0 };
      const severityA = severityOrder[a.level as keyof typeof severityOrder] || 0;
      const severityB = severityOrder[b.level as keyof typeof severityOrder] || 0;
      return sortOrder === "asc" ? severityA - severityB : severityB - severityA;
    } else {
      // Default: sort by date
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    }
  });

  return {
    searchQuery,
    setSearchQuery,
    selectedTactics,
    toggleTacticFilter,
    selectedSeverities,
    toggleSeverityFilter,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    resetFilters,
    filteredRules
  };
};
