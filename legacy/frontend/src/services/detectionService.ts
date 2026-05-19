
import { toast } from "@/components/ui/use-toast";
import { aiService } from "@/services/aiService";
import { EmulationLog, EmulationResult } from "@/types/backend";
import { MitreAttackTechnique } from "@/utils/mitreAttackUtils";

/**
 * Detection Service
 * Handles real-time detection and analysis of emulation results and logs
 */
export const detectionService = {
  /**
   * Analyze logs for suspicious patterns and anomalies
   * @param logs Emulation logs to analyze
   * @returns Analysis results with detected anomalies
   */
  async analyzeLogs(logs: EmulationLog[]): Promise<{
    anomalies: Array<{
      techniqueId: string;
      description: string;
      confidence: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    timestamp: string;
    processedLogsCount: number;
  }> {
    try {
      console.log(`Analyzing ${logs.length} logs for anomalies`);
      
      // Use AI service to detect anomalies in the logs
      const result = await aiService.detectAnomalies(logs);
      
      console.log(`Analysis complete: found ${result.anomalies.length} anomalies`);
      
      return result;
    } catch (error) {
      console.error("Error during log analysis:", error);
      toast({
        title: "Analysis Error",
        description: `Failed to analyze logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      
      return {
        anomalies: [],
        timestamp: new Date().toISOString(),
        processedLogsCount: 0
      };
    }
  },
  
  /**
   * Generate enhanced detection rules based on emulation results
   * @param emulationResult The emulation result to analyze
   * @returns Generated rules and improvement suggestions
   */
  async generateDetectionRules(emulationResult: EmulationResult): Promise<{
    rules: Array<{
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      techniqueId: string;
    }>;
    confidence: number;
    suggestedImprovements: string[];
  }> {
    try {
      console.log(`Generating detection rules for emulation: ${emulationResult.id}`);

      // Use AI service to generate enhanced rules
      const result = await aiService.generateEnhancedRules(emulationResult);
      
      toast({
        title: "Rules Generated",
        description: `Successfully generated ${result.rules.length} detection rules`,
      });
      
      return {
        rules: result.rules.map(rule => ({
          title: rule.title || '',
          description: rule.description || '',
          severity: rule.severity || 'medium',
          techniqueId: rule.techniqueId || ''
        })),
        confidence: result.confidence,
        suggestedImprovements: result.suggestedImprovements
      };
    } catch (error) {
      console.error("Error generating detection rules:", error);
      toast({
        title: "Rule Generation Failed",
        description: `Failed to generate rules: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      
      return {
        rules: [],
        confidence: 0,
        suggestedImprovements: ["Error in rule generation process"]
      };
    }
  },
  
  /**
   * Correlate logs and techniques to identify potential security gaps
   * @param logs Emulation logs to analyze
   * @param techniques MITRE ATT&CK techniques to compare against
   * @returns Gap analysis with recommendations
   */
  async performGapAnalysis(
    logs: EmulationLog[],
    techniques: MitreAttackTechnique[]
  ): Promise<{
    coveredTechniques: string[];
    uncoveredTechniques: string[];
    recommendations: Array<{
      techniqueId: string;
      recommendation: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  }> {
    try {
      console.log(`Performing gap analysis with ${logs.length} logs and ${techniques.length} techniques`);
      
      // Extract technique IDs from logs
      const loggedTechniqueIds = new Set(logs.map(log => log.techniqueId));
      
      // Identify covered and uncovered techniques
      const coveredTechniques = techniques
        .filter(tech => loggedTechniqueIds.has(tech.id))
        .map(tech => tech.id);
      
      const uncoveredTechniques = techniques
        .filter(tech => !loggedTechniqueIds.has(tech.id))
        .map(tech => tech.id);
      
      // Generate recommendations for uncovered techniques with proper typing
      const recommendations = techniques
        .filter(tech => !loggedTechniqueIds.has(tech.id))
        .map(tech => ({
          techniqueId: tech.id,
          recommendation: `Consider adding detection coverage for ${tech.name} (${tech.id})`,
          priority: (tech.tactic === 'Initial Access' || tech.tactic === 'Command and Control') 
            ? 'high' as const : 'medium' as const
        }));
      
      return {
        coveredTechniques,
        uncoveredTechniques,
        recommendations
      };
    } catch (error) {
      console.error("Error performing gap analysis:", error);
      toast({
        title: "Gap Analysis Failed",
        description: `Failed to analyze coverage gaps: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      
      return {
        coveredTechniques: [],
        uncoveredTechniques: [],
        recommendations: []
      };
    }
  }
};
