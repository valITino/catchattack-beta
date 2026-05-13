
// Core MITRE ATT&CK types
export interface MitreAttackTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  detection?: string;
  platforms?: string[];
  dataSources?: string[];
  mitigation?: string;
  references?: string[];
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
