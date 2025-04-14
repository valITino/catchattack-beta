
import { supabase, getCurrentTenantId } from '@/utils/supabase';
import type { 
  EmulationRequest, 
  EmulationResult,
  SigmaRule,
  DeployRequest,
  DeployResult,
  Schedule,
  SiemPlatform
} from '@/types/backend';

/**
 * Service for interacting with the backend API
 */
export const apiService = {
  /**
   * Trigger an adversary emulation
   * @param emulationRequest The emulation request data
   * @returns The emulation result
   */
  async triggerEmulation(emulationRequest: EmulationRequest): Promise<EmulationResult> {
    const tenantId = getCurrentTenantId();
    
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
    const tenantId = getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('emulation_results')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('timestamp', { ascending: false });
      
    if (error) throw new Error(`Error fetching emulation results: ${error.message}`);
    return data || [];
  },
  
  /**
   * Get all Sigma rules
   * @returns Array of Sigma rules
   */
  async getSigmaRules(): Promise<SigmaRule[]> {
    const tenantId = getCurrentTenantId();
    
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
    const tenantId = getCurrentTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-rule', {
      body: { 
        rule: { ...rule, tenant_id: tenantId },
      }
    });
    
    if (error) throw new Error(`Error creating Sigma rule: ${error.message}`);
    return data;
  },
  
  /**
   * Deploy Sigma rules to a SIEM platform
   * @param deployRequest The deployment request
   * @returns The deployment result
   */
  async deploySigmaRules(deployRequest: DeployRequest): Promise<DeployResult> {
    const tenantId = getCurrentTenantId();
    
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
    const tenantId = getCurrentTenantId();
    
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
    const tenantId = getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('siem_platforms')
      .upsert([{ ...platform, tenant_id: tenantId }])
      .select()
      .single();
      
    if (error) throw new Error(`Error upserting SIEM platform: ${error.message}`);
    return data;
  },
  
  /**
   * Create or update a schedule
   * @param schedule The schedule to create or update
   * @returns The created/updated schedule
   */
  async upsertSchedule(schedule: Partial<Schedule>): Promise<Schedule> {
    const tenantId = getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('schedules')
      .upsert([{ ...schedule, tenant_id: tenantId }])
      .select()
      .single();
      
    if (error) throw new Error(`Error upserting schedule: ${error.message}`);
    return data;
  },
  
  /**
   * Get all schedules
   * @returns Array of schedules
   */
  async getSchedules(): Promise<Schedule[]> {
    const tenantId = getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('createdAt', { ascending: false });
      
    if (error) throw new Error(`Error fetching schedules: ${error.message}`);
    return data || [];
  },
  
  /**
   * Delete a schedule
   * @param id The schedule ID to delete
   */
  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(`Error deleting schedule: ${error.message}`);
  },
  
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
    const tenantId = getCurrentTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('status', {
      body: { tenantId }
    });
    
    if (error) throw new Error(`Error fetching system status: ${error.message}`);
    return data;
  },
  
  /**
   * Get all tenants for the current user
   * @returns Array of tenants
   */
  async getUserTenants(): Promise<{ 
    id: string;
    name: string;
    description?: string;
    role: 'admin' | 'analyst' | 'viewer';
  }[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    interface TenantResult {
      role: 'admin' | 'analyst' | 'viewer';
      tenants: {
        id: string;
        name: string;
        description?: string;
      };
    }
    
    const { data, error } = await supabase
      .from('users_tenants')
      .select(`
        role,
        tenants (
          id,
          name,
          description
        )
      `)
      .eq('userId', user.id);
      
    if (error) throw new Error(`Error fetching user tenants: ${error.message}`);
    
    // Fix the data mapping to correctly handle the structure
    return (data || []).map(item => ({
      id: item.tenants?.id,
      name: item.tenants?.name,
      description: item.tenants?.description,
      role: item.role,
    }));
  },
  
  /**
   * Create a new tenant
   * @param tenant The tenant data
   * @returns The created tenant
   */
  async createTenant(tenant: { name: string; description?: string }): Promise<{ id: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    // Insert the tenant
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert([{ 
        name: tenant.name, 
        description: tenant.description,
        createdAt: new Date().toISOString()
      }])
      .select()
      .single();
      
    if (tenantError) throw new Error(`Error creating tenant: ${tenantError.message}`);
    
    // Associate the current user with the tenant as admin
    const { error: userTenantError } = await supabase
      .from('users_tenants')
      .insert([{ 
        userId: user.id,
        tenantId: tenantData.id,
        role: 'admin'
      }]);
      
    if (userTenantError) throw new Error(`Error associating user with tenant: ${userTenantError.message}`);
    
    return { id: tenantData.id };
  }
};
