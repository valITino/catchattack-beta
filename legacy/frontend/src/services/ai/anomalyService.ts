
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/utils/supabase";
import type { EmulationLog } from "@/types/backend";

export const anomalyService = {
  async detectAnomalies(logs: EmulationLog[]): Promise<{
    anomalies: Array<{
      techniqueId: string;
      description: string;
      confidence: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    timestamp: string;
    processedLogsCount: number;
  }> {
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      console.warn('Attempted to detect anomalies with empty or invalid logs');
      return { 
        anomalies: [],
        timestamp: new Date().toISOString(),
        processedLogsCount: 0
      };
    }
    
    console.log(`Detecting anomalies in ${logs.length} logs`);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-anomaly-detection', {
        body: { logs }
      });
      
      if (error) {
        console.error('Anomaly detection error:', error);
        throw new Error(`Error detecting anomalies: ${error.message}`);
      }
      
      return {
        ...data,
        timestamp: new Date().toISOString(),
        processedLogsCount: logs.length
      };
    } catch (error) {
      console.error('Error in anomaly detection:', error);
      throw new Error(`Failed to detect anomalies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};
