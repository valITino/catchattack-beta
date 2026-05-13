
export interface GeneratorOption {
  id: string;
  name: string;
  description: string;
  model?: string;
  category: "behavior" | "technique" | "log";
}

export interface GenerationResult {
  statistics: {
    techniquesCovered: number;
    totalTechniques: number;
    tacticsCovered: number;
    totalTactics: number;
    estimatedEfficacy: number;
  };
  analysis: {
    type: "info" | "warning";
    message: string;
  }[];
  rules: GeneratedRule[];
}

export interface GeneratedRule {
  id: string;
  title: string;
  description: string;
  severity: string;
  technique: string;
  atomicTestReferences?: {
    id: string;
    name: string;
  }[];
  dataSourceRecommendations?: string[];
  efficacyNote?: string;
}

// Interfaces for Atomic Red Team integration
export interface AtomicTest {
  id: string;
  name: string;
  description: string;
  supportedPlatforms: string[];
  executor: {
    name: string;
    command: string;
    elevation_required: boolean;
  };
  input_arguments?: Record<string, {
    description: string;
    type: string;
    default: string;
  }>;
}

export interface SigmaRuleTemplate {
  title: string;
  id: string;
  description: string;
  status: string;
  logsource: {
    product: string;
    service?: string;
    category?: string;
  };
  detection: Record<string, any>;
  fields?: string[];
  falsepositives?: string[];
  level: string;
  tags?: string[];
}

export interface TechniqueReference {
  id: string;
  name: string;
  tactic: string;
}
