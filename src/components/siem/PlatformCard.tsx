
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2Off, RefreshCw, Unlink } from "lucide-react";
import { SiemPlatform, getStatusColor, connectToSiem } from "@/utils/siemUtils";
import { toast } from "@/components/ui/use-toast";

interface PlatformCardProps {
  platform: SiemPlatform;
  isSelected: boolean;
  onSelect: (platformId: string) => void;
}

const PlatformCard = ({ platform, isSelected, onSelect }: PlatformCardProps) => {
  const handleConnectPlatform = async () => {
    const result = await connectToSiem(platform.id, platform.name);
    if (result.success) {
      toast({
        title: "Connection Successful",
        description: result.message,
      });
    } else {
      toast({
        title: "Connection Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };
  
  const handleSyncPlatform = () => {
    toast({
      title: "Sync Initiated",
      description: `Synchronizing with ${platform.name}`,
    });
  };

  return (
    <div
      className={`p-3 border rounded-md cursor-pointer ${
        isSelected
          ? "border-cyber-primary bg-cyber-primary/10"
          : "border-cyber-primary/20 hover:border-cyber-primary/50"
      }`}
      onClick={() => onSelect(platform.id)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{platform.name}</h3>
          <p className="text-xs text-gray-400">{platform.description}</p>
        </div>
        {platform.connected ? (
          <Badge className="bg-cyber-success/20 text-cyber-success border-cyber-success">
            Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="text-gray-400">
            Disconnected
          </Badge>
        )}
      </div>
      
      {platform.connected && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-400">Rules: </span>
            <span>{platform.rulesDeployed}</span>
          </div>
          <div>
            <span className="text-gray-400">Status: </span>
            <span className={getStatusColor(platform.status)}>
              {platform.status.charAt(0).toUpperCase() + platform.status.slice(1)}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">Last Sync: </span>
            <span>
              {platform.lastSync 
                ? new Date(platform.lastSync).toLocaleString() 
                : "Never"}
            </span>
          </div>
        </div>
      )}
      
      {!platform.connected && isSelected && (
        <div className="mt-2">
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleConnectPlatform();
            }}
            className="w-full bg-cyber-primary hover:bg-cyber-primary/90"
          >
            Connect
          </Button>
        </div>
      )}
      
      {platform.connected && isSelected && (
        <div className="mt-2 flex justify-between gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="border-cyber-danger text-cyber-danger hover:bg-cyber-danger/10"
            onClick={(e) => {
              e.stopPropagation();
              toast({
                title: "Platform Disconnected",
                description: `Disconnected from ${platform.name}`,
              });
            }}
          >
            <Unlink className="h-3 w-3 mr-1" /> Disconnect
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleSyncPlatform();
            }}
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Sync
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlatformCard;
