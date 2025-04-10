
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Clock, PlayCircle, Repeat, ShieldCheck, Shuffle, AlarmClock, Activity, Terminal, CheckSquare2 } from "lucide-react";
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
  autoDeployRules: boolean;
  terminationConditions: {
    maxDuration: number;
    stopOnDetection: boolean;
    detectionThreshold: number;
  };
  notification: {
    email: boolean;
    slack: boolean;
    recipients: string[];
  };
}

const EmulationScheduler = ({ onSchedule }: EmulationSchedulerProps) => {
  const [date, setDate] = useState<Date>();
  const [frequency, setFrequency] = useState<string>("once");
  const [time, setTime] = useState<string>("09:00");
  const [randomize, setRandomize] = useState<boolean>(false);
  const [days, setDays] = useState<string[]>([]);
  const [autoGenerateRules, setAutoGenerateRules] = useState<boolean>(true);
  const [autoDeployRules, setAutoDeployRules] = useState<boolean>(false);
  
  // New: Advanced automation settings
  const [maxDuration, setMaxDuration] = useState<number>(60); // minutes
  const [stopOnDetection, setStopOnDetection] = useState<boolean>(true);
  const [detectionThreshold, setDetectionThreshold] = useState<number>(3);
  const [notifyEmail, setNotifyEmail] = useState<boolean>(true);
  const [notifySlack, setNotifySlack] = useState<boolean>(false);
  const [recipients, setRecipients] = useState<string>("security-team@catchattack.com");
  
  const [currentTab, setCurrentTab] = useState<string>("basic");

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
      autoGenerateRules,
      autoDeployRules,
      terminationConditions: {
        maxDuration,
        stopOnDetection,
        detectionThreshold
      },
      notification: {
        email: notifyEmail,
        slack: notifySlack,
        recipients: recipients.split(',').map(r => r.trim()).filter(r => r !== '')
      }
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
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="basic">
              <Clock className="h-4 w-4 mr-2" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Terminal className="h-4 w-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 pt-4">
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
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <AlarmClock className="h-4 w-4 mr-2 text-cyber-primary" />
                Termination Conditions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-duration">Maximum Duration (minutes)</Label>
                  <Input
                    id="max-duration"
                    type="number"
                    min={1}
                    max={1440}
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(parseInt(e.target.value) || 60)}
                    className="bg-cyber-darker border-cyber-primary/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="detection-threshold">Detection Threshold</Label>
                  <Input
                    id="detection-threshold"
                    type="number"
                    min={1}
                    max={100}
                    value={detectionThreshold}
                    onChange={(e) => setDetectionThreshold(parseInt(e.target.value) || 3)}
                    className="bg-cyber-darker border-cyber-primary/20"
                    disabled={!stopOnDetection}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="stop-on-detection">Stop on Detection</Label>
                  <p className="text-sm text-gray-400">
                    Automatically stop the emulation if detected by security controls
                  </p>
                </div>
                <Switch
                  id="stop-on-detection"
                  checked={stopOnDetection}
                  onCheckedChange={setStopOnDetection}
                  className="data-[state=checked]:bg-cyber-primary"
                />
              </div>
              
              <div className="border-t border-cyber-primary/20 pt-4 space-y-4">
                <h3 className="text-sm font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-cyber-primary" />
                  Automation Actions
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-deploy">Auto-Deploy Generated Rules</Label>
                    <p className="text-sm text-gray-400">
                      Automatically deploy generated rules to connected SIEM platforms
                    </p>
                  </div>
                  <Switch
                    id="auto-deploy"
                    checked={autoDeployRules}
                    onCheckedChange={setAutoDeployRules}
                    className="data-[state=checked]:bg-cyber-primary"
                    disabled={!autoGenerateRules}
                  />
                </div>
              </div>
              
              <div className="border-t border-cyber-primary/20 pt-4 space-y-4">
                <h3 className="text-sm font-medium flex items-center">
                  <CheckSquare2 className="h-4 w-4 mr-2 text-cyber-primary" />
                  Notifications
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-email">Email Notifications</Label>
                    <p className="text-sm text-gray-400">
                      Send email when emulation starts and completes
                    </p>
                  </div>
                  <Switch
                    id="notify-email"
                    checked={notifyEmail}
                    onCheckedChange={setNotifyEmail}
                    className="data-[state=checked]:bg-cyber-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-slack">Slack Notifications</Label>
                    <p className="text-sm text-gray-400">
                      Send Slack notifications for emulation events
                    </p>
                  </div>
                  <Switch
                    id="notify-slack"
                    checked={notifySlack}
                    onCheckedChange={setNotifySlack}
                    className="data-[state=checked]:bg-cyber-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipients">Notification Recipients</Label>
                  <Input
                    id="recipients"
                    placeholder="email@example.com, #slack-channel"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    className="bg-cyber-darker border-cyber-primary/20"
                  />
                  <p className="text-xs text-gray-400">
                    Comma-separated emails or Slack channels
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
