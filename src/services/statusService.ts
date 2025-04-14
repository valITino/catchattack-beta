
import { supabase } from '@/utils/supabase';
import { baseService } from './baseService';

/**
 * Service for system status operations
 */
export const statusService = {
  /**
   * Get system status
   * @returns The system status
   */
  async getSystemStatus(): Promise<{
    emulations: number;
    rules: number;
    deployments: number;
    lastEmulation?: string;
    lastDeployment?: string;
    aiMetrics?: {
      ruleGenerationAccuracy: number;
      anomalyDetectionAccuracy: number;
      predictionAccuracy: number;
      lastTraining: string;
    }
  }> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('status', {
      body: { tenantId }
    });
    
    if (error) throw new Error(`Error fetching system status: ${error.message}`);
    return data;
  },
  
  /**
   * Get AI system status and metrics
   * @returns AI-specific status metrics
   */
  async getAIStatus(): Promise<{
    modelVersions: Record<string, string>;
    trainingStatus: 'idle' | 'training' | 'error';
    modelPerformance: {
      ruleGeneration: { accuracy: number, f1Score: number };
      anomalyDetection: { accuracy: number, f1Score: number };
      scheduling: { accuracy: number, meanError: number };
    };
    lastTrainingDate: string;
    datasetStats: {
      trainingSize: number;
      validationSize: number;
      lastUpdated: string;
    };
  }> {
    const tenantId = baseService.getTenantId();
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-status', {
      body: { tenantId }
    });
    
    if (error) throw new Error(`Error fetching AI system status: ${error.message}`);
    return data;
  }
};
