
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, Shield, XCircle } from "lucide-react";

interface StatusBadgeProps {
  type: 'coverage' | 'detection' | 'alert' | 'error';
  value: string | number;
  label?: string;
  tooltipText?: string;
}

export const StatusBadge = ({ type, value, label, tooltipText }: StatusBadgeProps) => {
  const getIcon = () => {
    switch (type) {
      case 'coverage': return <Shield className="h-3.5 w-3.5 mr-1" />;
      case 'detection': return <CheckCircle className="h-3.5 w-3.5 mr-1" />;
      case 'alert': return <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
      case 'error': return <XCircle className="h-3.5 w-3.5 mr-1" />;
      default: return null;
    }
  };
  
  const getVariant = () => {
    switch (type) {
      case 'coverage': return "outline";
      case 'detection': return "secondary";
      case 'alert': return "default";
      case 'error': return "destructive";
      default: return "default";
    }
  };

  const badge = (
    <Badge variant={getVariant()} className="flex items-center">
      {getIcon()}
      {label && <span className="mr-1">{label}:</span>}
      <span>{value}</span>
    </Badge>
  );

  if (tooltipText) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
};

export default StatusBadge;
