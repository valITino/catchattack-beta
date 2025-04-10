
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Cloud } from "lucide-react";
import { DeployableRule, getSeverityColor, deploySigmaRuleToSiem } from "@/utils/siemUtils";
import { toast } from "@/components/ui/use-toast";

interface DeployableRuleCardProps {
  rule: DeployableRule;
  selectedPlatformId: string | null;
  isConnected: boolean;
  isSelected: boolean;
  onToggleSelect: (ruleId: string) => void;
}

const DeployableRuleCard = ({
  rule,
  selectedPlatformId,
  isConnected,
  isSelected,
  onToggleSelect
}: DeployableRuleCardProps) => {
  const isDeployed = selectedPlatformId && rule.deployedTo.includes(selectedPlatformId);
  
  const handleDeployRule = async () => {
    if (!selectedPlatformId) return;
    
    toast({
      title: "Deployment Started",
      description: "Deploying sigma rule to selected SIEM platform",
    });
    
    const result = await deploySigmaRuleToSiem(rule.id, selectedPlatformId);
    
    if (result.success) {
      toast({
        title: "Rule Deployed",
        description: result.message,
      });
    } else {
      toast({
        title: "Deployment Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-3 border border-cyber-primary/20 rounded-md">
      <div className="flex items-start">
        {selectedPlatformId && isConnected && (
          <div className="pt-1 pr-3">
            <Checkbox 
              id={rule.id} 
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(rule.id)}
              className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
              disabled={isDeployed}
            />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{rule.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getSeverityColor(rule.severity)}>
                {rule.severity}
              </Badge>
              {isDeployed && (
                <Badge className="bg-cyber-success/20 text-cyber-success border-cyber-success">
                  Deployed
                </Badge>
              )}
            </div>
          </div>
          
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
                onClick={handleDeployRule}
                className="bg-cyber-primary hover:bg-cyber-primary/90"
              >
                <Cloud className="h-3 w-3 mr-1" /> Deploy
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeployableRuleCard;
