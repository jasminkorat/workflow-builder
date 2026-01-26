import { defineStore } from 'pinia'
import type { WorkflowState, WorkflowNode, WorkflowEdge, Viewport } from '../types'
import { useHistoryStore } from './historyStore'
import { getNodeDefinition } from '../schemas/nodeDefinitions'
import { clearWorkflow as clearPersistedWorkflow } from '../utils/persistence'

function tryEnsureBaselineSnapshot(historyStore: ReturnType<typeof useHistoryStore>, state: WorkflowState) {
  try {
    if (historyStore.past.length === 0) {
      historyStore.saveSnapshot(state)
    }
  } catch {}
}

function trySaveSnapshot(historyStore: ReturnType<typeof useHistoryStore>, state: WorkflowState) {
  try {
    historyStore.saveSnapshot(state)
  } catch {}
}

export const useWorkflowStore = defineStore('workflow', {
  state: (): WorkflowState => ({
    nodes: [],
    edges: [],
    nodeConfigs: {},
    viewport: { zoom: 1, x: 0, y: 0 },
    selectedNodeId: null
  }),

  getters: {
    selectedNode: (state): WorkflowNode | null => {
      return state.nodes.find(n => n.id === state.selectedNodeId) || null
    },
    
    selectedNodeConfig: (state) => {
      if (!state.selectedNodeId) return null
      return state.nodeConfigs[state.selectedNodeId] || {}
    },

    getNodeById: (state) => (id: string): WorkflowNode | undefined => {
      return state.nodes.find(n => n.id === id)
    },

    getOutgoingEdges: (state) => (nodeId: string): WorkflowEdge[] => {
      return state.edges.filter(e => e.source === nodeId)
    },

    getIncomingEdges: (state) => (nodeId: string): WorkflowEdge[] => {
      return state.edges.filter(e => e.target === nodeId)
    },

    hasUnconnectedNodes: (state): boolean => {
      if (state.nodes.length === 0) return false
      return state.nodes.some(node => {
        const hasIncoming = state.edges.some(e => e.target === node.id)
        const hasOutgoing = state.edges.some(e => e.source === node.id)
        return !hasIncoming && !hasOutgoing
      })
    },

    hasPendingConfig: (state): boolean => {
      return state.nodes.some(node => {
        const def = getNodeDefinition(node.type)
        if (!def || def.fields.length === 0) return false
        const config = state.nodeConfigs[node.id] || {}
        return def.fields.some(field => {
          if (!field.required) return false
          const value = config[field.name]
          return value === undefined || value === null || value === ''
        })
      })
    },

    hasTriggerNode: (state): boolean => {
      return state.nodes.some(node => {
        const def = getNodeDefinition(node.type)
        return def?.category === 'trigger'
      })
    },

    isValidWorkflow: (state): boolean => {
      // Check for cycles (DAG requirement)
      const hasCycle = detectCycle(state.nodes, state.edges)
      if (hasCycle) return false

      // Condition nodes must have at least one outgoing edge.
      // If two or more edges exist, require both true and false branches.
      for (const node of state.nodes) {
        if (node.type === 'condition') {
          const outgoing = state.edges.filter(e => e.source === node.id)
          if (outgoing.length === 0) return false

          if (outgoing.length >= 2) {
            const hasTrue = outgoing.some(e => e.type === 'true')
            const hasFalse = outgoing.some(e => e.type === 'false')
            if (!hasTrue || !hasFalse) return false
          }
        }
      }

      return true
    }
  },

  actions: {
    addNode(node: WorkflowNode) {
      const historyStore = useHistoryStore()
      tryEnsureBaselineSnapshot(historyStore, this.$state)

      try {
        clearPersistedWorkflow()
      } catch {}

      this.nodes.push(node)
      this.nodeConfigs[node.id] = node.data.config || {}

      trySaveSnapshot(historyStore, this.$state)
    },

    updateNode(id: string, updates: Partial<WorkflowNode>) {
      const historyStore = useHistoryStore()
      tryEnsureBaselineSnapshot(historyStore, this.$state)

      const index = this.nodes.findIndex(n => n.id === id)
      if (index !== -1) {
        const existing = this.nodes[index]
        if (!existing) return
        const updated: WorkflowNode = {
          ...existing,
          ...updates,
          id: existing.id,
          position: updates.position ?? existing.position
        }
        this.nodes[index] = updated
      }

      trySaveSnapshot(historyStore, this.$state)
    },

    updateNodeConfig(id: string, config: Record<string, any>) {
      const historyStore = useHistoryStore()
      tryEnsureBaselineSnapshot(historyStore, this.$state)

      this.nodeConfigs[id] = config
      const node = this.nodes.find(n => n.id === id)
      if (node) {
        node.data.config = config
      }

      trySaveSnapshot(historyStore, this.$state)
    },

    deleteNode(id: string) {
      const historyStore = useHistoryStore()
      tryEnsureBaselineSnapshot(historyStore, this.$state)

      this.nodes = this.nodes.filter(n => n.id !== id)
      this.edges = this.edges.filter(e => e.source !== id && e.target !== id)
      delete this.nodeConfigs[id]
      if (this.selectedNodeId === id) {
        this.selectedNodeId = null
      }

      trySaveSnapshot(historyStore, this.$state)
    },

    deleteNodes(ids: string[]) {
      const historyStore = useHistoryStore()
      tryEnsureBaselineSnapshot(historyStore, this.$state)

      const idSet = new Set(ids)
      this.nodes = this.nodes.filter(n => !idSet.has(n.id))
      this.edges = this.edges.filter(e => !idSet.has(e.source) && !idSet.has(e.target))
      ids.forEach(id => delete this.nodeConfigs[id])
      if (this.selectedNodeId && idSet.has(this.selectedNodeId)) {
        this.selectedNodeId = null
      }

      trySaveSnapshot(historyStore, this.$state)
    },

    updateNodePositions(updates: { id: string; position: { x: number; y: number } }[]) {
      const historyStore = useHistoryStore()
      tryEnsureBaselineSnapshot(historyStore, this.$state)

      updates.forEach(({ id, position }) => {
        const node = this.nodes.find(n => n.id === id)
        if (node) {
          node.position = position
        }
      })

      trySaveSnapshot(historyStore, this.$state)
    },

    addEdge(edge: WorkflowEdge) {
      const historyStore = useHistoryStore()
      tryEnsureBaselineSnapshot(historyStore, this.$state)

      this.edges.push(edge)

      trySaveSnapshot(historyStore, this.$state)
    },

    deleteEdge(id: string) {
      const historyStore = useHistoryStore()
      tryEnsureBaselineSnapshot(historyStore, this.$state)

      this.edges = this.edges.filter(e => e.id !== id)

      trySaveSnapshot(historyStore, this.$state)
    },

    setSelectedNode(id: string | null) {
      this.selectedNodeId = id
    },

    updateViewport(viewport: Viewport) {
      this.viewport = viewport
    },

    restoreState(state: Partial<WorkflowState>) {
      this.$patch(current => {
        Object.assign(current, state)
      })
    },

    clearWorkflow() {
      this.$patch({
        nodes: [],
        edges: [],
        nodeConfigs: {},
        selectedNodeId: null
      })
      try {
        clearPersistedWorkflow()
      } catch {}
      try {
        useHistoryStore().clear()
      } catch {}
    }
  }
})

// Cycle detection for DAG validation
function detectCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adjList = new Map<string, string[]>()
  
  nodes.forEach(node => adjList.set(node.id, []))
  edges.forEach(edge => {
    const neighbors = adjList.get(edge.source) || []
    neighbors.push(edge.target)
    adjList.set(edge.source, neighbors)
  })

  const visited = new Set<string>()
  const recStack = new Set<string>()

  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    recStack.add(nodeId)

    const neighbors = adjList.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recStack.has(neighbor)) {
        return true
      }
    }

    recStack.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true
    }
  }

  return false
}
