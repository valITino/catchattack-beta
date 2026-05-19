
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmulationConfig } from "@/components/emulation/RandomEmulationGenerator";

interface RandomEmulationResultsProps {
  config: EmulationConfig | null;
}

export function RandomEmulationResults({ config }: RandomEmulationResultsProps) {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle>Generated Configuration</CardTitle>
        <CardDescription>Details of your randomly generated attack emulation</CardDescription>
      </CardHeader>
      <CardContent>
        {config ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Complexity</span>
                <span className="font-medium">{config.complexity}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Techniques</span>
                <span className="font-medium">{config.techniqueCount}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 p-6">
            No random emulation configuration generated
          </div>
        )}
      </CardContent>
    </Card>
  );
}
