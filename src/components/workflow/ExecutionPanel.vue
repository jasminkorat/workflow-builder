<template>
  <div class="execution-panel bg-white border-t border-gray-200 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">Execution</h3>
      
      <div class="flex items-center gap-2">
        <button
          v-if="executionStore.status === 'idle'"
          @click="handleRun"
          :disabled="!workflowStore.isValidWorkflow || workflowStore.nodes.length === 0 || workflowStore.hasUnconnectedNodes || workflowStore.hasPendingConfig"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          data-testid="execution-run"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
          </svg>
          Run
        </button>

        <button
          v-if="executionStore.status === 'running'"
          @click="executionStore.pauseExecution()"
          class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
          data-testid="execution-pause"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4z"/>
          </svg>
          Pause
        </button>

        <button
          v-if="executionStore.status === 'paused'"
          @click="executionStore.resumeExecution()"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          data-testid="execution-resume"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
          </svg>
          Resume
        </button>

        <button
          v-if="executionStore.status !== 'idle'"
          @click="handleStop"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          data-testid="execution-stop"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z"/>
          </svg>
          Stop
        </button>

        <button
          @click="executionStore.clearLogs()"
          :disabled="executionStore.logs.length === 0"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          data-testid="execution-clear"
        >
          Clear Logs
        </button>
      </div>
    </div>

    <div class="status-bar mb-4 p-3 rounded-lg" :class="statusBarClass">
      <div class="flex items-center gap-3">
        <span class="font-semibold">Status:</span>
        <span class="uppercase tracking-wide">{{ executionStore.status }}</span>
        <span v-if="executionStore.status !== 'idle'" class="ml-auto">
          Step {{ executionStore.currentStep }} / {{ workflowStore.nodes.length }}
        </span>
      </div>
    </div>

    <div ref="logsContainer" class="logs-container bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
      <div v-if="executionStore.logs.length === 0" class="text-center text-gray-400 py-8">
        No execution logs yet
      </div>
      
      <div
        v-for="(log, index) in executionStore.logs"
        :key="index"
        class="log-entry mb-3 p-3 bg-white border rounded-lg"
        :class="`log-${log.status}`"
        :data-testid="`log-${index}`"
      >
        <div class="flex items-start gap-3">
          <StatusIndicator :status="log.status" />
          
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm text-gray-800">{{ log.nodeName }}</div>
            <div class="text-sm text-gray-600 mt-1">{{ log.message }}</div>
            <div v-if="log.data" class="text-xs text-gray-500 mt-2 font-mono bg-gray-50 p-2 rounded">
              {{ JSON.stringify(log.data, null, 2) }}
            </div>
          </div>
          
          <div class="text-xs text-gray-400">
            {{ formatTimestamp(log.timestamp) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useWorkflowStore } from '../../stores/workflowStore'
import { useExecutionStore, executeWorkflow } from '../../stores/executionStore'
import { useConfirmStore } from '../../stores/confirmStore'
import StatusIndicator from './StatusIndicator.vue'

const workflowStore = useWorkflowStore()
const executionStore = useExecutionStore()
const confirmStore = useConfirmStore()

const logsContainer = ref<HTMLDivElement | null>(null)

const statusBarClass = computed(() => {
  const classes: Record<string, string> = {
    idle: 'bg-gray-100 text-gray-700',
    running: 'bg-blue-100 text-blue-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700'
  }
  return classes[executionStore.status] || classes.idle
})

watch(
  () => executionStore.logs.length,
  async () => {
    await nextTick()
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  }
)

function handleRun() {
  if (!workflowStore.hasTriggerNode) {
    confirmStore.requestConfirm(
      'Add a trigger node to start the workflow.',
      'Trigger Required',
      'OK',
      'Close'
    )
    return
  }

  if (!workflowStore.isValidWorkflow) {
    alert('Cannot run invalid workflow')
    return
  }

  executeWorkflow(
    workflowStore.nodes,
    workflowStore.edges,
    workflowStore.nodeConfigs,
    executionStore
  )
}

function handleStop() {
  executionStore.stopExecution()
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}
</script>

<style scoped>
.execution-panel {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.logs-container {
  flex: 1;
  min-height: 0;
}

.log-entry {
  transition: all 0.2s;
}

.log-success {
  border-color: #10b981;
}

.log-error {
  border-color: #ef4444;
}

.log-running {
  border-color: #3b82f6;
}
</style>
