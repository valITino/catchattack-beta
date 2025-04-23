
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GitCommit, BookOpen, Code, AlertTriangle } from "lucide-react";
import { getSeverityColor } from "@/utils/siemUtils";
import { GenerationResult } from "../types/generator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface GeneratedRulesDisplayProps {
  results: GenerationResult;
}

const GeneratedRulesDisplay = ({ results }: GeneratedRulesDisplayProps) => {
  return (
    <div className="border border-cyber-primary/20 rounded-md">
      <div className="p-4 border-b border-cyber-primary/20">
        <Label className="text-sm text-gray-400">Generated Rules</Label>
      </div>
      <ScrollArea className="h-64">
        <div className="p-4 space-y-3">
          {results.rules.map((rule) => (
            <div key={rule.id} className="border border-cyber-primary/20 rounded-md p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{rule.title}</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="bg-cyber-darker">
                            <GitCommit className="h-3 w-3 mr-1" /> {rule.technique}
                          </Badge>
                          {rule.atomicTestReferences && (
                            <Badge variant="outline" className="bg-cyber-darker/30">
                              <Code className="h-3 w-3 mr-1" /> Atomic tests available
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="w-80 p-2">
                        <p className="text-xs mb-2">This rule maps to the MITRE ATT&CK technique: {rule.technique}</p>
                        {rule.atomicTestReferences && (
                          <div className="text-xs text-gray-400">
                            <div className="font-medium mb-1">Based on Atomic Red Team tests:</div>
                            <ul className="list-disc list-inside">
                              {rule.atomicTestReferences.map((ref, idx) => (
                                <li key={idx} className="ml-2">{ref.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge className={getSeverityColor(rule.severity.toLowerCase())}>
                  {rule.severity}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-2">{rule.description}</p>
              
              {/* Enhanced information display */}
              {rule.dataSourceRecommendations && (
                <div className="mt-3 text-xs border-t border-cyber-primary/10 pt-2">
                  <div className="flex items-start gap-1 text-gray-400">
                    <BookOpen className="h-3 w-3 mt-0.5" />
                    <span>Recommended data sources: {rule.dataSourceRecommendations.join(', ')}</span>
                  </div>
                </div>
              )}
              
              {rule.efficacyNote && (
                <div className="mt-1 text-xs flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 text-cyber-warning mt-0.5" />
                  <span className="text-cyber-warning">{rule.efficacyNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default GeneratedRulesDisplay;
