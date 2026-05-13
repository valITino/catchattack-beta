
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";
import { DeployableRule } from "@/utils/siemUtils";

interface RuleCardFooterProps {
  rule: DeployableRule;
  selectedPlatformId: string | null;
  isConnected: boolean;
  isDeployed: boolean;
  onDeploy: () => void;
}

const RuleCardFooter = ({ 
  rule, 
  selectedPlatformId, 
  isConnected,
  isDeployed,
  onDeploy 
}: RuleCardFooterProps) => {
  return (
    <div className="mt-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">{rule.source}</Badge>
        <span className="text-xs text-gray-400">
          Created: {new Date(rule.dateCreated).toLocaleDateString()}
        </span>
      </div>
      
      {selectedPlatformId && isConnected && !isDeployed && (
        <Button 
          size="sm" 
          onClick={onDeploy}
          className="bg-cyber-primary hover:bg-cyber-primary/90"
        >
          <Cloud className="h-3 w-3 mr-1" /> Deploy
        </Button>
      )}
    </div>
  );
};

export default RuleCardFooter;
