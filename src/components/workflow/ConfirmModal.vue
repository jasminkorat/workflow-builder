<template>
  <div v-if="confirmStore.visible" class="confirm-backdrop" role="dialog" aria-modal="true">
    <div class="confirm-modal">
      <div class="confirm-header">
        <h3 class="confirm-title">{{ confirmStore.title }}</h3>
      </div>
      <p class="confirm-message">{{ confirmStore.message }}</p>
      <div class="confirm-actions">
        <button class="confirm-btn confirm-cancel" @click="confirmStore.cancel">{{ confirmStore.cancelText }}</button>
        <button class="confirm-btn confirm-danger" @click="confirmStore.confirm">{{ confirmStore.confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfirmStore } from '../../stores/confirmStore'

const confirmStore = useConfirmStore()
</script>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  backdrop-filter: blur(4px);
}

.confirm-modal {
  width: min(420px, 92vw);
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
  border: 1px solid #e5e7eb;
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.confirm-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.confirm-message {
  margin-top: 8px;
  font-size: 14px;
  color: #475569;
}

.confirm-actions {
  margin-top: 18px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.confirm-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.confirm-cancel {
  background: #f8fafc;
  color: #0f172a;
  border: 1px solid #e2e8f0;
}

.confirm-cancel:hover {
  background: #f1f5f9;
}

.confirm-danger {
  color: #fff;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: 1px solid rgba(220, 38, 38, 0.6);
}

.confirm-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.25);
}
</style>
