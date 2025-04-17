
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface GeneratorConfigurationProps {
  selectedOption: string;
  customRuleInput: string;
  setCustomRuleInput: (value: string) => void;
  selectedTechniques: string[];
  setSelectedTechniques: (techniques: string[]) => void;
  generateCorrelation: boolean;
  setGenerateCorrelation: (value: boolean) => void;
  techniques: string[];
}

const GeneratorConfiguration = ({
  selectedOption,
  customRuleInput,
  setCustomRuleInput,
  selectedTechniques,
  setSelectedTechniques,
  generateCorrelation,
  setGenerateCorrelation,
  techniques,
}: GeneratorConfigurationProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Configuration</h3>
      
      <div className="space-y-3">
        {selectedOption === "technique-coverage" && (
          <div className="space-y-2">
            <Label>Target MITRE ATT&CK Techniques</Label>
            <div className="grid grid-cols-2 gap-2">
              {techniques.map(technique => (
                <div key={technique} className="flex items-center space-x-2">
                  <Checkbox 
                    id={technique} 
                    checked={selectedTechniques.includes(technique)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTechniques([...selectedTechniques, technique]);
                      } else {
                        setSelectedTechniques(selectedTechniques.filter(t => t !== technique));
                      }
                    }}
                  />
                  <Label htmlFor={technique} className="text-sm">{technique}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {selectedOption === "log-pattern" && (
          <div className="space-y-2">
            <Label>Custom Log Pattern (Optional)</Label>
            <Textarea 
              placeholder="Paste log samples or patterns to analyze..."
              value={customRuleInput}
              onChange={(e) => setCustomRuleInput(e.target.value)}
              className="h-32 bg-cyber-darker border-cyber-primary/20"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-0.5">
            <Label htmlFor="correlation">Generate Correlation Rules</Label>
            <p className="text-sm text-gray-400">
              Create advanced correlation rules that detect multi-stage attacks
            </p>
          </div>
          <Switch
            id="correlation"
            checked={generateCorrelation}
            onCheckedChange={setGenerateCorrelation}
            className="data-[state=checked]:bg-cyber-primary"
          />
        </div>
      </div>
    </div>
  );
};

export default GeneratorConfiguration;
