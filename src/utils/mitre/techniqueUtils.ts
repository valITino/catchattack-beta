
import { MitreAttackTechnique } from "./types";
import { aiService } from "@/services/aiService";

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
export const generateLocalMitreTechniques = (): MitreAttackTechnique[] => {
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
