
import { supabase, getCurrentTenantId } from '@/utils/supabase';

/**
 * Base utility functions for services
 */
export const baseService = {
  /**
   * Get the current tenant ID or throw an error if not available
   * @returns The current tenant ID
   */
  getTenantId(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant ID is required');
    return tenantId;
  }
};
