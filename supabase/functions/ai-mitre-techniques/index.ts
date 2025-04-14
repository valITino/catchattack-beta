
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getMitreAttackTechniques } from "../_shared/ai-helpers.ts";

/**
 * AI-powered MITRE ATT&CK framework data provider
 * Provides techniques and tactics from the MITRE ATT&CK framework
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching MITRE ATT&CK techniques");
    
    // In a production environment, this would:
    // 1. Fetch from the MITRE ATT&CK API
    // 2. Or connect to a STIX/TAXII server
    // 3. Or pull from a regularly updated database
    
    const techniques = await getMitreAttackTechniques();
    
    console.log(`Fetched ${techniques.length} MITRE ATT&CK techniques`);
    
    return new Response(
      JSON.stringify({ 
        techniques,
        timestamp: new Date().toISOString(),
        source: "MITRE ATT&CK Framework",
        version: "v12.0" // Would be dynamically determined in production
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching MITRE ATT&CK data:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch MITRE ATT&CK data",
        message: error.message,
        techniques: [], // Return empty array for consistent response
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
