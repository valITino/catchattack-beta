
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchAtomicRedTeamTests } from "./atomicTests.ts";
import { fetchSigmaRuleTemplates } from "./sigmaRules.ts";
import { enhanceSigmaRuleWithAtomicTests, enhanceSigmaRuleWithTemplates } from "./ruleEnhancement.ts";
import { AtomicTest, SigmaTemplate } from "./types.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emulationResult, tenantId, options } = await req.json();
    
    if (!emulationResult || !emulationResult.logs || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Analyzing logs for tenant ${tenantId}, emulation ID: ${emulationResult.id}`);
    
    // Load Atomic Red Team tests and Sigma templates
    const atomicTests = await fetchAtomicRedTeamTests(emulationResult.techniques);
    console.log(`Loaded ${atomicTests.length} Atomic Red Team tests for analysis`);
    
    const sigmaTemplates = await fetchSigmaRuleTemplates(emulationResult.techniques);
    console.log(`Loaded ${sigmaTemplates.length} Sigma rule templates for reference`);
    
    // Enhanced analysis that incorporates Atomic Red Team tests and Sigma templates
    const analysis = await analyzeEmulationLogsWithReferences(
      emulationResult.logs,
      atomicTests,
      sigmaTemplates,
      options
    );
    
    // Transform AI analysis into rule suggestions
    const ruleSuggestions = analysis.patterns.map(pattern => {
      return {
        title: `Detection for ${pattern.technique}`,
        description: pattern.description,
        techniqueId: pattern.techniqueId,
        rule: pattern.sigmaRule,
        status: 'draft',
        severity: pattern.severity as 'low' | 'medium' | 'high' | 'critical',
        source: emulationResult.id,
        atomicTestReferences: pattern.atomicTestReferences || [],
        dataSourceRecommendations: pattern.dataSourceRecommendations || []
      };
    });
    
    return new Response(
      JSON.stringify({
        rules: ruleSuggestions,
        confidence: analysis.confidence,
        suggestedImprovements: analysis.suggestedImprovements,
        referenceMaterials: {
          atomicTests: atomicTests.map(test => ({ 
            id: test.id, 
            name: test.name,
            techniqueId: test.techniqueId 
          })),
          sigmaTemplates: sigmaTemplates.map(template => ({ 
            id: template.id, 
            title: template.title,
            techniqueId: template.techniqueId 
          }))
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in AI rule generation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function analyzeEmulationLogsWithReferences(logs: any[], atomicTests: AtomicTest[], sigmaTemplates: SigmaTemplate[], options: any) {
  // Use the existing helper function as a starting point
  const patterns = [];
  const confidence = 0.85; // Base confidence
  const suggestedImprovements = [
    "Consider adding more data sources for comprehensive coverage",
    "Review and customize detection thresholds"
  ];
  
  // Process each technique's logs
  const techniqueGroups = new Map();
  for (const log of logs) {
    if (!techniqueGroups.has(log.techniqueId)) {
      techniqueGroups.set(log.techniqueId, []);
    }
    techniqueGroups.get(log.techniqueId).push(log);
  }
  
  // Generate patterns for each technique
  for (const [techniqueId, techLogs] of techniqueGroups) {
    const matchingAtomicTests = atomicTests.filter(test => test.techniqueId === techniqueId);
    const matchingTemplates = sigmaTemplates.filter(template => template.techniqueId === techniqueId);
    
    // Generate base Sigma rule
    let sigmaRule = generateBaseSigmaRule(techniqueId, techLogs);
    
    // Enhance with atomic tests
    sigmaRule = enhanceSigmaRuleWithAtomicTests(sigmaRule, matchingAtomicTests);
    
    // Enhance with template patterns
    const templatePatterns = matchingTemplates.map(t => t.yamlContent);
    sigmaRule = enhanceSigmaRuleWithTemplates(sigmaRule, templatePatterns);
    
    patterns.push({
      technique: `Technique ${techniqueId}`,
      techniqueId,
      description: `Detection rule for technique ${techniqueId} based on emulated behavior`,
      sigmaRule,
      severity: determineSeverity(techniqueId, techLogs),
      atomicTestReferences: matchingAtomicTests.map(test => ({
        id: test.id,
        name: test.name,
        commandSample: test.executor.command.substring(0, 100)
      }))
    });
  }
  
  return { patterns, confidence, suggestedImprovements };
}

function generateBaseSigmaRule(techniqueId: string, logs: any[]): string {
  // Basic Sigma rule generation - in production, this would be more sophisticated
  return `title: Detection Rule for ${techniqueId}
description: Automatically generated rule based on emulated behavior
status: experimental
references:
  - https://attack.mitre.org/techniques/${techniqueId}/
author: AI Generator
date: ${new Date().toISOString().split('T')[0]}
tags:
  - attack.${techniqueId}
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4688
  condition: selection
falsepositives:
  - Legitimate administrative activity
level: medium`;
}

function determineSeverity(techniqueId: string, logs: any[]): 'low' | 'medium' | 'high' | 'critical' {
  // Simple severity determination based on tactic/technique and log patterns
  const criticalTechniques = ['T1078', 'T1486', 'T1498'];
  const highTechniques = ['T1110', 'T1134', 'T1068'];
  
  if (criticalTechniques.includes(techniqueId)) return 'critical';
  if (highTechniques.includes(techniqueId)) return 'high';
  
  // Default to medium if no specific criteria met
  return 'medium';
}
