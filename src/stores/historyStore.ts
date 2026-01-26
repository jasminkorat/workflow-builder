import { defineStore } from 'pinia'
import type { HistoryState, HistorySnapshot, WorkflowState } from '../types'

const MAX_HISTORY = 50

export const useHistoryStore = defineStore('history', {
  state: (): HistoryState => ({
    past: [],
    future: [],
    canUndo: false,
    canRedo: false
  }),

  actions: {
    saveSnapshot(workflowState: WorkflowState) {
      const snapshot: HistorySnapshot = {
        nodes: JSON.parse(JSON.stringify(workflowState.nodes)),
        edges: JSON.parse(JSON.stringify(workflowState.edges)),
        nodeConfigs: JSON.parse(JSON.stringify(workflowState.nodeConfigs)),
        viewport: { ...workflowState.viewport }
      }

      this.past.push(snapshot)
      if (this.past.length > MAX_HISTORY) {
        this.past.shift()
      }
      this.future = []
      this.canUndo = this.past.length > 1
      this.canRedo = false
    },

    undo(): HistorySnapshot | null {
      if (this.past.length <= 1) return null

      const snapshot = this.past.pop()
      if (snapshot) {
        this.future.push(snapshot)
      }
      this.canUndo = this.past.length > 1
      this.canRedo = this.future.length > 0

      // Return the new current state (top of past stack)
      return this.past[this.past.length - 1] || null
    },

    redo(): HistorySnapshot | null {
      if (this.future.length === 0) return null

      const snapshot = this.future.pop()
      if (snapshot) {
        this.past.push(snapshot)
      }
      this.canUndo = this.past.length > 1
      this.canRedo = this.future.length > 0

      // Return the state we just moved to past (which is the current state now)
      return snapshot || null
    },

    clear() {
      this.$patch({
        past: [],
        future: [],
        canUndo: false,
        canRedo: false
      })
    }
  }
})
