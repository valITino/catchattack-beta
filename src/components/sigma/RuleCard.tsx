
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SigmaRule } from "@/utils/mitreAttackUtils";
import { ShieldCheck, Copy, Code } from "lucide-react";
import { useState } from "react";
import DeployRuleButton from "./DeployRuleButton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RuleCardProps {
  rule: SigmaRule;
  onViewDetails?: (rule: SigmaRule) => void;
}

const RuleCard = ({ rule, onViewDetails }: RuleCardProps) => {
  const [showCode, setShowCode] = useState(false);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(rule.content);
    // You could add a toast here to confirm the copy
  };

  // Get severity color
  const getSeverityColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-cyber-danger text-white";
      case "high": return "bg-cyber-danger/80 text-white";
      case "medium": return "bg-cyber-warning text-black";
      case "low": return "bg-cyber-accent/70 text-black";
      case "informational": return "bg-cyber-info text-white";
      default: return "bg-cyber-primary text-white";
    }
  };

  return (
    <>
      <Card className="cyber-card h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{rule.title}</CardTitle>
            <Badge className={getSeverityColor(rule.level)}>
              {rule.level.charAt(0).toUpperCase() + rule.level.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-gray-400">ID: {rule.id}</p>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-3">
            <p className="text-sm">{rule.description}</p>
            
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="bg-cyber-darker">
                <ShieldCheck className="h-3 w-3 mr-1" /> {rule.technique.id}
              </Badge>
              <Badge variant="outline" className="bg-cyber-darker">
                {rule.technique.tactic}
              </Badge>
            </div>
            
            {rule.deployed && rule.deploymentTargets && rule.deploymentTargets.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400">Deployed to:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {rule.deploymentTargets.map((target) => (
                    <Badge key={target} variant="secondary" className="text-xs">
                      {target === "elastic" ? "Elastic Security" :
                       target === "splunk" ? "Splunk" :
                       target === "sentinel" ? "Microsoft Sentinel" :
                       target === "qradar" ? "IBM QRadar" : target}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-4 border-t border-cyber-primary/20">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCode(true)}
          >
            <Code className="h-4 w-4 mr-1" /> View
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            <DeployRuleButton rule={rule} size="sm" />
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{rule.title}</DialogTitle>
            <DialogDescription>
              Sigma rule for {rule.technique.id}: {rule.technique.name}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-grow mt-4">
            <pre className="bg-cyber-darker p-4 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap">
              {rule.content}
            </pre>
          </ScrollArea>
          
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={handleCopyToClipboard}
              className="mr-2"
            >
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
            <DeployRuleButton rule={rule} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RuleCard;
