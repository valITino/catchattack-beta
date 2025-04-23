import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Shuffle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { TemplatesTab } from "@/components/emulation/settings/TemplatesTab";
import { TechniquesTab } from "@/components/emulation/settings/TechniquesTab";
import { EmulationParameters } from "@/components/emulation/settings/EmulationParameters";
import { TargetSystems } from "@/components/emulation/settings/TargetSystems";
import { AutomationSettings } from "@/components/emulation/settings/AutomationSettings";
import EmulationScheduler, { EmulationSchedule } from "@/components/emulation/EmulationScheduler";
import RandomEmulationGenerator, { EmulationConfig } from "@/components/emulation/RandomEmulationGenerator";
import { EmulationHeader } from "@/components/emulation/settings/EmulationHeader";
import { ScheduledEmulationsList } from "@/components/emulation/settings/ScheduledEmulationsList";
import { RandomEmulationResults } from "@/components/emulation/settings/RandomEmulationResults";

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
  const [scheduledEmulations, setScheduledEmulations] = useState<EmulationSchedule[]>([]);
  const [randomEmulationConfig, setRandomEmulationConfig] = useState<EmulationConfig | null>(null);
  const [activeTabMain, setActiveTabMain] = useState<string>("manual");
  const [duration, setDuration] = useState<string>("30");

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

  const handleScheduleEmulation = (schedule: EmulationSchedule) => {
    setScheduledEmulations([...scheduledEmulations, schedule]);
  };

  const handleRandomEmulation = (config: EmulationConfig) => {
    setRandomEmulationConfig(config);
    
    if (config.immediate) {
      toast({
        title: "Random Emulation Started",
        description: "Random emulation has been generated and started",
      });
    }
  };

  return (
    <div className="space-y-6">
      <EmulationHeader onStart={handleStartEmulation} />

      <Tabs value={activeTabMain} onValueChange={setActiveTabMain} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="scheduled"><Clock className="h-4 w-4 mr-2" />Scheduled</TabsTrigger>
          <TabsTrigger value="random"><Shuffle className="h-4 w-4 mr-2" />Random</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Tabs defaultValue="template" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="techniques">Techniques</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="template">
              <TemplatesTab 
                templates={adversaryTemplates}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
              />
            </TabsContent>

            <TabsContent value="techniques">
              <TechniquesTab 
                techniques={ttps}
                selectedTechniques={selectedTechniques}
                onTechniqueToggle={toggleTechnique}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmulationParameters 
                  name={emulationName}
                  description={emulationDescription}
                  onNameChange={setEmulationName}
                  onDescriptionChange={setEmulationDescription}
                  duration={duration}
                  onDurationChange={setDuration}
                />

                <TargetSystems 
                  systems={targetSystems}
                  selectedSystems={selectedSystems}
                  onSystemToggle={toggleSystem}
                />
              </div>

              <AutomationSettings 
                autoGenerateRules={autoGenerateRules}
                autoPushToSiem={autoPushToSiem}
                onAutoGenerateRulesChange={setAutoGenerateRules}
                onAutoPushToSiemChange={setAutoPushToSiem}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmulationScheduler onSchedule={handleScheduleEmulation} />
            <ScheduledEmulationsList 
              emulations={scheduledEmulations}
              onDelete={(index) => {
                setScheduledEmulations(scheduledEmulations.filter((_, i) => i !== index));
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="random" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RandomEmulationGenerator onGenerate={handleRandomEmulation} />
            <RandomEmulationResults config={randomEmulationConfig} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmulationSettings;
