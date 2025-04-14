
import { RefreshCw, Filter, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DetectionRulesProps {
  isLoading: boolean;
}

const DetectionRules = ({ isLoading }: DetectionRulesProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Detection Rules</CardTitle>
        <CardDescription>Manage and deploy detection rules</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Deploy Rules
            </Button>
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
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No detection rules generated yet
              </p>
              <Button variant="outline" className="mt-4">
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
