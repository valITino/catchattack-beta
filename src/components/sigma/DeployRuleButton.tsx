
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SigmaRule } from "@/utils/mitreAttackUtils";
import { Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import DeploymentDialog from "./DeploymentDialog";

interface DeployRuleButtonProps {
  rule: SigmaRule;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const DeployRuleButton = ({ 
  rule, 
  variant = "default", 
  size = "default",
  className
}: DeployRuleButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog} 
        variant={variant}
        size={size}
        disabled={rule.deployed}
        className={`${rule.deployed ? "opacity-50 cursor-not-allowed" : ""} ${className || ""}`}
      >
        <Upload className={`${size !== "icon" ? "mr-2" : ""} h-4 w-4`} />
        {size !== "icon" && (rule.deployed ? "Deployed" : "Deploy to SIEM")}
      </Button>

      <DeploymentDialog
        rule={rule}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
};

export default DeployRuleButton;
