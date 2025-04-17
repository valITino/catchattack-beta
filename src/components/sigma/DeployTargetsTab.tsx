
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, Upload } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

interface DeployTargetsTabProps {
  selectedTargets: Record<string, boolean>;
  onToggleTarget: (target: string) => void;
  autoOptimize: boolean;
  onAutoOptimizeChange: (value: boolean) => void;
  onStartOptimization: () => void;
  onDeploy: () => void;
  isDeploying: boolean;
  closeDialog: () => void;
}

const DeployTargetsTab = ({
  selectedTargets,
  onToggleTarget,
  autoOptimize,
  onAutoOptimizeChange,
  onStartOptimization,
  onDeploy,
  isDeploying,
  closeDialog
}: DeployTargetsTabProps) => {
  const anyTargetSelected = Object.values(selectedTargets).some(v => v);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="elastic" 
            checked={selectedTargets.elastic}
            onCheckedChange={() => onToggleTarget('elastic')}
          />
          <Label htmlFor="elastic" className="cursor-pointer">Elastic Security</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="splunk" 
            checked={selectedTargets.splunk}
            onCheckedChange={() => onToggleTarget('splunk')}
          />
          <Label htmlFor="splunk" className="cursor-pointer">Splunk</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="sentinel" 
            checked={selectedTargets.sentinel}
            onCheckedChange={() => onToggleTarget('sentinel')}
          />
          <Label htmlFor="sentinel" className="cursor-pointer">Microsoft Sentinel</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="qradar" 
            checked={selectedTargets.qradar}
            onCheckedChange={() => onToggleTarget('qradar')}
          />
          <Label htmlFor="qradar" className="cursor-pointer">IBM QRadar</Label>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-0.5">
          <Label htmlFor="auto-optimize">Auto-optimize for each platform</Label>
          <p className="text-xs text-gray-400">
            CatchAttack will automatically optimize the rule for each SIEM platform
          </p>
        </div>
        <Checkbox 
          id="auto-optimize" 
          checked={autoOptimize}
          onCheckedChange={(checked) => onAutoOptimizeChange(!!checked)}
        />
      </div>
      
      <DialogFooter className="sm:justify-end pt-2">
        <Button 
          onClick={closeDialog} 
          variant="outline"
          disabled={isDeploying}
        >
          Cancel
        </Button>
        <Button 
          onClick={autoOptimize ? onStartOptimization : onDeploy}
          disabled={isDeploying || !anyTargetSelected}
        >
          {isDeploying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : autoOptimize ? (
            <>
              <Settings className="mr-2 h-4 w-4" />
              Optimize & Deploy
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Deploy
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default DeployTargetsTab;
