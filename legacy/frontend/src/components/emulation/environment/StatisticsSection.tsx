
import { Server, Database, Shield } from "lucide-react";
import { VirtualEnvironment } from "../VirtualizedEnvironment";

interface StatisticsSectionProps {
  environment: VirtualEnvironment;
}

const StatisticsSection = ({ environment }: StatisticsSectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border border-cyber-primary/20 rounded-md p-4">
        <div className="flex items-center gap-2 mb-2">
          <Server className="h-4 w-4 text-cyber-primary" />
          <h3 className="font-medium">Virtual Machines</h3>
        </div>
        <div className="text-2xl font-bold">{environment.vms.length}</div>
        <p className="text-sm text-gray-400">Active systems</p>
      </div>
      
      <div className="border border-cyber-primary/20 rounded-md p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-cyber-primary" />
          <h3 className="font-medium">Data Sources</h3>
        </div>
        <div className="text-2xl font-bold">{environment.dataSources.length}</div>
        <p className="text-sm text-gray-400">Log providers</p>
      </div>
      
      <div className="border border-cyber-primary/20 rounded-md p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-cyber-primary" />
          <h3 className="font-medium">Vulnerabilities</h3>
        </div>
        <div className="text-2xl font-bold">
          {environment.vms.reduce((sum, vm) => sum + vm.vulnerabilities, 0)}
        </div>
        <p className="text-sm text-gray-400">Detected issues</p>
      </div>
    </div>
  );
};

export default StatisticsSection;
