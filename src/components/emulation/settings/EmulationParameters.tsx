
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmulationParametersProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  duration: string;
  onDurationChange: (value: string) => void;
}

export function EmulationParameters({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  duration,
  onDurationChange
}: EmulationParametersProps) {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle>Emulation Parameters</CardTitle>
        <CardDescription>Define the emulation details and scope</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Emulation Name</Label>
          <Input 
            id="name" 
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="bg-cyber-darker border-cyber-primary/20"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="min-h-[100px] bg-cyber-darker border-cyber-primary/20"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Select value={duration} onValueChange={onDurationChange}>
            <SelectTrigger className="bg-cyber-darker border-cyber-primary/20">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
