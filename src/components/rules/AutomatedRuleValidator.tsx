
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ClipboardCheck, AlertTriangle, CheckCircle, X, Upload, Brain } from "lucide-react";

interface AutomatedRuleValidatorProps {
  onValidationComplete?: (result: ValidationResult) => void;
  initialRule?: string;
}

interface ValidationResult {
  valid: boolean;
  score: number;
  issues: Issue[];
  optimizedRule?: string;
}

interface Issue {
  type: "error" | "warning" | "info";
  message: string;
  line?: number; // Making line optional to match usage in the code
  severity: "high" | "medium" | "low";
  fix?: string;
}

const MOCK_VALIDATION_STEPS = [
  "Parsing rule syntax...",
  "Checking for common pitfalls...",
  "Analyzing detection logic...",
  "Validating against MITRE ATT&CK...",
  "Checking for potential false positives...",
  "Optimizing rule performance...",
  "Finalizing validation..."
];

const AutomatedRuleValidator = ({ onValidationComplete, initialRule }: AutomatedRuleValidatorProps) => {
  const [ruleContent, setRuleContent] = useState<string>(initialRule || "");
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showOptimized, setShowOptimized] = useState<boolean>(false);

  const handleValidate = () => {
    if (!ruleContent.trim()) {
      toast({
        title: "Empty Rule",
        description: "Please enter a Sigma rule to validate",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationProgress(0);
    setCurrentStep(MOCK_VALIDATION_STEPS[0]);
    setValidationResult(null);

    // Simulate validation process
    let step = 0;
    const totalSteps = MOCK_VALIDATION_STEPS.length;
    
    const intervalId = setInterval(() => {
      if (step < totalSteps) {
        const progress = Math.round(((step + 1) / totalSteps) * 100);
        setValidationProgress(progress);
        setCurrentStep(MOCK_VALIDATION_STEPS[step]);
        step++;
      } else {
        clearInterval(intervalId);
        
        // Generate mock validation result
        const result = generateMockValidationResult(ruleContent);
        setValidationResult(result);
        setIsValidating(false);
        
        if (onValidationComplete) {
          onValidationComplete(result);
        }
        
        const variant = result.valid ? "default" : "destructive";
        toast({
          title: result.valid ? "Validation Successful" : "Validation Failed",
          description: result.valid 
            ? `Rule passed validation with score: ${result.score}%` 
            : `Rule has ${result.issues.filter(i => i.type === "error").length} errors to fix`,
          variant,
        });
      }
    }, 800);

    return () => clearInterval(intervalId);
  };
  
  const handleApplyOptimizations = () => {
    if (validationResult?.optimizedRule) {
      setRuleContent(validationResult.optimizedRule);
      setShowOptimized(false);
      toast({
        title: "Optimizations Applied",
        description: "The rule has been updated with AI-suggested optimizations",
      });
    }
  };
  
  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-cyber-danger text-white";
      case "medium":
        return "bg-cyber-warning text-black";
      case "low":
        return "bg-cyber-info text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 text-cyber-primary mr-2" />
          AI Rule Validator
        </CardTitle>
        <CardDescription>
          Use CatchAttack's AI to validate and optimize your Sigma rules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="rule-content">Sigma Rule</Label>
            {validationResult && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowOptimized(!showOptimized)}
              >
                {showOptimized ? "Show Original" : "Show Optimized"}
              </Button>
            )}
          </div>
          <Textarea
            id="rule-content"
            value={showOptimized && validationResult?.optimizedRule ? validationResult.optimizedRule : ruleContent}
            onChange={(e) => setRuleContent(e.target.value)}
            rows={15}
            className="font-mono text-sm bg-cyber-darker border-cyber-primary/20"
            placeholder="Enter your Sigma rule here..."
            disabled={isValidating || showOptimized}
          />
        </div>
        
        {isValidating && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{validationProgress}%</span>
              </div>
              <Progress value={validationProgress} />
            </div>
            
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-cyber-primary" />
            </div>
          </div>
        )}
        
        {validationResult && !isValidating && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {validationResult.valid ? (
                  <CheckCircle className="h-5 w-5 text-cyber-success mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-cyber-danger mr-2" />
                )}
                <span className="font-medium">
                  {validationResult.valid ? "Rule Valid" : "Rule Needs Fixes"}
                </span>
              </div>
              
              <Badge className={
                validationResult.score > 80 
                  ? "bg-cyber-success text-white" 
                  : validationResult.score > 50 
                    ? "bg-cyber-warning text-black" 
                    : "bg-cyber-danger text-white"
              }>
                Score: {validationResult.score}/100
              </Badge>
            </div>
            
            {validationResult.issues.length > 0 && (
              <div>
                <Label className="text-sm mb-2 block">Issues Found</Label>
                <ScrollArea className="h-[200px] border border-cyber-primary/20 rounded-md">
                  <div className="p-3 space-y-2">
                    {validationResult.issues.map((issue, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded-md border ${
                          issue.type === "error" 
                            ? "border-cyber-danger/30 bg-cyber-danger/5" 
                            : issue.type === "warning" 
                              ? "border-cyber-warning/30 bg-cyber-warning/5"
                              : "border-cyber-info/30 bg-cyber-info/5"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start">
                            {issue.type === "error" ? (
                              <X className="h-4 w-4 text-cyber-danger mt-0.5 mr-2" />
                            ) : issue.type === "warning" ? (
                              <AlertTriangle className="h-4 w-4 text-cyber-warning mt-0.5 mr-2" />
                            ) : (
                              <ClipboardCheck className="h-4 w-4 text-cyber-info mt-0.5 mr-2" />
                            )}
                            <div>
                              <p className="text-sm">{issue.message}</p>
                              {issue.line && (
                                <p className="text-xs text-gray-400 mt-1">Line: {issue.line}</p>
                              )}
                              {issue.fix && (
                                <p className="text-xs mt-1 italic">{issue.fix}</p>
                              )}
                            </div>
                          </div>
                          <Badge className={getSeverityBadgeColor(issue.severity)} variant="outline">
                            {issue.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pt-2">
        {validationResult && validationResult.optimizedRule && showOptimized && (
          <Button 
            onClick={handleApplyOptimizations}
            className="bg-cyber-primary hover:bg-cyber-primary/90 mr-auto"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Apply Optimizations
          </Button>
        )}
        
        {validationResult && validationResult.valid && (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Deploy Rule
          </Button>
        )}
        
        <Button 
          onClick={handleValidate}
          disabled={isValidating || !ruleContent.trim()}
          className={validationResult ? "bg-cyber-success hover:bg-cyber-success/90" : ""}
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : validationResult ? (
            <CheckCircle className="h-4 w-4 mr-2" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          {isValidating ? "Validating..." : validationResult ? "Validate Again" : "Validate Rule"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const generateMockValidationResult = (ruleContent: string): ValidationResult => {
  // In a real implementation, this would use NLP/AI to analyze the rule
  
  // For demo purposes, generate random results
  const hasError = Math.random() < 0.3;
  const issueCount = Math.floor(Math.random() * 5) + (hasError ? 1 : 0);
  
  const issues: Issue[] = [];
  
  // Sample issue types to randomly generate
  const possibleIssues = [
    {
      type: "error",
      message: "Missing required field 'detection.condition'",
      severity: "high",
      fix: "Add a condition field under the detection section"
    },
    {
      type: "warning",
      message: "Rule may generate false positives",
      severity: "medium",
      fix: "Consider adding additional filter conditions"
    },
    {
      type: "warning",
      message: "Non-standard field name used",
      severity: "low",
      fix: "Replace with standard field name according to Sigma specification"
    },
    {
      type: "info",
      message: "Consider adding additional context to description",
      severity: "low"
    },
    {
      type: "error",
      message: "Invalid regex pattern",
      severity: "high",
      fix: "Fix regex syntax error"
    },
    {
      type: "warning",
      message: "MITRE technique ID format is incorrect",
      severity: "medium",
      fix: "Use standard format like T1234.001"
    },
    {
      type: "info",
      message: "Rule could benefit from additional references",
      severity: "low"
    }
  ];
  
  // Generate some random issues
  for (let i = 0; i < issueCount; i++) {
    const randomIssue = { ...possibleIssues[Math.floor(Math.random() * possibleIssues.length)] };
    // Add the line property here
    randomIssue.line = Math.floor(Math.random() * 15) + 1;
    issues.push(randomIssue as Issue);
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

export default AutomatedRuleValidator;
