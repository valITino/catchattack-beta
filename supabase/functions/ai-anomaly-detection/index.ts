
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
      console.error("Invalid logs data received:", logs);
      return new Response(
        JSON.stringify({ 
          error: "Missing or invalid logs parameter",
          details: "The logs parameter must be a non-empty array",
          anomalies: [], // Return empty anomalies array for consistent response structure
          status: "error"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!tenantId || typeof tenantId !== 'string') {
      console.error("Missing or invalid tenant ID:", tenantId);
      return new Response(
        JSON.stringify({ 
          error: "Missing or invalid tenant ID",
          details: "A valid tenant ID string is required for this operation",
          anomalies: [], // Return empty anomalies array for consistent response structure
          status: "error"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Detecting anomalies for tenant ${tenantId} in ${logs.length} logs`);
    
    // Call the AI helper function to analyze the logs for anomalies
    const startTime = Date.now();
    const anomalyResults = await detectAnomalies(logs);
    const processingTime = Date.now() - startTime;
    
    console.log(`Found ${anomalyResults.length} anomalies in ${processingTime}ms`);
    
    return new Response(
      JSON.stringify({ 
        anomalies: anomalyResults,
        timestamp: new Date().toISOString(),
        processedLogsCount: logs.length,
        processingTimeMs: processingTime,
        status: "success"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in anomaly detection:", error);
    
    // Provide a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: "Failed to process anomaly detection request",
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
        anomalies: [], // Return empty anomalies array for consistent response structure
        status: "error",
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
