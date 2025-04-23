
export interface TTP {
  id: string;
  name: string;
  tactic: string;
  description: string;
}

export interface AdversaryTemplate {
  id: string;
  name: string;
  description: string;
  techniques: string[];
  complexity: string;
}

export interface TargetSystem {
  id: string;
  name: string;
  description: string;
}

// Mock data for predefined TTPs (Tactics, Techniques, Procedures)
export const ttps: TTP[] = [
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

// Mock data for adversary templates
export const adversaryTemplates: AdversaryTemplate[] = [
  { 
    id: "APT29", 
    name: "APT29 (Cozy Bear)", 
    description: "Russian state-sponsored threat actor known for sophisticated attacks.",
    techniques: ["T1078", "T1566", "T1027", "T1071"],
    complexity: "High"
  },
  { 
    id: "APT41", 
    name: "APT41", 
    description: "Chinese state-sponsored espionage group that also conducts financially motivated operations.",
    techniques: ["T1059", "T1053", "T1016", "T1049"],
    complexity: "High"
  },
  { 
    id: "RANSOMWARE", 
    name: "Generic Ransomware", 
    description: "Common ransomware attack pattern including initial access, lateral movement, and encryption.",
    techniques: ["T1566", "T1110", "T1059"],
    complexity: "Medium"
  },
];

// Available systems for emulation
export const targetSystems: TargetSystem[] = [
  { id: "windows-server", name: "Windows Server", description: "Windows Server 2019" },
  { id: "linux-ubuntu", name: "Linux Server", description: "Ubuntu 20.04 LTS" },
  { id: "windows-client", name: "Windows Client", description: "Windows 10 Enterprise" },
  { id: "api-gateway", name: "API Gateway", description: "REST API Gateway" },
  { id: "web-server", name: "Web Server", description: "Nginx/Apache" },
  { id: "database", name: "Database", description: "PostgreSQL/MySQL" },
];

