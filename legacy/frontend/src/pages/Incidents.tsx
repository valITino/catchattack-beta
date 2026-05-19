
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, Clock, Eye, FileText, Filter, Plus, Search, 
  Shield, User, Calendar, AlertCircle, CheckCircle2, XCircle 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Mock data for incidents
const incidents = [
  {
    id: "INC-001",
    title: "Suspicious PowerShell Activity",
    severity: "high",
    status: "open",
    createdAt: "2025-04-10T08:15:00Z",
    assignedTo: "Sarah Johnson",
    description: "Multiple encoded PowerShell commands detected on critical server",
    source: "Sigma Rule: PowerShell Encoded Commands",
    affectedSystems: ["DC-SERVER-01", "APP-SERVER-03"]
  },
  {
    id: "INC-002",
    title: "Potential Data Exfiltration",
    severity: "critical",
    status: "investigating",
    createdAt: "2025-04-09T23:42:00Z",
    assignedTo: "Michael Chen",
    description: "Large outbound data transfer detected outside of business hours",
    source: "SIEM Alert: Data Volume Anomaly",
    affectedSystems: ["DB-SERVER-05"]
  },
  {
    id: "INC-003",
    title: "Failed Authentication Attempts",
    severity: "medium",
    status: "closed",
    createdAt: "2025-04-08T14:30:00Z",
    assignedTo: "Alex Rodriguez",
    description: "Multiple failed login attempts from external IP addresses",
    source: "Authentication Logs",
    affectedSystems: ["VPN-GATEWAY"]
  },
  {
    id: "INC-004",
    title: "Malware Detection",
    severity: "high",
    status: "remediated",
    createdAt: "2025-04-07T11:20:00Z",
    assignedTo: "Emily Zhang",
    description: "Trojan detected and quarantined on endpoint",
    source: "Endpoint Protection",
    affectedSystems: ["WORKSTATION-123"]
  },
  {
    id: "INC-005",
    title: "Unusual Admin Activity",
    severity: "medium",
    status: "open",
    createdAt: "2025-04-10T06:45:00Z",
    assignedTo: null,
    description: "Admin account active during non-business hours",
    source: "Sigma Rule: Unusual Admin Login Time",
    affectedSystems: ["ADMIN-SERVER-01", "DC-SERVER-02"]
  }
];

const Incidents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  
  // Filter incidents based on search and tab
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = searchQuery === "" || 
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTab === "all") return matchesSearch;
    if (selectedTab === "open") return matchesSearch && (incident.status === "open" || incident.status === "investigating");
    if (selectedTab === "closed") return matchesSearch && (incident.status === "closed" || incident.status === "remediated");
    
    return matchesSearch;
  });
  
  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-cyber-danger text-white";
      case "high": return "bg-cyber-danger/80 text-white";
      case "medium": return "bg-cyber-warning text-black";
      case "low": return "bg-cyber-accent/70 text-black";
      default: return "bg-cyber-primary text-white";
    }
  };
  
  // Get status badge color and icon
  const getStatusDetails = (status: string) => {
    switch (status) {
      case "open":
        return { 
          color: "bg-cyber-danger/20 text-cyber-danger border-cyber-danger", 
          icon: <AlertCircle className="h-3 w-3 mr-1" /> 
        };
      case "investigating":
        return { 
          color: "bg-cyber-warning/20 text-cyber-warning border-cyber-warning", 
          icon: <Search className="h-3 w-3 mr-1" /> 
        };
      case "remediated":
        return { 
          color: "bg-cyber-info/20 text-cyber-info border-cyber-info", 
          icon: <Shield className="h-3 w-3 mr-1" /> 
        };
      case "closed":
        return { 
          color: "bg-cyber-success/20 text-cyber-success border-cyber-success", 
          icon: <CheckCircle2 className="h-3 w-3 mr-1" /> 
        };
      default:
        return { 
          color: "bg-gray-600/20 text-gray-400 border-gray-600", 
          icon: <Clock className="h-3 w-3 mr-1" /> 
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Security Incidents</h1>
        <Button className="bg-cyber-primary hover:bg-cyber-primary/90">
          <Plus className="h-4 w-4 mr-2" /> New Incident
        </Button>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setSelectedTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search incidents..."
                className="pl-9 bg-cyber-darker border-cyber-primary/20 w-[200px] md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="m-0">
          <Card className="cyber-card">
            <CardHeader className="pb-2">
              <CardTitle>All Incidents</CardTitle>
              <CardDescription>
                Manage and investigate security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4 -mr-4">
                <div className="space-y-3">
                  {filteredIncidents.length > 0 ? (
                    filteredIncidents.map(incident => {
                      const statusDetails = getStatusDetails(incident.status);
                      return (
                        <div 
                          key={incident.id}
                          className="border border-cyber-primary/20 rounded-md p-4 hover:border-cyber-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <AlertTriangle className={`h-4 w-4 ${
                                  incident.severity === "critical" || incident.severity === "high" 
                                    ? "text-cyber-danger" 
                                    : "text-cyber-warning"
                                }`} />
                                <h3 className="font-medium">{incident.title}</h3>
                              </div>
                              <p className="text-sm text-gray-400 mt-1">
                                {incident.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getSeverityColor(incident.severity)}>
                                {incident.severity}
                              </Badge>
                              <Badge className={statusDetails.color}>
                                {statusDetails.icon}
                                {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-gray-400">ID: </span>
                              {incident.id}
                            </div>
                            <div>
                              <span className="text-gray-400">Created: </span>
                              {new Date(incident.createdAt).toLocaleString()}
                            </div>
                            <div>
                              <span className="text-gray-400">Source: </span>
                              {incident.source}
                            </div>
                            <div>
                              <span className="text-gray-400">Assigned: </span>
                              {incident.assignedTo || "Unassigned"}
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {incident.affectedSystems.map(system => (
                                <Badge key={system} variant="outline" className="text-xs">
                                  {system}
                                </Badge>
                              ))}
                            </div>
                            <div>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" /> View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center p-6 text-gray-400">
                      No incidents match your search criteria
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t border-cyber-primary/20 pt-4">
              <div className="flex items-center justify-between w-full text-sm">
                <div className="text-gray-400">
                  Showing {filteredIncidents.length} out of {incidents.length} incidents
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" /> Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-1" /> Schedule Report
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="open" className="m-0">
          <Card className="cyber-card">
            <CardHeader className="pb-2">
              <CardTitle>Open Incidents</CardTitle>
              <CardDescription>
                Active incidents requiring investigation or remediation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Similar content as "all" tab but filtered for open incidents */}
              {/* This is just a stub - the actual implementation would show open incidents */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="closed" className="m-0">
          <Card className="cyber-card">
            <CardHeader className="pb-2">
              <CardTitle>Closed Incidents</CardTitle>
              <CardDescription>
                Resolved or remediated security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Similar content as "all" tab but filtered for closed incidents */}
              {/* This is just a stub - the actual implementation would show closed incidents */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Incidents;
