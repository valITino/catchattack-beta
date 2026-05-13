
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ComplexitySelectorProps {
  complexity: string;
  onComplexityChange: (value: string) => void;
}

const ComplexitySelector = ({ complexity, onComplexityChange }: ComplexitySelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="complexity">Complexity</Label>
      <Select
        value={complexity}
        onValueChange={onComplexityChange}
      >
        <SelectTrigger id="complexity" className="bg-cyber-darker border-cyber-primary/20">
          <SelectValue placeholder="Select complexity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low - Basic TTPs</SelectItem>
          <SelectItem value="medium">Medium - Standard TTPs</SelectItem>
          <SelectItem value="high">High - Advanced TTPs</SelectItem>
          <SelectItem value="apts">APT - Nation State Level</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ComplexitySelector;
