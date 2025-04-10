
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SigmaRule, deploySigmaRule } from "@/utils/mitreAttackUtils";
import { toast } from "@/components/ui/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DeployRuleButtonProps {
  rule: SigmaRule;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const DeployRuleButton = ({ rule, variant = "default", size = "default" }: DeployRuleButtonProps) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Record<string, boolean>>({
    elastic: true,
    splunk: true,
    sentinel: false,
    qradar: false,
  });

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleToggleTarget = (target: string) => {
    setSelectedTargets({
      ...selectedTargets,
      [target]: !selectedTargets[target],
    });
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

    setIsDeploying(true);

    try {
      const result = await deploySigmaRule(rule, targets);
      
      if (result.success) {
        toast({
          title: "Rule Deployed",
          description: `Successfully deployed to: ${result.deployedTo.join(", ")}`,
        });
      } else if (result.deployedTo.length > 0 && result.errors.length > 0) {
        toast({
          title: "Partial Deployment",
          description: `Deployed to: ${result.deployedTo.join(", ")}. Failed for: ${result.errors.map(e => e.target).join(", ")}`,
          // Changed from "warning" to "destructive" since "warning" is not a valid variant
          variant: "destructive",
        });
      } else {
        toast({
          title: "Deployment Failed",
          description: `Failed to deploy rule: ${result.errors.map(e => `${e.target} (${e.message})`).join(", ")}`,
          variant: "destructive",
        });
      }
      
      setIsDialogOpen(false);
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

  return (
    <>
      <Button 
        onClick={handleOpenDialog} 
        variant={variant}
        size={size}
        disabled={rule.deployed}
        className={rule.deployed ? "opacity-50 cursor-not-allowed" : ""}
      >
        <Upload className="mr-2 h-4 w-4" />
        {rule.deployed ? "Deployed" : "Deploy to SIEM"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deploy Sigma Rule</DialogTitle>
            <DialogDescription>
              Select the SIEM platforms where you want to deploy this rule.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="elastic" 
                  checked={selectedTargets.elastic}
                  onCheckedChange={() => handleToggleTarget('elastic')}
                />
                <Label htmlFor="elastic" className="cursor-pointer">Elastic Security</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="splunk" 
                  checked={selectedTargets.splunk}
                  onCheckedChange={() => handleToggleTarget('splunk')}
                />
                <Label htmlFor="splunk" className="cursor-pointer">Splunk</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="sentinel" 
                  checked={selectedTargets.sentinel}
                  onCheckedChange={() => handleToggleTarget('sentinel')}
                />
                <Label htmlFor="sentinel" className="cursor-pointer">Microsoft Sentinel</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="qradar" 
                  checked={selectedTargets.qradar}
                  onCheckedChange={() => handleToggleTarget('qradar')}
                />
                <Label htmlFor="qradar" className="cursor-pointer">IBM QRadar</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button 
              onClick={() => setIsDialogOpen(false)} 
              variant="outline"
              disabled={isDeploying}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeploy}
              disabled={isDeploying}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Deploy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeployRuleButton;
