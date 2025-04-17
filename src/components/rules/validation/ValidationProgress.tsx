
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ValidationProgressProps {
  isValidating: boolean;
  progress: number;
  currentStep: string;
}

const ValidationProgress = ({ isValidating, progress, currentStep }: ValidationProgressProps) => {
  if (!isValidating) return null;
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{currentStep}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
      
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyber-primary" />
      </div>
    </div>
  );
};

export default ValidationProgress;
