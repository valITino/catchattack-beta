
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
