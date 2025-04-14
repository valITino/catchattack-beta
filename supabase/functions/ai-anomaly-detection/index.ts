
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { detectAnomalies } from "../_shared/ai-helpers.ts";

/**
 * AI-powered anomaly detection edge function
 * Analyzes logs to detect unusual patterns or behaviors
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { logs, tenantId } = await req.json();
    
    if (!logs || !Array.isArray(logs) || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Detecting anomalies for tenant ${tenantId} in ${logs.length} logs`);
    
    // In a real implementation, this would call an AI service
    // Here we use a helper function that mocks anomaly detection
    const anomalyResults = await detectAnomalies(logs);
    
    return new Response(
      JSON.stringify({ anomalies: anomalyResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in anomaly detection:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
