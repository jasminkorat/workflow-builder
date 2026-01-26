import type { SavedWorkflow, WorkflowState } from '../types'

const STORAGE_KEY = 'workflow-builder-state'
const AUTOSAVE_DELAY = 2000

let autosaveTimeout: number | null = null

export function saveWorkflow(state: WorkflowState, name: string = 'Untitled Workflow'): void {
  const saved: SavedWorkflow = {
    version: '1.0.0',
    name,
    nodes: state.nodes,
    edges: state.edges,
    nodeConfigs: state.nodeConfigs,
    viewport: state.viewport,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    console.log('Workflow saved successfully')
  } catch (error) {
    console.error('Failed to save workflow:', error)
    throw new Error('Failed to save workflow to localStorage')
  }
}

export function loadWorkflow(): SavedWorkflow | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null

    const workflow = JSON.parse(data) as SavedWorkflow
    console.log('Workflow loaded successfully')
    return workflow
  } catch (error) {
    console.error('Failed to load workflow:', error)
    return null
  }
}

export function clearWorkflow(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('Workflow cleared')
  } catch (error) {
    console.error('Failed to clear workflow:', error)
  }
}

export function autosave(state: WorkflowState): void {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout)
  }

  autosaveTimeout = window.setTimeout(() => {
    saveWorkflow(state, 'Auto-saved Workflow')
  }, AUTOSAVE_DELAY)
}

export function exportWorkflow(state: WorkflowState, name: string): void {
  const saved: SavedWorkflow = {
    version: '1.0.0',
    name,
    nodes: state.nodes,
    edges: state.edges,
    nodeConfigs: state.nodeConfigs,
    viewport: state.viewport,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/\s+/g, '-').toLowerCase()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importWorkflow(file: File): Promise<SavedWorkflow> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const workflow = JSON.parse(content) as SavedWorkflow
        resolve(workflow)
      } catch (error) {
        reject(new Error('Invalid workflow file'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}
