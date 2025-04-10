
import { toast } from "@/components/ui/use-toast";

// Platform status types
export type SiemStatus = "healthy" | "warning" | "error" | "disconnected";

// SIEM platform interface
export interface SiemPlatform {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  lastSync: string | null;
  rulesDeployed: number;
  status: SiemStatus;
}

// Deployable rule interface
export interface DeployableRule {
  id: string;
  title: string;
  description: string;
  severity: string;
  source: string;
  deployedTo: string[];
  dateCreated: string;
}

// Connect to SIEM platform
export const connectToSiem = async (platformId: string, platformName: string) => {
  toast({
    title: "Connection Initiated",
    description: `Setting up connection to ${platformName}`,
  });
  
  // Simulate API call
  return new Promise<{ success: boolean, message: string }>((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: `Successfully connected to ${platformName}` });
    }, 2000);
  });
};

// Deploy sigma rule to SIEM platform
export const deploySigmaRuleToSiem = async (
  ruleId: string, 
  platformId: string
): Promise<{ success: boolean; message: string }> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ 
        success: true, 
        message: `Rule ${ruleId} deployed to platform ${platformId}` 
      });
    }, 1500);
  });
};

// Bulk deploy rules to SIEM platform
export const bulkDeployRules = async (
  ruleIds: string[], 
  platformId: string,
  platformName: string
): Promise<{ success: boolean; deployedCount: number; failedCount: number }> => {
  toast({
    title: "Bulk Deployment Started",
    description: `Deploying ${ruleIds.length} rules to ${platformName}`,
  });
  
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate some success and some failures
      const successCount = Math.floor(ruleIds.length * 0.9);
      const failureCount = ruleIds.length - successCount;
      
      resolve({ 
        success: successCount > 0, 
        deployedCount: successCount,
        failedCount: failureCount
      });
    }, 2000);
  });
};

// Get status color based on platform status
export const getStatusColor = (status: SiemStatus): string => {
  switch (status) {
    case "healthy":
      return "text-cyber-success";
    case "warning":
      return "text-cyber-warning";
    case "error":
      return "text-cyber-danger";
    default:
      return "text-gray-400";
  }
};

// Get severity color for badges
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case "critical":
      return "bg-cyber-danger/20 text-cyber-danger border-cyber-danger";
    case "high":
      return "bg-red-900/20 text-red-400 border-red-900";
    case "medium":
      return "bg-cyber-warning/20 text-cyber-warning border-cyber-warning";
    case "low":
      return "bg-cyber-info/20 text-cyber-info border-cyber-info";
    default:
      return "bg-gray-600/20 text-gray-400 border-gray-600";
  }
};
