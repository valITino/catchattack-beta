
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTechniques, startVm, generateYaml, startEmulation } from "@/services/api";
import { useTechnique } from "@/hooks/useTechnique";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
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
  techniques?: MitreAttackTechnique[];
}

const MitreMatrix: React.FC<MitreMatrixProps> = ({
  selectedTechniques = [],
  onTechniqueSelect,
  coveredTechniques = [],
  isInteractive = true,
  techniques: externalTechniques
}) => {
  const [techniques, setTechniques] = useState<MitreAttackTechnique[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tactics, setTactics] = useState<string[]>([]);
  const [activeTech, setActiveTech] = useState<string | null>(null);
  const { data: fullData } = useTechnique(activeTech ?? '');

  useEffect(() => {
    if (externalTechniques && externalTechniques.length > 0) {
      setTechniques(externalTechniques);
      const uniqueTactics = [...new Set(externalTechniques.map(t => t.tactic))];
      setTactics(uniqueTactics.sort());
      setLoading(false);
      return;
    }

    const fetchMitreTechniques = async () => {
      try {
        setLoading(true);
        const response = await getTechniques();
        const data = response.data;
        if (data && data.techniques) {
          setTechniques(data.techniques);
          const uniqueTactics = [...new Set(data.techniques.map(t => t.tactic))];
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
    if (isInteractive) {
      setActiveTech(techniqueId);
      onTechniqueSelect?.(techniqueId);
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
    <Drawer open={!!activeTech} onOpenChange={() => setActiveTech(null)}>
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
    {activeTech && (
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{fullData?.technique.name || activeTech}</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <p className="text-sm whitespace-pre-line">{fullData?.technique.description}</p>
          {fullData?.atomic_tests && (
            <div className="space-y-2">
              <h4 className="font-semibold">Atomic tests</h4>
              {fullData.atomic_tests.map((t: any, i: number) => (
                <div key={i} className="border p-2 rounded">
                  <div className="flex justify-between">
                    <span>{t.name}</span>
                    <Button size="sm" onClick={() => { navigator.clipboard.writeText(t.executor?.command || ''); toast({title:'Copied command'}); }}>Copy</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {Array.isArray(fullData?.caldera_abilities) && (
            <div className="space-y-1">
              <h4 className="font-semibold">CALDERA abilities</h4>
              {fullData.caldera_abilities.map((a: any, i: number) => (
                <div key={i}>{a.name || a.ability_id}</div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    )}
    </Drawer>
  );
};

export default MitreMatrix;
