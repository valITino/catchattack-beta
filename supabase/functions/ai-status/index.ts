
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * AI system status edge function
 * Returns status and performance metrics of AI models
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenantId } = await req.json();
    
    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: "Missing tenant ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Getting AI status for tenant ${tenantId}`);
    
    // In a real implementation, this would fetch actual AI system metrics
    // Here we return mock data
    const aiStatus = {
      modelVersions: {
        ruleGeneration: "v1.2.1",
        anomalyDetection: "v1.0.3",
        scheduling: "v0.9.5"
      },
      trainingStatus: "idle",
      modelPerformance: {
        ruleGeneration: { accuracy: 0.87, f1Score: 0.83 },
        anomalyDetection: { accuracy: 0.92, f1Score: 0.89 },
        scheduling: { accuracy: 0.75, meanError: 120 } // Error in seconds
      },
      lastTrainingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      datasetStats: {
        trainingSize: 2500,
        validationSize: 500,
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      }
    };
    
    return new Response(
      JSON.stringify(aiStatus),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in AI status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
