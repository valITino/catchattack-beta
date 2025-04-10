
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { 
  Database, 
  Shield, 
  ArrowUpCircle,
  RefreshCw,
  Settings, 
  Check, 
  History, 
  Clock,
  AlertCircle
} from "lucide-react";

// Sample sigma rules that can be deployed
const deployableRules = [
  {
    id: "rule-001",
    title: "PowerShell Execution with Encoded Command",
    description: "Detects PowerShell execution with encoded command parameter",
    severity: "high",
    status: "ready",
    source: "windows",
    lastTested: "2025-04-10T12:34:56Z",
    selected: false
  },
  {
    id: "rule-002",
    title: "Service Creation with Binary Path Manipulation",
    description: "Detects service creation with suspicious binary paths",
    severity: "critical",
    status: "ready",
    source: "windows",
    lastTested: "2025-04-10T13:45:23Z",
    selected: false
  },
  {
    id: "rule-003",
    title: "Suspicious API Access Patterns",
    description: "Detects unusual API access patterns indicating data exfiltration",
    severity: "medium",
    status: "needs_testing",
    source: "api",
    lastTested: "2025-04-09T09:12:35Z",
    selected: false
  },
  {
    id: "rule-004",
    title: "Linux Privilege Escalation via SUID Binary",
    description: "Detects potential privilege escalation via SUID binary execution",
    severity: "high",
    status: "ready",
    source: "linux",
    lastTested: "2025-04-10T14:22:16Z",
    selected: false
  },
  {
    id: "rule-005",
    title: "Unusual User Agent in Web Requests",
    description: "Detects unusual or suspicious user agents in web requests",
    severity: "medium",
    status: "ready",
    source: "web",
    lastTested: "2025-04-09T18:34:12Z",
    selected: false
  }
];

// Connected SIEM platforms
const connectedSiems = [
  {
    id: "siem-001",
    name: "Elasticsearch",
    type: "elasticsearch",
    url: "https://elasticsearch.example.com:9200",
    status: "connected",
    lastSync: "2025-04-10T14:30:45Z"
  },
  {
    id: "siem-002",
    name: "Local SIEM Test",
    type: "elasticsearch",
    url: "http://localhost:9200",
    status: "connected",
    lastSync: "2025-04-10T13:25:12Z"
  }
];

// Recent deployments
const deploymentHistory = [
  {
    id: "deploy-001",
    timestamp: "2025-04-10T14:30:45Z",
    target: "Elasticsearch",
    rules: 7,
    status: "success",
    user: "Security Analyst"
  },
  {
    id: "deploy-002",
    timestamp: "2025-04-09T11:22:33Z",
    target: "Elasticsearch",
    rules: 3,
    status: "success",
    user: "Security Analyst"
  },
  {
    id: "deploy-003",
    timestamp: "2025-04-08T16:45:12Z",
    target: "Local SIEM Test",
    rules: 5,
    status: "success",
    user: "Security Analyst"
  },
  {
    id: "deploy-004",
    timestamp: "2025-04-07T10:15:30Z",
    target: "Elasticsearch",
    rules: 2,
    status: "failed",
    user: "Security Analyst",
    error: "Connection timeout"
  }
];

const SiemIntegration = () => {
  const [rules, setRules] = useState(deployableRules);
  const [selectedSiem, setSelectedSiem] = useState<string>(connectedSiems[0].id);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Select/deselect all rules
  const handleSelectAll = (checked: boolean) => {
    setRules(rules.map(rule => ({ ...rule, selected: checked })));
  };
  
  // Toggle rule selection
  const handleToggleRule = (id: string, checked: boolean) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, selected: checked } : rule
    ));
  };
  
  // Filter rules
  const filteredRules = rules.filter(rule => {
    // Filter by status
    if (filterStatus !== "all" && rule.status !== filterStatus) {
      return false;
    }
    
    // Filter by severity
    if (selectedSeverities.length > 0 && !selectedSeverities.includes(rule.severity)) {
      return false;
    }
    
    // Filter by source
    if (selectedSources.length > 0 && !selectedSources.includes(rule.source)) {
      return false;
    }
    
    // Search by title or description
    if (searchQuery && !rule.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !rule.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Count selected rules
  const selectedCount = rules.filter(rule => rule.selected).length;
  
  // Deploy selected rules
  const handleDeployRules = () => {
    if (selectedCount === 0) {
      toast({
        title: "No Rules Selected",
        description: "Please select at least one rule to deploy",
        variant: "destructive",
      });
      return;
    }
    
    const targetSiem = connectedSiems.find(siem => siem.id === selectedSiem);
    if (!targetSiem) {
      toast({
        title: "Invalid SIEM Target",
        description: "Please select a valid SIEM target",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Deploying Rules",
      description: `Deploying ${selectedCount} rules to ${targetSiem.name}`,
    });
    
    // Simulate deployment delay
    setTimeout(() => {
      toast({
        title: "Deployment Complete",
        description: `Successfully deployed ${selectedCount} rules to ${targetSiem.name}`,
        variant: "success",
      });
      
      // Reset selection
      setRules(rules.map(rule => ({ ...rule, selected: false })));
    }, 2000);
  };
  
  // Toggle severity filter
  const toggleSeverity = (severity: string) => {
    if (selectedSeverities.includes(severity)) {
      setSelectedSeverities(selectedSeverities.filter(s => s !== severity));
    } else {
      setSelectedSeverities([...selectedSeverities, severity]);
    }
  };
  
  // Toggle source filter
  const toggleSource = (source: string) => {
    if (selectedSources.includes(source)) {
      setSelectedSources(selectedSources.filter(s => s !== source));
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilterStatus("all");
    setSelectedSeverities([]);
    setSelectedSources([]);
    setSearchQuery("");
  };
  
  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-cyber-success/20 text-cyber-success border-cyber-success">Ready</Badge>;
      case "needs_testing":
        return <Badge className="bg-cyber-warning/20 text-cyber-warning border-cyber-warning">Needs Testing</Badge>;
      case "deprecated":
        return <Badge className="bg-cyber-danger/20 text-cyber-danger border-cyber-danger">Deprecated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SIEM Integration</h1>
        <Button 
          className="bg-cyber-primary hover:bg-cyber-primary/90"
          onClick={handleDeployRules}
        >
          <ArrowUpCircle className="mr-2 h-4 w-4" />
          Deploy Selected Rules ({selectedCount})
        </Button>
      </div>
      
      <Tabs defaultValue="deploy" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="deploy">
            <Shield className="mr-2 h-4 w-4" />
            Deploy Rules
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Database className="mr-2 h-4 w-4" />
            SIEM Connections
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Deployment History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="deploy" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle>Deployment Options</CardTitle>
                  <CardDescription>Configure deployment settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siem-target">Deploy To</Label>
                    <Select
                      value={selectedSiem}
                      onValueChange={setSelectedSiem}
                    >
                      <SelectTrigger className="bg-cyber-darker border-cyber-primary/20">
                        <SelectValue placeholder="Select SIEM target" />
                      </SelectTrigger>
                      <SelectContent>
                        {connectedSiems.map(siem => (
                          <SelectItem key={siem.id} value={siem.id}>
                            {siem.name} ({siem.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="test-mode">Test Mode</Label>
                      <Switch id="test-mode" className="data-[state=checked]:bg-cyber-primary" />
                    </div>
                    <p className="text-xs text-gray-400">
                      Deploy rules in test mode without enabling alerts
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="backup-existing">Backup Existing</Label>
                      <Switch 
                        id="backup-existing" 
                        defaultChecked
                        className="data-[state=checked]:bg-cyber-primary" 
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      Create backup of existing rules before deployment
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="override-existing">Override Existing</Label>
                      <Switch 
                        id="override-existing" 
                        defaultChecked
                        className="data-[state=checked]:bg-cyber-primary" 
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      Override existing rules with the same ID
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="col-span-2">
              <Card className="cyber-card h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Available Rules</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs h-7"
                      >
                        Clear Filters
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSelectAll(filteredRules.length > 0 && filteredRules.every(r => r.selected) ? false : true)}
                        className="text-xs h-7"
                      >
                        {filteredRules.length > 0 && filteredRules.every(r => r.selected) 
                          ? "Deselect All" 
                          : "Select All"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-3">
                  <div className="flex space-x-2 px-1">
                    <Input
                      placeholder="Search rules..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-cyber-darker border-cyber-primary/20"
                    />
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className="w-[180px] bg-cyber-darker border-cyber-primary/20">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="needs_testing">Needs Testing</SelectItem>
                        <SelectItem value="deprecated">Deprecated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 px-1">
                    <span className="text-xs text-gray-400 flex items-center">Severity:</span>
                    {["critical", "high", "medium", "low"].map(severity => (
                      <Badge
                        key={severity}
                        variant={selectedSeverities.includes(severity) ? "default" : "outline"}
                        className={`cursor-pointer text-xs ${getSeverityColor(severity)}`}
                        onClick={() => toggleSeverity(severity)}
                      >
                        {severity}
                      </Badge>
                    ))}
                    
                    <span className="text-xs text-gray-400 ml-2 flex items-center">Source:</span>
                    {["windows", "linux", "api", "web"].map(source => (
                      <Badge
                        key={source}
                        variant={selectedSources.includes(source) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleSource(source)}
                      >
                        {source}
                      </Badge>
                    ))}
                  </div>
                  
                  <ScrollArea className="h-[400px] pr-3">
                    <div className="space-y-2 px-1">
                      {filteredRules.length > 0 ? (
                        filteredRules.map(rule => (
                          <div
                            key={rule.id}
                            className="p-3 border border-cyber-primary/20 rounded-md"
                          >
                            <div className="flex items-start">
                              <Checkbox
                                checked={rule.selected}
                                onCheckedChange={(checked) => handleToggleRule(rule.id, checked === true)}
                                className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary mr-2 mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h3 className="font-medium">{rule.title}</h3>
                                  {getStatusBadge(rule.status)}
                                </div>
                                <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge className={getSeverityColor(rule.severity)}>{rule.severity}</Badge>
                                  <Badge variant="outline">{rule.source}</Badge>
                                  <span className="text-xs text-gray-500">
                                    Last tested: {new Date(rule.lastTested).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-gray-400">
                          No rules match the current filters
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="connections" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="cyber-card col-span-2">
              <CardHeader>
                <CardTitle>Connected SIEM Platforms</CardTitle>
                <CardDescription>Manage your SIEM connections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectedSiems.map(siem => (
                  <div
                    key={siem.id}
                    className="border border-cyber-primary/20 rounded-md p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium">{siem.name}</h3>
                          <Badge 
                            className="ml-2 bg-cyber-success/20 text-cyber-success border-cyber-success"
                          >
                            Connected
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Type: {siem.type}</p>
                        <p className="text-sm text-gray-400">URL: {siem.url}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" /> Configure
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Last sync: {formatDate(siem.lastSync)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 text-xs px-2"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" /> Sync Now
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <span className="mr-2">+</span>Connect New SIEM
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Connection Health</CardTitle>
                <CardDescription>Monitoring and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {connectedSiems.map(siem => (
                    <div key={`health-${siem.id}`} className="p-3 border border-cyber-primary/20 rounded-md">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm">{siem.name}</h3>
                        <div className="flex items-center space-x-1">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-green-500">Online</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-400">Latency</p>
                          <p className="font-mono">24ms</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Uptime</p>
                          <p className="font-mono">99.9%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Active Rules</p>
                          <p className="font-mono">143</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Avg. Processing</p>
                          <p className="font-mono">0.8s</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Alert className="bg-cyber-primary/5 border-cyber-primary">
                    <Check className="h-4 w-4 text-cyber-success" />
                    <AlertTitle>All systems operational</AlertTitle>
                    <AlertDescription>
                      All SIEM connections are functioning properly
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>Record of rule deployments to SIEM platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deploymentHistory.map(deployment => (
                  <div
                    key={deployment.id}
                    className="border border-cyber-primary/20 rounded-md p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium">Deployment to {deployment.target}</h3>
                          {deployment.status === "success" ? (
                            <Badge className="ml-2 bg-cyber-success/20 text-cyber-success border-cyber-success">
                              Success
                            </Badge>
                          ) : (
                            <Badge className="ml-2 bg-cyber-danger/20 text-cyber-danger border-cyber-danger">
                              Failed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {formatDate(deployment.timestamp)} by {deployment.user}
                        </p>
                        <p className="text-sm mt-1">
                          {deployment.rules} rules {deployment.status === "success" ? "deployed" : "attempted"}
                        </p>
                        
                        {deployment.status === "failed" && deployment.error && (
                          <div className="mt-2 flex items-start space-x-2 text-cyber-danger text-sm">
                            <AlertCircle className="h-4 w-4 mt-0.5" />
                            <span>{deployment.error}</span>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
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

// Helper function to get severity color classes
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

export default SiemIntegration;
