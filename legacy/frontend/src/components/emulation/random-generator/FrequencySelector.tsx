
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FrequencySelectorProps {
  frequency: string;
  onFrequencyChange: (value: string) => void;
}

const FrequencySelector = ({ frequency, onFrequencyChange }: FrequencySelectorProps) => {
  return (
    <Select value={frequency} onValueChange={onFrequencyChange}>
      <SelectTrigger className="bg-cyber-darker border-cyber-primary/20">
        <SelectValue placeholder="Select frequency" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="hourly">Hourly</SelectItem>
        <SelectItem value="daily">Daily</SelectItem>
        <SelectItem value="weekly">Weekly</SelectItem>
        <SelectItem value="monthly">Monthly</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default FrequencySelector;
