
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import { GeneratorOption } from "../types/generator";

interface GeneratorOptionsProps {
  options: GeneratorOption[];
  selectedOption: string;
  onSelectOption: (optionId: string) => void;
}

const GeneratorOptions = ({ options, selectedOption, onSelectOption }: GeneratorOptionsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {options.map(option => (
        <div 
          key={option.id}
          className={`border rounded-md p-4 cursor-pointer transition-all ${
            selectedOption === option.id 
              ? "border-cyber-primary bg-cyber-primary/10" 
              : "border-cyber-primary/20 hover:border-cyber-primary/50"
          }`}
          onClick={() => onSelectOption(option.id)}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium">{option.name}</h3>
            <Badge variant="outline" className="bg-cyber-darker/50">
              {option.category}
            </Badge>
          </div>
          <p className="text-sm text-gray-400 mb-2">{option.description}</p>
          {option.model && (
            <div className="flex items-center text-xs text-gray-500">
              <Brain className="h-3 w-3 mr-1" />
              {option.model}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GeneratorOptions;
