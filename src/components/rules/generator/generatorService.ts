
import { GenerationResult } from "../types/generator";

export const simulateGenerationResults = (generationType: string): GenerationResult => {
  const baseResults = {
    statistics: {
      techniquesCovered: Math.floor(Math.random() * 10) + 5,
      totalTechniques: 15,
      tacticsCovered: Math.floor(Math.random() * 4) + 3,
      totalTactics: 8,
      estimatedEfficacy: Math.floor(Math.random() * 20) + 75
    },
    analysis: [
      { type: "info" as const, message: "High coverage achieved for execution techniques" },
      { type: "warning" as const, message: "Limited coverage for lateral movement tactics" },
      { type: "info" as const, message: "Correlation rules successfully generated for multi-stage attacks" }
    ],
    rules: []
  };
  
  if (generationType === "behavior-analysis") {
    baseResults.rules = [
      {
        id: "auto-rule-001",
        title: "PowerShell Encoded Command Execution",
        description: "Detects PowerShell execution with encoded commands",
        severity: "high",
        technique: "T1059.001"
      },
      {
        id: "auto-rule-002",
        title: "Suspicious Registry Modification",
        description: "Detects modifications to sensitive registry keys",
        severity: "medium",
        technique: "T1112"
      },
      {
        id: "auto-rule-003",
        title: "Credential Dumping via LSASS Access",
        description: "Detects access to LSASS memory for credential extraction",
        severity: "critical",
        technique: "T1003.001"
      }
    ];
  } else if (generationType === "technique-coverage") {
    baseResults.rules = [
      {
        id: "auto-rule-004",
        title: "Remote Service Creation",
        description: "Detects remote service creation for lateral movement",
        severity: "high",
        technique: "T1021.002"
      },
      {
        id: "auto-rule-005",
        title: "Scheduled Task Creation",
        description: "Detects scheduled task creation for persistence",
        severity: "medium",
        technique: "T1053.005"
      }
    ];
  } else {
    baseResults.rules = [
      {
        id: "auto-rule-006",
        title: "Suspicious Authentication Patterns",
        description: "Detects unusual authentication patterns across multiple systems",
        severity: "high",
        technique: "T1078"
      },
      {
        id: "auto-rule-007",
        title: "Unusual Process Network Connections",
        description: "Detects processes making unusual network connections",
        severity: "medium",
        technique: "T1071"
      },
      {
        id: "auto-rule-008",
        title: "Log Clearing Activity",
        description: "Detects attempts to clear log files to cover tracks",
        severity: "high",
        technique: "T1070.001"
      },
      {
        id: "auto-rule-009",
        title: "Unusual Service Installations",
        description: "Detects installation of uncommon services",
        severity: "medium",
        technique: "T1543.003"
      }
    ];
  }
  
  return baseResults as GenerationResult;
};

export const generatorOptions = [
  {
    id: "behavior-analysis",
    name: "Behavior Analysis",
    description: "Analyze emulated attack behaviors to create optimized rules",
    model: "Advanced Behavior Processor",
    category: "behavior"
  },
  {
    id: "technique-coverage",
    name: "Technique Coverage",
    description: "Generate rules for gaps in MITRE ATT&CK coverage",
    model: "MITRE ATT&CK Mapper",
    category: "technique"
  },
  {
    id: "log-pattern",
    name: "Log Pattern Mining",
    description: "Auto-discover patterns from historical log data",
    model: "Pattern Recognition System",
    category: "log"
  }
];

export const sampleTechniques = [
  "T1059.001 - PowerShell",
  "T1027 - Obfuscated Files or Information",
  "T1036 - Masquerading",
  "T1105 - Ingress Tool Transfer",
  "T1021 - Remote Services"
];
