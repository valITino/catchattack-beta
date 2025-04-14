
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
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-rule-generation', {
      body: { 
        emulationResult,
        tenantId
      }
    });
    
    if (error) throw new Error(`Error generating enhanced rules: ${error.message}`);
    return data;
  },
  
  /**
   * Detect anomalies in emulation logs using AI
   * @param logs The logs to analyze
   * @returns Detected anomalies with confidence scores
   */
  async detectAnomalies(logs: EmulationLog[]): Promise<{
    anomalies: {
      techniqueId: string;
      description: string;
      confidence: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }[];
  }> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-anomaly-detection', {
      body: { 
        logs,
        tenantId
      }
    });
    
    if (error) throw new Error(`Error detecting anomalies: ${error.message}`);
    return data;
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
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-predictive-scheduling', {
      body: { 
        techniqueIds,
        tenantId
      }
    });
    
    if (error) throw new Error(`Error getting predictive schedule: ${error.message}`);
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
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-rule-similarity', {
      body: { 
        ruleContent,
        tenantId
      }
    });
    
    if (error) throw new Error(`Error finding similar rules: ${error.message}`);
    return data;
  }
};
