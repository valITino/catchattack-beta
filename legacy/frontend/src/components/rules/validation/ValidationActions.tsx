
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle, Loader2, Upload } from "lucide-react";
import { ValidationResult } from "../types/validation";

interface ValidationActionsProps {
  validationResult: ValidationResult | null;
  isValidating: boolean;
  ruleContent: string;
  showOptimized: boolean;
  onValidate: () => void;
  onApplyOptimizations: () => void;
}

const ValidationActions = ({ 
  validationResult, 
  isValidating, 
  ruleContent, 
  showOptimized,
  onValidate, 
  onApplyOptimizations 
}: ValidationActionsProps) => {
  return (
    <div className="flex justify-end space-x-2 pt-2">
      {validationResult && validationResult.optimizedRule && showOptimized && (
        <Button 
          onClick={onApplyOptimizations}
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
        onClick={onValidate}
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
    </div>
  );
};

export default ValidationActions;
