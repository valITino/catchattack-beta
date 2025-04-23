
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Technique {
  id: string;
  name: string;
  tactic: string;
  description: string;
}

interface TechniquesTabProps {
  techniques: Technique[];
  selectedTechniques: string[];
  onTechniqueToggle: (techniqueId: string) => void;
}

export function TechniquesTab({ techniques, selectedTechniques, onTechniqueToggle }: TechniquesTabProps) {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle>Tactics & Techniques</CardTitle>
        <CardDescription>Select specific MITRE ATT&CK techniques to emulate</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {techniques.map(ttp => (
            <div 
              key={ttp.id}
              className="border border-cyber-primary/20 rounded-md p-3"
            >
              <div className="flex items-start mb-2">
                <Checkbox 
                  id={ttp.id} 
                  checked={selectedTechniques.includes(ttp.id)}
                  onCheckedChange={() => onTechniqueToggle(ttp.id)}
                  className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary mr-2 mt-1"
                />
                <div>
                  <Label 
                    htmlFor={ttp.id}
                    className="font-medium cursor-pointer"
                  >
                    {ttp.id}: {ttp.name}
                  </Label>
                  <Badge 
                    variant="outline" 
                    className="ml-2 bg-cyber-accent/10 border-cyber-accent text-xs"
                  >
                    {ttp.tactic}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-400 ml-6">{ttp.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
