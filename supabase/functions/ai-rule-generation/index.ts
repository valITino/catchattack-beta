
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { analyzeEmulationLogs } from "../_shared/ai-helpers.ts";

/**
 * AI-enhanced rule generation edge function
 * Analyzes emulation logs to generate or enhance Sigma rules
 * Integrates with Atomic Red Team tests and Sigma rule templates
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emulationResult, tenantId, options } = await req.json();
    
    if (!emulationResult || !emulationResult.logs || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Analyzing logs for tenant ${tenantId}, emulation ID: ${emulationResult.id}`);
    
    // Load Atomic Red Team tests for the techniques used in this emulation
    const atomicTests = await fetchAtomicRedTeamTests(emulationResult.techniques);
    console.log(`Loaded ${atomicTests.length} Atomic Red Team tests for analysis`);
    
    // Load Sigma rule templates for the techniques 
    const sigmaTemplates = await fetchSigmaRuleTemplates(emulationResult.techniques);
    console.log(`Loaded ${sigmaTemplates.length} Sigma rule templates for reference`);
    
    // Enhanced analysis that incorporates Atomic Red Team tests and Sigma templates
    const analysis = await analyzeEmulationLogsWithReferences(
      emulationResult.logs,
      atomicTests,
      sigmaTemplates,
      options
    );
    
    // Transform AI analysis into rule suggestions
    const ruleSuggestions = analysis.patterns.map(pattern => {
      return {
        title: `Detection for ${pattern.technique}`,
        description: pattern.description,
        techniqueId: pattern.techniqueId,
        rule: pattern.sigmaRule,
        status: 'draft',
        severity: pattern.severity as 'low' | 'medium' | 'high' | 'critical',
        source: emulationResult.id, // Mark the source as this emulation
        atomicTestReferences: pattern.atomicTestReferences || [],
        dataSourceRecommendations: pattern.dataSourceRecommendations || []
      };
    });
    
    return new Response(
      JSON.stringify({
        rules: ruleSuggestions,
        confidence: analysis.confidence,
        suggestedImprovements: analysis.suggestedImprovements,
        referenceMaterials: {
          atomicTests: atomicTests.map(test => ({ 
            id: test.id, 
            name: test.name,
            techniqueId: test.techniqueId 
          })),
          sigmaTemplates: sigmaTemplates.map(template => ({ 
            id: template.id, 
            title: template.title,
            techniqueId: template.techniqueId 
          }))
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in AI rule generation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Fetch Atomic Red Team tests for specified techniques
 */
async function fetchAtomicRedTeamTests(techniqueIds: string[]) {
  try {
    const tests = [];
    
    // For each technique, fetch the corresponding atomic tests
    for (const techniqueId of techniqueIds) {
      // Format the technique ID for the GitHub API (e.g., T1078 -> T1078)
      const formattedId = techniqueId.split('.')[0]; // Remove sub-technique part if any
      
      // Fetch Atomic Red Team test from GitHub
      const url = `https://raw.githubusercontent.com/redcanaryco/atomic-red-team/master/atomics/${formattedId}/${formattedId}.yaml`;
      const response = await fetch(url);
      
      if (response.ok) {
        // Parse YAML content (simplified handling here)
        const text = await response.text();
        // Simple extraction of test data (in a real implementation, use a YAML parser)
        const atomicTests = parseAtomicYaml(text, formattedId);
        tests.push(...atomicTests);
      }
    }
    
    return tests;
  } catch (error) {
    console.error("Error fetching Atomic Red Team tests:", error);
    return [];
  }
}

/**
 * Simple YAML parser for Atomic Red Team tests (simplified)
 * In a real implementation, use a proper YAML parser
 */
function parseAtomicYaml(yamlContent: string, techniqueId: string) {
  const tests = [];
  
  // Very simplified parsing - in production use a proper YAML parser
  const testBlocks = yamlContent.split('- name:').slice(1);
  
  for (let i = 0; i < testBlocks.length; i++) {
    const block = testBlocks[i];
    const name = block.split('\n')[0].trim();
    const description = (block.match(/description:\s*\|([\s\S]*?)(?:supported_platforms:|$)/) || ['', ''])[1].trim();
    const platforms = (block.match(/supported_platforms:([\s\S]*?)(?:input_arguments:|executor:|$)/) || ['', ''])[1]
      .trim()
      .split('\n')
      .filter(line => line.trim().startsWith('- '))
      .map(line => line.replace('-', '').trim());
      
    const executorMatch = block.match(/executor:\s*\|([\s\S]*?)(?:- name:|$)/);
    const executorBlock = executorMatch ? executorMatch[1] : '';
    
    const executorName = (executorBlock.match(/name:\s*(.*)/) || ['', 'command_prompt'])[1].trim();
    const command = (executorBlock.match(/command:\s*\|([\s\S]*?)(?:name:|$)/) || ['', ''])[1].trim();
    
    tests.push({
      id: `${techniqueId}-atomic-${i+1}`,
      techniqueId,
      name,
      description,
      supportedPlatforms: platforms,
      executor: {
        name: executorName,
        command,
        elevation_required: executorBlock.includes('elevation_required: true')
      }
    });
  }
  
  return tests;
}

/**
 * Fetch Sigma rule templates for specified techniques
 */
async function fetchSigmaRuleTemplates(techniqueIds: string[]) {
  try {
    const templates = [];
    
    // For each technique ID, try to find matching Sigma rules in the SigmaHQ repository
    for (const techniqueId of techniqueIds) {
      // Format the technique ID for search (e.g., T1078 -> t1078)
      const searchId = techniqueId.toLowerCase();
      
      // Search for rules with that technique tag
      // This is a simple approach - in production, we would need to search more specifically
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

/**
 * Simple YAML parser for Sigma rules (simplified)
 * In a real implementation, use a proper YAML parser
 */
function parseSigmaYaml(yamlContent: string, techniqueId: string) {
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
    level: levelMatch ? levelMatch[1].trim() : 'medium',
    yamlContent // Store the full content for reference
  };
}

/**
 * Enhanced log analysis using Atomic Red Team tests and Sigma templates for context
 */
async function analyzeEmulationLogsWithReferences(logs, atomicTests, sigmaTemplates, options) {
  // Use the existing helper function as a starting point
  const baseAnalysis = await analyzeEmulationLogs(logs);
  
  // Enhance the patterns with references to Atomic tests and Sigma templates
  const enhancedPatterns = baseAnalysis.patterns.map(pattern => {
    // Find matching atomic tests for this technique
    const matchingTests = atomicTests.filter(test => 
      test.techniqueId === pattern.techniqueId ||
      test.techniqueId === pattern.techniqueId.split('.')[0] // Handle sub-techniques
    );
    
    // Find matching sigma templates
    const matchingTemplates = sigmaTemplates.filter(template => 
      template.techniqueId === pattern.techniqueId ||
      template.techniqueId === pattern.techniqueId.split('.')[0]
    );
    
    // Use atomic tests to enhance rule creation
    if (matchingTests.length > 0) {
      // Add references to relevant atomic tests
      pattern.atomicTestReferences = matchingTests.map(test => ({
        id: test.id,
        name: test.name,
        commandSample: test.executor.command.substring(0, 100) + (test.executor.command.length > 100 ? '...' : '')
      }));
      
      // Improve the sigma rule based on atomic test commands if possible
      if (pattern.sigmaRule) {
        pattern.sigmaRule = enhanceSigmaRuleWithAtomicTests(pattern.sigmaRule, matchingTests);
      }
    }
    
    // Use sigma templates to enhance rule creation
    if (matchingTemplates.length > 0) {
      // Extract relevant detection logic from templates
      const templateDetectionPatterns = matchingTemplates.map(template => {
        // Very simplified extraction
        const detectionBlock = template.yamlContent.match(/detection:([\s\S]*?)(?:\nfields:|\nfalsepositives:|\nlevel:|\Z)/);
        return detectionBlock ? detectionBlock[1].trim() : null;
      }).filter(Boolean);
      
      if (templateDetectionPatterns.length > 0 && pattern.sigmaRule) {
        pattern.sigmaRule = enhanceSigmaRuleWithTemplates(pattern.sigmaRule, templateDetectionPatterns);
      }
    }
    
    return pattern;
  });
  
  return {
    ...baseAnalysis,
    patterns: enhancedPatterns,
    confidence: baseAnalysis.confidence * 1.2, // Increased confidence due to real-world references
    enhancedWithRealWorldData: true
  };
}

/**
 * Enhance a Sigma rule using information from Atomic Red Team tests
 */
function enhanceSigmaRuleWithAtomicTests(sigmaRule, atomicTests) {
  // This is a simplified implementation
  // In a real scenario, we would parse the sigma rule YAML and add detection patterns
  
  // Simple string enhancement (in production, use proper YAML manipulation)
  let enhancedRule = sigmaRule;
  
  // Extract command patterns from atomic tests
  const commandPatterns = atomicTests
    .map(test => test.executor.command)
    .filter(Boolean)
    .map(cmd => {
      // Extract potentially useful command fragments
      const fragments = cmd
        .split(/[\s|&;<>]/)
        .filter(fragment => fragment.length > 5)
        .filter(fragment => !fragment.startsWith('$') && !fragment.startsWith('%'))
        .map(fragment => fragment.replace(/["']/g, '').trim());
      
      return fragments;
    })
    .flat();
  
  // If we found useful command patterns, try to incorporate them
  if (commandPatterns.length > 0) {
    // Check if the rule already has a 'selection' block
    if (enhancedRule.includes('selection:')) {
      // Add new detection criteria
      const selectionIndex = enhancedRule.indexOf('selection:');
      const commandPattern = commandPatterns.slice(0, 3).join('|');
      
      const insertionPoint = enhancedRule.indexOf('\n', selectionIndex);
      if (insertionPoint !== -1) {
        const addition = `\n      CommandLine|contains:\n        - '${commandPattern}'`;
        enhancedRule = enhancedRule.slice(0, insertionPoint) + addition + enhancedRule.slice(insertionPoint);
      }
    }
  }
  
  return enhancedRule;
}

/**
 * Enhance a Sigma rule using patterns from existing Sigma templates
 */
function enhanceSigmaRuleWithTemplates(sigmaRule, templatePatterns) {
  // Simple enhancement (in production, use proper YAML manipulation)
  if (templatePatterns.length === 0) return sigmaRule;
  
  // Extract useful detection patterns
  const selectionBlocks = templatePatterns
    .map(pattern => {
      const selectionMatch = pattern.match(/selection[^:]*:([\s\S]*?)(?:condition:|\Z)/);
      return selectionMatch ? selectionMatch[1].trim() : null;
    })
    .filter(Boolean);
  
  if (selectionBlocks.length > 0) {
    // Add a comment referencing the enhanced sigma rule
    const comment = '\n# Enhanced with patterns from Sigma community rules\n';
    const bestBlock = selectionBlocks[0]; // Just use the first one for simplicity
    
    // Add some commented references at the end
    return sigmaRule + comment + '# Reference detection pattern:\n' + 
      '# ' + bestBlock.split('\n').join('\n# ');
  }
  
  return sigmaRule;
}
