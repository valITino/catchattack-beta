
import { useState } from "react";
import { SigmaRuleListItem } from "@/components/sigma/RuleList";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export function useSigmaGenerator() {
  const [selectedRule, setSelectedRule] = useState<SigmaRuleListItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>("rules");
  const navigate = useNavigate();

  const handleSelectRule = (rule: SigmaRuleListItem) => {
    setSelectedRule(rule);
  };

  const handleDeployRuleToSiem = (rule: SigmaRuleListItem) => {
    toast({
      title: "Deployment Option",
      description: "Choose where to deploy this rule",
      action: (
        <button 
          onClick={() => navigate("/siem")} 
          className="bg-cyber-primary hover:bg-cyber-primary/90 rounded px-4 py-2 text-white text-sm"
        >
          Go to SIEM Integration
        </button>
      ),
    });
  };

  return {
    selectedRule,
    activeTab,
    setActiveTab,
    handleSelectRule,
    handleDeployRuleToSiem,
  };
}
