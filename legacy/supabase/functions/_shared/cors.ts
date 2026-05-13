
/**
 * CORS headers for Supabase Edge Functions
 * Used to allow cross-origin requests to the API
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
