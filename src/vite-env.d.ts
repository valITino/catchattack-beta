
/// <reference types="vite/client" />

// Add Supabase to the window object for our mocks
interface Window {
  supabase?: {
    functions: {
      invoke: (
        functionName: string, 
        options: { 
          body?: any 
        }
      ) => Promise<{ data: any; error: any }>
    }
  }
}
