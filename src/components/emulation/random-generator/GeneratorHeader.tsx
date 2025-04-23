
import { Dices, Settings2 } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GeneratorHeaderProps {
  automated?: boolean;
}

const GeneratorHeader = ({ automated = false }: GeneratorHeaderProps) => {
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {automated ? (
          <Settings2 className="h-5 w-5 text-cyber-primary" />
        ) : (
          <Dices className="h-5 w-5 text-cyber-primary" />
        )}
        {automated ? "Automated Emulation Pipeline" : "Random Emulation Generator"}
      </CardTitle>
      <CardDescription>
        {automated 
          ? "Configure automated emulation pipelines with CI/CD integration"
          : "Generate random attack patterns based on MITRE ATT&CK"
        }
      </CardDescription>
    </CardHeader>
  );
};

export default GeneratorHeader;

