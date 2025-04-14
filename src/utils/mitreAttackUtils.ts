
import { toast } from "@/components/ui/use-toast";
import { aiService } from "@/services/aiService";

// Interface for MITRE ATT&CK Technique
export interface MitreAttackTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
}

// Interface for MITRE ATT&CK Tactic
export interface MitreAttackTactic {
  id: string;
  name: string;
  description: string;
}

// Interface for Sigma Rules
export interface SigmaRule {
  id: string;
  title: string;
  description: string;
  technique: MitreAttackTechnique;
  status: "draft" | "experimental" | "test" | "stable" | "deprecated";
  level: "informational" | "low" | "medium" | "high" | "critical";
  author: string;
  date: string;
  modified: string;
  content: string;
  deployed?: boolean;
  deploymentTargets?: string[];
}

// Storage for existing rules to prevent duplicates
const existingRules: Record<string, SigmaRule> = {};

// Cache for MITRE ATT&CK data to avoid excessive API calls
let mitreCache: {
  techniques: MitreAttackTechnique[];
  lastUpdated: number;
} | null = null;

// Get MITRE ATT&CK techniques from API or cache
export const getMitreTechniques = async (): Promise<MitreAttackTechnique[]> => {
  // Check cache validity (cache expires after 1 hour)
  const isCacheValid = mitreCache && 
                      (Date.now() - mitreCache.lastUpdated < 3600000);
                      
  if (isCacheValid) {
    return mitreCache.techniques;
  }
  
  try {
    // Fetch from AI service which connects to MITRE API
    const result = await aiService.getMitreTechniques();
    
    // Update cache
    mitreCache = {
      techniques: result.techniques,
      lastUpdated: Date.now()
    };
    
    return result.techniques;
  } catch (error) {
    console.error('Error fetching MITRE techniques:', error);
    
    // Return local fallbacks if API fails
    return generateLocalMitreTechniques();
  }
};

// Fallback to generate local MITRE techniques if API fails
const generateLocalMitreTechniques = (): MitreAttackTechnique[] => {
  // Simplified version of MITRE ATT&CK for fallback
  return [
    { id: "T1078", name: "Valid Accounts", tactic: "Initial Access", description: "Adversaries may obtain and abuse credentials of existing accounts." },
    { id: "T1566", name: "Phishing", tactic: "Initial Access", description: "Adversaries may send phishing messages to gain access to victim systems." },
    { id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution", description: "Adversaries may abuse command and script interpreters to execute commands." },
    { id: "T1053", name: "Scheduled Task/Job", tactic: "Execution", description: "Adversaries may abuse task scheduling functionality to facilitate execution." },
    { id: "T1027", name: "Obfuscated Files or Information", tactic: "Defense Evasion", description: "Adversaries may attempt to make an executable or file difficult to discover or analyze." },
    { id: "T1110", name: "Brute Force", tactic: "Credential Access", description: "Adversaries may use brute force techniques to gain access to accounts." },
    { id: "T1016", name: "System Network Configuration Discovery", tactic: "Discovery", description: "Adversaries may look for details about the network configuration of systems." },
    { id: "T1049", name: "System Network Connections Discovery", tactic: "Discovery", description: "Adversaries may attempt to get a listing of network connections." },
    { id: "T1071", name: "Application Layer Protocol", tactic: "Command and Control", description: "Adversaries may use application layer protocols for communication." },
  ];
};

// Generate a random emulation based on MITRE ATT&CK tactics and techniques
export const generateRandomEmulation = (
  tactics: string[],
  techniqueCount: number,
  complexity: string
): MitreAttackTechnique[] => {
  // In a real implementation, this would fetch from a full MITRE ATT&CK database
  // or API to get real techniques based on the specified tactics
  
  // This is a mock implementation to simulate the functionality
  const techniques: MitreAttackTechnique[] = [];
  
  // Simulate fetching appropriate techniques based on the complexity level
  const complexityWeight = {
    low: 1,
    medium: 2,
    high: 3,
    apts: 4
  }[complexity] || 2;
  
  for (let i = 0; i < techniqueCount; i++) {
    // Randomly select a tactic
    const randomTacticIndex = Math.floor(Math.random() * tactics.length);
    const tacticId = tactics[randomTacticIndex];
    
    // Generate a "random" technique (mock data)
    const technique: MitreAttackTechnique = {
      id: `T${Math.floor(1000 + Math.random() * 9000)}`, // Random technique ID
      name: `${getTacticName(tacticId)} Technique ${i + 1} (C${complexityWeight})`,
      tactic: tacticId,
      description: `A ${complexity} complexity technique that targets ${getTacticName(tacticId)}`
    };
    
    techniques.push(technique);
  }
  
  return techniques;
};

// Get tactic name from ID
export const getTacticName = (tacticId: string): string => {
  const tacticMap: Record<string, string> = {
    "TA0001": "Initial Access",
    "TA0002": "Execution",
    "TA0003": "Persistence",
    "TA0004": "Privilege Escalation",
    "TA0005": "Defense Evasion",
    "TA0006": "Credential Access",
    "TA0007": "Discovery",
    "TA0008": "Lateral Movement",
    "TA0009": "Collection",
    "TA0010": "Exfiltration",
    "TA0011": "Command and Control",
    "TA0040": "Impact"
  };
  
  return tacticMap[tacticId] || tacticId;
};

// Check if a rule with similar content already exists
export const checkRuleExists = (techniqueId: string, title: string): SigmaRule | null => {
  // Check by technique ID
  const existingByTechnique = Object.values(existingRules).find(
    rule => rule.technique.id === techniqueId && 
    rule.title.toLowerCase().includes(title.toLowerCase().split(':')[0])
  );
  
  return existingByTechnique || null;
};

// Generate Sigma rule from detected activity
export const generateSigmaRule = (technique: MitreAttackTechnique): SigmaRule => {
  // Check if a similar rule already exists
  const existingRule = checkRuleExists(technique.id, `Detecting ${technique.name}`);
  
  if (existingRule) {
    toast({
      title: "Rule Already Exists",
      description: `A rule for ${technique.name} already exists with ID: ${existingRule.id}`,
      variant: "default",
    });
    return existingRule;
  }
  
  // In a real implementation, this would use a template system and AI/ML
  // to generate proper Sigma rules based on the technique and observed behavior
  
  // Generate a unique ID
  const ruleId = generateUUID();
  
  // Mock implementation to simulate the functionality
  const ruleTemplate = `title: Detecting ${technique.name}
description: Rule to detect ${technique.name} techniques (${technique.id})
id: ${ruleId}
status: experimental
author: Security Team
date: ${new Date().toISOString().split('T')[0]}
modified: ${new Date().toISOString().split('T')[0]}
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4688
    CommandLine|contains:
      - 'suspicious command'
      - 'suspicious parameter'
  condition: selection
falsepositives:
  - Legitimate administrative activity
level: medium
tags:
  - attack.${technique.tactic.toLowerCase()}
  - attack.${technique.id.toLowerCase()}`;

  // Create the rule object
  const rule: SigmaRule = {
    id: ruleId,
    title: `Detecting ${technique.name}`,
    description: `Rule to detect ${technique.name} techniques (${technique.id})`,
    technique: technique,
    status: "experimental",
    level: "medium",
    author: "Security Team",
    date: new Date().toISOString().split('T')[0],
    modified: new Date().toISOString().split('T')[0],
    content: ruleTemplate,
    deployed: false
  };
  
  // Store the rule to check for duplicates later
  existingRules[rule.id] = rule;
  
  return rule;
};

// Helper function to generate a UUID
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Deploy a rule to SIEM systems
export const deploySigmaRule = async (
  rule: SigmaRule,
  targets: string[]
): Promise<{success: boolean, deployedTo: string[], errors: {target: string, message: string}[]}> => {
  // In a real implementation, this would call an API to deploy the rule to specified SIEM systems
  console.log('Deploying rule:', rule.title, 'to targets:', targets);
  
  const result = {
    success: true,
    deployedTo: [] as string[],
    errors: [] as {target: string, message: string}[]
  };
  
  // Simulate deployment success/failure
  for (const target of targets) {
    // Simulate a random success/failure (90% success rate)
    if (Math.random() < 0.9) {
      result.deployedTo.push(target);
      console.log(`Successfully deployed to ${target}`);
      
      // Update the rule's deployment status
      rule.deployed = true;
      rule.deploymentTargets = [...(rule.deploymentTargets || []), target];
      
      // Update in storage
      existingRules[rule.id] = rule;
    } else {
      result.errors.push({
        target,
        message: `Failed to connect to ${target} deployment service`
      });
      result.success = false;
      console.error(`Failed to deploy to ${target}`);
    }
  }
  
  return result;
};

// Schedule an emulation run
export const scheduleEmulation = async (
  schedule: any, 
  emulationName: string,
  selectedTechniques: string[]
): Promise<boolean> => {
  try {
    // In a real implementation, this would call an API to schedule the emulation
    console.log('Scheduling emulation:', {
      name: emulationName,
      techniques: selectedTechniques,
      schedule
    });
    
    // Simulate success
    return true;
  } catch (error) {
    console.error('Error scheduling emulation:', error);
    toast({
      title: "Scheduling Error",
      description: "Failed to schedule the emulation",
      variant: "destructive",
    });
    return false;
  }
};

// Get all existing rules
export const getAllRules = (): SigmaRule[] => {
  return Object.values(existingRules);
};

// Get a rule by ID
export const getRuleById = (id: string): SigmaRule | null => {
  return existingRules[id] || null;
};
