
import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GenerationProgressProps {
  progress: number;
}

const GenerationProgress = ({ progress }: GenerationProgressProps) => {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle>Environment Generation</CardTitle>
        <CardDescription>Creating your virtualized environment based on the provided infrastructure details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-cyber-success" />
            <span className="text-sm">Analyzing infrastructure data</span>
          </div>
          {progress > 20 && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-cyber-success" />
              <span className="text-sm">Creating network topology</span>
            </div>
          )}
          {progress > 40 && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-cyber-success" />
              <span className="text-sm">Provisioning virtual machines</span>
            </div>
          )}
          {progress > 60 && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-cyber-success" />
              <span className="text-sm">Configuring security controls</span>
            </div>
          )}
          {progress > 80 && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-cyber-success" />
              <span className="text-sm">Preparing data sources</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GenerationProgress;
