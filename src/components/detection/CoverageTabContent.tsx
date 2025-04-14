
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MitreMatrix from "@/components/mitre/MitreMatrix";
import CoverageAnalysis from "@/components/detection/CoverageAnalysis";
import DetectionRules from "@/components/detection/DetectionRules";
import { EmulationResult } from "@/types/backend";

interface CoverageTabContentProps {
  isLoading: boolean;
  emulationResults: EmulationResult[];
  coveredTechniques: string[];
  gapAnalysis: {
    coveredTechniques: string[];
    uncoveredTechniques: string[];
    recommendations: Array<{
      techniqueId: string;
      recommendation: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  } | null;
  selectedTechniques: string[];
  onTechniqueSelect: (techniqueId: string) => void;
}

const CoverageTabContent = ({
  isLoading,
  emulationResults,
  coveredTechniques,
  gapAnalysis,
  selectedTechniques,
  onTechniqueSelect
}: CoverageTabContentProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CoverageAnalysis 
          isLoading={isLoading}
          emulationResults={emulationResults}
          coveredTechniques={coveredTechniques}
          gapAnalysis={gapAnalysis}
        />
        
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>MITRE ATT&CK Coverage</CardTitle>
            <CardHeader>Visualization of covered techniques in the MITRE ATT&CK framework</CardHeader>
          </CardHeader>
          <CardContent>
            <MitreMatrix 
              selectedTechniques={selectedTechniques}
              onTechniqueSelect={onTechniqueSelect}
              coveredTechniques={coveredTechniques}
              isInteractive={true}
            />
          </CardContent>
        </Card>
      </div>
      
      <DetectionRules isLoading={isLoading} />
    </div>
  );
};

export default CoverageTabContent;
