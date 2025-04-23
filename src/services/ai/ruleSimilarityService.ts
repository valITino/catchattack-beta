
import { supabase } from "@/utils/supabase";
import type { SigmaRule } from "@/types/backend";

export const ruleSimilarityService = {
  async findSimilarRules(ruleContent: string): Promise<{
    similarRules: Array<{
      ruleId: string;
      similarity: number;
      title: string;
    }>;
  }> {
    if (!ruleContent || typeof ruleContent !== 'string' || ruleContent.trim() === '') {
      return { similarRules: [] };
    }
    
    console.log('Searching for similar rules');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-rule-similarity', {
        body: { ruleContent }
      });
      
      if (error) {
        console.error('Error from similarity detection edge function:', error);
        throw new Error(`Error detecting similar rules: ${error.message}`);
      }
      
      if (!data || !data.similarRules || !Array.isArray(data.similarRules)) {
        console.warn('Invalid response format from similarity detection service');
        return { similarRules: [] };
      }
      
      return data;
    } catch (error) {
      console.error('Error in rule similarity detection:', error);
      // Return empty result on error instead of throwing
      return { similarRules: [] };
    }
  }
};
