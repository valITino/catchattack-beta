
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Play, AlertTriangle, Info, PlusCircle, Trash2 } from "lucide-react";

// Mock data for predefined TTPs (Tactics, Techniques, Procedures)
const ttps = [
  { id: "T1078", name: "Valid Accounts", tactic: "Initial Access", description: "Adversaries may obtain and abuse credentials of existing accounts." },
  { id: "T1566", name: "Phishing", tactic: "Initial Access", description: "Adversaries may send phishing messages to gain access to victim systems." },
  { id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution", description: "Adversaries may abuse command and script interpreters to execute commands." },
  { id: "T1053", name: "Scheduled Task/Job", tactic: "Execution", description: "Adversaries may abuse task scheduling functionality to facilitate execution." },
  { id: "T1027", name: "Obfuscated Files or Information", tactic: "Defense Evasion", description: "Adversaries may attempt to make an executable or file difficult to discover or analyze." },
  { id: "T1110", name: "Brute Force", tactic: "Credential Access", description: "Adversaries may use brute force techniques to gain access to accounts." },
  { id: "T1016", name: "System Network Configuration Discovery", tactic: "Discovery", description: "Adversaries may look for details about the network configuration of systems." },
  { id: "T1049", name: "System Network Connections Discovery", tactic: "Discovery", description: "Adversaries may attempt to get a listing of network connections." },
  { id: "T1071", name: "Application Layer Protocol", tactic: "Command and Control", description: "Adversaries may use application layer protocols for communication." },
];

// Mock data for adversary templates
const adversaryTemplates = [
  { 
    id: "APT29", 
    name: "APT29 (Cozy Bear)", 
    description: "Russian state-sponsored threat actor known for sophisticated attacks.",
    techniques: ["T1078", "T1566", "T1027", "T1071"],
    complexity: "High"
  },
  { 
    id: "APT41", 
    name: "APT41", 
    description: "Chinese state-sponsored espionage group that also conducts financially motivated operations.",
    techniques: ["T1059", "T1053", "T1016", "T1049"],
    complexity: "High"
  },
  { 
    id: "RANSOMWARE", 
    name: "Generic Ransomware", 
    description: "Common ransomware attack pattern including initial access, lateral movement, and encryption.",
    techniques: ["T1566", "T1110", "T1059"],
    complexity: "Medium"
  },
];

// Available systems for emulation
const targetSystems = [
  { id: "windows-server", name: "Windows Server", description: "Windows Server 2019" },
  { id: "linux-ubuntu", name: "Linux Server", description: "Ubuntu 20.04 LTS" },
  { id: "windows-client", name: "Windows Client", description: "Windows 10 Enterprise" },
  { id: "api-gateway", name: "API Gateway", description: "REST API Gateway" },
  { id: "web-server", name: "Web Server", description: "Nginx/Apache" },
  { id: "database", name: "Database", description: "PostgreSQL/MySQL" },
];

const EmulationSettings = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [emulationName, setEmulationName] = useState<string>("");
  const [emulationDescription, setEmulationDescription] = useState<string>("");
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [autoGenerateRules, setAutoGenerateRules] = useState<boolean>(true);
  const [autoPushToSiem, setAutoPushToSiem] = useState<boolean>(false);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = adversaryTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTechniques(template.techniques);
      setEmulationName(`${template.name} Emulation`);
      setEmulationDescription(template.description);
    }
  };

  const toggleTechnique = (techniqueId: string) => {
    if (selectedTechniques.includes(techniqueId)) {
      setSelectedTechniques(selectedTechniques.filter(id => id !== techniqueId));
    } else {
      setSelectedTechniques([...selectedTechniques, techniqueId]);
    }
  };

  const toggleSystem = (systemId: string) => {
    if (selectedSystems.includes(systemId)) {
      setSelectedSystems(selectedSystems.filter(id => id !== systemId));
    } else {
      setSelectedSystems([...selectedSystems, systemId]);
    }
  };

  const handleStartEmulation = () => {
    if (!emulationName) {
      toast({
        title: "Validation Error",
        description: "Please provide a name for the emulation",
        variant: "destructive",
      });
      return;
    }

    if (selectedTechniques.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one technique to emulate",
        variant: "destructive",
      });
      return;
    }

    if (selectedSystems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one target system",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Emulation Started",
      description: `${emulationName} has been scheduled and will begin shortly.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Adversary Emulation Configuration</h1>
        <Button 
          onClick={handleStartEmulation}
          className="bg-cyber-primary hover:bg-cyber-primary/90"
        >
          <Play className="mr-2 h-4 w-4" /> Start Emulation
        </Button>
      </div>

      <Tabs defaultValue="template" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="techniques">Techniques</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-4">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>Adversary Templates</CardTitle>
              <CardDescription>Start with a pre-configured emulation template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {adversaryTemplates.map(template => (
                <div 
                  key={template.id}
                  className={`p-4 border rounded-md cursor-pointer transition-colors ${
                    selectedTemplate === template.id 
                      ? 'border-cyber-primary bg-cyber-primary/10' 
                      : 'border-cyber-primary/20 hover:border-cyber-primary/40'
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{template.name}</h3>
                    <Badge variant="outline">{template.complexity}</Badge>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{template.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.techniques.map(techId => {
                      const tech = ttps.find(t => t.id === techId);
                      return (
                        <Badge key={techId} variant="secondary" className="text-xs">
                          {tech?.id}: {tech?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="techniques" className="space-y-4">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>Tactics & Techniques</CardTitle>
              <CardDescription>Select specific MITRE ATT&CK techniques to emulate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ttps.map(ttp => (
                  <div 
                    key={ttp.id}
                    className="border border-cyber-primary/20 rounded-md p-3"
                  >
                    <div className="flex items-start mb-2">
                      <Checkbox 
                        id={ttp.id} 
                        checked={selectedTechniques.includes(ttp.id)}
                        onCheckedChange={() => toggleTechnique(ttp.id)}
                        className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary mr-2 mt-1"
                      />
                      <div>
                        <Label 
                          htmlFor={ttp.id}
                          className="font-medium cursor-pointer"
                        >
                          {ttp.id}: {ttp.name}
                        </Label>
                        <Badge 
                          variant="outline" 
                          className="ml-2 bg-cyber-accent/10 border-cyber-accent text-xs"
                        >
                          {ttp.tactic}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 ml-6">{ttp.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Emulation Parameters</CardTitle>
                <CardDescription>Define the emulation details and scope</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Emulation Name</Label>
                  <Input 
                    id="name" 
                    value={emulationName}
                    onChange={(e) => setEmulationName(e.target.value)}
                    className="bg-cyber-darker border-cyber-primary/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={emulationDescription}
                    onChange={(e) => setEmulationDescription(e.target.value)}
                    className="min-h-[100px] bg-cyber-darker border-cyber-primary/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select defaultValue="30">
                    <SelectTrigger className="bg-cyber-darker border-cyber-primary/20">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Target Systems</CardTitle>
                <CardDescription>Select systems to run the emulation against</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {targetSystems.map(system => (
                    <div
                      key={system.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox 
                        id={system.id}
                        checked={selectedSystems.includes(system.id)}
                        onCheckedChange={() => toggleSystem(system.id)}
                        className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                      />
                      <div className="grid gap-1.5">
                        <Label 
                          htmlFor={system.id}
                          className="font-medium cursor-pointer"
                        >
                          {system.name}
                        </Label>
                        <p className="text-xs text-gray-400">
                          {system.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>Configure post-emulation actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-generate">Auto-Generate Sigma Rules</Label>
                  <p className="text-sm text-gray-400">
                    Automatically create detection rules from discovered vulnerabilities
                  </p>
                </div>
                <Switch 
                  id="auto-generate"
                  checked={autoGenerateRules}
                  onCheckedChange={setAutoGenerateRules}
                  className="data-[state=checked]:bg-cyber-primary"
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-push">Auto-Push Rules to SIEM</Label>
                  <p className="text-sm text-gray-400">
                    Push generated rules to connected SIEM platforms automatically
                  </p>
                </div>
                <Switch 
                  id="auto-push"
                  checked={autoPushToSiem}
                  onCheckedChange={setAutoPushToSiem}
                  className="data-[state=checked]:bg-cyber-primary"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center p-2 rounded-md bg-cyber-primary/10 border border-cyber-primary/20">
        <Info className="h-5 w-5 text-cyber-info mr-2" />
        <span className="text-sm">
          All emulation activities are conducted in an isolated environment and tagged with specific identifiers for easy cleanup.
        </span>
      </div>
    </div>
  );
};

export default EmulationSettings;
