
// Functions for handling Atomic Red Team tests
import { AtomicTest } from './types.ts';

export async function fetchAtomicRedTeamTests(techniqueIds: string[]): Promise<AtomicTest[]> {
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
        // Parse YAML content
        const text = await response.text();
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

export function parseAtomicYaml(yamlContent: string, techniqueId: string): AtomicTest[] {
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
