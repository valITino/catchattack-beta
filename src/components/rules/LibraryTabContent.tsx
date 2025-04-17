
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import RuleFilters from "./RuleFilters";
import RulesList from "./RulesList";
import { useRuleFilters } from "@/hooks/useRuleFilters";
import { SigmaRule } from "@/utils/mitre/types";

interface LibraryTabContentProps {
  rules: SigmaRule[];
  isLoading?: boolean;
}

const LibraryTabContent = ({ rules, isLoading = false }: LibraryTabContentProps) => {
  const {
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
  } = useRuleFilters(rules);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Rule Repository</CardTitle>
            <CardDescription>Manage and deploy detection rules</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <RuleFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTactics={selectedTactics}
            toggleTacticFilter={toggleTacticFilter}
            selectedSeverities={selectedSeverities}
            toggleSeverityFilter={toggleSeverityFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            toggleSortOrder={toggleSortOrder}
            resetFilters={resetFilters}
          />
          
          <div className="border-t border-cyber-primary/20 pt-4">
            <RulesList rules={filteredRules} isLoading={isLoading} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LibraryTabContent;
