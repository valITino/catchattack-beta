
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCode2, AlertTriangle, Shield, Play } from "lucide-react";

interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

interface RecentActivityCardProps {
  activities: Activity[];
}

const RecentActivityCard = ({ activities }: RecentActivityCardProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "rule-generated":
        return <FileCode2 className="h-4 w-4 text-cyber-primary" />;
      case "vulnerability-detected":
        return <AlertTriangle className="h-4 w-4 text-cyber-danger" />;
      case "rule-deployed":
        return <Shield className="h-4 w-4 text-cyber-success" />;
      case "emulation-started":
        return <Play className="h-4 w-4 text-cyber-warning" />;
      default:
        return <FileCode2 className="h-4 w-4 text-cyber-primary" />;
    }
  };

  return (
    <Card className="cyber-card">
      <CardHeader className="pb-2">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-cyber-primary/10 mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="space-y-1">
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm text-gray-400">{activity.description}</p>
              <p className="text-xs text-gray-500">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;
