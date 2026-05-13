
import { useDetectionCenter } from "@/hooks/useDetectionCenter";
import DetectionCenterHeader from "@/components/detection/DetectionCenterHeader";
import DetectionCenterTabs from "@/components/detection/DetectionCenterTabs";

const DetectionCenter = () => {
  const {
    selectedTab,
    setSelectedTab,
    selectedTechniques,
    handleTechniqueSelect,
    coveredTechniques,
    detectedAnomalies,
    gapAnalysis,
    emulationResults,
    isLoading
  } = useDetectionCenter();

  return (
    <div className="space-y-6">
      <DetectionCenterHeader title="Detection Center" />
      
      <DetectionCenterTabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        isLoading={isLoading}
        emulationResults={emulationResults}
        coveredTechniques={coveredTechniques}
        gapAnalysis={gapAnalysis}
        selectedTechniques={selectedTechniques}
        onTechniqueSelect={handleTechniqueSelect}
        anomalies={detectedAnomalies}
      />
    </div>
  );
};

export default DetectionCenter;
