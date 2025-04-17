
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GitCommit } from "lucide-react";
import { getSeverityColor } from "@/utils/siemUtils";
import { GenerationResult } from "../types/generator";

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
                <h4 className="font-medium">{rule.title}</h4>
                <Badge className={getSeverityColor(rule.severity.toLowerCase())}>
                  {rule.severity}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-2">{rule.description}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-cyber-darker">
                  <GitCommit className="h-3 w-3 mr-1" /> {rule.technique}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default GeneratedRulesDisplay;
