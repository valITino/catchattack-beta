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
import { ttps, adversaryTemplates, targetSystems } from "@/data/emulationData";

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
