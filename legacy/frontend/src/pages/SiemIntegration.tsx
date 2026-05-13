
import { AlertCircle } from "lucide-react";
import TenantHeader from "@/components/layout/TenantHeader";
import SiemPlatformsSection from "@/components/siem/SiemPlatformsSection";
import PlatformSettings from "@/components/siem/PlatformSettings";
import DeployableRulesSection from "@/components/siem/DeployableRulesSection";
import { useSiemIntegration } from "@/hooks/useSiemIntegration";

const SiemIntegration = () => {
  const {
    selectedPlatform,
    setSelectedPlatform,
    selectedRules,
    toggleRuleSelection,
    siemPlatforms,
    currentPlatform,
    sigmaRules,
    platformsLoading,
    rulesLoading,
    isPlatformConnected
  } = useSiemIntegration();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">SIEM Integration</h1>
        <TenantHeader />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <SiemPlatformsSection
            platforms={siemPlatforms}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={setSelectedPlatform}
            isLoading={platformsLoading}
          />
          
          {selectedPlatform && (
            <PlatformSettings selectedPlatform={currentPlatform} />
          )}
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <DeployableRulesSection
            rules={sigmaRules}
            selectedRules={selectedRules}
            onToggleRuleSelection={toggleRuleSelection}
            selectedPlatform={selectedPlatform}
            isPlatformConnected={isPlatformConnected}
            isLoading={rulesLoading}
          />
          
          {!selectedPlatform && (
            <div className="flex items-center p-3 rounded-md bg-cyber-primary/10 border border-cyber-primary/20">
              <AlertCircle className="h-5 w-5 text-cyber-info mr-2" />
              <span className="text-sm">
                Select a SIEM platform from the left panel to manage rule deployments
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiemIntegration;
