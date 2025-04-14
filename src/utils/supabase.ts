
import { createClient } from '@supabase/supabase-js';
import type { Tables } from '@/types/backend';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Tables>(supabaseUrl, supabaseAnonKey);

// Create a helper for tenant-specific queries
export function getTenantQuery(table: string, tenantId: string | null) {
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  
  return supabase.from(table).select('*').eq('tenant_id', tenantId);
}

// Helper for getting the current tenant ID from local storage
export function getCurrentTenantId(): string | null {
  return localStorage.getItem('currentTenantId');
}

// Helper for setting the current tenant ID in local storage
export function setCurrentTenantId(tenantId: string): void {
  localStorage.setItem('currentTenantId', tenantId);
}
