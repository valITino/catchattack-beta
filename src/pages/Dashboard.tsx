
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react";
import StatusCard from "@/components/dashboard/StatusCard";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";

const dashboardData = {
  emulationStats: {
    total: 24,
    active: 3,
    completed: 18,
    failed: 3,
  },
  detectionData: [
    { name: "Jan", detected: 65, fixed: 40 },
    { name: "Feb", detected: 75, fixed: 55 },
    { name: "Mar", detected: 83, fixed: 70 },
    { name: "Apr", detected: 92, fixed: 85 },
    { name: "May", detected: 78, fixed: 75 },
    { name: "Jun", detected: 95, fixed: 90 },
  ],
  threatTypes: [
    { name: "Ransomware", value: 35, color: "#ef4444" },
    { name: "Data Exfiltration", value: 25, color: "#f59e0b" },
    { name: "Credential Theft", value: 20, color: "#3b82f6" },
    { name: "Privilege Escalation", value: 15, color: "#8b5cf6" },
    { name: "Lateral Movement", value: 5, color: "#10b981" },
  ],
  recentEmulations: [
    { 
      id: "EM-2025-042", 
      name: "APT29 Emulation", 
      status: "active", 
      progress: 68, 
      vulnerabilities: 12,
      rulesPending: 8,
      startTime: "2025-04-09T14:30:00"
    },
    { 
      id: "EM-2025-041", 
      name: "Ransomware Simulation", 
      status: "completed", 
      progress: 100, 
      vulnerabilities: 9,
      rulesGenerated: 7,
      startTime: "2025-04-08T09:15:00",
      completionTime: "2025-04-08T11:45:00"
    },
    { 
      id: "EM-2025-040", 
      name: "Supply Chain Attack", 
      status: "completed", 
      progress: 100, 
      vulnerabilities: 15,
      rulesGenerated: 12,
      startTime: "2025-04-07T13:20:00",
      completionTime: "2025-04-07T17:10:00"
    },
    { 
      id: "EM-2025-039", 
      name: "Lateral Movement Test", 
      status: "failed", 
      progress: 45, 
      error: "Connection timeout in test environment",
      startTime: "2025-04-06T10:00:00",
      failureTime: "2025-04-06T10:35:00"
    },
  ],
  recentActivities: [
    {
      id: 1,
      type: "rule-generated",
      title: "Sigma Rule Generated",
      description: "12 rules generated for APT29 emulation",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      type: "vulnerability-detected",
      title: "New Vulnerability",
      description: "Critical authentication bypass detected in API gateway",
      timestamp: "4 hours ago"
    },
    {
      id: 3,
      type: "rule-deployed",
      title: "Rules Deployed to SIEM",
      description: "7 rules deployed to Elasticsearch",
      timestamp: "Yesterday"
    },
    {
      id: 4,
      type: "emulation-started",
      title: "Emulation Started",
      description: "APT29 emulation campaign initiated",
      timestamp: "Yesterday"
    }
  ]
};

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Detection Operations Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard 
          title="Total Emulations"
          value={dashboardData.emulationStats.total}
          icon={<Activity className="h-5 w-5 text-cyber-info" />}
          trend="+4 this month"
          trendUp={true}
        />
        <StatusCard 
          title="Active Campaigns"
          value={dashboardData.emulationStats.active}
          icon={<Clock className="h-5 w-5 text-cyber-warning" />}
          trend="2 ending today"
          trendUp={false}
        />
        <StatusCard 
          title="Vulnerabilities Fixed"
          value="85%"
          icon={<CheckCircle className="h-5 w-5 text-cyber-success" />}
          trend="+15% from last month"
          trendUp={true}
        />
        <StatusCard 
          title="Rules Generated"
          value="143"
          icon={<Shield className="h-5 w-5 text-cyber-primary" />}
          trend="+28 this month"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 cyber-card">
          <CardHeader>
            <CardTitle>Detection & Remediation Trends</CardTitle>
            <CardDescription>Vulnerabilities detected vs. fixed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dashboardData.detectionData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderColor: '#3b82f6',
                      color: '#fff'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="detected" 
                    name="Vulnerabilities Detected" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fixed" 
                    name="Vulnerabilities Fixed" 
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="cyber-card">
          <CardHeader>
            <CardTitle>Threat Categories</CardTitle>
            <CardDescription>Distribution of detected threats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.threatTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dashboardData.threatTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderColor: '#3b82f6',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 cyber-card">
          <CardHeader>
            <CardTitle>Emulation Campaigns</CardTitle>
            <CardDescription>Recent and ongoing emulation activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentEmulations.map((emulation) => (
              <div key={emulation.id} className="border border-cyber-primary/20 rounded-md p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{emulation.name}</div>
                    <div className="text-sm text-gray-400">ID: {emulation.id}</div>
                  </div>
                  <StatusBadge status={emulation.status} />
                </div>

                {emulation.status === "active" && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Progress</span>
                      <span>{emulation.progress}%</span>
                    </div>
                    <Progress value={emulation.progress} className="h-2 bg-cyber-dark" />
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-cyber-danger mr-1">{emulation.vulnerabilities}</span>
                        <span className="text-gray-400">Vulnerabilities</span>
                      </div>
                      <div>
                        <span className="text-cyber-warning mr-1">{emulation.rulesPending}</span>
                        <span className="text-gray-400">Rules Pending</span>
                      </div>
                    </div>
                  </div>
                )}

                {emulation.status === "completed" && (
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-gray-400">Vulnerabilities:</div>
                      <div className="font-medium">{emulation.vulnerabilities}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Rules Generated:</div>
                      <div className="font-medium text-cyber-success">{emulation.rulesGenerated}</div>
                    </div>
                  </div>
                )}

                {emulation.status === "failed" && (
                  <div className="text-sm text-cyber-danger flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {emulation.error}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <RecentActivityCard activities={dashboardData.recentActivities} />
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    active: "bg-cyber-primary/20 text-cyber-primary border-cyber-primary",
    completed: "bg-cyber-success/20 text-cyber-success border-cyber-success",
    failed: "bg-cyber-danger/20 text-cyber-danger border-cyber-danger",
  };

  return (
    <Badge 
      className={`${variants[status as keyof typeof variants]} py-1`}
      variant="outline"
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default Dashboard;
