
import { handleEmulationRequest } from './edge-functions/emulate';
import { handleCreateRuleRequest } from './edge-functions/create-rule';
import { handleDeployRequest } from './edge-functions/deploy';
import { handleStatusRequest } from './edge-functions/status';

// Mock the Supabase Edge Functions
// This will be replaced by actual Edge Functions when deployed
export const mockSupabaseFunctions = {
  'emulate': handleEmulationRequest,
  'create-rule': handleCreateRuleRequest,
  'deploy': handleDeployRequest,
  'status': handleStatusRequest
};

// Initialize the mock functions
export function initMockFunctions() {
  // Override the supabase.functions.invoke method if in development
  if (import.meta.env.DEV && window.supabase) {
    console.log('Initializing mock Supabase functions');
    
    // Save the original invoke method
    const originalInvoke = window.supabase.functions.invoke;
    
    // Override the invoke method
    window.supabase.functions.invoke = async (functionName: string, options: any) => {
      console.log(`Invoking mock function: ${functionName}`, options);
      
      // Use the mock function if available
      if (mockSupabaseFunctions[functionName]) {
        try {
          const result = await mockSupabaseFunctions[functionName](options.body);
          return { data: result, error: null };
        } catch (error) {
          console.error(`Error in mock function ${functionName}:`, error);
          return { data: null, error: { message: error.message } };
        }
      }
      
      // Fall back to the original invoke method
      console.warn(`No mock found for function ${functionName}, using original invoke`);
      return originalInvoke(functionName, options);
    };
  }
}
