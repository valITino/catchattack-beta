
import { ManualConfiguration } from "./ManualConfiguration";

interface ManualTabContentProps {
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

export function ManualTabContent({
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
}: ManualTabContentProps) {
  return (
    <div className="space-y-4">
      <ManualConfiguration 
        selectedTemplate={selectedTemplate}
        selectedTechniques={selectedTechniques}
        emulationName={emulationName}
        emulationDescription={emulationDescription}
        selectedSystems={selectedSystems}
        autoGenerateRules={autoGenerateRules}
        autoPushToSiem={autoPushToSiem}
        duration={duration}
        onTemplateSelect={onTemplateSelect}
        onTechniqueToggle={onTechniqueToggle}
        onEmulationNameChange={onEmulationNameChange}
        onEmulationDescriptionChange={onEmulationDescriptionChange}
        onSystemToggle={onSystemToggle}
        onAutoGenerateRulesChange={onAutoGenerateRulesChange}
        onAutoPushToSiemChange={onAutoPushToSiemChange}
        onDurationChange={onDurationChange}
      />
    </div>
  );
}
