
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { detectAnomalies } from "../_shared/ai-helpers.ts";
import type { AiAnalysisRequest, EmulationLog } from "../_shared/types.ts";

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
    const startTime = Date.now();
    const { logs, tenantId }: AiAnalysisRequest = await req.json();
    
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      console.error("Invalid logs data received:", logs);
      return new Response(
        JSON.stringify({ 
          error: "Missing or invalid logs parameter",
          details: "The logs parameter must be a non-empty array",
          anomalies: [], // Return empty anomalies array for consistent response structure
          status: "error",
          timestamp: new Date().toISOString()
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
          status: "error",
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Detecting anomalies for tenant ${tenantId} in ${logs.length} logs`);
    
    // Performance monitoring
    const analysisStartTime = Date.now();
    
    // Call the AI helper function to analyze the logs for anomalies
    const anomalyResults = await detectAnomalies(logs);
    
    // Calculate processing times
    const analysisTime = Date.now() - analysisStartTime;
    const totalProcessingTime = Date.now() - startTime;
    
    console.log(`Found ${anomalyResults.length} anomalies in ${analysisTime}ms (total: ${totalProcessingTime}ms)`);
    
    // Return anomaly results with performance metrics
    return new Response(
      JSON.stringify({ 
        anomalies: anomalyResults,
        timestamp: new Date().toISOString(),
        processedLogsCount: logs.length,
        processingTimeMs: analysisTime,
        totalTimeMs: totalProcessingTime,
        status: anomalyResults.length > 0 ? "anomalies_detected" : "no_anomalies"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in anomaly detection:", error);
    
    // Provide a standardized error response
    return new Response(
      JSON.stringify({ 
        error: "Failed to process anomaly detection request",
        message: error.message,
        stack: Deno.env.get("ENVIRONMENT") === "development" ? error.stack : undefined,
        anomalies: [], // Return empty anomalies array for consistent response structure
        status: "error",
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
