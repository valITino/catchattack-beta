
import { useState, useEffect } from "react";
import { Shield, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmulationResult } from "@/types/backend";
import StatusBadge from "./StatusBadges";

interface CoverageAnalysisProps {
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
}

const CoverageAnalysis = ({ 
  isLoading, 
  emulationResults, 
  coveredTechniques, 
  gapAnalysis 
}: CoverageAnalysisProps) => {
  
  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2 text-green-500" />
          Coverage Summary
        </CardTitle>
        <CardDescription>Detection coverage analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        ) : emulationResults.length === 0 ? (
          <div className="text-center py-6">
            <div className="mb-2">No emulation results found</div>
            <p className="text-sm text-muted-foreground">
              Run an emulation to analyze detection coverage
            </p>
            <Button variant="outline" size="sm" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Run New Emulation
            </Button>
          </div>
        ) : (
          <>
            <div>
              <div className="text-xl font-bold">
                {coveredTechniques.length} Techniques
              </div>
              <div className="text-sm text-muted-foreground">
                detected in last emulation
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Latest Emulation</div>
              <div className="text-sm text-muted-foreground">
                {new Date(emulationResults[0].timestamp).toLocaleString()}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 py-2">
              <StatusBadge 
                type="coverage" 
                value={coveredTechniques.length} 
                label="Covered" 
                tooltipText="Techniques with detection coverage"
              />
              {gapAnalysis && (
                <StatusBadge 
                  type="alert" 
                  value={gapAnalysis.uncoveredTechniques.length} 
                  label="Gaps"
                  tooltipText="Techniques without detection coverage" 
                />
              )}
              <StatusBadge 
                type="detection" 
                value={emulationResults[0].logs.length} 
                label="Logs"
                tooltipText="Total logs analyzed" 
              />
            </div>
            
            <Separator />
            
            {gapAnalysis && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Coverage Gaps</div>
                <div className="flex items-center text-amber-500">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>
                    {gapAnalysis.uncoveredTechniques.length} techniques without coverage
                  </span>
                </div>
                
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {gapAnalysis.recommendations.slice(0, 5).map((rec, i) => (
                      <div key={i} className="text-sm p-2 rounded-md bg-muted">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs">{rec.techniqueId}</span>
                          <Badge 
                            variant={rec.priority === 'high' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="mt-1">{rec.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CoverageAnalysis;
