
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { FileCode2, Download, Copy, Check, Cloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SigmaRuleListItem } from "./RuleList";

interface RuleEditorProps {
  selectedRule: SigmaRuleListItem | null;
}

const RuleEditor = ({ selectedRule }: RuleEditorProps) => {
  const [ruleContent, setRuleContent] = useState<string>(selectedRule?.rule || "");
  const navigate = useNavigate();

  const handleRuleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRuleContent(e.target.value);
  };

  const handleSaveRule = () => {
    toast({
      title: "Rule Updated",
      description: "Sigma rule has been successfully updated",
    });
  };

  const handleCopyRule = () => {
    navigator.clipboard.writeText(ruleContent);
    toast({
      title: "Copied to Clipboard",
      description: "Sigma rule content copied to clipboard",
    });
  };

  const handleExportRule = () => {
    toast({
      title: "Rule Exported",
      description: "Sigma rule exported as YAML file",
    });
  };

  const handleDeployRuleToSiem = () => {
    toast({
      title: "Deployment Option",
      description: "Choose where to deploy this rule",
      action: (
        <Button 
          onClick={() => navigate("/siem")} 
          className="bg-cyber-primary hover:bg-cyber-primary/90"
        >
          Go to SIEM Integration
        </Button>
      ),
    });
  };

  if (!selectedRule) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] border border-dashed border-gray-700 rounded-md">
        <div className="text-center p-6">
          <FileCode2 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a Rule</h3>
          <p className="text-gray-400 text-sm">
            Select a rule from the repository to view and edit its definition
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="cyber-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{selectedRule.title}</CardTitle>
            <CardDescription>{selectedRule.description}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="default" 
              onClick={handleDeployRuleToSiem}
              className="bg-cyber-primary hover:bg-cyber-primary/90"
            >
              <Cloud className="h-4 w-4 mr-1" /> Deploy to SIEM
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportRule}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyRule}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-gray-400">Severity</Label>
            <p className="text-sm">{selectedRule.severity}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Source</Label>
            <p className="text-sm">{selectedRule.source}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Emulation</Label>
            <p className="text-sm">{selectedRule.emulation}</p>
          </div>
        </div>
        
        <div>
          <Label htmlFor="rule-content">Rule Definition (YAML)</Label>
          <Textarea
            id="rule-content"
            value={ruleContent}
            onChange={handleRuleContentChange}
            rows={20}
            className="font-mono text-sm bg-cyber-darker border-cyber-primary/20"
          />
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSaveRule} className="bg-cyber-primary hover:bg-cyber-primary/90">
            <Check className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RuleEditor;
