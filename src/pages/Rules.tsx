
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileCode2, Search, ArrowUpDown, Filter, 
  RefreshCw, GitFork, BookMarked, Lightbulb
} from "lucide-react";
import { SigmaRule, checkRuleExists, getAllRules } from "@/utils/mitreAttackUtils";
import { getSeverityColor } from "@/utils/siemUtils";
import RuleCard from "@/components/sigma/RuleCard";
import AutoRuleGenerator from "@/components/rules/AutoRuleGenerator";

const Rules = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTactics, setSelectedTactics] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "date" | "severity">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Get all rules from the mock store
  const allRules = getAllRules();
  
  // Filter and sort rules
  const filteredRules = allRules.filter(rule => {
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

  // Tactic filter handler
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Detection Rules</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">
            <BookMarked className="h-4 w-4 mr-2" />
            Rule Library
          </TabsTrigger>
          <TabsTrigger value="generator">
            <Lightbulb className="h-4 w-4 mr-2" />
            Auto-Generator
          </TabsTrigger>
          <TabsTrigger value="community">
            <GitFork className="h-4 w-4 mr-2" />
            Community Rules
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Rule Repository</CardTitle>
                  <CardDescription>Manage and deploy detection rules</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedTactics([]);
                      setSelectedSeverities([]);
                      setSearchQuery("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                          setSortOrder("desc");
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
                          setSortOrder("desc");
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
                          setSortOrder("asc");
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
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm font-medium">Filters</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-2">MITRE Tactics</p>
                      <div className="flex flex-wrap gap-2">
                        {["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion"].map(tactic => (
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
                        {["critical", "high", "medium", "low", "informational"].map(severity => (
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
                
                <div className="border-t border-cyber-primary/20 pt-4">
                  <ScrollArea className="h-[500px]">
                    {filteredRules.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRules.map(rule => (
                          <RuleCard key={rule.id} rule={rule} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64">
                        <FileCode2 className="h-12 w-12 text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium mb-1">No rules found</h3>
                        <p className="text-sm text-gray-400">
                          Try adjusting your filters or create a new rule
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="generator" className="space-y-4">
          <AutoRuleGenerator />
        </TabsContent>
        
        <TabsContent value="community" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Rules</CardTitle>
              <CardDescription>Discover and import rules created by the community</CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-center">
                <GitFork className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Community Marketplace</h3>
                <p className="text-gray-400 mb-4">
                  Discover and share detection rules with the CatchAttack community
                </p>
                <Button>Explore Community Rules</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Rules;
