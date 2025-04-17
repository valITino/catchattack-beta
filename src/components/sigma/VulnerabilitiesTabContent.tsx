
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VulnerabilityList from "@/components/sigma/VulnerabilityList";
import { SigmaRuleListItem } from "@/components/sigma/RuleList";
import { Vulnerability } from "@/data/vulnerabilities";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface VulnerabilitiesTabContentProps {
  vulnerabilities: Vulnerability[];
  rules: SigmaRuleListItem[];
  onSelectRule: (rule: SigmaRuleListItem) => void;
  setActiveTab: (tab: string) => void;
}

const VulnerabilitiesTabContent = ({ 
  vulnerabilities, 
  rules, 
  onSelectRule, 
  setActiveTab 
}: VulnerabilitiesTabContentProps) => {
  const navigate = useNavigate();

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

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle>Detected Vulnerabilities</CardTitle>
        <CardDescription>Vulnerabilities detected during emulation that can be converted to detection rules</CardDescription>
      </CardHeader>
      <CardContent>
        <VulnerabilityList 
          vulnerabilities={vulnerabilities}
          rules={rules}
          onSelectRule={onSelectRule}
          setActiveTab={setActiveTab}
          onDeployRule={handleDeployRuleToSiem}
        />
      </CardContent>
    </Card>
  );
};

export default VulnerabilitiesTabContent;
