
import { supabase } from '@/utils/supabase';
import { baseService } from './baseService';
import type { Schedule } from '@/types/backend';

/**
 * Service for managing schedules
 */
export const scheduleService = {
  /**
   * Create or update a schedule
   * @param schedule The schedule to create or update
   * @returns The created/updated schedule
   */
  async upsertSchedule(schedule: Partial<Schedule>): Promise<Schedule> {
    const tenantId = baseService.getTenantId();
    
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
    const tenantId = baseService.getTenantId();
    
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
};
