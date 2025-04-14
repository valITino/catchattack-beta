
import { supabase } from '@/utils/supabase';
import { baseService } from './baseService';

/**
 * Service for system status operations
 */
export const statusService = {
  /**
   * Get system status
   * @returns The system status
   */
  async getSystemStatus(): Promise<{
    emulations: number;
    rules: number;
    deployments: number;
    lastEmulation?: string;
    lastDeployment?: string;
  }> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('status', {
      body: { tenantId }
    });
    
    if (error) throw new Error(`Error fetching system status: ${error.message}`);
    return data;
  },
};
