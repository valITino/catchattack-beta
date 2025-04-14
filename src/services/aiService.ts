
import { supabase } from '@/utils/supabase';
import { baseService } from './baseService';
import type { SigmaRule, EmulationResult, EmulationLog } from '@/types/backend';

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
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-rule-generation', {
      body: { 
        emulationResult,
        tenantId
      }
    });
    
    if (error) throw new Error(`Error generating enhanced rules: ${error.message}`);
    if (!data) throw new Error('No data returned from rule generation service');
    
    return data;
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
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-predictive-scheduling', {
      body: { 
        techniqueIds,
        tenantId
      }
    });
    
    if (error) throw new Error(`Error getting predictive schedule: ${error.message}`);
    if (!data) throw new Error('No data returned from predictive scheduling service');
    
    return data;
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
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-rule-similarity', {
      body: { 
        ruleContent,
        tenantId
      }
    });
    
    if (error) throw new Error(`Error finding similar rules: ${error.message}`);
    if (!data) throw new Error('No data returned from rule similarity service');
    
    return data;
  }
};
