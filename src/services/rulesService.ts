
import { supabase } from '@/utils/supabase';
import { baseService } from './baseService';
import type { SigmaRule } from '@/types/backend';

/**
 * Service for managing Sigma rules
 */
export const rulesService = {
  /**
   * Get all Sigma rules
   * @returns Array of Sigma rules
   */
  async getSigmaRules(): Promise<SigmaRule[]> {
    const tenantId = baseService.getTenantId();
    
    const { data, error } = await supabase
      .from('sigma_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('dateCreated', { ascending: false });
      
    if (error) throw new Error(`Error fetching Sigma rules: ${error.message}`);
    return data || [];
  },
  
  /**
   * Create a new Sigma rule
   * @param rule The rule to create
   * @returns The created rule
   */
  async createSigmaRule(rule: Partial<SigmaRule>): Promise<SigmaRule> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-rule', {
      body: { 
        rule: { ...rule, tenant_id: tenantId },
      }
    });
    
    if (error) throw new Error(`Error creating Sigma rule: ${error.message}`);
    return data;
  },
};
