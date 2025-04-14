
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { DefaultTooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { UI_CONFIG } from "./config/config";
import { logger } from "./utils/logger";

// Configure query client with defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: import.meta.env.DEV ? false : true,
      meta: {
        onError: (error: Error) => {
          logger.error('Query error:', error);
        },
      },
    },
    mutations: {
      retry: 1,
      meta: {
        onError: (error: Error) => {
          logger.error('Mutation error:', error);
        },
      },
    },
  },
});

const App = () => {
  logger.debug('Initializing application');
  
  return (
    <QueryClientProvider client={queryClient}>
      <DefaultTooltipProvider delayDuration={UI_CONFIG.tooltips.delay}>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </DefaultTooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
