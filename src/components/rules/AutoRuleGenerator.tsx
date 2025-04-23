
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Wand2 } from "lucide-react";
import { useRuleGenerator } from "./hooks/useRuleGenerator";
import GeneratorOptions from "./generator/GeneratorOptions";
import GeneratorConfiguration from "./generator/GeneratorConfiguration";
import GenerationStats from "./generator/GenerationStats";
import GeneratedRulesDisplay from "./generator/GeneratedRulesDisplay";
import { generatorOptions } from "./generator/generatorService";

const AutoRuleGenerator = () => {
  const {
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
    techniques
  } = useRuleGenerator();
  
  const selectedGeneratorOption = generatorOptions.find(option => option.id === selectedOption);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="h-5 w-5 text-cyber-warning mr-2" />
          Automated Rule Generation
        </CardTitle>
        <CardDescription>
          Let CatchAttack's AI engine generate optimized detection rules
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!generationResults ? (
          <div className="space-y-6">
            <GeneratorOptions 
              options={generatorOptions}
              selectedOption={selectedOption}
              onSelectOption={handleSelectOption}
            />
            
            <Separator />
            
            <GeneratorConfiguration
              selectedOption={selectedOption}
              customRuleInput={customRuleInput}
              setCustomRuleInput={setCustomRuleInput}
              selectedTechniques={selectedTechniques}
              setSelectedTechniques={setSelectedTechniques}
              generateCorrelation={generateCorrelation}
              setGenerateCorrelation={setGenerateCorrelation}
              techniques={techniques}
            />
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleStartGeneration}
                className="bg-cyber-primary hover:bg-cyber-primary/90"
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Rules
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Generation Results</h3>
                <p className="text-sm text-gray-400">
                  {generationResults.rules.length} rules generated based on {selectedGeneratorOption?.name}
                </p>
              </div>
              <Badge className="bg-cyber-success">Complete</Badge>
            </div>
            
            <GenerationStats results={generationResults} />
            
            <GeneratedRulesDisplay results={generationResults} />
          </div>
        )}
      </CardContent>
      {generationResults && (
        <CardFooter className="flex justify-end gap-2 border-t border-cyber-primary/20 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setGenerationResults(null)}
          >
            Discard
          </Button>
          <Button 
            className="bg-cyber-primary hover:bg-cyber-primary/90"
            onClick={handleSaveRules}
          >
            Add Rules to Library
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AutoRuleGenerator;
