import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { FileCode2, Download, Copy, Eye, RefreshCw, Check, X, Search, Filter } from "lucide-react";

const generatedRules = [
  {
    id: "rule-001",
    title: "PowerShell Execution with Encoded Command",
    description: "Detects PowerShell execution with encoded command parameter",
    status: "active",
    severity: "high",
    source: "windows",
    tags: ["attack.execution", "attack.t1059.001"],
    rule: `title: PowerShell Execution with Encoded Command
description: Detects PowerShell execution with encoded command parameter
id: 1234-abcd-5678-efgh
status: experimental
author: Security Team
date: 2025/04/10
modified: 2025/04/10
logsource:
  product: windows
  service: powershell
detection:
  selection:
    EventID: 4104
    ScriptBlockText|contains:
      - "-enc "
      - "-EncodedCommand"
  condition: selection
falsepositives:
  - Administrative scripts
level: high
tags:
  - attack.execution
  - attack.t1059.001`,
    emulation: "APT29 Emulation",
    detectionCount: 5,
    dateCreated: "2025-04-10T12:34:56Z"
  },
  {
    id: "rule-002",
    title: "Service Creation with Binary Path Manipulation",
    description: "Detects service creation with suspicious binary paths",
    status: "active",
    severity: "critical",
    source: "windows",
    tags: ["attack.persistence", "attack.privilege_escalation", "attack.t1543.003"],
    rule: `title: Service Creation with Binary Path Manipulation
description: Detects service creation with suspicious binary paths
id: abcd-1234-efgh-5678
status: experimental
author: Security Team
date: 2025/04/10
modified: 2025/04/10
logsource:
  product: windows
  service: security
  definition: 'Requirements: Audit Policy : Audit Security System Extension'
detection:
  selection:
    EventID: 4697
    ServiceFileName|contains:
      - 'cmd.exe /c'
      - 'powershell'
      - '-nop'
      - '/c start'
  condition: selection
falsepositives:
  - Legitimate services using command shell functionality
level: critical
tags:
  - attack.persistence
  - attack.privilege_escalation
  - attack.t1543.003`,
    emulation: "APT29 Emulation",
    detectionCount: 3,
    dateCreated: "2025-04-10T13:45:23Z"
  },
  {
    id: "rule-003",
    title: "Suspicious API Access Patterns",
    description: "Detects unusual API access patterns indicating data exfiltration",
    status: "testing",
    severity: "medium",
    source: "api",
    tags: ["attack.exfiltration", "attack.t1567"],
    rule: `title: Suspicious API Access Patterns
description: Detects unusual API access patterns indicating data exfiltration
id: efgh-5678-abcd-1234
status: experimental
author: Security Team
date: 2025/04/10
modified: 2025/04/10
logsource:
  product: api_gateway
  service: accesslogs
detection:
  selection:
    method: 'GET'
    path|contains: '/api/users'
    status_code: 200
  timeframe: 5m
  condition: selection | count() by client_ip > 50
falsepositives:
  - Batch operations
  - Data migrations
level: medium
tags:
  - attack.exfiltration
  - attack.t1567`,
    emulation: "Supply Chain Attack",
    detectionCount: 12,
    dateCreated: "2025-04-10T09:12:35Z"
  },
];

const vulnerabilities = [
  {
    id: "vuln-001",
    name: "Powershell Encoded Command Execution",
    description: "Detection of PowerShell execution with encoded commands, which can be used to obfuscate malicious code",
    severity: "High",
    emulation: "APT29 Emulation",
    tactic: "Execution",
    technique: "T1059.001",
    hasRule: true,
    ruleId: "rule-001"
  },
  {
    id: "vuln-002",
    name: "Service Creation Abuse",
    description: "Service creation with binary path containing suspicious commands, often used for persistence",
    severity: "Critical",
    emulation: "APT29 Emulation",
    tactic: "Persistence",
    technique: "T1543.003",
    hasRule: true,
    ruleId: "rule-002"
  },
  {
    id: "vuln-003",
    name: "API Rate Limit Bypass",
    description: "Excessive API requests indicating potential data scraping or exfiltration attempts",
    severity: "Medium",
    emulation: "Supply Chain Attack",
    tactic: "Exfiltration",
    technique: "T1567",
    hasRule: true,
    ruleId: "rule-003"
  },
  {
    id: "vuln-004",
    name: "Unquoted Service Path",
    description: "Windows service using unquoted service path, which can lead to privilege escalation",
    severity: "Medium",
    emulation: "APT29 Emulation",
    tactic: "Privilege Escalation",
    technique: "T1574.009",
    hasRule: false
  },
  {
    id: "vuln-005",
    name: "Suspicious Registry Modification",
    description: "Modification of registry keys associated with persistence mechanisms",
    severity: "High",
    emulation: "Ransomware Simulation",
    tactic: "Persistence",
    technique: "T1112",
    hasRule: false
  }
];

const SigmaGenerator = () => {
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [ruleContent, setRuleContent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("rules");
  const [selectedVulnerability, setSelectedVulnerability] = useState<string | null>(null);

  const handleSelectRule = (rule: any) => {
    setSelectedRule(rule);
    setRuleContent(rule.rule);
  };

  const handleRuleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRuleContent(e.target.value);
  };

  const handleSaveRule = () => {
    toast({
      title: "Rule Updated",
      description: "Sigma rule has been successfully updated",
    });
  };

  const handleCopyRule = () => {
    navigator.clipboard.writeText(ruleContent);
    toast({
      title: "Copied to Clipboard",
      description: "Sigma rule content copied to clipboard",
    });
  };

  const handleExportRule = () => {
    toast({
      title: "Rule Exported",
      description: "Sigma rule exported as YAML file",
    });
  };

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

  const filteredRules = generatedRules.filter(rule => {
    const matchesSearch = searchQuery === "" || 
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = selectedSeverities.length === 0 || 
      selectedSeverities.includes(rule.severity);
    
    const matchesSource = selectedSources.length === 0 || 
      selectedSources.includes(rule.source);
    
    return matchesSearch && matchesSeverity && matchesSource;
  });

  const handleGenerateRule = (vulnerabilityId: string) => {
    toast({
      title: "Rule Generation Started",
      description: "Generating sigma rule from vulnerability data",
    });
    
    setTimeout(() => {
      toast({
        title: "Rule Generated",
        description: "New sigma rule has been created and added to the repository",
      });
    }, 2000);
  };

  const vulnerabilitiesWithoutRules = vulnerabilities.filter(v => !v.hasRule);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sigma Rules Generator</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rules">
            <FileCode2 className="mr-2 h-4 w-4" />
            Generated Rules
          </TabsTrigger>
          <TabsTrigger value="vulnerabilities">
            <Search className="mr-2 h-4 w-4" />
            Vulnerabilities
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <Card className="cyber-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Rule Repository</CardTitle>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>Generated detection rules</CardDescription>
                </CardHeader>
                <CardContent>
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
                              onClick={() => handleSelectRule(rule)}
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
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2 space-y-4">
              {selectedRule ? (
                <Card className="cyber-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedRule.title}</CardTitle>
                        <CardDescription>{selectedRule.description}</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={handleExportRule}>
                          <Download className="h-4 w-4 mr-1" /> Export
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCopyRule}>
                          <Copy className="h-4 w-4 mr-1" /> Copy
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-400">Severity</Label>
                        <p className="text-sm">{selectedRule.severity}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">Source</Label>
                        <p className="text-sm">{selectedRule.source}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">Emulation</Label>
                        <p className="text-sm">{selectedRule.emulation}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="rule-content">Rule Definition (YAML)</Label>
                      <Textarea
                        id="rule-content"
                        value={ruleContent}
                        onChange={handleRuleContentChange}
                        rows={20}
                        className="font-mono text-sm bg-cyber-darker border-cyber-primary/20"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={handleSaveRule} className="bg-cyber-primary hover:bg-cyber-primary/90">
                        <Check className="h-4 w-4 mr-2" /> Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px] border border-dashed border-gray-700 rounded-md">
                  <div className="text-center p-6">
                    <FileCode2 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Rule</h3>
                    <p className="text-gray-400 text-sm">
                      Select a rule from the repository to view and edit its definition
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="vulnerabilities" className="space-y-4">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>Detected Vulnerabilities</CardTitle>
              <CardDescription>Vulnerabilities detected during emulation that can be converted to detection rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vulnerabilities.map((vuln) => (
                  <div 
                    key={vuln.id} 
                    className="p-4 border border-cyber-primary/20 rounded-md"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{vuln.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className="bg-cyber-primary/10 border-cyber-primary"
                          >
                            {vuln.technique}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="bg-cyber-accent/10 border-cyber-accent"
                          >
                            {vuln.tactic}
                          </Badge>
                          <Badge 
                            className={getSeverityColor(vuln.severity.toLowerCase())}
                          >
                            {vuln.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">{vuln.description}</p>
                      </div>
                      
                      {vuln.hasRule ? (
                        <Button 
                          variant="outline" 
                          className="border-cyber-success text-cyber-success hover:bg-cyber-success/10"
                          onClick={() => {
                            const rule = generatedRules.find(r => r.id === vuln.ruleId);
                            if (rule) {
                              handleSelectRule(rule);
                              setActiveTab("rules");
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" /> View Rule
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleGenerateRule(vuln.id)}
                          className="bg-cyber-primary hover:bg-cyber-primary/90"
                        >
                          <FileCode2 className="h-4 w-4 mr-2" /> Generate Rule
                        </Button>
                      )}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Found in emulation: <span className="text-gray-400">{vuln.emulation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return "bg-cyber-danger/20 text-cyber-danger border-cyber-danger";
    case 'high':
      return "bg-red-900/20 text-red-400 border-red-900";
    case 'medium':
      return "bg-cyber-warning/20 text-cyber-warning border-cyber-warning";
    case 'low':
      return "bg-cyber-info/20 text-cyber-info border-cyber-info";
    default:
      return "bg-gray-600/20 text-gray-400 border-gray-600";
  }
};

export default SigmaGenerator;
