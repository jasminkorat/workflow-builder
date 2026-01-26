import { describe, it, expect, beforeEach } from 'vitest'
import { saveWorkflow, loadWorkflow, clearWorkflow } from '../utils/persistence'
import type { WorkflowState } from '../types'

describe('Persistence Utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should save workflow to localStorage', () => {
    const state: WorkflowState = {
      nodes: [
        {
          id: 'test-1',
          type: 'manual-trigger',
          position: { x: 100, y: 100 },
          data: { label: 'Test', config: {} }
        }
      ],
      edges: [],
      nodeConfigs: {},
      viewport: { zoom: 1, x: 0, y: 0 },
      selectedNodeId: null
    }

    saveWorkflow(state, 'Test Workflow')
    
    const saved = localStorage.getItem('workflow-builder-state')
    expect(saved).not.toBeNull()
    
    if (saved) {
      const parsed = JSON.parse(saved)
      expect(parsed.name).toBe('Test Workflow')
      expect(parsed.nodes).toHaveLength(1)
    }
  })

  it('should load workflow from localStorage', () => {
    const state: WorkflowState = {
      nodes: [
        {
          id: 'test-1',
          type: 'manual-trigger',
          position: { x: 100, y: 100 },
          data: { label: 'Test', config: {} }
        }
      ],
      edges: [],
      nodeConfigs: {},
      viewport: { zoom: 1, x: 0, y: 0 },
      selectedNodeId: null
    }

    saveWorkflow(state, 'Test Workflow')
    
    const loaded = loadWorkflow()
    expect(loaded).not.toBeNull()
    expect(loaded?.nodes).toHaveLength(1)
    expect(loaded?.name).toBe('Test Workflow')
  })

  it('should return null when no workflow saved', () => {
    const loaded = loadWorkflow()
    expect(loaded).toBeNull()
  })

  it('should clear workflow from localStorage', () => {
    const state: WorkflowState = {
      nodes: [],
      edges: [],
      nodeConfigs: {},
      viewport: { zoom: 1, x: 0, y: 0 },
      selectedNodeId: null
    }

    saveWorkflow(state, 'Test')
    expect(localStorage.getItem('workflow-builder-state')).not.toBeNull()

    clearWorkflow()
    expect(localStorage.getItem('workflow-builder-state')).toBeNull()
  })
})
