
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SigmaRule } from "@/utils/mitreAttackUtils";
import { optimizeRuleForSiem, validateRuleInEnvironment } from "@/utils/siemUtils";
import { toast } from "@/components/ui/use-toast";
import { Upload, Loader2, Settings, SkipForward, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DeployRuleButtonProps {
  rule: SigmaRule;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const DeployRuleButton = ({ 
  rule, 
  variant = "default", 
  size = "default",
  className
}: DeployRuleButtonProps) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("targets");
  const [selectedTargets, setSelectedTargets] = useState<Record<string, boolean>>({
    elastic: true,
    splunk: true,
    sentinel: false,
    qradar: false,
  });
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [autoOptimize, setAutoOptimize] = useState(true);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setOptimizationProgress(0);
    setOptimizationResults(null);
  };

  const handleToggleTarget = (target: string) => {
    setSelectedTargets({
      ...selectedTargets,
      [target]: !selectedTargets[target],
    });
  };

  const runOptimization = async () => {
    const targets = Object.entries(selectedTargets)
      .filter(([_, isSelected]) => isSelected)
      .map(([target]) => target);
    
    if (targets.length === 0) return;
    
    setActiveTab("optimization");
    setOptimizationProgress(10);
    
    const results: any = {
      targets: {},
      overallScore: 0
    };
    
    // Process each target
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      setOptimizationProgress(10 + ((i / targets.length) * 50));
      
      try {
        // Run optimization
        const optimization = await optimizeRuleForSiem(rule.content, target);
        
        // Run validation
        const validation = await validateRuleInEnvironment(rule.id, target);
        
        results.targets[target] = {
          optimization,
          validation,
          optimizedContent: optimization.optimized
        };
      } catch (error) {
        console.error(`Error optimizing for ${target}:`, error);
      }
    }
    
    // Calculate overall score (0-100)
    const validTargets = Object.values(results.targets).filter((t: any) => t.validation.valid);
    results.overallScore = Math.round((validTargets.length / targets.length) * 100);
    
    setOptimizationProgress(100);
    setOptimizationResults(results);
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
      await runOptimization();
    }

    setIsDeploying(true);

    try {
      // In a real implementation, this would call an API to deploy the optimized rules
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Rule Deployed",
        description: `Successfully deployed to ${targets.length} platforms`,
      });
      
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

  const handleSkipOptimization = () => {
    setActiveTab("targets");
    setAutoOptimize(false);
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog} 
        variant={variant}
        size={size}
        disabled={rule.deployed}
        className={`${rule.deployed ? "opacity-50 cursor-not-allowed" : ""} ${className || ""}`}
      >
        <Upload className={`${size !== "icon" ? "mr-2" : ""} h-4 w-4`} />
        {size !== "icon" && (rule.deployed ? "Deployed" : "Deploy to SIEM")}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            
            <TabsContent value="targets" className="space-y-4 py-4">
              <div className="space-y-4">
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
                
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-optimize">Auto-optimize for each platform</Label>
                    <p className="text-xs text-gray-400">
                      CatchAttack will automatically optimize the rule for each SIEM platform
                    </p>
                  </div>
                  <Checkbox 
                    id="auto-optimize" 
                    checked={autoOptimize}
                    onCheckedChange={(checked) => setAutoOptimize(!!checked)}
                  />
                </div>
              </div>
              
              <DialogFooter className="sm:justify-end pt-2">
                <Button 
                  onClick={() => setIsDialogOpen(false)} 
                  variant="outline"
                  disabled={isDeploying}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={autoOptimize ? runOptimization : handleDeploy}
                  disabled={isDeploying || Object.values(selectedTargets).every(v => !v)}
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : autoOptimize ? (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Optimize & Deploy
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Deploy
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="optimization" className="space-y-4 py-4">
              {optimizationResults ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Optimization Results</h3>
                    <Badge className={optimizationResults.overallScore > 80 
                      ? "bg-cyber-success text-background" 
                      : optimizationResults.overallScore > 50 
                        ? "bg-cyber-warning text-background" 
                        : "bg-cyber-danger text-background"}>
                      {optimizationResults.overallScore}% Compatible
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(optimizationResults.targets).map(([target, result]: [string, any]) => (
                      <div key={target} className="border border-cyber-primary/20 rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium capitalize">{target}</div>
                          <Badge 
                            variant="outline" 
                            className={result.validation.valid 
                              ? "border-cyber-success text-cyber-success" 
                              : "border-cyber-danger text-cyber-danger"}
                          >
                            {result.validation.valid ? "Valid" : "Needs Adjustment"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-400">False positives: </span>
                            <span>{result.validation.falsePositives}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Potential impact: </span>
                            <span className="capitalize">{result.validation.potentialImpact}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <DialogFooter className="sm:justify-end pt-2">
                    <Button 
                      onClick={() => setActiveTab("targets")} 
                      variant="outline"
                    >
                      Back
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
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Optimizing rule for selected platforms...</span>
                      <span>{optimizationProgress}%</span>
                    </div>
                    <Progress value={optimizationProgress} />
                  </div>
                  
                  {optimizationProgress < 100 && (
                    <div className="flex justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleSkipOptimization}
                      >
                        <SkipForward className="h-4 w-4 mr-1" />
                        Skip
                      </Button>
                      <p className="text-xs text-gray-400 italic">
                        This may take a few moments...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeployRuleButton;
