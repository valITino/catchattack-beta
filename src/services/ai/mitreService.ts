
import { supabase } from "@/utils/supabase";
import { toast } from "@/components/ui/use-toast";

export const mitreService = {
  async getMitreTechniques() {
    console.log(`Fetching MITRE ATT&CK techniques`);
    
    try {
      const requestStartTime = performance.now();
      
      const { data, error } = await supabase.functions.invoke('ai-mitre-techniques', {
        body: {}
      });
      
      const requestTime = performance.now() - requestStartTime;
      console.log(`MITRE techniques fetch completed in ${requestTime.toFixed(2)}ms`);
      
      if (error) {
        console.error('Error from MITRE techniques edge function:', error);
        throw new Error(`Error fetching MITRE techniques: ${error.message}`);
      }
      
      if (!data || !data.techniques || !Array.isArray(data.techniques)) {
        console.error('Invalid response format from MITRE techniques service', data);
        throw new Error('Invalid response format from MITRE ATT&CK service');
      }
      
      if (data.cached) {
        console.log('Using cached MITRE ATT&CK data');
      } else {
        console.log('Using fresh MITRE ATT&CK data');
      }
      
      console.log(`Fetched ${data.techniques.length} MITRE techniques from ${data.source || 'unknown source'}`);
      
      return data;
    } catch (error) {
      console.error('Error fetching MITRE techniques:', error);
      toast({
        title: "MITRE Data Error",
        description: "Failed to fetch ATT&CK framework data. Using fallback data.",
        variant: "destructive",
      });
      
      // Return fallback data
      return {
        techniques: [
          { id: "T1078", name: "Valid Accounts", tactic: "Initial Access", description: "Adversaries may obtain and abuse credentials of existing accounts." },
          { id: "T1566", name: "Phishing", tactic: "Initial Access", description: "Adversaries may send phishing messages to gain access to victim systems." },
          { id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution", description: "Adversaries may abuse command and script interpreters to execute commands." }
        ],
        timestamp: new Date().toISOString(),
        source: "Local Fallback Data",
        version: "v1.0 (fallback)",
        cached: true
      };
    }
  }
};
