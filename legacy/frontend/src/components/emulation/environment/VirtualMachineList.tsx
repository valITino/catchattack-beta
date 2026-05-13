
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { VirtualMachine } from "../VirtualizedEnvironment";

interface VirtualMachineListProps {
  vms: VirtualMachine[];
  showVulnerabilities: boolean;
  onToggleVulnerabilities: () => void;
}

const VirtualMachineList = ({ 
  vms, 
  showVulnerabilities, 
  onToggleVulnerabilities 
}: VirtualMachineListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Virtual Machines</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggleVulnerabilities}
          className="text-xs"
        >
          {showVulnerabilities ? (
            <><EyeOff className="h-3 w-3 mr-1" /> Hide Vulnerabilities</>
          ) : (
            <><Eye className="h-3 w-3 mr-1" /> Show Vulnerabilities</>
          )}
        </Button>
      </div>
      
      <div className="space-y-2">
        {vms.map((vm) => (
          <div key={vm.id} className="border border-cyber-primary/20 rounded-md p-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{vm.name}</h4>
                <p className="text-sm text-gray-400">{vm.os}</p>
              </div>
              <Badge 
                variant="outline" 
                className={
                  vm.status === "running" ? "bg-green-500/10 text-green-500 border-green-500" :
                  vm.status === "error" ? "bg-red-500/10 text-red-500 border-red-500" :
                  "bg-gray-500/10 text-gray-500 border-gray-500"
                }
              >
                {vm.status}
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-xs text-gray-400">Services:</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {vm.services.map((service, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
            {showVulnerabilities && (
              <div className="mt-2 pt-2 border-t border-cyber-primary/10">
                <div className="text-xs text-gray-400">Vulnerabilities:</div>
                <div className="mt-1">
                  <Badge className="bg-red-500/10 text-red-500 border-red-500">
                    {vm.vulnerabilities} detected
                  </Badge>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualMachineList;
