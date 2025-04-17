
import { toast } from "@/components/ui/use-toast";
import { MitreAttackTechnique, SigmaRule } from "./types";
import { generateUUID } from "./helpers";

// Storage for existing rules to prevent duplicates
const existingRules: Record<string, SigmaRule> = {};

// Check if a rule with similar content already exists
export const checkRuleExists = (techniqueId: string, title: string): SigmaRule | null => {
  // Check by technique ID
  const existingByTechnique = Object.values(existingRules).find(
    rule => rule.technique.id === techniqueId && 
    rule.title.toLowerCase().includes(title.toLowerCase().split(':')[0])
  );
  
  return existingByTechnique || null;
};

// Generate Sigma rule from detected activity
export const generateSigmaRule = (technique: MitreAttackTechnique): SigmaRule => {
  // Check if a similar rule already exists
  const existingRule = checkRuleExists(technique.id, `Detecting ${technique.name}`);
  
  if (existingRule) {
    toast({
      title: "Rule Already Exists",
      description: `A rule for ${technique.name} already exists with ID: ${existingRule.id}`,
      variant: "default",
    });
    return existingRule;
  }
  
  // In a real implementation, this would use a template system and AI/ML
  // to generate proper Sigma rules based on the technique and observed behavior
  
  // Generate a unique ID
  const ruleId = generateUUID();
  
  // Mock implementation to simulate the functionality
  const ruleTemplate = `title: Detecting ${technique.name}
description: Rule to detect ${technique.name} techniques (${technique.id})
id: ${ruleId}
status: experimental
author: Security Team
date: ${new Date().toISOString().split('T')[0]}
modified: ${new Date().toISOString().split('T')[0]}
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4688
    CommandLine|contains:
      - 'suspicious command'
      - 'suspicious parameter'
  condition: selection
falsepositives:
  - Legitimate administrative activity
level: medium
tags:
  - attack.${technique.tactic.toLowerCase()}
  - attack.${technique.id.toLowerCase()}`;

  // Create the rule object
  const rule: SigmaRule = {
    id: ruleId,
    title: `Detecting ${technique.name}`,
    description: `Rule to detect ${technique.name} techniques (${technique.id})`,
    technique: technique,
    status: "experimental",
    level: "medium",
    author: "Security Team",
    date: new Date().toISOString().split('T')[0],
    modified: new Date().toISOString().split('T')[0],
    content: ruleTemplate,
    deployed: false
  };
  
  // Store the rule to check for duplicates later
  existingRules[rule.id] = rule;
  
  return rule;
};

// Deploy a rule to SIEM systems
export const deploySigmaRule = async (
  rule: SigmaRule,
  targets: string[]
): Promise<{success: boolean, deployedTo: string[], errors: {target: string, message: string}[]}> => {
  // In a real implementation, this would call an API to deploy the rule to specified SIEM systems
  console.log('Deploying rule:', rule.title, 'to targets:', targets);
  
  const result = {
    success: true,
    deployedTo: [] as string[],
    errors: [] as {target: string, message: string}[]
  };
  
  // Simulate deployment success/failure
  for (const target of targets) {
    // Simulate a random success/failure (90% success rate)
    if (Math.random() < 0.9) {
      result.deployedTo.push(target);
      console.log(`Successfully deployed to ${target}`);
      
      // Update the rule's deployment status
      rule.deployed = true;
      rule.deploymentTargets = [...(rule.deploymentTargets || []), target];
      
      // Update in storage
      existingRules[rule.id] = rule;
    } else {
      result.errors.push({
        target,
        message: `Failed to connect to ${target} deployment service`
      });
      result.success = false;
      console.error(`Failed to deploy to ${target}`);
    }
  }
  
  return result;
};

// Get all existing rules
export const getAllRules = (): SigmaRule[] => {
  return Object.values(existingRules);
};

// Get a rule by ID
export const getRuleById = (id: string): SigmaRule | null => {
  return existingRules[id] || null;
};
