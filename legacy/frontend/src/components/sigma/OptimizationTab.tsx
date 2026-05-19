
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, SkipForward, Upload } from "lucide-react";

interface OptimizationTabProps {
  optimizationProgress: number;
  optimizationResults: any;
  onSkipOptimization: () => void;
  onBackToTargets: () => void;
  onDeploy: () => void;
  isDeploying: boolean;
}

const OptimizationTab = ({
  optimizationProgress,
  optimizationResults,
  onSkipOptimization,
  onBackToTargets,
  onDeploy,
  isDeploying
}: OptimizationTabProps) => {
  if (optimizationResults) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Optimization Results</h3>
          <Badge className={optimizationResults.overallScore > 80 
            ? "bg-cyber-success text-background" 
            : optimizationResults.overallScore > 50 
              ? "bg-cyber-warning text-background" 
              : "bg-cyber-danger text-background"}>
            {optimizationResults.overallScore}% Compatible
          </Badge>
        </div>
        
        <div className="space-y-3">
          {Object.entries(optimizationResults.targets).map(([target, result]: [string, any]) => (
            <div key={target} className="border border-cyber-primary/20 rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium capitalize">{target}</div>
                <Badge 
                  variant="outline" 
                  className={result.validation.valid 
                    ? "border-cyber-success text-cyber-success" 
                    : "border-cyber-danger text-cyber-danger"}
                >
                  {result.validation.valid ? "Valid" : "Needs Adjustment"}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">False positives: </span>
                  <span>{result.validation.falsePositives}</span>
                </div>
                <div>
                  <span className="text-gray-400">Potential impact: </span>
                  <span className="capitalize">{result.validation.potentialImpact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <DialogFooter className="sm:justify-end pt-2">
          <Button 
            onClick={onBackToTargets} 
            variant="outline"
          >
            Back
          </Button>
          <Button 
            onClick={onDeploy}
            disabled={isDeploying}
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Deploy
              </>
            )}
          </Button>
        </DialogFooter>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Optimizing rule for selected platforms...</span>
          <span>{optimizationProgress}%</span>
        </div>
        <Progress value={optimizationProgress} />
      </div>
      
      {optimizationProgress < 100 && (
        <div className="flex justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onSkipOptimization}
          >
            <SkipForward className="h-4 w-4 mr-1" />
            Skip
          </Button>
          <p className="text-xs text-gray-400 italic">
            This may take a few moments...
          </p>
        </div>
      )}
    </div>
  );
};

export default OptimizationTab;
