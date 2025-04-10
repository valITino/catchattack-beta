
import { toast } from "@/components/ui/use-toast";

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
const getTacticName = (tacticId: string): string => {
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

// Generate Sigma rule from detected activity
export const generateSigmaRule = (technique: MitreAttackTechnique): string => {
  // In a real implementation, this would use a template system and AI/ML
  // to generate proper Sigma rules based on the technique and observed behavior
  
  // Mock implementation to simulate the functionality
  const ruleTemplate = `title: Detecting ${technique.name}
description: Rule to detect ${technique.name} techniques (${technique.id})
id: ${generateUUID()}
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

  return ruleTemplate;
};

// Helper function to generate a UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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
