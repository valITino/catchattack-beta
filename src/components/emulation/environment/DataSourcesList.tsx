
import { Badge } from "@/components/ui/badge";
import { DataSource } from "../VirtualizedEnvironment";

interface DataSourcesListProps {
  dataSources: DataSource[];
}

const DataSourcesList = ({ dataSources }: DataSourcesListProps) => {
  return (
    <div className="space-y-2">
      {dataSources.map((source) => (
        <div key={source.id} className="border border-cyber-primary/20 rounded-md p-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{source.name}</h4>
              <p className="text-sm text-gray-400">{source.type}</p>
            </div>
            {source.sampleAvailable && (
              <Badge className="bg-cyber-success/10 text-cyber-success border-cyber-success">
                Sample Available
              </Badge>
            )}
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-400">Format:</div>
            <Badge variant="secondary" className="mt-1 text-xs">
              {source.format}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DataSourcesList;
