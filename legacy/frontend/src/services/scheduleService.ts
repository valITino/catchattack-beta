
import { supabase } from '@/utils/supabase';
import { baseService } from './baseService';
import { aiService } from './aiService';
import type { Schedule, EmulationRequest } from '@/types/backend';

/**
 * Service for managing schedules
 */
export const scheduleService = {
  /**
   * Create or update a schedule
   * @param schedule The schedule to create or update
   * @param useAIPrediction Whether to use AI for predicting optimal schedule time
   * @returns The created/updated schedule
   */
  async upsertSchedule(schedule: Partial<Schedule>, useAIPrediction = false): Promise<Schedule> {
    const tenantId = baseService.getTenantId();
    
    // Use AI to predict optimal scheduling time if requested
    if (useAIPrediction && schedule.emulation?.techniques) {
      try {
        const prediction = await aiService.getPredictiveSchedule(schedule.emulation.techniques);
        
        // Only apply AI prediction if confidence is high enough
        if (prediction.confidence > 0.7) {
          // Update the schedule with AI-suggested time
          if (!schedule.emulation.schedule) {
            schedule.emulation.schedule = {};
          }
          
          schedule.emulation.schedule.timestamp = prediction.suggestedTime;
          
          // Add explanation to the schedule description
          if (!schedule.description) {
            schedule.description = '';
          }
          schedule.description += `\nAI Scheduling Recommendation: ${prediction.reasoning} (Resource impact: ${prediction.resourceImpact})`;
        }
      } catch (aiError) {
        console.error('AI prediction error:', aiError);
        // Non-blocking - proceed with original schedule if AI prediction fails
      }
    }
    
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
  
  /**
   * Get AI-recommended scheduling options for a set of techniques
   * @param emulationRequest The emulation request to schedule
   * @returns AI recommendations for scheduling
   */
  async getScheduleRecommendations(emulationRequest: EmulationRequest): Promise<{
    optimalTime: string;
    alternativeTimes: string[];
    reasoning: string;
    resourceImpact: 'low' | 'medium' | 'high';
  }> {
    if (!emulationRequest.techniques || emulationRequest.techniques.length === 0) {
      throw new Error('Emulation request must include techniques');
    }
    
    // Call AI service for predictions
    const prediction = await aiService.getPredictiveSchedule(emulationRequest.techniques);
    
    // Format the response for the frontend
    return {
      optimalTime: prediction.suggestedTime,
      alternativeTimes: [], // In a real implementation, the AI might suggest alternatives
      reasoning: prediction.reasoning,
      resourceImpact: prediction.resourceImpact
    };
  }
};
