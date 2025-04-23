import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Dices, Settings2, Clock } from "lucide-react";
import TacticsList from "./random-generator/TacticsList";
import DeployTargetsSelector from "./random-generator/DeployTargetsSelector";
import FrequencySelector from "./random-generator/FrequencySelector";
import ComplexitySelector from "./random-generator/ComplexitySelector";
import TechniqueCountSlider from "./random-generator/TechniqueCountSlider";
import ImmediateExecution from "./random-generator/ImmediateExecution";
import GeneratorHeader from "./random-generator/GeneratorHeader";

interface RandomEmulationGeneratorProps {
  onGenerate: (config: EmulationConfig) => void;
  automated?: boolean;
}

export interface EmulationConfig {
  complexity: string;
  techniqueCount: number;
  tactics: string[];
  immediate: boolean;
  automated?: boolean;
  frequency?: string;
  deployTargets?: string[];
}

const RandomEmulationGenerator = ({ onGenerate, automated = false }: RandomEmulationGeneratorProps) => {
  const [complexity, setComplexity] = useState<string>("medium");
  const [techniqueCount, setTechniqueCount] = useState<number>(5);
  const [selectedTactics, setSelectedTactics] = useState<string[]>(
    ["TA0001", "TA0002", "TA0003", "TA0004", "TA0005"]
  );
  const [immediate, setImmediate] = useState<boolean>(true);
  const [isAutomated, setIsAutomated] = useState<boolean>(automated);
  const [frequency, setFrequency] = useState<string>("daily");
  const [deployTargets, setDeployTargets] = useState<string[]>(["elastic"]);

  const toggleTactic = (tacticId: string) => {
    if (selectedTactics.includes(tacticId)) {
      setSelectedTactics(selectedTactics.filter(id => id !== tacticId));
    } else {
      setSelectedTactics([...selectedTactics, tacticId]);
    }
  };

  const toggleDeployTarget = (target: string) => {
    if (deployTargets.includes(target)) {
      setDeployTargets(deployTargets.filter(t => t !== target));
    } else {
      setDeployTargets([...deployTargets, target]);
    }
  };

  const handleGenerate = () => {
    if (selectedTactics.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one tactic",
        variant: "destructive",
      });
      return;
    }

    const config: EmulationConfig = {
      complexity,
      techniqueCount,
      tactics: selectedTactics,
      immediate,
      automated: isAutomated,
      frequency: isAutomated ? frequency : undefined,
      deployTargets: isAutomated ? deployTargets : undefined
    };

    onGenerate(config);
    
    toast({
      title: isAutomated ? "Automated Emulation Pipeline Created" : "Random Emulation Generated",
      description: isAutomated 
        ? `${techniqueCount} techniques will run ${frequency} across ${selectedTactics.length} tactics` 
        : `${techniqueCount} techniques selected across ${selectedTactics.length} tactics with ${complexity} complexity`,
    });
  };

  return (
    <Card className="cyber-card">
      <GeneratorHeader automated={automated} />
      <CardContent className="space-y-4">
        <ComplexitySelector 
          complexity={complexity} 
          onComplexityChange={setComplexity} 
        />
        
        <TechniqueCountSlider 
          techniqueCount={techniqueCount}
          onTechniqueCountChange={setTechniqueCount}
        />

        <div className="space-y-2">
          <Label>MITRE Tactics</Label>
          <TacticsList 
            selectedTactics={selectedTactics} 
            onTacticToggle={toggleTactic} 
          />
        </div>
        
        {automated && (
          <>
            <div className="space-y-2 pt-2">
              <Label>Execution Frequency</Label>
              <FrequencySelector 
                frequency={frequency} 
                onFrequencyChange={setFrequency} 
              />
            </div>
            
            <div className="space-y-2 pt-2">
              <Label>Deploy Rules To</Label>
              <DeployTargetsSelector 
                deployTargets={deployTargets}
                onDeployTargetToggle={toggleDeployTarget}
              />
            </div>
          </>
        )}

        {!automated && (
          <ImmediateExecution 
            immediate={immediate}
            onImmediateChange={setImmediate}
          />
        )}

        <Button 
          onClick={handleGenerate} 
          className="w-full mt-4 bg-cyber-primary hover:bg-cyber-primary/90"
        >
          {automated ? (
            <>
              <Clock className="mr-2 h-4 w-4" /> Create Automated Pipeline
            </>
          ) : (
            <>
              <Dices className="mr-2 h-4 w-4" /> Generate Random Emulation
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RandomEmulationGenerator;
