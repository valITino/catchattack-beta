
import { ValidationResult } from "../types/validation";

// Mock validation steps
export const MOCK_VALIDATION_STEPS = [
  "Parsing rule syntax...",
  "Checking for common pitfalls...",
  "Analyzing detection logic...",
  "Validating against MITRE ATT&CK...",
  "Checking for potential false positives...",
  "Optimizing rule performance...",
  "Finalizing validation..."
];

export const generateMockValidationResult = (ruleContent: string): ValidationResult => {
  // In a real implementation, this would use NLP/AI to analyze the rule
  
  // For demo purposes, generate random results
  const hasError = Math.random() < 0.3;
  const issueCount = Math.floor(Math.random() * 5) + (hasError ? 1 : 0);
  
  const issues: Issue[] = [];
  
  // Sample issue types to randomly generate
  const possibleIssues = [
    {
      type: "error" as const,
      message: "Missing required field 'detection.condition'",
      severity: "high" as const,
      fix: "Add a condition field under the detection section"
    },
    {
      type: "warning" as const,
      message: "Rule may generate false positives",
      severity: "medium" as const,
      fix: "Consider adding additional filter conditions"
    },
    {
      type: "warning" as const,
      message: "Non-standard field name used",
      severity: "low" as const,
      fix: "Replace with standard field name according to Sigma specification"
    },
    {
      type: "info" as const,
      message: "Consider adding additional context to description",
      severity: "low" as const
    },
    {
      type: "error" as const,
      message: "Invalid regex pattern",
      severity: "high" as const,
      fix: "Fix regex syntax error"
    },
    {
      type: "warning" as const,
      message: "MITRE technique ID format is incorrect",
      severity: "medium" as const,
      fix: "Use standard format like T1234.001"
    },
    {
      type: "info" as const,
      message: "Rule could benefit from additional references",
      severity: "low" as const
    }
  ];
  
  // Generate some random issues
  for (let i = 0; i < issueCount; i++) {
    // Create a new issue object and cast it to Issue type
    const randomIssueTemplate = possibleIssues[Math.floor(Math.random() * possibleIssues.length)];
    const randomIssue: Issue = { ...randomIssueTemplate };
    
    // Add the line property here
    randomIssue.line = Math.floor(Math.random() * 15) + 1;
    issues.push(randomIssue);
  }
  
  // Calculate a score based on issues
  let score = 100;
  issues.forEach(issue => {
    if (issue.type === "error") score -= 15;
    else if (issue.type === "warning") score -= 5;
    else score -= 2;
  });
  
  score = Math.max(0, Math.min(100, score));
  
  // Generate an "optimized" rule (in a real implementation this would be AI-generated)
  const optimizedRule = score < 100 
    ? ruleContent + "\n\n# AI-Suggested Improvements:\n# - Added additional filters to reduce false positives\n# - Standardized field names\n# - Added references to relevant threat reports"
    : undefined;
  
  return {
    valid: issues.filter(i => i.type === "error").length === 0,
    score,
    issues,
    optimizedRule
  };
};

export interface Issue {
  type: "error" | "warning" | "info";
  message: string;
  line?: number;
  severity: "high" | "medium" | "low";
  fix?: string;
}
