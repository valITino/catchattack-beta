
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
  rules: {
    id: string;
    title: string;
    description: string;
    severity: string;
    technique: string;
  }[];
}
