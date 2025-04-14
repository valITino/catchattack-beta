
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { analyzeEmulationLogs } from "../_shared/ai-helpers.ts";

/**
 * AI-enhanced rule generation edge function
 * Analyzes emulation logs to generate or enhance Sigma rules
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emulationResult, tenantId } = await req.json();
    
    if (!emulationResult || !emulationResult.logs || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Analyzing logs for tenant ${tenantId}, emulation ID: ${emulationResult.id}`);
    
    // In a real implementation, this would send logs to an AI service for analysis
    // Here we'll use a helper function that mocks AI analysis
    const analysis = await analyzeEmulationLogs(emulationResult.logs);
    
    // Transform AI analysis into rule suggestions
    const ruleSuggestions = analysis.patterns.map(pattern => {
      return {
        title: `Detection for ${pattern.technique}`,
        description: pattern.description,
        techniqueId: pattern.techniqueId,
        rule: pattern.sigmaRule,
        status: 'draft',
        severity: pattern.severity as 'low' | 'medium' | 'high' | 'critical',
        source: emulationResult.id, // Mark the source as this emulation
      };
    });
    
    return new Response(
      JSON.stringify({
        rules: ruleSuggestions,
        confidence: analysis.confidence,
        suggestedImprovements: analysis.suggestedImprovements,
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
