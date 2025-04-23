
import { supabase } from "@/utils/supabase";

export const scheduleService = {
  async getPredictiveSchedule(techniques: string[]): Promise<{
    suggestedTime: string;
    confidence: number;
    reasoning: string;
    resourceImpact: 'low' | 'medium' | 'high';
  }> {
    if (!techniques || !Array.isArray(techniques) || techniques.length === 0) {
      throw new Error('Cannot predict schedule without techniques');
    }
    
    console.log(`Generating predictive schedule for ${techniques.length} techniques`);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-predictive-scheduling', {
        body: { techniques }
      });
      
      if (error) {
        console.error('Error from predictive scheduling edge function:', error);
        throw new Error(`Error generating predictive schedule: ${error.message}`);
      }
      
      if (!data || !data.suggestedTime) {
        console.error('Invalid response format from predictive scheduling service', data);
        throw new Error('Invalid response from predictive scheduling service');
      }
      
      return {
        suggestedTime: data.suggestedTime,
        confidence: data.confidence || 0.75,
        reasoning: data.reasoning || 'Optimal time based on resource usage patterns',
        resourceImpact: data.resourceImpact || 'low'
      };
    } catch (error) {
      console.error('Error in predictive scheduling:', error);
      // Provide default values if prediction fails
      return {
        suggestedTime: new Date(Date.now() + 3600000).toISOString(), // Default to 1 hour from now
        confidence: 0.5,
        reasoning: 'Default scheduling based on general best practices',
        resourceImpact: 'low'
      };
    }
  }
};
