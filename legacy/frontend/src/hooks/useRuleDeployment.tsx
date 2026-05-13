
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { deploySigmaRuleToSiem } from "@/utils/siemUtils";

export const useRuleDeployment = (ruleId: string, platformId: string | null) => {
  const [isDeploying, setIsDeploying] = useState(false);

  const deployRule = async () => {
    if (!platformId) return;
    
    setIsDeploying(true);
    
    toast({
      title: "Deployment Started",
      description: "Deploying sigma rule to selected SIEM platform",
    });
    
    try {
      const result = await deploySigmaRuleToSiem(ruleId, platformId);
      
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
    } catch (error) {
      toast({
        title: "Deployment Error",
        description: "An unexpected error occurred during deployment",
        variant: "destructive",
      });
      console.error("Rule deployment error:", error);
    } finally {
      setIsDeploying(false);
    }
  };

  return {
    isDeploying,
    deployRule
  };
};
