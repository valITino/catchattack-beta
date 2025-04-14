
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, Shield, XCircle, Info } from "lucide-react";

export type StatusBadgeType = 'coverage' | 'detection' | 'alert' | 'error' | 'info';
export type BadgeVariant = "outline" | "secondary" | "default" | "destructive";

interface StatusBadgeProps {
  type: StatusBadgeType;
  value: string | number;
  label?: string;
  tooltipText?: string;
  animate?: boolean;
  onClick?: () => void;
}

export const StatusBadge = ({ type, value, label, tooltipText, animate = false, onClick }: StatusBadgeProps) => {
  const getIcon = () => {
    switch (type) {
      case 'coverage': return <Shield className="h-3.5 w-3.5 mr-1" />;
      case 'detection': return <CheckCircle className="h-3.5 w-3.5 mr-1" />;
      case 'alert': return <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
      case 'error': return <XCircle className="h-3.5 w-3.5 mr-1" />;
      case 'info': return <Info className="h-3.5 w-3.5 mr-1" />;
      default: return null;
    }
  };
  
  const getVariant = (): BadgeVariant => {
    switch (type) {
      case 'coverage': return "outline";
      case 'detection': return "secondary";
      case 'info': return "secondary";
      case 'alert': return "default";
      case 'error': return "destructive";
      default: return "default";
    }
  };

  const badgeClasses = `flex items-center ${animate ? 'animate-pulse' : ''} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`;
  
  const badge = (
    <Badge variant={getVariant()} className={badgeClasses} onClick={onClick}>
      {getIcon()}
      {label && <span className="mr-1">{label}:</span>}
      <span>{value}</span>
    </Badge>
  );

  if (tooltipText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};

// Badge Group component for showing multiple badges in a consistent way
export const StatusBadgeGroup: React.FC<{
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
}> = ({ children, spacing = 'md' }) => {
  const spacingClasses = {
    sm: 'space-x-1',
    md: 'space-x-2',
    lg: 'space-x-3',
  };

  return (
    <div className={`flex flex-wrap items-center ${spacingClasses[spacing]}`}>
      {children}
    </div>
  );
};

export default StatusBadge;
