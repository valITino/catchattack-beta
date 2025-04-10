
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, Wand2, GitCommit, AlertTriangle, Brain, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GeneratorOption {
  id: string;
  name: string;
  description: string;
  model?: string;
  category: "behavior" | "technique" | "log";
}

const generatorOptions: GeneratorOption[] = [
  {
    id: "behavior-analysis",
    name: "Behavior Analysis",
    description: "Analyze emulated attack behaviors to create optimized rules",
    model: "Advanced Behavior Processor",
    category: "behavior"
  },
  {
    id: "technique-coverage",
    name: "Technique Coverage",
    description: "Generate rules for gaps in MITRE ATT&CK coverage",
    model: "MITRE ATT&CK Mapper",
    category: "technique"
  },
  {
    id: "log-pattern",
    name: "Log Pattern Mining",
    description: "Auto-discover patterns from historical log data",
    model: "Pattern Recognition System",
    category: "log"
  }
];

const AutoRuleGenerator = () => {
  const [selectedOption, setSelectedOption] = useState<string>("behavior-analysis");
  const [customRuleInput, setCustomRuleInput] = useState<string>("");
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [generateCorrelation, setGenerateCorrelation] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [generationResults, setGenerationResults] = useState<any | null>(null);
  
  const selectedGeneratorOption = generatorOptions.find(option => option.id === selectedOption);

  const handleStartGeneration = () => {
    setIsRunning(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const results = simulateGenerationResults(selectedOption);
      setGenerationResults(results);
      setIsRunning(false);
      
      toast({
        title: "Rule Generation Complete",
        description: `Successfully generated ${results.rules.length} detection rules`,
      });
    }, 3000);
  };

  const handleSaveRules = () => {
    toast({
      title: "Rules Saved",
      description: "All generated rules have been added to your library",
    });
    setGenerationResults(null);
  };

  const techniques = [
    "T1059.001 - PowerShell",
    "T1027 - Obfuscated Files or Information",
    "T1036 - Masquerading",
    "T1105 - Ingress Tool Transfer",
    "T1021 - Remote Services"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="h-5 w-5 text-cyber-warning mr-2" />
          Automated Rule Generation
        </CardTitle>
        <CardDescription>
          Let CatchAttack's AI engine generate optimized detection rules
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!generationResults ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {generatorOptions.map(option => (
                <div 
                  key={option.id}
                  className={`border rounded-md p-4 cursor-pointer transition-all ${
                    selectedOption === option.id 
                      ? "border-cyber-primary bg-cyber-primary/10" 
                      : "border-cyber-primary/20 hover:border-cyber-primary/50"
                  }`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{option.name}</h3>
                    <Badge variant="outline" className="bg-cyber-darker/50">
                      {option.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{option.description}</p>
                  {option.model && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Brain className="h-3 w-3 mr-1" />
                      {option.model}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuration</h3>
              
              <div className="space-y-3">
                {selectedOption === "technique-coverage" && (
                  <div className="space-y-2">
                    <Label>Target MITRE ATT&CK Techniques</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {techniques.map(technique => (
                        <div key={technique} className="flex items-center space-x-2">
                          <Checkbox 
                            id={technique} 
                            checked={selectedTechniques.includes(technique)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTechniques([...selectedTechniques, technique]);
                              } else {
                                setSelectedTechniques(selectedTechniques.filter(t => t !== technique));
                              }
                            }}
                          />
                          <Label htmlFor={technique} className="text-sm">{technique}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedOption === "log-pattern" && (
                  <div className="space-y-2">
                    <Label>Custom Log Pattern (Optional)</Label>
                    <Textarea 
                      placeholder="Paste log samples or patterns to analyze..."
                      value={customRuleInput}
                      onChange={(e) => setCustomRuleInput(e.target.value)}
                      className="h-32 bg-cyber-darker border-cyber-primary/20"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="correlation">Generate Correlation Rules</Label>
                    <p className="text-sm text-gray-400">
                      Create advanced correlation rules that detect multi-stage attacks
                    </p>
                  </div>
                  <Switch
                    id="correlation"
                    checked={generateCorrelation}
                    onCheckedChange={setGenerateCorrelation}
                    className="data-[state=checked]:bg-cyber-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleStartGeneration}
                className="bg-cyber-primary hover:bg-cyber-primary/90"
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Rules
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Generation Results</h3>
                <p className="text-sm text-gray-400">
                  {generationResults.rules.length} rules generated based on {selectedGeneratorOption?.name}
                </p>
              </div>
              <Badge className="bg-cyber-success">Complete</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-400">Coverage Statistics</Label>
                <div className="border border-cyber-primary/20 rounded-md p-4 mt-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Techniques Covered:</span>
                    <Badge variant="outline" className="bg-cyber-darker">
                      {generationResults.statistics.techniquesCovered}/{generationResults.statistics.totalTechniques}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Tactics Covered:</span>
                    <Badge variant="outline" className="bg-cyber-darker">
                      {generationResults.statistics.tacticsCovered}/{generationResults.statistics.totalTactics}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Estimated Efficacy:</span>
                    <Badge variant="outline" className="bg-cyber-darker">
                      {generationResults.statistics.estimatedEfficacy}%
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-gray-400">Analysis Summary</Label>
                <div className="border border-cyber-primary/20 rounded-md p-4 mt-1 space-y-2">
                  {generationResults.analysis.map((item: any, index: number) => (
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
            
            <div className="border border-cyber-primary/20 rounded-md">
              <div className="p-4 border-b border-cyber-primary/20">
                <Label className="text-sm text-gray-400">Generated Rules</Label>
              </div>
              <ScrollArea className="h-64">
                <div className="p-4 space-y-3">
                  {generationResults.rules.map((rule: any) => (
                    <div key={rule.id} className="border border-cyber-primary/20 rounded-md p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{rule.title}</h4>
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{rule.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-cyber-darker">
                          <GitCommit className="h-3 w-3 mr-1" /> {rule.technique}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>
      {generationResults && (
        <CardFooter className="flex justify-end gap-2 border-t border-cyber-primary/20 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setGenerationResults(null)}
          >
            Discard
          </Button>
          <Button 
            className="bg-cyber-primary hover:bg-cyber-primary/90"
            onClick={handleSaveRules}
          >
            Add Rules to Library
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

// Helper function to simulate generation results
const simulateGenerationResults = (generationType: string) => {
  // This would be replaced with actual AI-generated content in a real implementation
  
  const baseResults = {
    statistics: {
      techniquesCovered: Math.floor(Math.random() * 10) + 5,
      totalTechniques: 15,
      tacticsCovered: Math.floor(Math.random() * 4) + 3,
      totalTactics: 8,
      estimatedEfficacy: Math.floor(Math.random() * 20) + 75
    },
    analysis: [
      { type: "info", message: "High coverage achieved for execution techniques" },
      { type: "warning", message: "Limited coverage for lateral movement tactics" },
      { type: "info", message: "Correlation rules successfully generated for multi-stage attacks" }
    ],
    rules: []
  };
  
  // Generate different rules based on the selected generator type
  if (generationType === "behavior-analysis") {
    baseResults.rules = [
      {
        id: "auto-rule-001",
        title: "PowerShell Encoded Command Execution",
        description: "Detects PowerShell execution with encoded commands",
        severity: "high",
        technique: "T1059.001"
      },
      {
        id: "auto-rule-002",
        title: "Suspicious Registry Modification",
        description: "Detects modifications to sensitive registry keys",
        severity: "medium",
        technique: "T1112"
      },
      {
        id: "auto-rule-003",
        title: "Credential Dumping via LSASS Access",
        description: "Detects access to LSASS memory for credential extraction",
        severity: "critical",
        technique: "T1003.001"
      }
    ];
  } else if (generationType === "technique-coverage") {
    baseResults.rules = [
      {
        id: "auto-rule-004",
        title: "Remote Service Creation",
        description: "Detects remote service creation for lateral movement",
        severity: "high",
        technique: "T1021.002"
      },
      {
        id: "auto-rule-005",
        title: "Scheduled Task Creation",
        description: "Detects scheduled task creation for persistence",
        severity: "medium",
        technique: "T1053.005"
      }
    ];
  } else {
    baseResults.rules = [
      {
        id: "auto-rule-006",
        title: "Suspicious Authentication Patterns",
        description: "Detects unusual authentication patterns across multiple systems",
        severity: "high",
        technique: "T1078"
      },
      {
        id: "auto-rule-007",
        title: "Unusual Process Network Connections",
        description: "Detects processes making unusual network connections",
        severity: "medium",
        technique: "T1071"
      },
      {
        id: "auto-rule-008",
        title: "Log Clearing Activity",
        description: "Detects attempts to clear log files to cover tracks",
        severity: "high",
        technique: "T1070.001"
      },
      {
        id: "auto-rule-009",
        title: "Unusual Service Installations",
        description: "Detects installation of uncommon services",
        severity: "medium",
        technique: "T1543.003"
      }
    ];
  }
  
  return baseResults;
};

export default AutoRuleGenerator;
