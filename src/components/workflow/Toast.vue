<template>
  <div v-if="toastStore.visible" class="toast" :class="`toast-${toastStore.type}`" role="status">
    <span class="toast-text">{{ toastStore.message }}</span>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '../../stores/toastStore'

const toastStore = useToastStore()
</script>

<style scoped>
.toast {
  position: fixed;
  top: 5rem;
  right: 16px;
  z-index: 9999;
  padding: 10px 14px;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  min-width: 20rem;
}

.toast-success {
  background: #10b981;
}

.toast-error {
  background: #ef4444;
}

.toast-info {
  background: #3b82f6;
}
</style>
