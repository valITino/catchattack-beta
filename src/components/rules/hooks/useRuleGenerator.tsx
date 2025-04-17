
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { GenerationResult } from "../types/generator";
import { simulateGenerationResults, sampleTechniques } from "../generator/generatorService";

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
    
    // Simulate AI processing
    setTimeout(() => {
      const results = simulateGenerationResults(selectedOption);
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
    handleSelectOption,
    handleStartGeneration,
    handleSaveRules,
    techniques: sampleTechniques
  };
};
