
import { supabase } from '@/utils/supabase';
import { baseService } from './baseService';
import type { SigmaRule, EmulationResult, EmulationLog } from '@/types/backend';
import { toast } from '@/components/ui/use-toast';

/**
 * Service for AI-enhanced operations
 */
export const aiService = {
  /**
   * Use AI to analyze emulation logs and generate enhanced Sigma rules
   * @param emulationResult The emulation result containing logs to analyze
   * @returns AI-enhanced Sigma rule suggestions
   */
  async generateEnhancedRules(emulationResult: EmulationResult): Promise<{
    rules: Partial<SigmaRule>[];
    confidence: number;
    suggestedImprovements: string[];
  }> {
    const tenantId = baseService.getTenantId();
    
    if (!emulationResult || !emulationResult.logs || emulationResult.logs.length === 0) {
      throw new Error('Cannot generate rules from empty or invalid emulation results');
    }
    
    console.log(`Generating enhanced rules for emulation ID: ${emulationResult.id}`);
    
    try {
      // Request start time for performance monitoring
      const requestStartTime = performance.now();
      
      // Call to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('ai-rule-generation', {
        body: { 
          emulationResult,
          tenantId
        }
      });
      
      // Calculate elapsed time
      const requestTime = performance.now() - requestStartTime;
      console.log(`Rule generation completed in ${requestTime.toFixed(2)}ms`);
      
      if (error) throw new Error(`Error generating enhanced rules: ${error.message}`);
      if (!data) throw new Error('No data returned from rule generation service');
      
      return data;
    } catch (error) {
      console.error('Error in rule generation:', error);
      throw new Error(`Failed to generate enhanced rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  /**
   * Detect anomalies in emulation logs using AI
   * @param logs The logs to analyze
   * @returns Detected anomalies with confidence scores and metadata
   */
  async detectAnomalies(logs: EmulationLog[]): Promise<{
    anomalies: {
      techniqueId: string;
      description: string;
      confidence: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }[];
    timestamp: string;
    processedLogsCount: number;
    processingTimeMs?: number;
    status?: string;
  }> {
    const tenantId = baseService.getTenantId();
    
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      console.warn('Attempted to detect anomalies with empty or invalid logs');
      return { 
        anomalies: [],
        timestamp: new Date().toISOString(),
        processedLogsCount: 0,
        status: 'no_logs'
      };
    }
    
    console.log(`Detecting anomalies in ${logs.length} logs for tenant ${tenantId}`);
    
    try {
      // Performance monitoring
      const requestStartTime = performance.now();
      
      // Call to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('ai-anomaly-detection', {
        body: { 
          logs,
          tenantId
        }
      });
      
      // Calculate client-side request time
      const requestTime = performance.now() - requestStartTime;
      console.log(`Anomaly detection API call completed in ${requestTime.toFixed(2)}ms`);
      
      if (error) {
        console.error('Anomaly detection error:', error);
        throw new Error(`Error detecting anomalies: ${error.message}`);
      }
      
      if (!data || !data.anomalies) {
        console.warn('No anomaly data returned from service or invalid response structure');
        return { 
          anomalies: [],
          timestamp: new Date().toISOString(),
          processedLogsCount: logs.length,
          status: 'no_anomalies'
        };
      }
      
      console.log(`Successfully detected ${data.anomalies.length} anomalies in ${data.processingTimeMs || 'unknown'}ms`);
      return {
        ...data,
        status: data.status || 'success'
      };
    } catch (error) {
      console.error('Exception in anomaly detection:', error);
      throw new Error(`Failed to detect anomalies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  /**
   * Get AI-predicted optimal scheduling times for emulations
   * @param techniqueIds The techniques to schedule
   * @returns Suggested scheduling times with explanations
   */
  async getPredictiveSchedule(techniqueIds: string[]): Promise<{
    suggestedTime: string;
    confidence: number;
    reasoning: string;
    resourceImpact: 'low' | 'medium' | 'high';
  }> {
    const tenantId = baseService.getTenantId();
    
    if (!techniqueIds || !Array.isArray(techniqueIds) || techniqueIds.length === 0) {
      throw new Error('Cannot generate schedule prediction without technique IDs');
    }
    
    console.log(`Getting predictive schedule for ${techniqueIds.length} techniques`);
    
    try {
      // Performance monitoring
      const requestStartTime = performance.now();
      
      // Call to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('ai-predictive-scheduling', {
        body: { 
          techniqueIds,
          tenantId
        }
      });
      
      // Calculate elapsed time
      const requestTime = performance.now() - requestStartTime;
      console.log(`Predictive scheduling completed in ${requestTime.toFixed(2)}ms`);
      
      if (error) throw new Error(`Error getting predictive schedule: ${error.message}`);
      if (!data) throw new Error('No data returned from predictive scheduling service');
      
      return data;
    } catch (error) {
      console.error('Error in predictive scheduling:', error);
      throw new Error(`Failed to get predictive schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  /**
   * Find similar existing rules using semantic similarity
   * @param ruleContent The rule content to compare
   * @returns Similar rules with similarity scores
   */
  async findSimilarRules(ruleContent: string): Promise<{
    similarRules: {
      ruleId: string;
      similarity: number;
      title: string;
    }[];
  }> {
    const tenantId = baseService.getTenantId();
    
    if (!ruleContent || ruleContent.trim() === '') {
      console.warn('Attempted to find similar rules with empty content');
      return { similarRules: [] };
    }
    
    console.log(`Finding rules similar to content with length ${ruleContent.length}`);
    
    try {
      // Performance monitoring
      const requestStartTime = performance.now();
      
      // Call to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('ai-rule-similarity', {
        body: { 
          ruleContent,
          tenantId
        }
      });
      
      // Calculate elapsed time
      const requestTime = performance.now() - requestStartTime;
      console.log(`Rule similarity analysis completed in ${requestTime.toFixed(2)}ms`);
      
      if (error) throw new Error(`Error finding similar rules: ${error.message}`);
      if (!data) throw new Error('No data returned from rule similarity service');
      
      return data;
    } catch (error) {
      console.error('Error in rule similarity check:', error);
      throw new Error(`Failed to find similar rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  /**
   * Fetch MITRE ATT&CK techniques and tactics
   * @returns MITRE ATT&CK framework data
   */
  async getMitreTechniques(): Promise<{
    techniques: {
      id: string;
      name: string;
      tactic: string;
      description: string;
      platforms?: string[];
    }[];
    timestamp?: string;
    source?: string;
    version?: string;
    cached?: boolean;
  }> {
    console.log(`Fetching MITRE ATT&CK techniques`);
    
    try {
      // Call to Supabase Edge Function with improved error handling
      const requestStartTime = performance.now();
      
      const { data, error } = await supabase.functions.invoke('ai-mitre-techniques', {
        body: {}
      });
      
      // Calculate elapsed time for performance monitoring
      const requestTime = performance.now() - requestStartTime;
      console.log(`MITRE techniques fetch completed in ${requestTime.toFixed(2)}ms`);
      
      if (error) {
        console.error('Error from MITRE techniques edge function:', error);
        throw new Error(`Error fetching MITRE techniques: ${error.message}`);
      }
      
      if (!data || !data.techniques || !Array.isArray(data.techniques)) {
        console.error('Invalid response format from MITRE techniques service', data);
        throw new Error('Invalid response format from MITRE ATT&CK service');
      }
      
      // Log caching status for monitoring
      if (data.cached) {
        console.log('Using cached MITRE ATT&CK data');
      } else {
        console.log('Using fresh MITRE ATT&CK data');
      }
      
      // Add version information to response
      console.log(`Fetched ${data.techniques.length} MITRE techniques from ${data.source || 'unknown source'}`);
      
      return data;
    } catch (error) {
      console.error('Error fetching MITRE techniques:', error);
      toast({
        title: "MITRE Data Error",
        description: "Failed to fetch ATT&CK framework data. Using fallback data.",
        variant: "destructive",
      });
      
      // Fallback to local data if API call fails
      return {
        techniques: [
          { id: "T1078", name: "Valid Accounts", tactic: "Initial Access", description: "Adversaries may obtain and abuse credentials of existing accounts." },
          { id: "T1566", name: "Phishing", tactic: "Initial Access", description: "Adversaries may send phishing messages to gain access to victim systems." },
          { id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution", description: "Adversaries may abuse command and script interpreters to execute commands." },
          { id: "T1053", name: "Scheduled Task/Job", tactic: "Execution", description: "Adversaries may abuse task scheduling functionality to facilitate execution." },
          { id: "T1027", name: "Obfuscated Files or Information", tactic: "Defense Evasion", description: "Adversaries may attempt to make an executable or file difficult to discover or analyze." },
          { id: "T1110", name: "Brute Force", tactic: "Credential Access", description: "Adversaries may use brute force techniques to gain access to accounts." },
          { id: "T1016", name: "System Network Configuration Discovery", tactic: "Discovery", description: "Adversaries may look for details about the network configuration of systems." },
          { id: "T1049", name: "System Network Connections Discovery", tactic: "Discovery", description: "Adversaries may attempt to get a listing of network connections." },
          { id: "T1057", name: "Process Discovery", tactic: "Discovery", description: "Adversaries may attempt to get information about running processes on a system." },
          { id: "T1071", name: "Application Layer Protocol", tactic: "Command and Control", description: "Adversaries may use application layer protocols for communication." },
          { id: "T1105", name: "Ingress Tool Transfer", tactic: "Command and Control", description: "Adversaries may transfer tools or other files from an external system to a compromised host." },
          { id: "T1041", name: "Exfiltration Over C2 Channel", tactic: "Exfiltration", description: "Adversaries may steal data by exfiltrating it over an existing command and control channel." },
        ],
        timestamp: new Date().toISOString(),
        source: "Local Fallback Data",
        version: "v1.0 (fallback)",
        cached: true
      };
    }
  },
  
  /**
   * Generate explanation for a detected technique
   * @param techniqueId The MITRE ATT&CK technique ID
   * @returns Explanation of the technique and mitigation suggestions
   */
  async explainTechnique(techniqueId: string): Promise<{
    name: string;
    description: string;
    tactic: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string[];
    detection: string[];
  }> {
    try {
      // Get all techniques
      const { techniques } = await this.getMitreTechniques();
      
      // Find the requested technique
      const technique = techniques.find(t => t.id === techniqueId);
      
      if (!technique) {
        throw new Error(`Technique ${techniqueId} not found`);
      }
      
      // Determine severity based on tactic
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (['Initial Access', 'Command and Control', 'Exfiltration'].includes(technique.tactic)) {
        severity = 'high';
      } else if (['Defense Evasion', 'Privilege Escalation', 'Impact'].includes(technique.tactic)) {
        severity = 'critical';
      } else if (['Discovery', 'Collection'].includes(technique.tactic)) {
        severity = 'low';
      }
      
      // Generate simple mitigation and detection recommendations
      const mitigation = [
        `Monitor for suspicious activity related to ${technique.name}`,
        `Implement least privilege principles to limit impact`,
        `Use application whitelisting to prevent unauthorized execution`
      ];
      
      const detection = [
        `Monitor logs for indicators of ${technique.name}`,
        `Implement detection rules targeting this technique`,
        `Correlate events across different systems to identify patterns`
      ];
      
      return {
        name: technique.name,
        description: technique.description,
        tactic: technique.tactic,
        severity,
        mitigation,
        detection
      };
    } catch (error) {
      console.error(`Error explaining technique ${techniqueId}:`, error);
      throw new Error(`Failed to explain technique: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};
