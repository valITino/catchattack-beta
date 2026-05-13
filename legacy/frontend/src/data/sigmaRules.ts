
import { SigmaRuleListItem } from "@/components/sigma/RuleList";

export const generatedRules: SigmaRuleListItem[] = [
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
