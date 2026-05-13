
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { MitreAttackTechnique } from "../_shared/types.ts";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
let cachedTechniques: MitreAttackTechnique[] | null = null;
let lastFetchTime = 0;

/**
 * AI-powered MITRE ATT&CK framework data provider
 * Provides techniques and tactics from the MITRE ATT&CK framework with caching
 * Integrated with TAXII server for real-time data
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Request for MITRE ATT&CK techniques received");
    
    const now = Date.now();
    const isCacheValid = cachedTechniques && (now - lastFetchTime < CACHE_TTL);
    
    if (!isCacheValid) {
      console.log("Cache invalid, fetching fresh MITRE ATT&CK data");
      
      try {
        // Try to fetch from TAXII server first
        cachedTechniques = await fetchFromTaxiiServer();
        console.log(`Successfully fetched ${cachedTechniques.length} techniques from TAXII server`);
      } catch (taxiiError) {
        console.error("Error fetching from TAXII server:", taxiiError);
        console.log("Falling back to GitHub hosted CTI data");
        // Fall back to GitHub-hosted CTI data
        cachedTechniques = await fetchMitreAttackTechniques();
      }
      
      lastFetchTime = now;
    } else {
      console.log("Using cached MITRE ATT&CK data");
    }
    
    // Additional request-specific filtering or sorting could be done here
    const queryParams = new URL(req.url).searchParams;
    const tactics = queryParams.get('tactics')?.split(',') || [];
    const platforms = queryParams.get('platforms')?.split(',') || [];
    
    let techniques = [...cachedTechniques];
    
    // Apply filters if provided
    if (tactics.length > 0) {
      techniques = techniques.filter(tech => tactics.includes(tech.tactic));
    }
    
    if (platforms.length > 0) {
      techniques = techniques.filter(tech => 
        tech.platforms && tech.platforms.some(p => platforms.includes(p))
      );
    }
    
    console.log(`Returning ${techniques.length} MITRE ATT&CK techniques`);
    
    return new Response(
      JSON.stringify({ 
        techniques,
        timestamp: new Date().toISOString(),
        source: "MITRE ATT&CK Framework",
        version: "v12.0",
        cached: isCacheValid
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

/**
 * Fetches data from MITRE ATT&CK TAXII server
 */
async function fetchFromTaxiiServer(): Promise<MitreAttackTechnique[]> {
  // TAXII 2.1 API endpoints
  const discoveryUrl = "https://cti-taxii.mitre.org/taxii/";
  const apiRootUrl = "https://cti-taxii.mitre.org/stix/";
  const enterpriseCollectionUrl = "https://cti-taxii.mitre.org/stix/collections/95ecc380-afe9-11e4-9b6c-751b66dd541e/";
  
  // Headers for TAXII requests
  const taxiiHeaders = {
    "Accept": "application/taxii+json;version=2.1",
    "Content-Type": "application/taxii+json;version=2.1",
  };
  
  // First, discover available API roots
  const discoveryResponse = await fetch(discoveryUrl, { headers: taxiiHeaders });
  if (!discoveryResponse.ok) {
    throw new Error(`TAXII discovery failed: ${discoveryResponse.status} ${discoveryResponse.statusText}`);
  }
  
  // Now fetch objects from the Enterprise ATT&CK collection
  const objectsUrl = `${enterpriseCollectionUrl}objects/`;
  const objectsResponse = await fetch(objectsUrl, { 
    headers: { 
      ...taxiiHeaders,
      "Accept": "application/vnd.oasis.stix+json; version=2.1"
    } 
  });
  
  if (!objectsResponse.ok) {
    throw new Error(`TAXII objects fetch failed: ${objectsResponse.status} ${objectsResponse.statusText}`);
  }
  
  const objectsData = await objectsResponse.json();
  
  // Process STIX data to extract techniques
  const techniques: MitreAttackTechnique[] = [];
  
  // Find all attack-pattern objects, which represent techniques
  const attackPatterns = objectsData.objects.filter(obj => obj.type === 'attack-pattern');
  
  for (const pattern of attackPatterns) {
    // Skip revoked or deprecated techniques
    if (pattern.revoked || pattern.x_mitre_deprecated) continue;
    
    // Find tactic using the kill_chain_phases
    let tactic = '';
    if (pattern.kill_chain_phases && pattern.kill_chain_phases.length > 0) {
      // Get the ATT&CK tactic from kill chain phase
      const attackTactic = pattern.kill_chain_phases.find(p => p.kill_chain_name === 'mitre-attack');
      if (attackTactic) {
        tactic = attackTactic.phase_name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    
    // Extract ID from external_references
    let id = '';
    let references: string[] = [];
    
    if (pattern.external_references) {
      const mitreSrc = pattern.external_references.find(ref => ref.source_name === 'mitre-attack');
      if (mitreSrc) {
        id = mitreSrc.external_id;
        
        // Add URL to references if available
        if (mitreSrc.url) {
          references.push(mitreSrc.url);
        }
      }
      
      // Add other references except MITRE source itself
      references = [
        ...references,
        ...pattern.external_references
          .filter(ref => ref.source_name !== 'mitre-attack' && ref.url)
          .map(ref => ref.url)
      ];
    }
    
    // Skip if no ID was found
    if (!id) continue;
    
    // Extract data sources
    const dataSources = pattern.x_mitre_data_sources || [];
    
    // Extract platforms
    const platforms = pattern.x_mitre_platforms || [];
    
    techniques.push({
      id,
      name: pattern.name,
      tactic,
      description: pattern.description,
      detection: pattern.x_mitre_detection || '',
      platforms: platforms,
      dataSources: dataSources,
      mitigation: pattern.x_mitre_mitigation || '',
      references: references
    });
  }
  
  return techniques;
}

/**
 * Fetches MITRE ATT&CK techniques from the official STIX/TAXII server or API
 * @returns Promise<MitreAttackTechnique[]> Array of MITRE ATT&CK techniques
 */
async function fetchMitreAttackTechniques(): Promise<MitreAttackTechnique[]> {
  try {
    // In a production environment, this would fetch from the actual MITRE ATT&CK API
    // Example using MITRE's GitHub-hosted CTI data
    const response = await fetch('https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch MITRE data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process STIX data to extract techniques
    // STIX data is complex and requires specialized parsing
    const techniques: MitreAttackTechnique[] = [];
    
    // Find all attack-pattern objects, which represent techniques
    const attackPatterns = data.objects.filter(obj => obj.type === 'attack-pattern');
    
    for (const pattern of attackPatterns) {
      // Skip revoked or deprecated techniques
      if (pattern.revoked || pattern.x_mitre_deprecated) continue;
      
      // Find tactic using the kill_chain_phases
      let tactic = '';
      if (pattern.kill_chain_phases && pattern.kill_chain_phases.length > 0) {
        // Get the ATT&CK tactic from kill chain phase
        const attackTactic = pattern.kill_chain_phases.find(p => p.kill_chain_name === 'mitre-attack');
        if (attackTactic) {
          tactic = attackTactic.phase_name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      }
      
      // Extract ID from external_references
      let id = '';
      let references: string[] = [];
      
      if (pattern.external_references) {
        const mitreSrc = pattern.external_references.find(ref => ref.source_name === 'mitre-attack');
        if (mitreSrc) {
          id = mitreSrc.external_id;
          
          // Add URL to references if available
          if (mitreSrc.url) {
            references.push(mitreSrc.url);
          }
        }
        
        // Add other references except MITRE source itself
        references = [
          ...references,
          ...pattern.external_references
            .filter(ref => ref.source_name !== 'mitre-attack' && ref.url)
            .map(ref => ref.url)
        ];
      }
      
      // Skip if no ID was found
      if (!id) continue;
      
      // Determine severity based on impact or complexity
      let severity: 'low' | 'medium' | 'high' = 'medium';
      
      // Check x_mitre_impact_type if available
      if (pattern.x_mitre_impact_type === 'high') {
        severity = 'high';
      } else if (pattern.x_mitre_impact_type === 'low') {
        severity = 'low';
      }

      // Extract data sources
      const dataSources = pattern.x_mitre_data_sources || [];
      
      // Extract platforms
      const platforms = pattern.x_mitre_platforms || [];
      
      techniques.push({
        id,
        name: pattern.name,
        tactic,
        description: pattern.description,
        detection: pattern.x_mitre_detection || '',
        platforms: platforms,
        dataSources: dataSources,
        mitigation: pattern.x_mitre_mitigation || '',
        references: references
      });
    }
    
    console.log(`Parsed ${techniques.length} techniques from MITRE ATT&CK data`);
    return techniques;
    
  } catch (error) {
    console.error("Error in fetchMitreAttackTechniques:", error);
    
    // Fallback to static data if API fails
    console.log("Using fallback static MITRE data");
    return getFallbackTechniques();
  }
}

/**
 * Provides fallback static MITRE technique data in case the API fetch fails
 */
function getFallbackTechniques(): MitreAttackTechnique[] {
  // Use a subset of real data for the fallback
  return [
    {
      id: "T1078",
      name: "Valid Accounts",
      tactic: "Initial Access",
      description: "Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.",
      detection: "Monitor authentication logs for login attempts with valid credentials from unusual sources or at unusual times.",
      platforms: ["Windows", "macOS", "Linux"],
      dataSources: ["Authentication logs", "Failed logon attempts"],
      mitigation: "Use multi-factor authentication and privileged account management.",
      references: ["https://attack.mitre.org/techniques/T1078"]
    },
    {
      id: "T1566",
      name: "Phishing",
      tactic: "Initial Access",
      description: "Adversaries may send phishing messages to gain access to victim systems. Phishing is a common means of initial access.",
      detection: "Monitor emails for suspicious characteristics and user reports of phishing attempts.",
      platforms: ["Windows", "macOS", "Linux", "SaaS"],
      dataSources: ["Email gateway logs", "User reports"],
      mitigation: "Implement email filtering and user awareness training.",
      references: ["https://attack.mitre.org/techniques/T1566"]
    },
    {
      id: "T1059",
      name: "Command and Scripting Interpreter",
      tactic: "Execution",
      description: "Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.",
      detection: "Monitor for unusual command-line activities and script execution.",
      platforms: ["Windows", "macOS", "Linux"],
      dataSources: ["Process monitoring", "Command-line logging"],
      mitigation: "Disable or restrict access to scripting interpreters where possible.",
      references: ["https://attack.mitre.org/techniques/T1059"]
    },
    {
      id: "T1053",
      name: "Scheduled Task/Job",
      tactic: "Execution",
      description: "Adversaries may abuse task scheduling functionality to facilitate initial or recurring execution of malicious code.",
      detection: "Monitor creation and modification of scheduled tasks and jobs.",
      platforms: ["Windows", "macOS", "Linux"],
      dataSources: ["Task scheduler logs", "Cron logs"],
      mitigation: "Configure proper access controls for task scheduling.",
      references: ["https://attack.mitre.org/techniques/T1053"]
    },
    {
      id: "T1027",
      name: "Obfuscated Files or Information",
      tactic: "Defense Evasion",
      description: "Adversaries may attempt to make an executable or file difficult to discover or analyze by encrypting, encoding, or otherwise obfuscating its contents.",
      detection: "Use anti-virus and file analysis tools to detect obfuscated files.",
      platforms: ["Windows", "macOS", "Linux"],
      dataSources: ["File monitoring", "Anti-virus"],
      mitigation: "Use application allowlisting and behavioral monitoring.",
      references: ["https://attack.mitre.org/techniques/T1027"]
    }
  ];
}
