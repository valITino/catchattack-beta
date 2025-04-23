
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * CALDERA integration edge function
 * Connects to CALDERA adversary emulation platform API
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, method = 'GET', payload, tenantId } = await req.json();
    
    if (!endpoint || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`CALDERA API request for tenant ${tenantId}, endpoint: ${endpoint}, method: ${method}`);
    
    // Get CALDERA credentials from environment variables
    // In a real implementation, these would be tenant-specific
    const calderaApiKey = Deno.env.get("CALDERA_API_KEY") || "ADMIN123";
    const calderaUrl = Deno.env.get("CALDERA_URL") || "http://localhost:8888";
    
    // Build the API URL
    const apiUrl = `${calderaUrl}/api/v2/${endpoint}`;
    
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${calderaApiKey}`
    };
    
    // Make the request to CALDERA
    const response = await fetch(apiUrl, {
      method,
      headers,
      ...(payload ? { body: JSON.stringify(payload) } : {})
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CALDERA API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`CALDERA API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Process and return the response
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in CALDERA integration:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
