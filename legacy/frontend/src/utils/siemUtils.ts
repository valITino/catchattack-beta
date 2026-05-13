
/**
 * SIEM Platform Interface
 */
export interface SiemPlatform {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  status: string;
  rulesDeployed: number;
  lastSync: string | null;
}

/**
 * Deployable Rule Interface
 */
export interface DeployableRule {
  id: string;
  title: string;
  description: string;
  severity: string;
  source: string;
  dateCreated: string;
  deployedTo: string[];
}

/**
 * Gets the appropriate color styling for a severity level
 * @param severity The severity level as a string
 * @returns CSS class string for styling
 */
export const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return "bg-cyber-danger/20 text-cyber-danger border-cyber-danger";
    case 'high':
      return "bg-red-900/20 text-red-400 border-red-900";
    case 'medium':
      return "bg-cyber-warning/20 text-cyber-warning border-cyber-warning";
    case 'low':
      return "bg-cyber-info/20 text-cyber-info border-cyber-info";
    default:
      return "bg-gray-600/20 text-gray-400 border-gray-600";
  }
};

/**
 * Gets the appropriate color styling for a status level
 * @param status The status level as a string
 * @returns CSS class string for styling
 */
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'online':
    case 'connected':
      return "text-cyber-success";
    case 'warning':
    case 'degraded':
      return "text-cyber-warning";
    case 'error':
    case 'offline':
    case 'disconnected':
      return "text-cyber-danger";
    default:
      return "text-gray-400";
  }
};

/**
 * Connect to a SIEM platform
 * @param platformId The SIEM platform ID
 * @param platformName The SIEM platform name
 * @returns Connection result
 */
export const connectToSiem = async (platformId: string, platformName: string): Promise<{success: boolean; message: string}> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for demo purposes
      
      resolve({
        success,
        message: success 
          ? `Successfully connected to ${platformName}` 
          : `Failed to connect to ${platformName}: Authentication error`
      });
    }, 1500);
  });
};

/**
 * Deploy a Sigma rule to a SIEM platform
 * @param ruleId The rule ID to deploy
 * @param platformId The platform ID to deploy to
 * @returns Deployment result
 */
export const deploySigmaRuleToSiem = async (ruleId: string, platformId: string): Promise<{success: boolean; message: string}> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate for demo purposes
      
      resolve({
        success,
        message: success 
          ? `Rule deployed successfully to platform ${platformId}` 
          : `Failed to deploy rule to platform ${platformId}: Invalid rule format`
      });
    }, 2000);
  });
};

/**
 * Optimizes a rule for a specific SIEM platform
 * @param ruleContent The rule content as string
 * @param siemPlatform The SIEM platform to optimize for
 * @returns Optimization results
 */
export const optimizeRuleForSiem = async (ruleContent: string, siemPlatform: string) => {
  // Simulate an API call
  return new Promise<{optimized: string; changes: string[]}>((resolve) => {
    setTimeout(() => {
      resolve({
        optimized: ruleContent,
        changes: [
          "Added platform-specific field mappings",
          "Optimized detection logic for better performance",
          "Applied platform-specific syntax"
        ]
      });
    }, 1000);
  });
};

/**
 * Validates a rule in the target environment
 * @param ruleId The rule ID to validate
 * @param environment The environment to validate against
 * @returns Validation results
 */
export const validateRuleInEnvironment = async (ruleId: string, environment: string) => {
  // Simulate an API call
  return new Promise<{valid: boolean; falsePositives: number; potentialImpact: string}>((resolve) => {
    setTimeout(() => {
      resolve({
        valid: Math.random() > 0.3,
        falsePositives: Math.floor(Math.random() * 5),
        potentialImpact: ["low", "medium", "high"][Math.floor(Math.random() * 3)]
      });
    }, 800);
  });
};
