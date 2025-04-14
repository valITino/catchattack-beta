
import { Play, Bell, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MitreMatrix from "@/components/mitre/MitreMatrix";

interface SimulationPanelProps {
  selectedTechniques: string[];
  onTechniqueSelect: (techniqueId: string) => void;
}

const SimulationPanel = ({ selectedTechniques, onTechniqueSelect }: SimulationPanelProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Quick Simulation</CardTitle>
          <CardDescription>Test detection capabilities with simulated attacks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Selected Techniques</h3>
              <div className="flex flex-wrap gap-2 min-h-10">
                {selectedTechniques.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No techniques selected
                  </div>
                ) : (
                  selectedTechniques.map(technique => (
                    <Badge key={technique} variant="secondary" className="font-mono">
                      {technique}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Simulation Options</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded-md bg-muted">
                  <div className="flex items-center">
                    <Bell className="h-4 w-4 mr-2" />
                    <span className="text-sm">Generate alerts</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Enabled</div>
                </div>
                
                <div className="flex items-center justify-between p-2 border rounded-md bg-muted">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">Schedule</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Run immediately</div>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <Button 
                className="w-full"
                disabled={selectedTechniques.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Run Simulation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Technique Selection</CardTitle>
          <CardDescription>Select techniques to include in simulation</CardDescription>
        </CardHeader>
        <CardContent>
          <MitreMatrix 
            selectedTechniques={selectedTechniques} 
            onTechniqueSelect={onTechniqueSelect}
            isInteractive={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SimulationPanel;
