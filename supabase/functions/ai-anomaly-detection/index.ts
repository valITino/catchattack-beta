
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
    
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Missing or invalid logs parameter",
          details: "The logs parameter must be a non-empty array"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!tenantId) {
      return new Response(
        JSON.stringify({ 
          error: "Missing tenant ID",
          details: "A valid tenant ID is required for this operation"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Detecting anomalies for tenant ${tenantId} in ${logs.length} logs`);
    
    // Call the AI helper function to analyze the logs for anomalies
    const anomalyResults = await detectAnomalies(logs);
    
    console.log(`Found ${anomalyResults.length} anomalies`);
    
    return new Response(
      JSON.stringify({ anomalies: anomalyResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in anomaly detection:", error);
    
    // Provide a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: "Failed to process anomaly detection request",
        message: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
