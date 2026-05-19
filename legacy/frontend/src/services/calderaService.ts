
import { baseService } from './baseService';
import { supabase } from '@/utils/supabase';
import { CalderaAgent, CalderaAbility, CalderaAdversary, CalderaOperation, CalderaResult } from '@/types/caldera';

/**
 * Service for interacting with CALDERA adversary emulation platform
 */
export const calderaService = {
  /**
   * Get all available CALDERA agents
   */
  async getAgents(): Promise<CalderaAgent[]> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('caldera-integration', {
      body: { 
        endpoint: 'agents',
        tenantId
      }
    });
    
    if (error) throw new Error(`Error fetching CALDERA agents: ${error.message}`);
    return data.agents || [];
  },
  
  /**
   * Get all available CALDERA abilities
   */
  async getAbilities(): Promise<CalderaAbility[]> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('caldera-integration', {
      body: { 
        endpoint: 'abilities',
        tenantId
      }
    });
    
    if (error) throw new Error(`Error fetching CALDERA abilities: ${error.message}`);
    return data.abilities || [];
  },
  
  /**
   * Get all adversary profiles
   */
  async getAdversaries(): Promise<CalderaAdversary[]> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('caldera-integration', {
      body: { 
        endpoint: 'adversaries',
        tenantId
      }
    });
    
    if (error) throw new Error(`Error fetching CALDERA adversaries: ${error.message}`);
    return data.adversaries || [];
  },
  
  /**
   * Start a new operation with the specified adversary and agents
   */
  async startOperation(name: string, adversaryId: string, agentGroups: string[]): Promise<CalderaOperation> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('caldera-integration', {
      body: { 
        endpoint: 'operations',
        method: 'POST',
        payload: {
          name,
          adversary_id: adversaryId,
          group: agentGroups,
          state: 'running',
          autonomous: true
        },
        tenantId
      }
    });
    
    if (error) throw new Error(`Error starting CALDERA operation: ${error.message}`);
    return data.operation;
  },
  
  /**
   * Get results from an operation
   */
  async getOperationResults(operationId: string): Promise<CalderaResult[]> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('caldera-integration', {
      body: { 
        endpoint: `operations/${operationId}/results`,
        tenantId
      }
    });
    
    if (error) throw new Error(`Error fetching operation results: ${error.message}`);
    return data.results || [];
  },
  
  /**
   * Stop an operation
   */
  async stopOperation(operationId: string): Promise<void> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { error } = await supabase.functions.invoke('caldera-integration', {
      body: { 
        endpoint: `operations/${operationId}`,
        method: 'PATCH',
        payload: {
          state: 'cleanup'
        },
        tenantId
      }
    });
    
    if (error) throw new Error(`Error stopping CALDERA operation: ${error.message}`);
  },
  
  /**
   * Generate virtual environment from agent data
   * @param agentId The agent ID to use for VM generation
   * @returns Generated environment configuration
   */
  async generateVMFromAgent(agentId: string): Promise<any> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('vm-generator', {
      body: { 
        agentId,
        tenantId
      }
    });
    
    if (error) throw new Error(`Error generating VM from agent data: ${error.message}`);
    return data;
  }
};
