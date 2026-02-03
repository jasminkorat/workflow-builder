<template>
  <div class="toolbar bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-bold text-gray-800">Workflow Builder</h1>
      
      <div class="flex items-center gap-2 ml-6">
        <button
          @click="handleNew"
          class="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          data-testid="toolbar-new"
        >
          New
        </button>
        
        <button
          v-if="!isSampleRoute && workflowStore.nodes.length > 0"
          @click="handleSave"
          :disabled="isSaveDisabled"
          class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          data-testid="toolbar-save"
        >
          Save
        </button>

        <div class="relative">
          <button
            @click="showSamplesMenu = !showSamplesMenu"
            class="px-4 py-2 text-sm border rounded-lg transition-colors"
            :class="isSampleRoute ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'"
            data-testid="toolbar-samples"
          >
            Sample Workflows
          </button>
          
          <div
            v-if="showSamplesMenu"
            class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[200px]"
          >
            <button
              v-for="(workflow, index) in sampleWorkflows"
              :key="index"
              @click="loadSampleWorkflow(workflow)"
              class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
              :data-testid="`sample-${index}`"
            >
              {{ workflow.name }}
            </button>
          </div>
        </div>
        
        <button
          @click="handleExport"
          class="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          data-testid="toolbar-export"
        >
          Export
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        @click="handleUndo"
        :disabled="!historyStore.canUndo"
        class="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Undo (Ctrl+Z)"
        data-testid="toolbar-undo"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
        </svg>
      </button>
      
      <button
        @click="handleRedo"
        :disabled="!historyStore.canRedo"
        class="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Redo (Shift+Ctrl+Z)"
        data-testid="toolbar-redo"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"/>
        </svg>
      </button>

      <!-- <div class="ml-4 px-3 py-1 bg-gray-100 rounded-lg text-sm">
        <span class="text-gray-600">Nodes:</span>
        <span class="font-semibold ml-1">{{ historyStore.currentNodeCount }}</span>
      </div> -->

      <div
        v-if="!workflowStore.isValidWorkflow"
        class="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
        data-testid="toolbar-invalid-warning"
      >
        ⚠️ Invalid Workflow
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWorkflowStore } from '../../stores/workflowStore'
import { useHistoryStore } from '../../stores/historyStore'
import { saveWorkflow, loadWorkflow, exportWorkflow } from '../../utils/persistence'
import { sampleWorkflows } from '../../utils/sampleWorkflows'
import type { SavedWorkflow } from '../../types'
import { useToastStore } from '../../stores/toastStore'
import { useConfirmStore } from '../../stores/confirmStore'

const workflowStore = useWorkflowStore()
const historyStore = useHistoryStore()
const router = useRouter()
const route = useRoute()
const toastStore = useToastStore()
const confirmStore = useConfirmStore()
const showSamplesMenu = ref(false)
const isSampleRoute = computed(() => typeof route.params.id === 'string')
const isSaveDisabled = computed(() => {
  if (!workflowStore.isValidWorkflow) return true
  if (workflowStore.nodes.length === 0) return true

  const saved = loadWorkflow()
  if (!saved) return false

  const normalize = (state: { nodes: any[]; edges: any[]; nodeConfigs: Record<string, any>; viewport: any }) => ({
    nodes: [...state.nodes].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...state.edges].sort((a, b) => a.id.localeCompare(b.id)),
    nodeConfigs: state.nodeConfigs,
    viewport: state.viewport
  })

  const current = normalize({
    nodes: workflowStore.nodes,
    edges: workflowStore.edges,
    nodeConfigs: workflowStore.nodeConfigs,
    viewport: workflowStore.viewport
  })

  const persisted = normalize({
    nodes: saved.nodes,
    edges: saved.edges,
    nodeConfigs: saved.nodeConfigs,
    viewport: saved.viewport
  })

  return JSON.stringify(current) === JSON.stringify(persisted)
})

async function handleNew() {
  const confirmed = await confirmStore.requestConfirm(
    'Clear current workflow? Unsaved changes will be lost.',
    'Start New Workflow',
    'Create',
    'Cancel'
  )
  if (!confirmed) return
  workflowStore.clearWorkflow()
  router.push('/')
}

function handleSave() {
  if (!workflowStore.isValidWorkflow) {
    toastStore.showToast('Cannot save invalid workflow. Please fix errors.', 'error')
    return
  }
  
  try {
    saveWorkflow(workflowStore.$state, 'My Workflow')
    toastStore.showToast('Changes saved successfully', 'success')
  } catch (error) {
    toastStore.showToast('Failed to save workflow', 'error')
  }
}

function handleExport() {
  const name = prompt('Enter workflow name:', 'my-workflow') || 'workflow'
  exportWorkflow(workflowStore.$state, name)
}

function loadSampleWorkflow(workflow: SavedWorkflow) {
  if (workflow.id) {
    router.push(`/samples/${workflow.id}`)
  }
  showSamplesMenu.value = false
}

function handleUndo() {
  const snapshot = historyStore.undo()
  if (snapshot) {
    workflowStore.restoreState(snapshot)
  }
}

function handleRedo() {
  const snapshot = historyStore.redo()
  if (snapshot) {
    workflowStore.restoreState(snapshot)
  }
}

// Click outside to close samples menu
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-testid="toolbar-samples"]')) {
      showSamplesMenu.value = false
    }
  })
}
</script>

<style scoped>
.toolbar {
  height: 64px;
}
</style>
