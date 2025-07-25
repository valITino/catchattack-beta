import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { MitreAttackTechnique } from './types'

// Mock toast to avoid React dependency during tests
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}))

let generateSigmaRule: typeof import('./ruleUtils').generateSigmaRule
let checkRuleExists: typeof import('./ruleUtils').checkRuleExists
let getAllRules: typeof import('./ruleUtils').getAllRules

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('./ruleUtils')
  generateSigmaRule = mod.generateSigmaRule
  checkRuleExists = mod.checkRuleExists
  getAllRules = mod.getAllRules
})

describe('rule utils', () => {
  it('generateSigmaRule creates a new rule with a unique ID', () => {
    const tech1: MitreAttackTechnique = { id: 'T0001', name: 'Test1', tactic: 'TA0002', description: '' }
    const tech2: MitreAttackTechnique = { id: 'T0002', name: 'Test2', tactic: 'TA0003', description: '' }

    const rule1 = generateSigmaRule(tech1)
    const rule2 = generateSigmaRule(tech2)

    expect(rule1.id).toBeDefined()
    expect(rule2.id).toBeDefined()
    expect(rule1.id).not.toBe(rule2.id)
    expect(getAllRules().length).toBe(2)
  })

  it('checkRuleExists returns existing rules when duplicates are generated', () => {
    const tech: MitreAttackTechnique = { id: 'T1000', name: 'Duplicate', tactic: 'TA0001', description: '' }
    const first = generateSigmaRule(tech)
    const second = generateSigmaRule(tech)

    expect(second).toBe(first)
    const existing = checkRuleExists(tech.id, `Detecting ${tech.name}`)
    expect(existing).toBe(first)
  })
})
