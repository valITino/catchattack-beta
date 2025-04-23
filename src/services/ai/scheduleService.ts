
import { supabase } from "@/utils/supabase";

export const scheduleService = {
  /**
   * Get AI-predicted optimal schedule for techniques
   * @param techniques Array of MITRE ATT&CK technique IDs
   */
  async getPredictiveSchedule(techniques: string[]): Promise<{
    suggestedTime: string;
    reasoning: string;
    confidence: number;
    resourceImpact: 'low' | 'medium' | 'high';
  }> {
    if (!techniques || !Array.isArray(techniques) || techniques.length === 0) {
      throw new Error('No techniques provided for schedule prediction');
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-predictive-scheduling', {
        body: { techniques }
      });
      
      if (error) {
        throw new Error(`Error predicting schedule: ${error.message}`);
      }
      
      if (!data || !data.suggestedTime) {
        throw new Error('Invalid response from predictive scheduling service');
      }
      
      return {
        suggestedTime: data.suggestedTime,
        reasoning: data.reasoning || 'Optimized based on system load and detection avoidance',
        confidence: data.confidence || 0.75,
        resourceImpact: data.resourceImpact || 'medium'
      };
    } catch (error) {
      console.error('Error in predictive scheduling:', error);
      
      // Return a fallback prediction rather than throwing
      return {
        suggestedTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        reasoning: 'Default schedule due to prediction failure',
        confidence: 0.5,
        resourceImpact: 'medium'
      };
    }
  }
};
