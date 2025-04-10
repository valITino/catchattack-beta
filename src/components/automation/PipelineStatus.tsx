
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { 
  PlayCircle, PauseCircle, RefreshCw, CheckCircle2, 
  AlertCircle, Clock, FileCode2, Upload, Eye, Settings 
} from "lucide-react";

// Mock pipeline data
export interface PipelineBuild {
  id: string;
  status: "running" | "completed" | "failed" | "waiting";
  startTime: Date;
  endTime?: Date;
  emulationName: string;
  techniques: number;
  tactics: string[];
  rulesGenerated?: number;
  rulesDeployed?: number;
  targets?: string[];
  errors?: string[];
  logs: string[];
}

interface PipelineStatusProps {
  pipelines: PipelineBuild[];
  onTogglePipeline: (pipelineId: string, running: boolean) => void;
  onViewDetails: (pipeline: PipelineBuild) => void;
}

const PipelineStatus = ({ pipelines, onTogglePipeline, onViewDetails }: PipelineStatusProps) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-cyber-primary/20 text-cyber-primary border-cyber-primary";
      case "completed":
        return "bg-cyber-success/20 text-cyber-success border-cyber-success";
      case "failed":
        return "bg-cyber-danger/20 text-cyber-danger border-cyber-danger";
      case "waiting":
        return "bg-gray-500/20 text-gray-400 border-gray-500";
      default:
        return "";
    }
  };

  const toggleExpand = (id: string) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
    }
  };

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-cyber-primary" />
          CI/CD Pipeline Status
        </CardTitle>
        <CardDescription>
          Current and recent automated emulation pipelines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <ScrollArea className="h-[450px]">
          {pipelines.length > 0 ? (
            <div className="space-y-4 p-6">
              {pipelines.map((pipeline) => (
                <div key={pipeline.id} className="border border-cyber-primary/20 rounded-md overflow-hidden">
                  <div 
                    className={`p-4 flex justify-between items-start hover:bg-cyber-darker/30 cursor-pointer`}
                    onClick={() => toggleExpand(pipeline.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {pipeline.status === "running" ? (
                          <RefreshCw className="h-4 w-4 text-cyber-primary animate-spin" />
                        ) : pipeline.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-cyber-success" />
                        ) : pipeline.status === "failed" ? (
                          <AlertCircle className="h-4 w-4 text-cyber-danger" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <h3 className="font-medium">{pipeline.emulationName}</h3>
                        <Badge className={getStatusColor(pipeline.status)}>
                          {pipeline.status.charAt(0).toUpperCase() + pipeline.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        Started: {pipeline.startTime.toLocaleString()}
                        {pipeline.endTime && ` • Completed: ${pipeline.endTime.toLocaleString()}`}
                      </div>

                      {(pipeline.status === "completed" || pipeline.status === "failed") && (
                        <div className="flex gap-2">
                          {pipeline.rulesGenerated !== undefined && (
                            <Badge variant="outline" className="bg-cyber-accent/10 border-cyber-accent">
                              <FileCode2 className="h-3 w-3 mr-1" /> {pipeline.rulesGenerated} Rules
                            </Badge>
                          )}
                          {pipeline.targets && pipeline.targets.length > 0 && (
                            <Badge variant="outline" className="bg-cyber-info/10 border-cyber-info">
                              <Upload className="h-3 w-3 mr-1" /> {pipeline.targets.length} Targets
                            </Badge>
                          )}
                        </div>
                      )}

                      {pipeline.status === "running" && (
                        <Progress value={70} className="h-2" />
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(pipeline);
                        }}
                        className="h-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={pipeline.status === "running" ? "destructive" : "default"} 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePipeline(pipeline.id, pipeline.status !== "running");
                        }}
                        className="h-8"
                      >
                        {pipeline.status === "running" ? (
                          <PauseCircle className="h-4 w-4" />
                        ) : (
                          <PlayCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {expanded === pipeline.id && (
                    <div className="p-4 bg-cyber-darker/30 border-t border-cyber-primary/20">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Execution Logs</h4>
                        <div className="bg-cyber-darker rounded-md p-3 text-xs font-mono max-h-40 overflow-y-auto">
                          {pipeline.logs.map((log, i) => (
                            <div key={i} className="py-0.5">
                              {log}
                            </div>
                          ))}
                        </div>
                        
                        {pipeline.errors && pipeline.errors.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <h4 className="text-sm font-medium text-cyber-danger">Errors</h4>
                            <div className="bg-cyber-danger/10 border border-cyber-danger/20 rounded-md p-3 text-xs">
                              {pipeline.errors.map((error, i) => (
                                <div key={i} className="py-0.5 text-cyber-danger">
                                  {error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              No pipeline runs found. Create an automated pipeline to get started.
            </div>
          )}
        </ScrollArea>
        
        <div className="flex justify-between items-center p-4 border-t border-cyber-primary/20 bg-cyber-darker/30">
          <div className="text-sm text-gray-400">
            {pipelines.filter(p => p.status === "running").length} pipeline(s) running
          </div>
          <Button 
            size="sm" 
            onClick={() => {
              toast({
                title: "Logs Refreshed",
                description: "Pipeline logs have been refreshed",
              });
            }}
            className="h-8"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PipelineStatus;
