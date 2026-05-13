
import { useState } from "react";
import { RefreshCw, Filter, Upload, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, StatusBadgeGroup } from "@/components/detection/StatusBadges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DetectionRulesProps {
  isLoading: boolean;
}

const DetectionRules = ({ isLoading }: DetectionRulesProps) => {
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  
  const handleDeploy = () => {
    setIsDeploying(true);
    // Simulate deployment
    setTimeout(() => {
      setIsDeploying(false);
    }, 2000);
  };

  return (
    <Card className="transition-all duration-200 hover:border-cyber-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Detection Rules</CardTitle>
            <CardDescription>Manage and deploy detection rules</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <StatusBadge 
                  type="info" 
                  value="Rules" 
                  tooltipText="Detection rules are YAML files in Sigma format that can be deployed to SIEM platforms"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Detection rules are YAML files in Sigma format</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh rule status from connected SIEM platforms</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm"
                    disabled={isLoading || isDeploying}
                    onClick={handleDeploy}
                  >
                    {isDeploying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Deploy Rules
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Deploy detection rules to connected SIEM platforms</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-muted-foreground">
                No detection rules generated yet
              </p>
              <Button 
                variant="outline" 
                className="mt-4 transition-all duration-200 hover:bg-cyber-primary/10 hover:border-cyber-primary"
              >
                Generate Rules from Latest Emulation
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DetectionRules;
