
import { DeployableRule } from "@/utils/siemUtils";
import RuleCardHeader from "./RuleCardHeader";
import RuleCardFooter from "./RuleCardFooter";
import RuleSelectionCheckbox from "./RuleSelectionCheckbox";
import { useRuleDeployment } from "@/hooks/useRuleDeployment";

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
  
  const { deployRule } = useRuleDeployment(
    rule.id,
    selectedPlatformId
  );

  return (
    <div className="p-3 border border-cyber-primary/20 rounded-md">
      <div className="flex items-start">
        {selectedPlatformId && isConnected && (
          <RuleSelectionCheckbox
            id={rule.id}
            isSelected={isSelected}
            isDisabled={!!isDeployed}
            onToggleSelect={onToggleSelect}
          />
        )}
        
        <div className="flex-1">
          <RuleCardHeader
            rule={rule}
            isDeployed={!!isDeployed}
          />
          
          <RuleCardFooter
            rule={rule}
            selectedPlatformId={selectedPlatformId}
            isConnected={isConnected}
            isDeployed={!!isDeployed}
            onDeploy={deployRule}
          />
        </div>
      </div>
    </div>
  );
};

export default DeployableRuleCard;
