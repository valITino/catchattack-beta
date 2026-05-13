
import { Badge } from "@/components/ui/badge";
import { DeployableRule, getSeverityColor } from "@/utils/siemUtils";

interface RuleCardHeaderProps {
  rule: DeployableRule;
  isDeployed: boolean;
}

const RuleCardHeader = ({ rule, isDeployed }: RuleCardHeaderProps) => {
  return (
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
  );
};

export default RuleCardHeader;
