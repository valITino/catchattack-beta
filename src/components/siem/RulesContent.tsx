
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeployableRule } from "@/utils/siemUtils";
import DeployableRuleCard from "./DeployableRuleCard";

interface RulesContentProps {
  rules: DeployableRule[];
  isLoading: boolean;
  selectedRules: string[];
  selectedPlatform: string | null;
  isPlatformConnected: boolean;
  onToggleRuleSelection: (ruleId: string) => void;
}

const RulesContent = ({
  rules,
  isLoading,
  selectedRules,
  selectedPlatform,
  isPlatformConnected,
  onToggleRuleSelection
}: RulesContentProps) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
        ))}
      </div>
    );
  }
  
  if (rules.length === 0) {
    return (
      <div className="text-center p-4 text-gray-400">
        No rules match the current filters
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[400px] pr-3 -mr-3">
      <div className="space-y-3">
        {rules.map(rule => (
          <DeployableRuleCard
            key={rule.id}
            rule={rule}
            selectedPlatformId={selectedPlatform}
            isConnected={isPlatformConnected}
            isSelected={selectedRules.includes(rule.id)}
            onToggleSelect={onToggleRuleSelection}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default RulesContent;
