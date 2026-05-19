
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { findSimilarRules } from "../_shared/ai-helpers.ts";

/**
 * AI-powered rule similarity detection edge function
 * Finds semantically similar existing rules to prevent duplicates
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ruleContent, tenantId } = await req.json();
    
    if (!ruleContent || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Finding similar rules for tenant ${tenantId}`);
    
    // In a real implementation, this would call an AI service
    // Here we use a helper function that mocks similarity detection
    const similarRules = await findSimilarRules(ruleContent, tenantId);
    
    return new Response(
      JSON.stringify({ similarRules }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in rule similarity detection:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
