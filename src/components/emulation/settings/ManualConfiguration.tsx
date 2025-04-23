
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplatesTab } from "./TemplatesTab";
import { TechniquesTab } from "./TechniquesTab";
import { EmulationParameters } from "./EmulationParameters";
import { TargetSystems } from "./TargetSystems";
import { AutomationSettings } from "./AutomationSettings";
import { ttps, adversaryTemplates, targetSystems } from "@/data/emulationData";

interface ManualConfigurationProps {
  selectedTemplate: string;
  selectedTechniques: string[];
  emulationName: string;
  emulationDescription: string;
  selectedSystems: string[];
  autoGenerateRules: boolean;
  autoPushToSiem: boolean;
  duration: string;
  onTemplateSelect: (templateId: string) => void;
  onTechniqueToggle: (techniqueId: string) => void;
  onEmulationNameChange: (name: string) => void;
  onEmulationDescriptionChange: (description: string) => void;
  onSystemToggle: (systemId: string) => void;
  onAutoGenerateRulesChange: (value: boolean) => void;
  onAutoPushToSiemChange: (value: boolean) => void;
  onDurationChange: (value: string) => void;
}

export function ManualConfiguration({
  selectedTemplate,
  selectedTechniques,
  emulationName,
  emulationDescription,
  selectedSystems,
  autoGenerateRules,
  autoPushToSiem,
  duration,
  onTemplateSelect,
  onTechniqueToggle,
  onEmulationNameChange,
  onEmulationDescriptionChange,
  onSystemToggle,
  onAutoGenerateRulesChange,
  onAutoPushToSiemChange,
  onDurationChange,
}: ManualConfigurationProps) {
  return (
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
          onTemplateSelect={onTemplateSelect}
        />
      </TabsContent>

      <TabsContent value="techniques">
        <TechniquesTab 
          techniques={ttps}
          selectedTechniques={selectedTechniques}
          onTechniqueToggle={onTechniqueToggle}
        />
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmulationParameters 
            name={emulationName}
            description={emulationDescription}
            onNameChange={onEmulationNameChange}
            onDescriptionChange={onEmulationDescriptionChange}
            duration={duration}
            onDurationChange={onDurationChange}
          />

          <TargetSystems 
            systems={targetSystems}
            selectedSystems={selectedSystems}
            onSystemToggle={onSystemToggle}
          />
        </div>

        <AutomationSettings 
          autoGenerateRules={autoGenerateRules}
          autoPushToSiem={autoPushToSiem}
          onAutoGenerateRulesChange={onAutoGenerateRulesChange}
          onAutoPushToSiemChange={onAutoPushToSiem}
        />
      </TabsContent>
    </Tabs>
  );
}
