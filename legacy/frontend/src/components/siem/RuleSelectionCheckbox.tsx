
import { Checkbox } from "@/components/ui/checkbox";

interface RuleSelectionCheckboxProps {
  id: string;
  isSelected: boolean;
  isDisabled: boolean;
  onToggleSelect: (id: string) => void;
}

const RuleSelectionCheckbox = ({
  id,
  isSelected,
  isDisabled,
  onToggleSelect
}: RuleSelectionCheckboxProps) => {
  return (
    <div className="pt-1 pr-3">
      <Checkbox 
        id={id} 
        checked={isSelected}
        onCheckedChange={() => onToggleSelect(id)}
        className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
        disabled={isDisabled}
      />
    </div>
  );
};

export default RuleSelectionCheckbox;
