
// Functions for handling Sigma rules
import { SigmaTemplate } from './types.ts';

export async function fetchSigmaRuleTemplates(techniqueIds: string[]): Promise<SigmaTemplate[]> {
  try {
    const templates = [];
    
    // For each technique ID, try to find matching Sigma rules in the SigmaHQ repository
    for (const techniqueId of techniqueIds) {
      // Format the technique ID for search (e.g., T1078 -> t1078)
      const searchId = techniqueId.toLowerCase();
      
      // Search for rules with that technique tag
      const searchUrl = `https://api.github.com/search/code?q=repo:SigmaHQ/sigma+attack.${searchId}`;
      
      try {
        const response = await fetch(searchUrl);
        if (response.ok) {
          const searchResults = await response.json();
          
          // For each potential match, fetch and check if it's a valid Sigma rule
          for (const item of searchResults.items?.slice(0, 3) || []) {
            if (item.path.endsWith('.yml') || item.path.endsWith('.yaml')) {
              const ruleUrl = `https://raw.githubusercontent.com/SigmaHQ/sigma/master/${item.path}`;
              const ruleResponse = await fetch(ruleUrl);
              
              if (ruleResponse.ok) {
                const ruleContent = await ruleResponse.text();
                const ruleTemplate = parseSigmaYaml(ruleContent, techniqueId);
                if (ruleTemplate) {
                  templates.push(ruleTemplate);
                }
              }
            }
          }
        }
      } catch (searchError) {
        console.error(`Error searching for Sigma rules for ${techniqueId}:`, searchError);
      }
    }
    
    return templates;
  } catch (error) {
    console.error("Error fetching Sigma rule templates:", error);
    return [];
  }
}

export function parseSigmaYaml(yamlContent: string, techniqueId: string): SigmaTemplate | null {
  // Very simplified parsing - in production use a proper YAML parser
  const titleMatch = yamlContent.match(/title:\s*(.*)/);
  const idMatch = yamlContent.match(/id:\s*(.*)/);
  const descriptionMatch = yamlContent.match(/description:\s*(.*)/);
  const statusMatch = yamlContent.match(/status:\s*(.*)/);
  const levelMatch = yamlContent.match(/level:\s*(.*)/);
  
  // Check if the rule actually is for the requested technique
  const tags = yamlContent.match(/tags:([\s\S]*?)(?:\n\w+:|\Z)/);
  const tagBlock = tags ? tags[1] : '';
  
  if (!tagBlock.toLowerCase().includes(`attack.${techniqueId.toLowerCase()}`)) {
    return null;
  }
  
  return {
    id: idMatch ? idMatch[1].trim() : `sigma-${Date.now()}`,
    techniqueId,
    title: titleMatch ? titleMatch[1].trim() : `Detection for ${techniqueId}`,
    description: descriptionMatch ? descriptionMatch[1].trim() : '',
    status: statusMatch ? statusMatch[1].trim() : 'experimental',
    yamlContent // Store the full content for reference
  };
}
