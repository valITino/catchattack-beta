
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { CalendarIcon, Clock, PlayCircle, Repeat, ShieldCheck, Shuffle } from "lucide-react";
import { format } from "date-fns";

interface EmulationSchedulerProps {
  onSchedule: (schedule: EmulationSchedule) => void;
}

export interface EmulationSchedule {
  frequency: string;
  randomize: boolean;
  startDate: Date | undefined;
  time: string;
  days: string[];
  autoGenerateRules: boolean;
}

const EmulationScheduler = ({ onSchedule }: EmulationSchedulerProps) => {
  const [date, setDate] = useState<Date>();
  const [frequency, setFrequency] = useState<string>("once");
  const [time, setTime] = useState<string>("09:00");
  const [randomize, setRandomize] = useState<boolean>(false);
  const [days, setDays] = useState<string[]>([]);
  const [autoGenerateRules, setAutoGenerateRules] = useState<boolean>(true);

  const toggleDay = (day: string) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const handleSchedule = () => {
    if (frequency !== "once" && days.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one day for recurring emulations",
        variant: "destructive",
      });
      return;
    }

    if (!date && frequency === "once") {
      toast({
        title: "Validation Error",
        description: "Please select a start date",
        variant: "destructive",
      });
      return;
    }

    const schedule: EmulationSchedule = {
      frequency,
      randomize,
      startDate: date,
      time,
      days,
      autoGenerateRules
    };

    onSchedule(schedule);
    
    toast({
      title: "Emulation Scheduled",
      description: `Emulation will run ${frequency === "once" ? "once" : frequency} ${frequency === "once" ? `on ${format(date!, "PPP")}` : ""} at ${time}`,
    });
  };

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyber-primary" />
          Schedule Emulation
        </CardTitle>
        <CardDescription>
          Set up automated emulation runs to continually test your defenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select
            value={frequency}
            onValueChange={setFrequency}
          >
            <SelectTrigger id="frequency" className="bg-cyber-darker border-cyber-primary/20">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once">Once</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {frequency !== "once" && (
          <div className="space-y-2">
            <Label>Days</Label>
            <div className="flex flex-wrap gap-2">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <Badge
                  key={day}
                  variant={days.includes(day) ? "default" : "outline"}
                  className={`cursor-pointer ${days.includes(day) ? "bg-cyber-primary" : "border-cyber-primary/40"}`}
                  onClick={() => toggleDay(day)}
                >
                  {day.substring(0, 3)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal bg-cyber-darker border-cyber-primary/20 ${!date && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-cyber-darker border-cyber-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="space-y-0.5">
            <Label htmlFor="randomize">Randomize Techniques</Label>
            <p className="text-sm text-gray-400">
              Randomly select techniques for each run to simulate diverse attacks
            </p>
          </div>
          <Switch
            id="randomize"
            checked={randomize}
            onCheckedChange={setRandomize}
            className="data-[state=checked]:bg-cyber-primary"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="space-y-0.5">
            <Label htmlFor="generate-rules">Auto-Generate Sigma Rules</Label>
            <p className="text-sm text-gray-400">
              Automatically create detection rules after emulation completes
            </p>
          </div>
          <Switch
            id="generate-rules"
            checked={autoGenerateRules}
            onCheckedChange={setAutoGenerateRules}
            className="data-[state=checked]:bg-cyber-primary"
          />
        </div>

        <Button 
          onClick={handleSchedule} 
          className="w-full mt-4 bg-cyber-primary hover:bg-cyber-primary/90"
        >
          <PlayCircle className="mr-2 h-4 w-4" /> Schedule Emulation
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmulationScheduler;
