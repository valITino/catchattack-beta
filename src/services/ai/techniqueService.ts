
import { supabase } from "@/utils/supabase";

export const techniqueService = {
  async explainTechnique(techniqueId: string): Promise<{
    name: string;
    description: string;
    tactic: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string[];
    detection: string[];
  }> {
    try {
      // Get all techniques from MITRE
      const { data: mitreData, error: mitreError } = await supabase.functions.invoke('ai-mitre-techniques', {
        body: {}
      });
      
      if (mitreError) throw new Error(`Error fetching MITRE data: ${mitreError.message}`);
      
      const technique = mitreData.techniques.find((t: any) => t.id === techniqueId);
      
      if (!technique) {
        throw new Error(`Technique ${techniqueId} not found`);
      }
      
      // Determine severity based on tactic
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (['Initial Access', 'Command and Control', 'Exfiltration'].includes(technique.tactic)) {
        severity = 'high';
      } else if (['Defense Evasion', 'Privilege Escalation', 'Impact'].includes(technique.tactic)) {
        severity = 'critical';
      } else if (['Discovery', 'Collection'].includes(technique.tactic)) {
        severity = 'low';
      }
      
      return {
        name: technique.name,
        description: technique.description,
        tactic: technique.tactic,
        severity,
        mitigation: [
          `Monitor for suspicious activity related to ${technique.name}`,
          `Implement least privilege principles to limit impact`,
          `Use application whitelisting to prevent unauthorized execution`
        ],
        detection: [
          `Monitor logs for indicators of ${technique.name}`,
          `Implement detection rules targeting this technique`,
          `Correlate events across different systems to identify patterns`
        ]
      };
    } catch (error) {
      console.error(`Error explaining technique ${techniqueId}:`, error);
      throw new Error(`Failed to explain technique: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};
