
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/utils/supabase";
import type { EmulationResult, SigmaRule } from "@/types/backend";

export const ruleGeneratorService = {
  async generateEnhancedRules(emulationResult: EmulationResult): Promise<{
    rules: Partial<SigmaRule>[];
    confidence: number;
    suggestedImprovements: string[];
  }> {
    if (!emulationResult || !emulationResult.logs || emulationResult.logs.length === 0) {
      throw new Error('Cannot generate rules from empty or invalid emulation results');
    }
    
    console.log(`Generating enhanced rules for emulation ID: ${emulationResult.id}`);
    
    try {
      const requestStartTime = performance.now();
      
      const { data, error } = await supabase.functions.invoke('ai-rule-generation', {
        body: { emulationResult }
      });
      
      const requestTime = performance.now() - requestStartTime;
      console.log(`Rule generation completed in ${requestTime.toFixed(2)}ms`);
      
      if (error) throw new Error(`Error generating enhanced rules: ${error.message}`);
      if (!data) throw new Error('No data returned from rule generation service');
      
      return data;
    } catch (error) {
      console.error('Error in rule generation:', error);
      throw new Error(`Failed to generate enhanced rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};
