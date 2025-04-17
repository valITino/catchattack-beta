
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useRuleValidation } from "./hooks/useRuleValidation";
import RuleTextarea from "./validation/RuleTextarea";
import ValidationProgress from "./validation/ValidationProgress";
import ValidationResultDisplay from "./validation/ValidationResult";
import ValidationActions from "./validation/ValidationActions";
import { ValidationResult } from "./types/validation";

interface AutomatedRuleValidatorProps {
  onValidationComplete?: (result: ValidationResult) => void;
  initialRule?: string;
}

const AutomatedRuleValidator = ({ onValidationComplete, initialRule }: AutomatedRuleValidatorProps) => {
  const {
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
  } = useRuleValidation(initialRule);

  // Call the onValidationComplete callback when validation is done
  const onValidate = () => {
    const result = handleValidate();
    
    // If validation completes and there's a callback, call it with the result
    if (validationResult && onValidationComplete) {
      onValidationComplete(validationResult);
    }
    
    return result;
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
        <RuleTextarea
          ruleContent={ruleContent}
          onRuleChange={setRuleContent}
          validationResult={validationResult}
          showOptimized={showOptimized}
          onToggleOptimized={toggleOptimized}
          isValidating={isValidating}
        />
        
        <ValidationProgress
          isValidating={isValidating}
          progress={validationProgress}
          currentStep={currentStep}
        />
        
        <ValidationResultDisplay
          result={validationResult}
          isValidating={isValidating}
        />
      </CardContent>
      <CardFooter>
        <ValidationActions
          validationResult={validationResult}
          isValidating={isValidating}
          ruleContent={ruleContent}
          showOptimized={showOptimized}
          onValidate={onValidate}
          onApplyOptimizations={handleApplyOptimizations}
        />
      </CardFooter>
    </Card>
  );
};

export default AutomatedRuleValidator;
