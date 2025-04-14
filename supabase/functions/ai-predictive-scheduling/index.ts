
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { predictOptimalSchedule } from "../_shared/ai-helpers.ts";

/**
 * AI-powered predictive scheduling edge function
 * Analyzes techniques and system metrics to suggest optimal scheduling times
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { techniqueIds, tenantId } = await req.json();
    
    if (!techniqueIds || !Array.isArray(techniqueIds) || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Predicting schedule for tenant ${tenantId} with ${techniqueIds.length} techniques`);
    
    // In a real implementation, this would call an AI service
    // Here we use a helper function that mocks prediction
    const prediction = await predictOptimalSchedule(techniqueIds);
    
    return new Response(
      JSON.stringify(prediction),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in predictive scheduling:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
