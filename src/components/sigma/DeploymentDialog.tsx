
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { SigmaRule } from "@/utils/mitreAttackUtils";
import DeployTargetsTab from "./DeployTargetsTab";
import OptimizationTab from "./OptimizationTab";
import { useRuleOptimization } from "@/hooks/useRuleOptimization";

interface DeploymentDialogProps {
  rule: SigmaRule;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeploymentDialog = ({ rule, isOpen, onOpenChange }: DeploymentDialogProps) => {
  const [activeTab, setActiveTab] = useState<string>("targets");
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Record<string, boolean>>({
    elastic: true,
    splunk: true,
    sentinel: false,
    qradar: false,
  });

  const { 
    optimizationProgress,
    optimizationResults,
    autoOptimize,
    setAutoOptimize,
    runOptimization,
    resetOptimization
  } = useRuleOptimization(rule);

  const handleToggleTarget = (target: string) => {
    setSelectedTargets({
      ...selectedTargets,
      [target]: !selectedTargets[target],
    });
  };

  const handleStartOptimization = async () => {
    const targets = Object.entries(selectedTargets)
      .filter(([_, isSelected]) => isSelected)
      .map(([target]) => target);
    
    setActiveTab("optimization");
    resetOptimization();
    await runOptimization(targets);
  };

  const handleSkipOptimization = () => {
    setActiveTab("targets");
    setAutoOptimize(false);
  };

  const handleDeploy = async () => {
    const targets = Object.entries(selectedTargets)
      .filter(([_, isSelected]) => isSelected)
      .map(([target]) => target);

    if (targets.length === 0) {
      toast({
        title: "No targets selected",
        description: "Please select at least one SIEM target for deployment",
        variant: "destructive",
      });
      return;
    }

    // Auto-optimize if enabled and not already optimized
    if (autoOptimize && !optimizationResults) {
      await runOptimization(targets);
    }

    setIsDeploying(true);

    try {
      // In a real implementation, this would call an API to deploy the optimized rules
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Rule Deployed",
        description: `Successfully deployed to ${targets.length} platforms`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error deploying rule:", error);
      toast({
        title: "Deployment Error",
        description: "An unexpected error occurred during deployment",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Reset state when dialog is opened
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setActiveTab("targets");
      resetOptimization();
      setAutoOptimize(true);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deploy Sigma Rule</DialogTitle>
          <DialogDescription>
            Configure deployment settings for this detection rule.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>
          
          <TabsContent value="targets">
            <DeployTargetsTab
              selectedTargets={selectedTargets}
              onToggleTarget={handleToggleTarget}
              autoOptimize={autoOptimize}
              onAutoOptimizeChange={setAutoOptimize}
              onStartOptimization={handleStartOptimization}
              onDeploy={handleDeploy}
              isDeploying={isDeploying}
              closeDialog={() => onOpenChange(false)}
            />
          </TabsContent>
          
          <TabsContent value="optimization">
            <OptimizationTab
              optimizationProgress={optimizationProgress}
              optimizationResults={optimizationResults}
              onSkipOptimization={handleSkipOptimization}
              onBackToTargets={() => setActiveTab("targets")}
              onDeploy={handleDeploy}
              isDeploying={isDeploying}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DeploymentDialog;
