import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkflowStore } from '../stores/workflowStore'
import { useHistoryStore } from '../stores/historyStore'
import type { WorkflowNode } from '../types'

describe('Workflow Store', () => {
  let workflowStore: ReturnType<typeof useWorkflowStore>

  beforeEach(() => {
    workflowStore = useWorkflowStore()
    workflowStore.clearWorkflow()
  })

  it('should add a node', () => {
    const node: WorkflowNode = {
      id: 'test-1',
      type: 'manual-trigger',
      position: { x: 100, y: 100 },
      data: { label: 'Test Node', config: {} }
    }

    workflowStore.addNode(node)
    
    expect(workflowStore.nodes).toHaveLength(1)
    expect(workflowStore.nodes[0]!.id).toBe('test-1')
  })

  it('should delete a node', () => {
    const node: WorkflowNode = {
      id: 'test-1',
      type: 'manual-trigger',
      position: { x: 100, y: 100 },
      data: { label: 'Test Node', config: {} }
    }

    workflowStore.addNode(node)
    expect(workflowStore.nodes).toHaveLength(1)

    workflowStore.deleteNode('test-1')
    expect(workflowStore.nodes).toHaveLength(0)
  })

  it('should update node config', () => {
    const node: WorkflowNode = {
      id: 'test-1',
      type: 'email-action',
      position: { x: 100, y: 100 },
      data: { label: 'Email', config: {} }
    }

    workflowStore.addNode(node)
    
    const newConfig = {
      to: 'test@example.com',
      subject: 'Test',
      body: 'Test body'
    }
    
    workflowStore.updateNodeConfig('test-1', newConfig)
    
    expect(workflowStore.nodeConfigs['test-1']).toEqual(newConfig)
  })

  it('should add edges', () => {
    const node1: WorkflowNode = {
      id: 'node-1',
      type: 'manual-trigger',
      position: { x: 100, y: 100 },
      data: { label: 'Start', config: {} }
    }

    const node2: WorkflowNode = {
      id: 'node-2',
      type: 'email-action',
      position: { x: 300, y: 100 },
      data: { label: 'Email', config: {} }
    }

    workflowStore.addNode(node1)
    workflowStore.addNode(node2)

    workflowStore.addEdge({
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2'
    })

    expect(workflowStore.edges).toHaveLength(1)
    expect(workflowStore.edges[0]!.source).toBe('node-1')
    expect(workflowStore.edges[0]!.target).toBe('node-2')
  })

  it('should detect cycles in workflow', () => {
    const node1: WorkflowNode = {
      id: 'node-1',
      type: 'manual-trigger',
      position: { x: 100, y: 100 },
      data: { label: 'Start', config: {} }
    }

    const node2: WorkflowNode = {
      id: 'node-2',
      type: 'email-action',
      position: { x: 300, y: 100 },
      data: { label: 'Email', config: {} }
    }

    workflowStore.addNode(node1)
    workflowStore.addNode(node2)

    // Create a valid DAG
    workflowStore.addEdge({ id: 'edge-1', source: 'node-1', target: 'node-2' })
    expect(workflowStore.isValidWorkflow).toBe(true)

    // Create a cycle
    workflowStore.addEdge({ id: 'edge-2', source: 'node-2', target: 'node-1' })
    expect(workflowStore.isValidWorkflow).toBe(false)
  })
})

describe('History Store', () => {
  let workflowStore: ReturnType<typeof useWorkflowStore>
  let historyStore: ReturnType<typeof useHistoryStore>

  beforeEach(() => {
    workflowStore = useWorkflowStore()
    historyStore = useHistoryStore()
    workflowStore.clearWorkflow()
  })

  it('should save snapshots on changes', () => {
    expect(historyStore.canUndo).toBe(false)

    const node: WorkflowNode = {
      id: 'test-1',
      type: 'manual-trigger',
      position: { x: 100, y: 100 },
      data: { label: 'Test', config: {} }
    }

    workflowStore.addNode(node)
    
    expect(historyStore.canUndo).toBe(true)
    expect(historyStore.past.length).toBeGreaterThan(0)
  })

  it('should undo and redo', () => {
    const node1: WorkflowNode = {
      id: 'test-1',
      type: 'manual-trigger',
      position: { x: 100, y: 100 },
      data: { label: 'Node 1', config: {} }
    }

    const node2: WorkflowNode = {
      id: 'test-2',
      type: 'email-action',
      position: { x: 300, y: 100 },
      data: { label: 'Node 2', config: {} }
    }

    workflowStore.addNode(node1)
    workflowStore.addNode(node2)

    expect(workflowStore.nodes).toHaveLength(2)
    expect(historyStore.canUndo).toBe(true)

    // Undo
    const snapshot = historyStore.undo()
    if (snapshot) workflowStore.restoreState(snapshot)
    
    expect(historyStore.canRedo).toBe(true)
    expect(workflowStore.nodes).toHaveLength(1)

    // Redo
    const redoSnapshot = historyStore.redo()
    if (redoSnapshot) workflowStore.restoreState(redoSnapshot)
    
    expect(workflowStore.nodes).toHaveLength(2)
  })

  it('should clear future on new action', () => {
    const node: WorkflowNode = {
      id: 'test-1',
      type: 'manual-trigger',
      position: { x: 100, y: 100 },
      data: { label: 'Test', config: {} }
    }

    workflowStore.addNode(node)
    historyStore.undo()
    
    expect(historyStore.canRedo).toBe(true)

    // New action should clear redo history
    const node2: WorkflowNode = {
      id: 'test-2',
      type: 'email-action',
      position: { x: 300, y: 100 },
      data: { label: 'Test 2', config: {} }
    }
    
    workflowStore.addNode(node2)
    expect(historyStore.canRedo).toBe(false)
  })
})
