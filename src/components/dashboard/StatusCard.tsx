
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
}

const StatusCard = ({ title, value, icon, trend, trendUp }: StatusCardProps) => {
  return (
    <Card className="cyber-card border border-cyber-primary/20">
      <CardContent className="py-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <span className="text-gray-400 text-sm">{title}</span>
          <div className="p-2 bg-cyber-primary/10 rounded-full">
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold mb-2">{value}</div>
        <div className={`flex items-center text-xs ${trendUp ? 'text-cyber-success' : 'text-cyber-danger'}`}>
          {trendUp ? (
            <ArrowUp className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDown className="h-3 w-3 mr-1" />
          )}
          <span>{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusCard;
