
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface TacticsListProps {
  selectedTactics: string[];
  onTacticToggle: (tacticId: string) => void;
}

// Mock data for tactics (moved from parent)
const tactics = [
  { id: "TA0001", name: "Initial Access", selected: true },
  { id: "TA0002", name: "Execution", selected: true },
  { id: "TA0003", name: "Persistence", selected: true },
  { id: "TA0004", name: "Privilege Escalation", selected: true },
  { id: "TA0005", name: "Defense Evasion", selected: true },
  { id: "TA0006", name: "Credential Access", selected: false },
  { id: "TA0007", name: "Discovery", selected: false },
  { id: "TA0008", name: "Lateral Movement", selected: false },
  { id: "TA0009", name: "Collection", selected: false },
  { id: "TA0010", name: "Exfiltration", selected: false },
  { id: "TA0011", name: "Command and Control", selected: false },
  { id: "TA0040", name: "Impact", selected: false },
];

const TacticsList = ({ selectedTactics, onTacticToggle }: TacticsListProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {tactics.map((tactic) => (
        <div key={tactic.id} className="flex items-center space-x-2">
          <Checkbox 
            id={tactic.id}
            checked={selectedTactics.includes(tactic.id)}
            onCheckedChange={() => onTacticToggle(tactic.id)}
            className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
          />
          <div>
            <Label 
              htmlFor={tactic.id}
              className="font-medium cursor-pointer"
            >
              {tactic.name}
            </Label>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TacticsList;
