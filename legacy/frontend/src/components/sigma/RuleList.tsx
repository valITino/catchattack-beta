
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from "lucide-react";
import { getSeverityColor } from "@/utils/siemUtils";

export interface SigmaRuleListItem {
  id: string;
  title: string;
  description: string;
  severity: string;
  source: string;
  tags: string[];
  rule: string;
  emulation: string;
  detectionCount: number;
  dateCreated: string;
  status?: string;
}

interface RuleListProps {
  rules: SigmaRuleListItem[];
  selectedRule: SigmaRuleListItem | null;
  onSelectRule: (rule: SigmaRuleListItem) => void;
}

const RuleList = ({ rules, selectedRule, onSelectRule }: RuleListProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const toggleSeverityFilter = (severity: string) => {
    if (selectedSeverities.includes(severity)) {
      setSelectedSeverities(selectedSeverities.filter(s => s !== severity));
    } else {
      setSelectedSeverities([...selectedSeverities, severity]);
    }
  };

  const toggleSourceFilter = (source: string) => {
    if (selectedSources.includes(source)) {
      setSelectedSources(selectedSources.filter(s => s !== source));
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  };

  const filteredRules = rules.filter(rule => {
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
      
      <ScrollArea className="h-[400px] pr-3 -mr-3">
        <div className="space-y-2">
          {filteredRules.length > 0 ? (
            filteredRules.map(rule => (
              <div
                key={rule.id}
                className={`p-3 border rounded-md cursor-pointer ${
                  selectedRule?.id === rule.id
                    ? "border-cyber-primary bg-cyber-primary/10"
                    : "border-cyber-primary/20 hover:border-cyber-primary/50"
                }`}
                onClick={() => onSelectRule(rule)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-sm mb-1">{rule.title}</h3>
                  <Badge className={getSeverityColor(rule.severity)}>
                    {rule.severity}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mb-2">{rule.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{rule.source}</Badge>
                  <span className="text-xs text-gray-400">Detections: {rule.detectionCount}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-gray-400">
              No rules match the current filters
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RuleList;
