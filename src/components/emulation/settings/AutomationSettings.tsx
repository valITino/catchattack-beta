
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface AutomationSettingsProps {
  autoGenerateRules: boolean;
  autoPushToSiem: boolean;
  onAutoGenerateRulesChange: (value: boolean) => void;
  onAutoPushToSiemChange: (value: boolean) => void;
}

export function AutomationSettings({
  autoGenerateRules,
  autoPushToSiem,
  onAutoGenerateRulesChange,
  onAutoPushToSiemChange
}: AutomationSettingsProps) {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle>Automation Settings</CardTitle>
        <CardDescription>Configure post-emulation actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-generate">Auto-Generate Sigma Rules</Label>
            <p className="text-sm text-gray-400">
              Automatically create detection rules from discovered vulnerabilities
            </p>
          </div>
          <Switch 
            id="auto-generate"
            checked={autoGenerateRules}
            onCheckedChange={onAutoGenerateRulesChange}
            className="data-[state=checked]:bg-cyber-primary"
          />
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-push">Auto-Push Rules to SIEM</Label>
            <p className="text-sm text-gray-400">
              Push generated rules to connected SIEM platforms automatically
            </p>
          </div>
          <Switch 
            id="auto-push"
            checked={autoPushToSiem}
            onCheckedChange={onAutoPushToSiemChange}
            className="data-[state=checked]:bg-cyber-primary"
          />
        </div>
      </CardContent>
    </Card>
  );
}
