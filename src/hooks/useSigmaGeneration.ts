
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { SigmaRule } from '@/types/backend';
import { toast } from '@/components/ui/use-toast';

export function useSigmaGeneration() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [generatedRule, setGeneratedRule] = useState<Partial<SigmaRule> | null>(null);

  async function generateRule(title: string, techniqueId: string) {
    setStatus('loading');
    try {
      const { data, error } = await supabase.functions.invoke('ai-rule-generation', {
        body: { 
          title,
          techniqueId,
        }
      });

      if (error) {
        console.error('Rule generation error:', error);
        toast({
          title: "Generation Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setGeneratedRule(data);
      setStatus('done');
      toast({
        title: "Rule Generated",
        description: "New Sigma rule has been generated successfully"
      });
    } catch (err) {
      console.error('Error generating rule:', err);
      toast({
        title: "Error",
        description: "Failed to generate rule",
        variant: "destructive"
      });
      setStatus('idle');
    }
  }

  return { generateRule, status, generatedRule };
}
