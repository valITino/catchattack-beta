
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface RuleTextareaProps {
  ruleContent: string;
  onRuleChange: (value: string) => void;
  validationResult: any | null;
  showOptimized: boolean;
  onToggleOptimized: () => void;
  isValidating: boolean;
}

const RuleTextarea = ({ 
  ruleContent, 
  onRuleChange, 
  validationResult, 
  showOptimized, 
  onToggleOptimized, 
  isValidating 
}: RuleTextareaProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="rule-content">Sigma Rule</Label>
        {validationResult && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onToggleOptimized}
          >
            {showOptimized ? "Show Original" : "Show Optimized"}
          </Button>
        )}
      </div>
      <Textarea
        id="rule-content"
        value={showOptimized && validationResult?.optimizedRule ? validationResult.optimizedRule : ruleContent}
        onChange={(e) => onRuleChange(e.target.value)}
        rows={15}
        className="font-mono text-sm bg-cyber-darker border-cyber-primary/20"
        placeholder="Enter your Sigma rule here..."
        disabled={isValidating || showOptimized}
      />
    </div>
  );
};

export default RuleTextarea;
