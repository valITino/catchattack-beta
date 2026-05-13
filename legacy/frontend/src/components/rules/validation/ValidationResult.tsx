
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, ClipboardCheck, X } from "lucide-react";
import { Issue, ValidationResult } from "../types/validation";

interface ValidationResultDisplayProps {
  result: ValidationResult | null;
  isValidating: boolean;
}

const ValidationResultDisplay = ({ result, isValidating }: ValidationResultDisplayProps) => {
  if (isValidating || !result) return null;

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-cyber-danger text-white";
      case "medium":
        return "bg-cyber-warning text-black";
      case "low":
        return "bg-cyber-info text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {result.valid ? (
            <CheckCircle className="h-5 w-5 text-cyber-success mr-2" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-cyber-danger mr-2" />
          )}
          <span className="font-medium">
            {result.valid ? "Rule Valid" : "Rule Needs Fixes"}
          </span>
        </div>
        
        <Badge className={
          result.score > 80 
            ? "bg-cyber-success text-white" 
            : result.score > 50 
              ? "bg-cyber-warning text-black" 
              : "bg-cyber-danger text-white"
        }>
          Score: {result.score}/100
        </Badge>
      </div>
      
      {result.issues.length > 0 && (
        <div>
          <Label className="text-sm mb-2 block">Issues Found</Label>
          <ScrollArea className="h-[200px] border border-cyber-primary/20 rounded-md">
            <div className="p-3 space-y-2">
              {result.issues.map((issue, index) => (
                <IssueItem key={index} issue={issue} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

interface IssueItemProps {
  issue: Issue;
}

const IssueItem = ({ issue }: IssueItemProps) => {
  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-cyber-danger text-white";
      case "medium":
        return "bg-cyber-warning text-black";
      case "low":
        return "bg-cyber-info text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div 
      className={`p-2 rounded-md border ${
        issue.type === "error" 
          ? "border-cyber-danger/30 bg-cyber-danger/5" 
          : issue.type === "warning" 
            ? "border-cyber-warning/30 bg-cyber-warning/5"
            : "border-cyber-info/30 bg-cyber-info/5"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          {issue.type === "error" ? (
            <X className="h-4 w-4 text-cyber-danger mt-0.5 mr-2" />
          ) : issue.type === "warning" ? (
            <AlertTriangle className="h-4 w-4 text-cyber-warning mt-0.5 mr-2" />
          ) : (
            <ClipboardCheck className="h-4 w-4 text-cyber-info mt-0.5 mr-2" />
          )}
          <div>
            <p className="text-sm">{issue.message}</p>
            {issue.line && (
              <p className="text-xs text-gray-400 mt-1">Line: {issue.line}</p>
            )}
            {issue.fix && (
              <p className="text-xs mt-1 italic">{issue.fix}</p>
            )}
          </div>
        </div>
        <Badge className={getSeverityBadgeColor(issue.severity)} variant="outline">
          {issue.severity}
        </Badge>
      </div>
    </div>
  );
};

export default ValidationResultDisplay;
