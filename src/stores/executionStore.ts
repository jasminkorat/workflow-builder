import { defineStore } from 'pinia'
import type { ExecutionState, ExecutionLog, NodeExecutionStatus, WorkflowNode, WorkflowEdge, ExecutionStatus } from '../types'
import { useConditionDecisionStore } from './conditionDecisionStore'

export const useExecutionStore = defineStore('execution', {
  state: (): ExecutionState => ({
    status: 'idle',
    activeNodeId: null,
    logs: [],
    currentStep: 0
  }),

  getters: {
    isRunning: (state) => state.status === 'running',
    isPaused: (state) => state.status === 'paused',
    isCompleted: (state) => state.status === 'completed',
    
    getNodeStatus: (state) => (nodeId: string): NodeExecutionStatus => {
      if (state.activeNodeId === nodeId) return 'running'
      for (let i = state.logs.length - 1; i >= 0; i--) {
        const log = state.logs[i]
        if (!log) continue
        if (log.nodeId === nodeId) {
          return log.status
        }
      }
      return 'pending'
    }
  },

  actions: {
    startExecution() {
      this.$patch({
        status: 'running',
        activeNodeId: null,
        logs: [],
        currentStep: 0
      })
    },

    pauseExecution() {
      this.status = 'paused'
    },

    resumeExecution() {
      this.status = 'running'
    },

    completeExecution() {
      this.$patch({
        status: 'completed',
        activeNodeId: null
      })

      window.setTimeout(() => {
        this.status = 'idle'
        this.activeNodeId = null
      }, 1000)
    },

    stopExecution() {
      this.$patch({
        status: 'idle',
        activeNodeId: null,
        logs: [],
        currentStep: 0
      })
    },

    setActiveNode(nodeId: string | null) {
      this.activeNodeId = nodeId
    },

    addLog(log: ExecutionLog, incrementStep = false) {
      this.$patch((state: ExecutionState) => {
        state.logs.push(log)
        if (incrementStep) state.currentStep++
      })
    },

    clearLogs() {
      this.$patch({
        logs: [],
        currentStep: 0
      })
    }
  }
})

// Execution Engine
export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  nodeConfigs: Record<string, any>,
  executionStore: ReturnType<typeof useExecutionStore>
): Promise<void> {
  executionStore.startExecution()
  const decisionStore = useConditionDecisionStore()

  executionStore.addLog({
    nodeId: 'system',
    nodeName: 'System',
    status: 'running',
    timestamp: Date.now(),
    message: 'Execution started'
  })

  // Build adjacency lists
  const outgoingMap = new Map<string, WorkflowEdge[]>()
  nodes.forEach(node => outgoingMap.set(node.id, []))
  edges.forEach(edge => {
    const list = outgoingMap.get(edge.source) || []
    list.push(edge)
    outgoingMap.set(edge.source, list)
  })

  const inDegree = new Map<string, number>()
  nodes.forEach(node => inDegree.set(node.id, 0))
  edges.forEach(edge => {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  })

  const queue: WorkflowNode[] = []
  nodes.forEach(node => {
    if ((inDegree.get(node.id) || 0) === 0) queue.push(node)
  })

  const executed = new Set<string>()

  while (queue.length > 0) {
    const node = queue.shift()!
    if (executionStore.status === 'idle') break
    if (executed.has(node.id)) continue

    // Wait if paused
    while (executionStore.status === 'paused') {
      await sleep(100)
    }

    executionStore.setActiveNode(node.id)
    
    const configSnapshot = nodeConfigs[node.id] || {}
    executionStore.addLog({
      nodeId: node.id,
      nodeName: node.data.label,
      status: 'running',
      timestamp: Date.now(),
      message: `Started ${node.type}`,
      data: { config: configSnapshot }
    })
    
    try {
      const result = await simulateNodeExecution(node, configSnapshot)
      
      executionStore.addLog({
        nodeId: node.id,
        nodeName: node.data.label,
        status: 'success',
        timestamp: Date.now(),
        message: result.message,
        data: {
          config: configSnapshot,
          result: result.data
        }
      }, true)

      // Handle condition branching
      const outgoing = outgoingMap.get(node.id) || []
      if (node.type === 'condition') {
        const conditionText = configSnapshot?.condition ? ` (${configSnapshot.condition})` : ''
        executionStore.addLog({
          nodeId: node.id,
          nodeName: node.data.label,
          status: 'running',
          timestamp: Date.now(),
          message: 'Awaiting condition decision...'
        })

        executionStore.pauseExecution()
        const decision = await decisionStore.requestDecision(
          `Choose outcome for "${node.data.label}"${conditionText}.`,
          'Condition Decision',
          'Pass (TRUE)',
          'Fail (FALSE)'
        )
        executionStore.resumeExecution()

        if ((executionStore.status as ExecutionStatus) === 'idle') break

        const branchType: 'true' | 'false' = decision ? 'true' : 'false'
        executionStore.addLog({
          nodeId: node.id,
          nodeName: node.data.label,
          status: 'success',
          timestamp: Date.now(),
          message: `Branch: ${decision ? 'TRUE' : 'FALSE'}`
        })

        outgoing
          .filter(edge => edge.type === branchType)
          .forEach(edge => {
            const target = nodes.find(n => n.id === edge.target)
            if (target) queue.push(target)
          })
      } else {
        outgoing.forEach(edge => {
          const target = nodes.find(n => n.id === edge.target)
          if (target) queue.push(target)
        })
      }

      await sleep(800) // Simulate execution time
    } catch (error) {
      executionStore.addLog({
        nodeId: node.id,
        nodeName: node.data.label,
        status: 'error',
        timestamp: Date.now(),
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { config: configSnapshot }
      }, true)
    }

    executed.add(node.id)
  }

  nodes.forEach(node => {
    if (!executed.has(node.id)) {
      executionStore.addLog({
        nodeId: node.id,
        nodeName: node.data.label,
        status: 'skipped',
        timestamp: Date.now(),
        message: 'Skipped (not selected by branch)'
      })
    }
  })

  executionStore.setActiveNode(null)
  executionStore.addLog({
    nodeId: 'system',
    nodeName: 'System',
    status: 'success',
    timestamp: Date.now(),
    message: 'Execution completed'
  })
  executionStore.completeExecution()
}

async function simulateNodeExecution(
  node: WorkflowNode,
  config: Record<string, any>
): Promise<{ message: string; data?: any }> {
  // Simulate different node types
  switch (node.type) {
    case 'manual-trigger':
      return { message: 'Workflow triggered manually', data: { timestamp: Date.now() } }
    
    case 'webhook-trigger':
      return { 
        message: `Webhook received from ${config.webhookUrl}`,
        data: { method: config.method, payload: { sample: 'data' } }
      }
    
    case 'http-action':
      return { 
        message: `HTTP ${config.method} request to ${config.url}`,
        data: { status: 200, response: { success: true } }
      }
    
    case 'email-action':
      return { 
        message: `Email sent to ${config.to}`,
        data: { subject: config.subject, messageId: 'sim-' + Date.now() }
      }
    
    case 'sms-action':
      return { 
        message: `SMS sent to ${config.phoneNumber}`,
        data: { message: config.message, sid: 'sim-' + Date.now() }
      }
    
    case 'condition':
      const conditionResult = Math.random() > 0.5 // Simulate random condition
      return { 
        message: `Condition evaluated: ${config.leftValue} ${config.operator} ${config.rightValue}`,
        data: { conditionResult }
      }
    
    case 'transform':
      return { 
        message: `Data transformed: ${config.transformName}`,
        data: { transformed: true, expression: config.expression }
      }
    
    case 'delay':
      const durationMs = config.duration * (config.unit === 'hours' ? 3600000 : config.unit === 'minutes' ? 60000 : 1000)
      await sleep(Math.min(durationMs, 2000)) // Cap at 2 seconds for simulation
      return { 
        message: `Delayed for ${config.duration} ${config.unit}`,
        data: { duration: config.duration, unit: config.unit }
      }
    
    default:
      return { message: 'Node executed', data: {} }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
