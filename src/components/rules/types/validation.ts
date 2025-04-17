
export interface Issue {
  type: "error" | "warning" | "info";
  message: string;
  line?: number;
  severity: "high" | "medium" | "low";
  fix?: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  issues: Issue[];
  optimizedRule?: string;
}
