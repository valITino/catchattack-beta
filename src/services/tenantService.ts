
import { supabase } from '@/utils/supabase';

/**
 * Service for tenant operations
 */
export const tenantService = {
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
    
    // Transform the data structure, properly handling the nested objects
    return (data || []).map(item => {
      if (!item || typeof item !== 'object') {
        return {
          id: '',
          name: '',
          description: undefined,
          role: 'viewer' as const,
        };
      }
      
      // Extract the role and tenants object
      const { role = 'viewer', tenants } = item as { role?: 'admin' | 'analyst' | 'viewer', tenants?: any };
      
      // If tenants object is missing or not an object, return defaults
      if (!tenants || typeof tenants !== 'object') {
        return {
          id: '',
          name: '',
          description: undefined,
          role: role as 'admin' | 'analyst' | 'viewer',
        };
      }
      
      // Now we can safely access the tenant properties
      return {
        id: tenants.id || '',
        name: tenants.name || '',
        description: tenants.description,
        role: role as 'admin' | 'analyst' | 'viewer',
      };
    });
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
