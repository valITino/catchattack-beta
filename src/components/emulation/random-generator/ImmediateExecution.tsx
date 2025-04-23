
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ImmediateExecutionProps {
  immediate: boolean;
  onImmediateChange: (checked: boolean) => void;
}

const ImmediateExecution = ({ immediate, onImmediateChange }: ImmediateExecutionProps) => {
  return (
    <div className="flex items-center space-x-2 pt-2">
      <Checkbox 
        id="immediate"
        checked={immediate}
        onCheckedChange={(checked) => onImmediateChange(checked as boolean)}
        className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
      />
      <Label htmlFor="immediate" className="cursor-pointer">
        Execute immediately after generation
      </Label>
    </div>
  );
};

export default ImmediateExecution;
