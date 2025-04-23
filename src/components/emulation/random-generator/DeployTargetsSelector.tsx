
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DeployTargetsSelectorProps {
  deployTargets: string[];
  onDeployTargetToggle: (target: string) => void;
}

const DeployTargetsSelector = ({ deployTargets, onDeployTargetToggle }: DeployTargetsSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="elastic"
          checked={deployTargets.includes("elastic")}
          onCheckedChange={() => onDeployTargetToggle("elastic")}
          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
        />
        <Label htmlFor="elastic" className="text-sm cursor-pointer">
          Elastic Security
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="splunk"
          checked={deployTargets.includes("splunk")}
          onCheckedChange={() => onDeployTargetToggle("splunk")}
          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
        />
        <Label htmlFor="splunk" className="text-sm cursor-pointer">
          Splunk
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="sentinel"
          checked={deployTargets.includes("sentinel")}
          onCheckedChange={() => onDeployTargetToggle("sentinel")}
          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
        />
        <Label htmlFor="sentinel" className="text-sm cursor-pointer">
          Microsoft Sentinel
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="qradar"
          checked={deployTargets.includes("qradar")}
          onCheckedChange={() => onDeployTargetToggle("qradar")}
          className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
        />
        <Label htmlFor="qradar" className="text-sm cursor-pointer">
          IBM QRadar
        </Label>
      </div>
    </div>
  );
};

export default DeployTargetsSelector;
