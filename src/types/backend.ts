
// Types for Adversary Emulation
export interface EmulationRequest {
  techniques: string[];  // MITRE ATT&CK technique IDs
  schedule?: {
    timestamp?: string;  // ISO timestamp for scheduled execution
    recurring?: {
      frequency: 'once' | 'daily' | 'weekly' | 'monthly';
      daysOfWeek?: number[];  // 0 = Sunday, 6 = Saturday
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
  techniqueId: string;  // MITRE ATT&CK technique ID
  rule: string;  // Actual Sigma rule in YAML format
  dateCreated: string;
  dateUpdated: string;
  deployedTo: string[];  // List of SIEM platform IDs
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;  // Log source
  isDuplicate: boolean;
  duplicateOf?: string;  // ID of the original rule if this is a duplicate
}

// Types for SIEM Integration
export interface SiemPlatform {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  lastSync: string | null;
  rulesDeployed: number;
  status: 'healthy' | 'warning' | 'error' | 'disconnected';
  credentials?: {
    apiKey?: string;
    url?: string;
    username?: string;
  };
}

export interface DeployRequest {
  ruleIds: string[];
  platformId: string;
}

export interface DeployResult {
  success: boolean;
  platformId: string;
  deployedRules: {
    ruleId: string;
    status: 'success' | 'failure';
    message?: string;
  }[];
  timestamp: string;
}

// Types for Scheduling
export interface Schedule {
  id: string;
  name: string;
  description?: string;
  emulation: EmulationRequest;
  status: 'active' | 'paused' | 'completed';
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// Database tables/collections
export type Tables = {
  emulation_results: EmulationResult;
  sigma_rules: SigmaRule;
  siem_platforms: SiemPlatform;
  deploy_results: DeployResult;
  schedules: Schedule;
  tenants: {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
  };
  users_tenants: {
    userId: string;
    tenantId: string;
    role: 'admin' | 'analyst' | 'viewer';
  }
};
