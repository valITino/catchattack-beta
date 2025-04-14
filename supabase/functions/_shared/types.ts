
/**
 * Shared types for Supabase Edge Functions
 */

// Types for Adversary Emulation
export interface EmulationRequest {
  techniques: string[];
  schedule?: {
    timestamp?: string;
    recurring?: {
      frequency: 'once' | 'daily' | 'weekly' | 'monthly';
      daysOfWeek?: number[];
    }
  };
  environment?: {
    target: string;
    osType: 'windows' | 'linux' | 'macos';
  };
}

export interface EmulationResult {
  id: string;
  status: 'success' | 'failure' | 'pending' | 'in-progress';
  techniques: string[];
  timestamp: string;
  logs: EmulationLog[];
  telemetry?: Record<string, any>;
}

export interface EmulationLog {
  techniqueId: string;
  timestamp: string;
  status: 'success' | 'failure';
  message: string;
  details?: Record<string, any>;
}

// Types for Sigma Rules
export interface SigmaRule {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'draft' | 'deprecated';
  author: string;
  techniqueId: string;
  rule: string;
  dateCreated: string;
  dateUpdated: string;
  deployedTo: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  aiGenerated?: boolean;
  aiConfidence?: number;
}

// Types for AI Analysis
export interface AiAnalysisRequest {
  logs: EmulationLog[];
  tenantId: string;
}

export interface AiRuleGenerationRequest {
  emulationResult: EmulationResult;
  tenantId: string;
}

export interface AiRuleSimilarityRequest {
  ruleContent: string;
  tenantId: string;
}

export interface AiPredictiveSchedulingRequest {
  techniqueIds: string[];
  tenantId: string;
}

// Enhanced types for MITRE ATT&CK framework
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

export interface MitreAttackResponse {
  techniques: MitreAttackTechnique[];
  timestamp: string;
  source: string;
  version: string;
  cached?: boolean;
}
