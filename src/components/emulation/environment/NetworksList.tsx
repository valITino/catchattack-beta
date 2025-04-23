
import { Badge } from "@/components/ui/badge";
import { NetworkSegment } from "../VirtualizedEnvironment";

interface NetworksListProps {
  networks: NetworkSegment[];
}

const NetworksList = ({ networks }: NetworksListProps) => {
  return (
    <div className="space-y-2">
      {networks.map((network) => (
        <div key={network.id} className="border border-cyber-primary/20 rounded-md p-3">
          <h4 className="font-medium">{network.name}</h4>
          <div className="mt-2">
            <div className="text-xs text-gray-400">Connected Devices:</div>
            <p className="text-sm">{network.devices.join(", ")}</p>
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-400">Security Controls:</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {network.securityControls.map((control, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {control}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NetworksList;
