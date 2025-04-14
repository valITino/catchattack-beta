
import { supabase } from '@/utils/supabase';
import { baseService } from './baseService';
import { aiService } from './aiService';
import type { EmulationRequest, EmulationResult } from '@/types/backend';

/**
 * Service for interacting with the emulation API
 */
export const emulationService = {
  /**
   * Trigger an adversary emulation
   * @param emulationRequest The emulation request data
   * @returns The emulation result
   */
  async triggerEmulation(emulationRequest: EmulationRequest): Promise<EmulationResult> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('emulate', {
      body: { 
        emulationRequest,
        tenantId
      }
    });
    
    if (error) throw new Error(`Error triggering emulation: ${error.message}`);
    
    // After successful emulation, automatically run anomaly detection
    try {
      const anomalies = await aiService.detectAnomalies(data.logs);
      console.log('AI detected anomalies:', anomalies);
      
      // In a real implementation, you might want to store these anomalies
      // or trigger alerts based on their severity
    } catch (aiError) {
      console.error('AI anomaly detection error:', aiError);
      // Non-blocking - we still return the emulation result even if AI analysis fails
    }
    
    return data;
  },
  
  /**
   * Get all emulation results
   * @returns Array of emulation results
   */
  async getEmulationResults(): Promise<EmulationResult[]> {
    const tenantId = baseService.getTenantId();
    
    const { data, error } = await supabase
      .from('emulation_results')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('timestamp', { ascending: false });
      
    if (error) throw new Error(`Error fetching emulation results: ${error.message}`);
    return data || [];
  },
  
  /**
   * Run AI analysis on a completed emulation
   * @param emulationId The ID of the completed emulation
   * @returns Analysis results including rule suggestions and anomalies
   */
  async runAIAnalysis(emulationId: string): Promise<{
    ruleSuggestions: any;
    anomalies: any;
  }> {
    const tenantId = baseService.getTenantId();
    
    // First fetch the emulation result
    const { data: emulation, error: fetchError } = await supabase
      .from('emulation_results')
      .select('*')
      .eq('id', emulationId)
      .eq('tenant_id', tenantId)
      .single();
    
    if (fetchError || !emulation) {
      throw new Error(`Error fetching emulation: ${fetchError?.message || 'Not found'}`);
    }
    
    // Now run the AI analyses in parallel for better performance
    const [ruleSuggestions, anomalies] = await Promise.all([
      aiService.generateEnhancedRules(emulation),
      aiService.detectAnomalies(emulation.logs)
    ]);
    
    return { ruleSuggestions, anomalies };
  }
};
