
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter, ArrowUpDown } from "lucide-react";
import { getSeverityColor } from "@/utils/siemUtils";

interface RuleFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedTactics: string[];
  toggleTacticFilter: (tactic: string) => void;
  selectedSeverities: string[];
  toggleSeverityFilter: (severity: string) => void;
  sortBy: "name" | "date" | "severity";
  setSortBy: (value: "name" | "date" | "severity") => void;
  sortOrder: "asc" | "desc";
  toggleSortOrder: () => void;
  resetFilters: () => void;
}

const RuleFilters = ({
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
  resetFilters
}: RuleFiltersProps) => {
  // Common tactics for MITRE ATT&CK
  const commonTactics = ["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion"];
  
  // Common severity levels
  const severityLevels = ["critical", "high", "medium", "low", "informational"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search rules by name, description, or MITRE ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-cyber-darker border-cyber-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={() => {
              if (sortBy === "date") {
                toggleSortOrder();
              } else {
                setSortBy("date");
              }
            }}
          >
            {sortBy === "date" && (
              <ArrowUpDown className={`h-4 w-4 mr-1 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
            )}
            Date
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={() => {
              if (sortBy === "severity") {
                toggleSortOrder();
              } else {
                setSortBy("severity");
              }
            }}
          >
            {sortBy === "severity" && (
              <ArrowUpDown className={`h-4 w-4 mr-1 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
            )}
            Severity
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={() => {
              if (sortBy === "name") {
                toggleSortOrder();
              } else {
                setSortBy("name");
              }
            }}
          >
            {sortBy === "name" && (
              <ArrowUpDown className={`h-4 w-4 mr-1 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
            )}
            Name
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
          >
            Clear Filters
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">MITRE Tactics</p>
            <div className="flex flex-wrap gap-2">
              {commonTactics.map(tactic => (
                <Badge
                  key={tactic}
                  variant={selectedTactics.includes(tactic) ? "default" : "outline"}
                  className={`cursor-pointer ${selectedTactics.includes(tactic) ? "bg-cyber-primary" : "border-cyber-primary/40"}`}
                  onClick={() => toggleTacticFilter(tactic)}
                >
                  {tactic}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">Severity</p>
            <div className="flex flex-wrap gap-2">
              {severityLevels.map(severity => (
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
        </div>
      </div>
    </div>
  );
};

export default RuleFilters;
