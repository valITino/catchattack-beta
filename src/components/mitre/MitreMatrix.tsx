
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aiService } from "@/services/aiService";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MitreAttackTechnique } from "@/utils/mitreAttackUtils";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

interface MitreMatrixProps {
  selectedTechniques?: string[];
  onTechniqueSelect?: (techniqueId: string) => void;
  coveredTechniques?: string[];
  isInteractive?: boolean;
}

const MitreMatrix: React.FC<MitreMatrixProps> = ({
  selectedTechniques = [],
  onTechniqueSelect,
  coveredTechniques = [],
  isInteractive = true
}) => {
  const [techniques, setTechniques] = useState<MitreAttackTechnique[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tactics, setTactics] = useState<string[]>([]);

  useEffect(() => {
    const fetchMitreTechniques = async () => {
      try {
        setLoading(true);
        const response = await aiService.getMitreTechniques();
        
        if (response && response.techniques) {
          setTechniques(response.techniques);
          
          // Extract unique tactics
          const uniqueTactics = [...new Set(response.techniques.map(t => t.tactic))];
          setTactics(uniqueTactics.sort());
        } else {
          setError("Invalid response format from MITRE ATT&CK service");
        }
      } catch (err) {
        console.error("Error fetching MITRE techniques:", err);
        setError("Failed to fetch MITRE ATT&CK techniques");
      } finally {
        setLoading(false);
      }
    };

    fetchMitreTechniques();
  }, []);

  const handleTechniqueClick = (techniqueId: string) => {
    if (isInteractive && onTechniqueSelect) {
      onTechniqueSelect(techniqueId);
    }
  };

  // Group techniques by tactic
  const techniquesByTactic = tactics.map(tactic => ({
    tactic,
    techniques: techniques.filter(t => t.tactic === tactic)
  }));

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center items-center" style={{ height: "400px" }}>
          <div className="text-center">
            <LoadingSpinner className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Loading MITRE ATT&CK Framework...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <p className="font-semibold">Failed to load MITRE ATT&CK data</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <button 
              className="flex items-center text-sm text-primary hover:underline" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-1 h-4 w-4" /> Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>MITRE ATT&CK Matrix</CardTitle>
        <CardDescription>Visualization of tactics and techniques</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[550px] pr-4">
          <div className="grid grid-cols-1 gap-6">
            {techniquesByTactic.map(({ tactic, techniques: tacticTechniques }) => (
              <div key={tactic} className="space-y-2">
                <h3 className="text-lg font-semibold">{tactic}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {tacticTechniques.map(technique => {
                    const isSelected = selectedTechniques.includes(technique.id);
                    const isCovered = coveredTechniques.includes(technique.id);
                    
                    return (
                      <TooltipProvider key={technique.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`
                                p-2 rounded-md border text-sm 
                                cursor-${isInteractive ? 'pointer' : 'default'}
                                ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 
                                  isCovered ? 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-900' : 
                                  'bg-card hover:bg-accent hover:text-accent-foreground'}
                              `}
                              onClick={() => handleTechniqueClick(technique.id)}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-mono text-xs">{technique.id}</span>
                                {isCovered && <CheckCircle className="h-4 w-4 text-green-500" />}
                              </div>
                              <p className="truncate">{technique.name}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <span className="font-semibold">{technique.id}: {technique.name}</span>
                                <Badge variant="outline" className="ml-2">
                                  {technique.tactic}
                                </Badge>
                              </div>
                              <p className="text-sm">{technique.description}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MitreMatrix;
