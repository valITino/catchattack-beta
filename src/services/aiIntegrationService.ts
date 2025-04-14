
import apiClient from './apiClient';
import { logger } from '@/utils/logger';
import { catchAsync } from '@/utils/errorHandler';
import { AI_CONFIG } from '@/config/config';
import type { EmulationResult } from '@/types/backend';

/**
 * Service for AI-powered rule generation and analysis
 */
export interface AIRuleSuggestion {
  title: string;
  description: string;
  techniqueId: string;
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export interface AIAnalysisResult {
  rules: AIRuleSuggestion[];
  confidence: number;
  suggestedImprovements: string[];
  processedData: {
    eventsAnalyzed: number;
    techniquesDetected: number;
    coverageGaps: string[];
  };
}

export interface AnomalyDetectionResult {
  anomalies: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    relatedTechnique?: string;
    confidence: number;
    eventIds: string[];
  }>;
  processedLogsCount: number;
  detectionThreshold: number;
}

/**
 * Service for AI-powered enhancements
 */
class AIIntegrationService {
  /**
   * Generate enhanced rules using AI analysis of emulation results
   * @param emulationResult Emulation result data
   * @returns Analysis results with rule suggestions
   */
  generateEnhancedRules = catchAsync(
    async (emulationResult: EmulationResult): Promise<AIAnalysisResult> => {
      logger.info('Generating AI-enhanced rules', { 
        emulationId: emulationResult.id,
        logCount: emulationResult.logs?.length || 0
      });
      
      try {
        // Call AI rule generation function
        const response = await apiClient.post('/ai-rule-generation', {
          emulationResult,
          tenantId: localStorage.getItem('tenant_id') || 'default'
        });
        
        logger.debug('AI rule generation complete', { 
          rulesGenerated: response.rules?.length || 0 
        });
        
        return response;
      } catch (error) {
        logger.error('Error generating AI-enhanced rules', error);
        
        // Fallback response if the AI service fails
        return {
          rules: [],
          confidence: 0,
          suggestedImprovements: ['AI service unavailable'],
          processedData: {
            eventsAnalyzed: 0,
            techniquesDetected: 0,
            coverageGaps: ['AI analysis failed']
          }
        };
      }
    }
  );

  /**
   * Detect anomalies in logs using AI
   * @param logs Event logs to analyze
   * @returns Detection results with anomalies
   */
  detectAnomalies = catchAsync(
    async (logs: any[]): Promise<AnomalyDetectionResult> => {
      logger.info('Detecting anomalies using AI', { logCount: logs.length });
      
      try {
        // Call AI anomaly detection function
        const response = await apiClient.post('/ai-anomaly-detection', {
          logs,
          threshold: AI_CONFIG.anomalyDetection.threshold,
          useHistoricalData: AI_CONFIG.anomalyDetection.useHistoricalData
        });
        
        logger.debug('AI anomaly detection complete', { 
          anomaliesDetected: response.anomalies?.length || 0 
        });
        
        return response;
      } catch (error) {
        logger.error('Error detecting anomalies', error);
        
        // Return empty result if the service fails
        return {
          anomalies: [],
          processedLogsCount: logs.length,
          detectionThreshold: AI_CONFIG.anomalyDetection.threshold
        };
      }
    }
  );

  /**
   * Find similar existing rules to prevent duplication
   * @param ruleContent Sigma rule content to compare
   * @returns Similarity analysis results
   */
  findSimilarRules = catchAsync(
    async (ruleContent: string): Promise<{
      similarRules: Array<{
        ruleId: string;
        title: string;
        similarity: number;
        diffAreas: string[];
      }>;
    }> => {
      logger.info('Finding similar rules');
      
      try {
        // Call AI rule similarity function
        const response = await apiClient.post('/ai-rule-similarity', {
          ruleContent,
          threshold: 0.7 // Similarity threshold
        });
        
        logger.debug('Similar rule check complete', { 
          similarRulesFound: response.similarRules?.length || 0 
        });
        
        return response;
      } catch (error) {
        logger.error('Error finding similar rules', error);
        
        // Return empty result if the service fails
        return { similarRules: [] };
      }
    }
  );

  /**
   * Generate predictive emulation schedule based on historical data
   * @returns Suggested emulation schedule
   */
  generatePredictiveSchedule = catchAsync(
    async (): Promise<{
      suggestedSchedules: Array<{
        dayOfWeek: number;
        timeOfDay: string;
        confidence: number;
        techniques: string[];
        reasoning: string;
      }>;
    }> => {
      logger.info('Generating predictive emulation schedule');
      
      try {
        // Call AI predictive scheduling function
        const response = await apiClient.post('/ai-predictive-scheduling', {
          tenantId: localStorage.getItem('tenant_id') || 'default'
        });
        
        logger.debug('Predictive scheduling complete', { 
          schedulesGenerated: response.suggestedSchedules?.length || 0 
        });
        
        return response;
      } catch (error) {
        logger.error('Error generating predictive schedule', error);
        
        // Return empty schedules if the service fails
        return { suggestedSchedules: [] };
      }
    }
  );
}

// Export singleton instance
export const aiIntegrationService = new AIIntegrationService();

// Default export for convenience
export default aiIntegrationService;
