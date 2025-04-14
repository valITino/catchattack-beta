import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { FileCode2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import RuleList, { SigmaRuleListItem } from "@/components/sigma/RuleList";
import RuleEditor from "@/components/sigma/RuleEditor";
import VulnerabilityList from "@/components/sigma/VulnerabilityList";
import { getSeverityColor } from "@/utils/siemUtils";

const generatedRules: SigmaRuleListItem[] = [
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
  const [selectedRule, setSelectedRule] = useState<SigmaRuleListItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>("rules");
  const navigate = useNavigate();

  const handleSelectRule = (rule: SigmaRuleListItem) => {
    setSelectedRule(rule);
  };

  const handleDeployRuleToSiem = (rule: SigmaRuleListItem) => {
    toast({
      title: "Deployment Option",
      description: "Choose where to deploy this rule",
      action: (
        <button 
          onClick={() => navigate("/siem")} 
          className="bg-cyber-primary hover:bg-cyber-primary/90 rounded px-4 py-2 text-white text-sm"
        >
          Go to SIEM Integration
        </button>
      ),
    });
  };

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
            <Card className="lg:col-span-1 cyber-card">
              <CardHeader className="pb-2">
                <CardTitle>Rule Repository</CardTitle>
                <CardDescription>Generated detection rules</CardDescription>
              </CardHeader>
              <CardContent>
                <RuleList 
                  rules={generatedRules}
                  selectedRule={selectedRule}
                  onSelectRule={handleSelectRule}
                />
              </CardContent>
            </Card>
            
            <div className="lg:col-span-2">
              <RuleEditor selectedRule={selectedRule} />
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
              <VulnerabilityList 
                vulnerabilities={vulnerabilities}
                rules={generatedRules}
                onSelectRule={handleSelectRule}
                setActiveTab={setActiveTab}
                onDeployRule={handleDeployRuleToSiem}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SigmaGenerator;
