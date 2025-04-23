
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { Dices, Settings2, Clock } from "lucide-react";
import TacticsList from "./random-generator/TacticsList";
import DeployTargetsSelector from "./random-generator/DeployTargetsSelector";
import FrequencySelector from "./random-generator/FrequencySelector";

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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {automated ? (
            <Settings2 className="h-5 w-5 text-cyber-primary" />
          ) : (
            <Dices className="h-5 w-5 text-cyber-primary" />
          )}
          {automated ? "Automated Emulation Pipeline" : "Random Emulation Generator"}
        </CardTitle>
        <CardDescription>
          {automated 
            ? "Configure automated emulation pipelines with CI/CD integration"
            : "Generate random attack patterns based on MITRE ATT&CK"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="complexity">Complexity</Label>
          <Select
            value={complexity}
            onValueChange={setComplexity}
          >
            <SelectTrigger id="complexity" className="bg-cyber-darker border-cyber-primary/20">
              <SelectValue placeholder="Select complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low - Basic TTPs</SelectItem>
              <SelectItem value="medium">Medium - Standard TTPs</SelectItem>
              <SelectItem value="high">High - Advanced TTPs</SelectItem>
              <SelectItem value="apts">APT - Nation State Level</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="technique-count">Number of Techniques</Label>
              <span className="text-sm font-medium">{techniqueCount}</span>
            </div>
            <Slider 
              id="technique-count"
              min={1} 
              max={15} 
              step={1} 
              value={[techniqueCount]} 
              onValueChange={(value) => setTechniqueCount(value[0])}
              className="data-[state=checked]:bg-cyber-primary"
            />
          </div>
        </div>

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
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="immediate"
              checked={immediate}
              onCheckedChange={(checked) => setImmediate(checked as boolean)}
              className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
            />
            <Label htmlFor="immediate" className="cursor-pointer">
              Execute immediately after generation
            </Label>
          </div>
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
