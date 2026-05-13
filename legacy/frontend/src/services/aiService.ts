
import { anomalyService } from './ai/anomalyService';
import { ruleGeneratorService } from './ai/ruleGeneratorService';
import { techniqueService } from './ai/techniqueService';
import { mitreService } from './ai/mitreService';
import { ruleSimilarityService } from './ai/ruleSimilarityService';
import { scheduleService as aiScheduleService } from './ai/scheduleService';

export const aiService = {
  detectAnomalies: anomalyService.detectAnomalies,
  generateEnhancedRules: ruleGeneratorService.generateEnhancedRules,
  explainTechnique: techniqueService.explainTechnique,
  getMitreTechniques: mitreService.getMitreTechniques,
  findSimilarRules: ruleSimilarityService.findSimilarRules,
  getPredictiveSchedule: aiScheduleService.getPredictiveSchedule
};
