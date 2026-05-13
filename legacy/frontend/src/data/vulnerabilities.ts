
export interface Vulnerability {
  id: string;
  name: string;
  description: string;
  severity: string;
  emulation: string;
  tactic: string;
  technique: string;
  hasRule: boolean;
  ruleId?: string;
}

export const vulnerabilities: Vulnerability[] = [
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
