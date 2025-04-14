
import { supabase } from '@/utils/supabase';
import { baseService } from './baseService';
import { aiService } from './aiService';
import type { SigmaRule, EmulationResult } from '@/types/backend';

/**
 * Service for managing Sigma rules
 */
export const rulesService = {
  /**
   * Get all Sigma rules
   * @returns Array of Sigma rules
   */
  async getSigmaRules(): Promise<SigmaRule[]> {
    const tenantId = baseService.getTenantId();
    
    const { data, error } = await supabase
      .from('sigma_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('dateCreated', { ascending: false });
      
    if (error) throw new Error(`Error fetching Sigma rules: ${error.message}`);
    return data || [];
  },
  
  /**
   * Create a new Sigma rule
   * @param rule The rule to create
   * @returns The created rule
   */
  async createSigmaRule(rule: Partial<SigmaRule>): Promise<SigmaRule> {
    const tenantId = baseService.getTenantId();
    
    // Before creating, check for similar existing rules using AI
    try {
      const similarityResult = await aiService.findSimilarRules(rule.rule || '');
      
      if (similarityResult.similarRules.some(r => r.similarity > 0.8)) {
        // Add a flag for the frontend to warn about potential duplicates
        rule.isDuplicate = true;
        rule.duplicateOf = similarityResult.similarRules[0].ruleId;
      }
    } catch (aiError) {
      console.error('AI similarity check error:', aiError);
      // Non-blocking - proceed with rule creation even if similarity check fails
    }
    
    // Call to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-rule', {
      body: { 
        rule: { ...rule, tenant_id: tenantId },
      }
    });
    
    if (error) throw new Error(`Error creating Sigma rule: ${error.message}`);
    return data;
  },
  
  /**
   * Generate AI-enhanced rules from emulation results
   * @param emulationResult The emulation result to analyze
   * @returns The generated rules
   */
  async generateRulesFromEmulation(emulationResult: EmulationResult): Promise<SigmaRule[]> {
    const tenantId = baseService.getTenantId();
    
    // First, use AI to generate enhanced rule suggestions
    const { rules: ruleSuggestions, confidence } = await aiService.generateEnhancedRules(emulationResult);
    
    if (!ruleSuggestions || ruleSuggestions.length === 0) {
      throw new Error('AI could not generate any rule suggestions');
    }
    
    // For each suggestion, create the actual rule
    const createdRules: SigmaRule[] = [];
    
    for (const ruleSuggestion of ruleSuggestions) {
      // Add metadata about AI generation
      const ruleWithMetadata = {
        ...ruleSuggestion,
        author: `AI (confidence: ${confidence.toFixed(2)})`,
        dateCreated: new Date().toISOString(),
        dateUpdated: new Date().toISOString()
      };
      
      try {
        const createdRule = await this.createSigmaRule(ruleWithMetadata);
        createdRules.push(createdRule);
      } catch (error) {
        console.error('Error creating AI-suggested rule:', error);
        // Continue with other rules even if one fails
      }
    }
    
    return createdRules;
  }
};
