
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link, Link2Off, RefreshCw, Unlink } from "lucide-react";
import { SiemPlatform, connectToSiem } from "@/utils/siemUtils";

interface PlatformSettingsProps {
  selectedPlatform: SiemPlatform | null;
}

const PlatformSettings = ({ selectedPlatform }: PlatformSettingsProps) => {
  const [autoDeployRules, setAutoDeployRules] = useState(false);

  // Reset state when platform changes
  useEffect(() => {
    setAutoDeployRules(false);
  }, [selectedPlatform?.id]);

  if (!selectedPlatform) {
    return null;
  }

  return (
    <Card className="cyber-card">
      <CardHeader className="pb-2">
        <CardTitle>Platform Settings</CardTitle>
        <CardDescription>Configure integration options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedPlatform.connected ? (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-deploy">Auto-Deploy Rules</Label>
                <p className="text-sm text-gray-400">
                  Automatically deploy new rules
                </p>
              </div>
              <Switch 
                id="auto-deploy"
                checked={autoDeployRules}
                onCheckedChange={setAutoDeployRules}
                className="data-[state=checked]:bg-cyber-primary"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="rule-format">Rule Format</Label>
              <Select defaultValue="native">
                <SelectTrigger id="rule-format" className="bg-cyber-darker border-cyber-primary/20">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="native">Native Format</SelectItem>
                  <SelectItem value="sigma">Sigma Format</SelectItem>
                  <SelectItem value="custom">Custom Mapping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-2 flex justify-between">
              <Button variant="outline" className="border-cyber-danger text-cyber-danger hover:bg-cyber-danger/10">
                <Unlink className="h-4 w-4 mr-2" /> Disconnect
              </Button>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Sync Now
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-4">
              <Link2Off className="h-12 w-12 text-gray-500 mx-auto mb-2" />
              <h3 className="font-medium">Not Connected</h3>
              <p className="text-sm text-gray-400 mb-4">
                This SIEM platform is not currently connected
              </p>
              <Button 
                onClick={() => connectToSiem(selectedPlatform.id, selectedPlatform.name)}
                className="bg-cyber-primary hover:bg-cyber-primary/90"
              >
                <Link className="h-4 w-4 mr-2" /> Connect Platform
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformSettings;
