
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { EmulationRequest, EmulationResult } from '@/types/backend';
import { toast } from '@/components/ui/use-toast';

export function useEmulation() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmulationResult | null>(null);

  async function startEmulation(request: EmulationRequest) {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('caldera-integration', {
        body: { 
          endpoint: 'operations',
          method: 'POST',
          payload: request 
        }
      });
      
      if (error) {
        console.error('Emulation error:', error);
        toast({
          title: "Emulation Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setResult(data);
      toast({
        title: "Emulation Started",
        description: `Operation ${request.techniques.length} technique(s) initiated`
      });
    } catch (err) {
      console.error('Error starting emulation:', err);
      toast({
        title: "Error",
        description: "Failed to start emulation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return { startEmulation, loading, result };
}
