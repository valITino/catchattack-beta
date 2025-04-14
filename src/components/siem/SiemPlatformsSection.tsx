
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiemPlatform } from "@/utils/siemUtils";
import PlatformCard from "./PlatformCard";

interface SiemPlatformsSectionProps {
  platforms: SiemPlatform[];
  selectedPlatform: string | null;
  onSelectPlatform: (platformId: string) => void;
  isLoading: boolean;
}

const SiemPlatformsSection = ({
  platforms,
  selectedPlatform,
  onSelectPlatform,
  isLoading
}: SiemPlatformsSectionProps) => {
  return (
    <Card className="cyber-card">
      <CardHeader className="pb-2">
        <CardTitle>SIEM Platforms</CardTitle>
        <CardDescription>Connected security platforms</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-pulse space-y-3 w-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {platforms.map(platform => (
              <PlatformCard 
                key={platform.id}
                platform={platform}
                isSelected={selectedPlatform === platform.id}
                onSelect={onSelectPlatform}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SiemPlatformsSection;
