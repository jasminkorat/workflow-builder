<template>
  <div id="app" class="app-container">
    <div v-if="showRotateOverlay" class="rotate-overlay" role="dialog" aria-live="polite">
      <div class="rotate-card">
        <div class="rotate-icon">📱↻</div>
        <h2 class="rotate-title">Rotate your device</h2>
        <p class="rotate-text">For the best experience, please rotate your phone to landscape mode to continue.</p>
      </div>
    </div>
    <Toolbar />
    <Toast />
    <ConfirmModal />
    <ConditionDecisionModal />
    
    <div class="main-content">
      <NodePalette @select-node-type="handlePaletteSelect" />
      
      <div class="canvas-wrapper">
        <WorkflowCanvas ref="workflowCanvasRef" />
        <ExecutionPanel />
      </div>
      
      <ConfigPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useWorkflowStore } from './stores/workflowStore'
import { useHistoryStore } from './stores/historyStore'
import { useToastStore } from './stores/toastStore'
import { useConfirmStore } from './stores/confirmStore'
import { useExecutionStore } from './stores/executionStore'
import { loadWorkflow } from './utils/persistence'
import { sampleWorkflows } from './utils/sampleWorkflows'
import Toolbar from './components/workflow/Toolbar.vue'
import NodePalette from './components/workflow/NodePalette.vue'
import WorkflowCanvas from './components/workflow/WorkflowCanvas.vue'
import ConfigPanel from './components/workflow/ConfigPanel.vue'
import ExecutionPanel from './components/workflow/ExecutionPanel.vue'
import Toast from './components/workflow/Toast.vue'
import ConfirmModal from './components/workflow/ConfirmModal.vue'
import ConditionDecisionModal from './components/workflow/ConditionDecisionModal.vue'

const workflowStore = useWorkflowStore()
const historyStore = useHistoryStore()
const toastStore = useToastStore()
const confirmStore = useConfirmStore()
const executionStore = useExecutionStore()
const route = useRoute()
const showRotateOverlay = ref(false)
const workflowCanvasRef = ref<InstanceType<typeof WorkflowCanvas> | null>(null)

// Load saved workflow on mount
onMounted(() => {
  updateRotateOverlay()

  if (route.params.id) {
    loadSampleById(String(route.params.id))
  } else {
    const saved = loadWorkflow()
    if (saved) {
      historyStore.clear()
      historyStore.saveSnapshot(workflowStore.$state)
      workflowStore.restoreState({
        nodes: saved.nodes,
        edges: saved.edges,
        nodeConfigs: saved.nodeConfigs,
        viewport: saved.viewport
      })
      historyStore.saveSnapshot(workflowStore.$state)
    }
  }

  // Setup keyboard shortcuts
  window.addEventListener('keydown', handleKeyboard)
  window.addEventListener('resize', updateRotateOverlay)
  window.addEventListener('orientationchange', updateRotateOverlay)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboard)
  window.removeEventListener('resize', updateRotateOverlay)
  window.removeEventListener('orientationchange', updateRotateOverlay)
})

watch(
  () => route.params.id,
  (id) => {
    if (id) {
      loadSampleById(String(id))
    }
  }
)

function loadSampleById(id: string) {
  const workflow = sampleWorkflows.find(sample => sample.id === id)
  if (!workflow) return
  executionStore.stopExecution()
  historyStore.clear()
  historyStore.saveSnapshot(workflowStore.$state)
  workflowStore.restoreState({
    nodes: workflow.nodes,
    edges: workflow.edges,
    nodeConfigs: workflow.nodeConfigs,
    viewport: workflow.viewport,
    selectedNodeId: null
  })
  historyStore.saveSnapshot(workflowStore.$state)
}

function updateRotateOverlay() {
  const width = window.innerWidth || document.documentElement.clientWidth
  const height = window.innerHeight || document.documentElement.clientHeight
  const isSmallScreen = width <= 1024
  const isPortrait = height >= width
  showRotateOverlay.value = isSmallScreen && isPortrait
}

function handlePaletteSelect(nodeType: string) {
  workflowCanvasRef.value?.addNodeAtCenter(nodeType)
}

function handleKeyboard(event: KeyboardEvent) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const ctrlKey = isMac ? event.metaKey : event.ctrlKey
  const target = event.target as HTMLElement | null
  const isFormField = !!target && (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  )

  // Undo: Ctrl/Cmd + Z
  if (ctrlKey && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    if (historyStore.canUndo) {
      const snapshot = historyStore.undo()
      if (snapshot) workflowStore.restoreState(snapshot)
    }
  }

  // Redo: Shift + Ctrl/Cmd + Z
  if (ctrlKey && event.key === 'z' && event.shiftKey) {
    event.preventDefault()
    if (historyStore.canRedo) {
      const snapshot = historyStore.redo()
      if (snapshot) workflowStore.restoreState(snapshot)
    }
  }

  // Delete: Delete/Backspace
  if (!isFormField && (event.key === 'Delete' || event.key === 'Backspace') && workflowStore.selectedNodeId) {
    event.preventDefault()
    confirmStore.requestConfirm('Delete this node?', 'Delete Node', 'Delete', 'Cancel').then(confirmed => {
      if (!confirmed) return
      workflowStore.deleteNode(workflowStore.selectedNodeId as string)
      toastStore.showToast('Node deleted', 'success')
    })
  }
}
</script>

<style>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.rotate-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at top, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.98));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 24px;
  text-align: center;
  color: #f8fafc;
}

.rotate-card {
  max-width: 360px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 20px;
  padding: 24px 22px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
}

.rotate-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.rotate-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.rotate-text {
  font-size: 14px;
  line-height: 1.5;
  color: #e2e8f0;
}
</style>
