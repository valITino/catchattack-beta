
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getSeverityColor } from "@/utils/siemUtils";

interface RuleFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSeverities: string[];
  toggleSeverityFilter: (severity: string) => void;
  selectedSources: string[];
  toggleSourceFilter: (source: string) => void;
  clearAllFilters: () => void;
}

const RuleFilters = ({
  searchQuery,
  setSearchQuery,
  selectedSeverities,
  toggleSeverityFilter,
  selectedSources,
  toggleSourceFilter,
  clearAllFilters
}: RuleFiltersProps) => {
  return (
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
          onClick={clearAllFilters}
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
    </div>
  );
};

export default RuleFilters;
