import type { Node, Edge } from '@vue-flow/core'
import { z } from 'zod'

// Node Categories
export type NodeCategory = 'trigger' | 'action' | 'logic'

// Node Types
export type NodeType = 
  | 'manual-trigger'
  | 'webhook-trigger'
  | 'http-action'
  | 'email-action'
  | 'sms-action'
  | 'condition'
  | 'transform'
  | 'delay'

// Field Types for Dynamic Config
export type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'checkbox' | 'json'

export interface FieldSchema {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  validation?: z.ZodType<any>
}

export interface NodeDefinition {
  type: NodeType
  category: NodeCategory
  label: string
  description: string
  icon: string
  color: string
  inputs: number
  outputs: number
  fields: FieldSchema[]
  defaultConfig: Record<string, any>
}

// Workflow State
export type WorkflowNode = Node & {
  type: NodeType
  data: {
    label: string
    config?: Record<string, any>
  }
}

export type WorkflowEdge = Edge & {
  id: string
  type?: 'default' | 'true' | 'false'
}

export interface Viewport {
  zoom: number
  x: number
  y: number
}

export interface WorkflowState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  nodeConfigs: Record<string, Record<string, any>>
  viewport: Viewport
  selectedNodeId: string | null
}

// Execution State
export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error'

export type NodeExecutionStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped'

export interface ExecutionLog {
  nodeId: string
  nodeName: string
  status: NodeExecutionStatus
  timestamp: number
  message: string
  data?: any
}

export interface ExecutionState {
  status: ExecutionStatus
  activeNodeId: string | null
  logs: ExecutionLog[]
  currentStep: number
}

// History for Undo/Redo
export interface HistorySnapshot {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  nodeConfigs: Record<string, Record<string, any>>
  viewport: Viewport
}

export interface HistoryState {
  past: HistorySnapshot[]
  future: HistorySnapshot[]
  canUndo: boolean
  canRedo: boolean
}

// Workflow Save Format
export interface SavedWorkflow {
  id?: string
  version: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  nodeConfigs: Record<string, Record<string, any>>
  viewport: Viewport
  createdAt: number
  updatedAt: number
}
