<template>
  <span
    class="status-indicator"
    :class="`status-${status}`"
    :title="statusText"
    :data-testid="`status-${status}`"
  >
    <span class="status-dot"></span>
    <span class="status-text">{{ statusText }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NodeExecutionStatus } from '../../types'

const props = defineProps<{
  status: NodeExecutionStatus
}>()

const statusText = computed(() => {
  const texts: Record<NodeExecutionStatus, string> = {
    pending: 'Pending',
    running: 'Running',
    success: 'Completed',
    error: 'Error',
    skipped: 'Skipped'
  }
  return texts[props.status]
})
</script>

<style scoped>
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-pending .status-dot {
  background: #9ca3af;
}

.status-running .status-dot {
  background: #3b82f6;
  animation: pulse 1.5s infinite;
}

.status-success .status-dot {
  background: #10b981;
}

.status-error .status-dot {
  background: #ef4444;
}

.status-skipped .status-dot {
  background: #f59e0b;
}

.status-pending .status-text {
  color: #6b7280;
}

.status-running .status-text {
  color: #3b82f6;
}

.status-success .status-text {
  color: #059669;
}

.status-error .status-text {
  color: #dc2626;
}

.status-skipped .status-text {
  color: #d97706;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
