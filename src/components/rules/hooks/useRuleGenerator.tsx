
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { GenerationResult, TechniqueReference } from "../types/generator";
import { simulateGenerationResults, sampleTechniques, getAtomicTests } from "../generator/generatorService";

export const useRuleGenerator = () => {
  const [selectedOption, setSelectedOption] = useState<string>("behavior-analysis");
  const [customRuleInput, setCustomRuleInput] = useState<string>("");
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [generateCorrelation, setGenerateCorrelation] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [generationResults, setGenerationResults] = useState<GenerationResult | null>(null);
  
  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleStartGeneration = () => {
    setIsRunning(true);
    
    // Simulate AI processing with real data integration
    setTimeout(() => {
      const results = simulateGenerationResults(selectedOption);
      
      // If user selected specific techniques, filter the results
      if (selectedTechniques.length > 0) {
        results.rules = results.rules.filter(rule => 
          selectedTechniques.includes(rule.technique) || 
          selectedTechniques.some(t => rule.technique.startsWith(t + '.'))
        );
        
        // If no rules match selected techniques, add at least one
        if (results.rules.length === 0 && selectedTechniques.length > 0) {
          const technique = selectedTechniques[0];
          // Try to get real atomic test data
          const atomicTests = getAtomicTests(technique);
          
          results.rules.push({
            id: `rule-fallback`,
            title: `Detection for ${technique}`,
            description: atomicTests.length > 0 
              ? atomicTests[0].description 
              : `Detects ${technique} techniques based on common patterns`,
            severity: 'medium',
            technique: technique
          });
        }
        
        // Update statistics
        results.statistics.techniquesCovered = results.rules.length;
      }
      
      setGenerationResults(results);
      setIsRunning(false);
      
      toast({
        title: "Rule Generation Complete",
        description: `Successfully generated ${results.rules.length} detection rules`,
      });
    }, 3000);
  };

  const handleSaveRules = () => {
    toast({
      title: "Rules Saved",
      description: "All generated rules have been added to your library",
    });
    setGenerationResults(null);
  };
  
  return {
    selectedOption,
    customRuleInput,
    setCustomRuleInput,
    selectedTechniques,
    setSelectedTechniques,
    generateCorrelation, 
    setGenerateCorrelation,
    isRunning,
    generationResults,
    setGenerationResults,
    handleSelectOption,
    handleStartGeneration,
    handleSaveRules,
    techniques: sampleTechniques
  };
};
