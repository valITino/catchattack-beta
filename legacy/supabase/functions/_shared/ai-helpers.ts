
/**
 * AI helpers for analysis of security data
 */

import { EmulationLog, MitreAttackTechnique } from "./types.ts";

/**
 * Detect anomalies in emulation logs using AI-based analysis
 * In production, this would use a real ML model or call to an AI API
 * @param logs The logs to analyze for anomalies
 * @returns Detected anomalies with confidence scores and metadata
 */
export async function detectAnomalies(logs: EmulationLog[]): Promise<{
  techniqueId: string;
  description: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}[]> {
  console.log(`Processing ${logs.length} logs for anomaly detection`);
  
  // In a production environment, this would:
  // 1. Use a machine learning model or external AI API
  // 2. Analyze patterns across multiple logs
  // 3. Compare against historical baselines
  // 4. Use behavioral analytics
  
  try {
    // Get MITRE techniques for context
    const techniques = await getMitreAttackTechniques();
    const techniquesMap = new Map(techniques.map(t => [t.id, t]));
    
    // Group logs by technique for analysis
    const techniqueGroups: Record<string, EmulationLog[]> = {};
    logs.forEach(log => {
      if (!techniqueGroups[log.techniqueId]) {
        techniqueGroups[log.techniqueId] = [];
      }
      techniqueGroups[log.techniqueId].push(log);
    });
    
    const anomalies = [];
    const processedTechniques = new Set();
    
    // Detect anomalies based on log patterns and technique metadata
    for (const log of logs) {
      const { techniqueId, status, message, details } = log;
      
      // Skip if we've already analyzed this technique
      if (processedTechniques.has(techniqueId)) continue;
      processedTechniques.add(techniqueId);
      
      // Get technique information from MITRE data
      const techniqueInfo = techniquesMap.get(techniqueId) || { 
        name: "Unknown Technique", 
        tactic: "Unknown", 
        severity: "medium" as const
      };
      
      // Look for indicators of suspicious activity
      // In production, this would use much more sophisticated algorithms
      
      // Analyze the logs for this technique
      const techLogs = techniqueGroups[techniqueId] || [];
      
      // Calculate anomaly metrics (this is simplified for demo purposes)
      const failureRate = techLogs.filter(l => l.status === 'failure').length / Math.max(1, techLogs.length);
      const hasErrorMessages = techLogs.some(l => l.message.toLowerCase().includes('error') || 
                                                l.message.toLowerCase().includes('exception'));
      const hasUnusualDetails = techLogs.some(l => l.details && 
                                                (l.details.unusualActivity || 
                                                 l.details.suspiciousPattern));
      
      // Determine if this is an anomaly based on our metrics
      // In production, this would use ML-based scoring and probabilistic models
      if (failureRate > 0.3 || hasErrorMessages || hasUnusualDetails) {
        // Calculate confidence score based on multiple factors
        let confidence = 0.5; // Base confidence
        
        if (failureRate > 0.7) confidence += 0.3;
        else if (failureRate > 0.3) confidence += 0.15;
        
        if (hasErrorMessages) confidence += 0.1;
        if (hasUnusualDetails) confidence += 0.2;
        
        // Map tactic to severity based on impact
        // In production, this would use a more nuanced approach
        let severity: 'low' | 'medium' | 'high' | 'critical';
        
        // Use tactic to influence severity rating
        switch (techniqueInfo.tactic.toLowerCase()) {
          case 'impact':
          case 'exfiltration':
            severity = failureRate > 0.5 ? 'critical' : 'high';
            break;
          case 'command and control':
          case 'privilege escalation':
            severity = hasUnusualDetails ? 'high' : 'medium';
            break;
          default:
            severity = hasErrorMessages ? 'medium' : 'low';
        }
        
        // Generate description using technique information
        const description = `Detected unusual patterns related to ${techniqueInfo.name} (${techniqueId}) in ${techniqueInfo.tactic} phase. ${
          hasErrorMessages ? 'Contains error conditions. ' : ''
        }${hasUnusualDetails ? 'Exhibits suspicious patterns. ' : ''}${
          failureRate > 0 ? `Failure rate: ${Math.round(failureRate * 100)}%. ` : ''
        }`;
        
        // Add detection recommendation if available
        const detectionAdvice = techniqueInfo.detection 
          ? `Detection guidance: ${techniqueInfo.detection}.` 
          : '';
        
        anomalies.push({
          techniqueId,
          description: description + ' ' + detectionAdvice,
          confidence: Math.min(0.99, confidence), // Cap at 0.99 to avoid false certainty
          severity
        });
      }
    }
    
    return anomalies;
    
  } catch (error) {
    console.error("Error in anomaly detection:", error);
    // Return limited anomalies in case of error
    return logs.slice(0, 3).map(log => ({
      techniqueId: log.techniqueId,
      description: `Error in analysis, but potentially suspicious activity detected for ${log.techniqueId}.`,
      confidence: 0.5,
      severity: 'medium' as const
    }));
  }
}

/**
 * Generate enhanced Sigma rules from security logs using AI analysis
 * @param logs The logs to analyze
 * @returns Enhanced Sigma rule suggestions
 */
export async function generateEnhancedRules(logs: EmulationLog[]): Promise<{
  rule: string;
  title: string;
  description: string;
  techniqueId: string;
  confidence: number;
}[]> {
  try {
    // Get MITRE techniques for context
    const techniques = await getMitreAttackTechniques();
    const techniquesMap = new Map(techniques.map(t => [t.id, t]));
    
    // Group logs by technique
    const techniqueGroups: Record<string, EmulationLog[]> = {};
    logs.forEach(log => {
      if (!techniqueGroups[log.techniqueId]) {
        techniqueGroups[log.techniqueId] = [];
      }
      techniqueGroups[log.techniqueId].push(log);
    });
    
    const ruleSuggestions = [];
    
    // Generate a rule for each technique with sufficient logs
    for (const [techniqueId, techLogs] of Object.entries(techniqueGroups)) {
      if (techLogs.length < 2) continue; // Skip techniques with too few logs
      
      const techniqueInfo = techniquesMap.get(techniqueId) || {
        name: "Unknown Technique",
        tactic: "Unknown",
        description: "No description available"
      };
      
      // Extract common patterns from logs
      const patterns = extractCommonPatterns(techLogs);
      if (!patterns.length) continue;
      
      // Generate Sigma rule based on patterns
      const sigmaRule = generateSigmaRule(techniqueId, techniqueInfo.name, patterns);
      
      ruleSuggestions.push({
        rule: sigmaRule,
        title: `Detect ${techniqueInfo.name} (${techniqueId})`,
        description: `Sigma rule to detect ${techniqueInfo.name} based on emulated behavior. ${techniqueInfo.description}`,
        techniqueId,
        confidence: 0.7 + (Math.min(techLogs.length, 10) / 20) // Confidence increases with more logs
      });
    }
    
    return ruleSuggestions;
    
  } catch (error) {
    console.error("Error in rule generation:", error);
    return []; // Return empty array on error
  }
}

/**
 * Extract common patterns from logs
 */
function extractCommonPatterns(logs: EmulationLog[]): string[] {
  // This would be much more sophisticated in production
  const patterns = new Set<string>();
  
  logs.forEach(log => {
    // Extract process names, commands, registry keys, etc.
    const details = log.details || {};
    
    if (details.process) patterns.add(`process: ${details.process}`);
    if (details.command) patterns.add(`command: ${details.command}`);
    if (details.registry) patterns.add(`registry: ${details.registry}`);
    if (details.network) patterns.add(`network: ${details.network}`);
    if (details.file) patterns.add(`file: ${details.file}`);
  });
  
  return Array.from(patterns);
}

/**
 * Generate a Sigma rule based on patterns
 */
function generateSigmaRule(techniqueId: string, techniqueName: string, patterns: string[]): string {
  // This would generate actual Sigma YAML in production
  return `title: ${techniqueName} Detection (${techniqueId})
id: ${crypto.randomUUID()}
status: experimental
description: Detects ${techniqueName} based on emulated adversary behavior
references:
  - https://attack.mitre.org/techniques/${techniqueId}/
author: AI Generator
date: ${new Date().toISOString().split('T')[0]}
tags:
  - attack.${techniqueId}
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    ${patterns.map(p => `    - ${p}`).join('\n')}
  condition: selection
falsepositives:
  - Unknown
level: medium`;
}

/**
 * Get MITRE ATT&CK techniques by calling the ai-mitre-techniques function
 * @returns Array of MITRE ATT&CK techniques
 */
export async function getMitreAttackTechniques(): Promise<MitreAttackTechnique[]> {
  try {
    // This is a local call to the ai-mitre-techniques endpoint
    // In production, this would be cached or use a more efficient access method
    const response = await fetch('http://localhost:54321/functions/v1/ai-mitre-techniques', {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch MITRE data: ${response.status}`);
    }
    
    const data = await response.json();
    return data.techniques || [];
    
  } catch (error) {
    console.error("Error fetching MITRE techniques:", error);
    // Return fallback data in case of error
    return getFallbackTechniques();
  }
}

/**
 * Provides fallback static MITRE technique data in case the API fetch fails
 */
function getFallbackTechniques(): MitreAttackTechnique[] {
  // Same fallback data as in the ai-mitre-techniques function
  return [
    {
      id: "T1078",
      name: "Valid Accounts",
      tactic: "Initial Access",
      description: "Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.",
      detection: "Monitor authentication logs for login attempts with valid credentials from unusual sources or at unusual times.",
      platforms: ["Windows", "macOS", "Linux"],
      dataSources: ["Authentication logs", "Failed logon attempts"],
      mitigation: "Use multi-factor authentication and privileged account management.",
      references: ["https://attack.mitre.org/techniques/T1078"]
    },
    {
      id: "T1566",
      name: "Phishing",
      tactic: "Initial Access",
      description: "Adversaries may send phishing messages to gain access to victim systems. Phishing is a common means of initial access.",
      detection: "Monitor emails for suspicious characteristics and user reports of phishing attempts.",
      platforms: ["Windows", "macOS", "Linux", "SaaS"],
      dataSources: ["Email gateway logs", "User reports"],
      mitigation: "Implement email filtering and user awareness training.",
      references: ["https://attack.mitre.org/techniques/T1566"]
    },
    {
      id: "T1059",
      name: "Command and Scripting Interpreter",
      tactic: "Execution",
      description: "Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.",
      detection: "Monitor for unusual command-line activities and script execution.",
      platforms: ["Windows", "macOS", "Linux"],
      dataSources: ["Process monitoring", "Command-line logging"],
      mitigation: "Disable or restrict access to scripting interpreters where possible.",
      references: ["https://attack.mitre.org/techniques/T1059"]
    },
    {
      id: "T1053",
      name: "Scheduled Task/Job",
      tactic: "Execution",
      description: "Adversaries may abuse task scheduling functionality to facilitate initial or recurring execution of malicious code.",
      detection: "Monitor creation and modification of scheduled tasks and jobs.",
      platforms: ["Windows", "macOS", "Linux"],
      dataSources: ["Task scheduler logs", "Cron logs"],
      mitigation: "Configure proper access controls for task scheduling.",
      references: ["https://attack.mitre.org/techniques/T1053"]
    },
    {
      id: "T1027",
      name: "Obfuscated Files or Information",
      tactic: "Defense Evasion",
      description: "Adversaries may attempt to make an executable or file difficult to discover or analyze by encrypting, encoding, or otherwise obfuscating its contents.",
      detection: "Use anti-virus and file analysis tools to detect obfuscated files.",
      platforms: ["Windows", "macOS", "Linux"],
      dataSources: ["File monitoring", "Anti-virus"],
      mitigation: "Use application allowlisting and behavioral monitoring.",
      references: ["https://attack.mitre.org/techniques/T1027"]
    }
  ];
}
