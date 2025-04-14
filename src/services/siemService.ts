
import { supabase } from '@/utils/supabase';
import { baseService } from './baseService';
import type { DeployRequest, DeployResult, SiemPlatform } from '@/types/backend';

/**
 * Service for managing SIEM platforms and deployments
 */
export const siemService = {
  /**
   * Deploy Sigma rules to a SIEM platform
   * @param deployRequest The deployment request
   * @returns The deployment result
   */
  async deploySigmaRules(deployRequest: DeployRequest): Promise<DeployResult> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('deploy', {
      body: { 
        deployRequest,
        tenantId
      }
    });
    
    if (error) throw new Error(`Error deploying Sigma rules: ${error.message}`);
    return data;
  },
  
  /**
   * Get all SIEM platforms
   * @returns Array of SIEM platforms
   */
  async getSiemPlatforms(): Promise<SiemPlatform[]> {
    const tenantId = baseService.getTenantId();
    
    const { data, error } = await supabase
      .from('siem_platforms')
      .select('*')
      .eq('tenant_id', tenantId);
      
    if (error) throw new Error(`Error fetching SIEM platforms: ${error.message}`);
    return data || [];
  },
  
  /**
   * Create or update a SIEM platform
   * @param platform The platform to create or update
   * @returns The created/updated platform
   */
  async upsertSiemPlatform(platform: Partial<SiemPlatform>): Promise<SiemPlatform> {
    const tenantId = baseService.getTenantId();
    
    const { data, error } = await supabase
      .from('siem_platforms')
      .upsert([{ ...platform, tenant_id: tenantId }])
      .select()
      .single();
      
    if (error) throw new Error(`Error upserting SIEM platform: ${error.message}`);
    return data;
  },
};
