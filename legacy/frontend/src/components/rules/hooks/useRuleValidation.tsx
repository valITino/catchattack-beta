
import { useState } from "react";
import { ValidationResult } from "../types/validation";
import { MOCK_VALIDATION_STEPS, generateMockValidationResult } from "../services/validationService";
import { toast } from "@/components/ui/use-toast";

export const useRuleValidation = (initialRule?: string) => {
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

  const toggleOptimized = () => {
    setShowOptimized(!showOptimized);
  };

  return {
    ruleContent,
    setRuleContent,
    isValidating,
    validationProgress,
    currentStep,
    validationResult,
    showOptimized,
    handleValidate,
    handleApplyOptimizations,
    toggleOptimized
  };
};
