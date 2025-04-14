
import { supabase } from '@/utils/supabase';
import { baseService } from './baseService';
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
};
