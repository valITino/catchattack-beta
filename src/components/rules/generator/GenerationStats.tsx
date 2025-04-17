
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { GenerationResult } from "../types/generator";

interface GenerationStatsProps {
  results: GenerationResult;
}

const GenerationStats = ({ results }: GenerationStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="text-sm text-gray-400">Coverage Statistics</Label>
        <div className="border border-cyber-primary/20 rounded-md p-4 mt-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Techniques Covered:</span>
            <Badge variant="outline" className="bg-cyber-darker">
              {results.statistics.techniquesCovered}/{results.statistics.totalTechniques}
            </Badge>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Tactics Covered:</span>
            <Badge variant="outline" className="bg-cyber-darker">
              {results.statistics.tacticsCovered}/{results.statistics.totalTactics}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Estimated Efficacy:</span>
            <Badge variant="outline" className="bg-cyber-darker">
              {results.statistics.estimatedEfficacy}%
            </Badge>
          </div>
        </div>
      </div>
      
      <div>
        <Label className="text-sm text-gray-400">Analysis Summary</Label>
        <div className="border border-cyber-primary/20 rounded-md p-4 mt-1 space-y-2">
          {results.analysis.map((item, index) => (
            <div key={index} className="flex items-start">
              {item.type === "info" ? (
                <CheckCircle className="h-4 w-4 text-cyber-success mt-0.5 mr-2 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-cyber-warning mt-0.5 mr-2 flex-shrink-0" />
              )}
              <span className="text-sm">{item.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenerationStats;
