
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";

interface RuleActionsProps {
  selectedCount: number;
  isPending: boolean;
  onBulkDeploy: () => void;
}

const RuleActions = ({ 
  selectedCount, 
  isPending, 
  onBulkDeploy 
}: RuleActionsProps) => {
  if (selectedCount === 0) return null;
  
  return (
    <Button 
      onClick={onBulkDeploy}
      className="bg-cyber-primary hover:bg-cyber-primary/90"
      disabled={isPending}
    >
      <Cloud className="h-4 w-4 mr-2" />
      {isPending 
        ? `Deploying (${selectedCount})...` 
        : `Deploy Selected (${selectedCount})`
      }
    </Button>
  );
};

export default RuleActions;
