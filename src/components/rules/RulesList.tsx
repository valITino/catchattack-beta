
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCode2 } from "lucide-react";
import RuleCard from "@/components/sigma/RuleCard";
import { SigmaRule } from "@/utils/mitre/types";

interface RulesListProps {
  rules: SigmaRule[];
  isLoading?: boolean;
}

const RulesList = ({ rules, isLoading = false }: RulesListProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-primary"></div>
        <p className="mt-4 text-sm text-gray-400">Loading rules...</p>
      </div>
    );
  }
  
  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FileCode2 className="h-12 w-12 text-gray-600 mb-4" />
        <h3 className="text-lg font-medium mb-1">No rules found</h3>
        <p className="text-sm text-gray-400">
          Try adjusting your filters or create a new rule
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map(rule => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </div>
    </ScrollArea>
  );
};

export default RulesList;
