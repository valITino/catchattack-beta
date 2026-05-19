
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RuleList, { SigmaRuleListItem } from "@/components/sigma/RuleList";
import RuleEditor from "@/components/sigma/RuleEditor";

interface RulesTabContentProps {
  rules: SigmaRuleListItem[];
}

const RulesTabContent = ({ rules }: RulesTabContentProps) => {
  const [selectedRule, setSelectedRule] = useState<SigmaRuleListItem | null>(null);

  const handleSelectRule = (rule: SigmaRuleListItem) => {
    setSelectedRule(rule);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 cyber-card">
        <CardHeader className="pb-2">
          <CardTitle>Rule Repository</CardTitle>
          <CardDescription>Generated detection rules</CardDescription>
        </CardHeader>
        <CardContent>
          <RuleList 
            rules={rules}
            selectedRule={selectedRule}
            onSelectRule={handleSelectRule}
          />
        </CardContent>
      </Card>
      
      <div className="lg:col-span-2">
        <RuleEditor selectedRule={selectedRule} />
      </div>
    </div>
  );
};

export default RulesTabContent;
