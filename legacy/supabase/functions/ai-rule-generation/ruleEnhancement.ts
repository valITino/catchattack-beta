
// Functions for enhancing Sigma rules with Atomic tests and templates
import { AtomicTest, SigmaTemplate, RuleEnhancement } from './types.ts';

export function enhanceSigmaRuleWithAtomicTests(sigmaRule: string, atomicTests: AtomicTest[]): string {
  // Simple enhancement (in production, use proper YAML manipulation)
  if (atomicTests.length === 0) return sigmaRule;
  
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
    if (sigmaRule.includes('selection:')) {
      const selectionIndex = sigmaRule.indexOf('selection:');
      const commandPattern = commandPatterns.slice(0, 3).join('|');
      
      const insertionPoint = sigmaRule.indexOf('\n', selectionIndex);
      if (insertionPoint !== -1) {
        const addition = `\n      CommandLine|contains:\n        - '${commandPattern}'`;
        sigmaRule = sigmaRule.slice(0, insertionPoint) + addition + sigmaRule.slice(insertionPoint);
      }
    }
  }
  
  return sigmaRule;
}

export function enhanceSigmaRuleWithTemplates(sigmaRule: string, templatePatterns: string[]): string {
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
