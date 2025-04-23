
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface System {
  id: string;
  name: string;
  description: string;
}

interface TargetSystemsProps {
  systems: System[];
  selectedSystems: string[];
  onSystemToggle: (systemId: string) => void;
}

export function TargetSystems({ systems, selectedSystems, onSystemToggle }: TargetSystemsProps) {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle>Target Systems</CardTitle>
        <CardDescription>Select systems to run the emulation against</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {systems.map(system => (
            <div
              key={system.id}
              className="flex items-center space-x-2"
            >
              <Checkbox 
                id={system.id}
                checked={selectedSystems.includes(system.id)}
                onCheckedChange={() => onSystemToggle(system.id)}
                className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
              />
              <div className="grid gap-1.5">
                <Label 
                  htmlFor={system.id}
                  className="font-medium cursor-pointer"
                >
                  {system.name}
                </Label>
                <p className="text-xs text-gray-400">
                  {system.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
