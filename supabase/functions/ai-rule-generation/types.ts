
// Type definitions for the AI rule generation service
export interface AtomicTest {
  id: string;
  techniqueId: string;
  name: string;
  description: string;
  supportedPlatforms: string[];
  executor: {
    name: string;
    command: string;
    elevation_required: boolean;
  };
}

export interface SigmaTemplate {
  id: string;
  techniqueId: string;
  title: string;
  description: string;
  status: string;
  yamlContent: string;
}

export interface RuleEnhancement {
  sigmaRule: string;
  description: string;
  technique: string;
  techniqueId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  atomicTestReferences?: Array<{
    id: string;
    name: string;
    commandSample: string;
  }>;
}
