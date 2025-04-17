
import { useState } from "react";
import { optimizeRuleForSiem, validateRuleInEnvironment } from "@/utils/siemUtils";
import { SigmaRule } from "@/utils/mitreAttackUtils";

export const useRuleOptimization = (rule: SigmaRule) => {
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [autoOptimize, setAutoOptimize] = useState(true);

  const runOptimization = async (selectedTargets: string[]) => {
    if (selectedTargets.length === 0) return;
    
    setOptimizationProgress(10);
    
    const results: any = {
      targets: {},
      overallScore: 0
    };
    
    // Process each target
    for (let i = 0; i < selectedTargets.length; i++) {
      const target = selectedTargets[i];
      setOptimizationProgress(10 + ((i / selectedTargets.length) * 50));
      
      try {
        // Run optimization
        const optimization = await optimizeRuleForSiem(rule.content, target);
        
        // Run validation
        const validation = await validateRuleInEnvironment(rule.id, target);
        
        results.targets[target] = {
          optimization,
          validation,
          optimizedContent: optimization.optimized
        };
      } catch (error) {
        console.error(`Error optimizing for ${target}:`, error);
      }
    }
    
    // Calculate overall score (0-100)
    const validTargets = Object.values(results.targets).filter((t: any) => t.validation.valid);
    results.overallScore = Math.round((validTargets.length / selectedTargets.length) * 100);
    
    setOptimizationProgress(100);
    setOptimizationResults(results);
    
    return results;
  };

  const resetOptimization = () => {
    setOptimizationProgress(0);
    setOptimizationResults(null);
  };

  return {
    optimizationProgress,
    optimizationResults,
    autoOptimize,
    setAutoOptimize,
    runOptimization,
    resetOptimization
  };
};
