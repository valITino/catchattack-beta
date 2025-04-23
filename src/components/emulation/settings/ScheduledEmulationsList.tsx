
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { EmulationSchedule } from "@/components/emulation/EmulationScheduler";

interface ScheduledEmulationsListProps {
  emulations: EmulationSchedule[];
  onDelete: (index: number) => void;
}

export function ScheduledEmulationsList({ emulations, onDelete }: ScheduledEmulationsListProps) {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle>Scheduled Emulations</CardTitle>
        <CardDescription>List of upcoming emulation runs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {emulations.length > 0 ? (
          emulations.map((schedule, index) => (
            <div key={index} className="p-3 border border-cyber-primary/20 rounded-md">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">
                    {schedule.frequency === "once" ? "One-time" : schedule.frequency} emulation
                  </h3>
                  <p className="text-sm text-gray-400">
                    {schedule.frequency === "once" && schedule.startDate 
                      ? `On ${schedule.startDate.toLocaleDateString()} at ${schedule.time}` 
                      : `Every ${schedule.frequency === "daily" ? "day" : 
                         schedule.frequency === "weekly" ? "week" : "month"} at ${schedule.time}`}
                  </p>
                  {schedule.days.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {schedule.days.map(day => (
                        <Badge key={day} variant="outline" className="text-xs">{day.substring(0,3)}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => onDelete(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {schedule.randomize && (
                  <Badge className="bg-cyber-accent/10 border-cyber-accent text-xs">Randomized</Badge>
                )}
                {schedule.autoGenerateRules && (
                  <Badge className="bg-cyber-success/10 border-cyber-success text-xs">Auto-rules</Badge>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 p-6">
            No scheduled emulations yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
