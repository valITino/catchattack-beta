
import { CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Anomaly {
  techniqueId: string;
  description: string;
  severity: string;
  confidence: number;
}

interface AnomalyDisplayProps {
  anomalies: Anomaly[];
}

const AnomalyDisplay = ({ anomalies }: AnomalyDisplayProps) => {
  // Function to get severity badge variant based on severity level
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Detected Anomalies</CardTitle>
        <CardDescription>AI-detected anomalies from recent emulations</CardDescription>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium">No Anomalies Detected</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No anomalies were detected in the most recent emulation data
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {anomalies.map((anomaly, index) => (
              <div 
                key={index}
                className="p-4 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1 flex items-center">
                        <span>Anomaly in </span>
                        <Badge className="ml-2 font-mono" variant="outline">
                          {anomaly.techniqueId}
                        </Badge>
                      </h4>
                      <p className="text-sm">{anomaly.description}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <Badge variant={getSeverityVariant(anomaly.severity)}>
                          {anomaly.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Confidence: {Math.round(anomaly.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnomalyDisplay;
