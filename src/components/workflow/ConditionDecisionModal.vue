<template>
  <div v-if="decisionStore.visible" class="decision-backdrop" role="dialog" aria-modal="true">
    <div class="decision-modal">
      <div class="decision-header">
        <h3 class="decision-title">{{ decisionStore.title }}</h3>
      </div>
      <p class="decision-message">{{ decisionStore.message }}</p>
      <div class="decision-actions">
        <button class="decision-btn decision-fail" @click="decisionStore.chooseFail">
          {{ decisionStore.failText }}
        </button>
        <button class="decision-btn decision-pass" @click="decisionStore.choosePass">
          {{ decisionStore.passText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConditionDecisionStore } from '../../stores/conditionDecisionStore'

const decisionStore = useConditionDecisionStore()
</script>

<style scoped>
.decision-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.decision-modal {
  width: min(460px, 92vw);
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
  border: 1px solid #e5e7eb;
}

.decision-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.decision-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.decision-message {
  margin-top: 8px;
  font-size: 14px;
  color: #475569;
}

.decision-actions {
  margin-top: 18px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.decision-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.decision-fail {
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #fecdd3;
}

.decision-fail:hover {
  background: #ffe4e6;
}

.decision-pass {
  color: #fff;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: 1px solid rgba(22, 163, 74, 0.6);
}

.decision-pass:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.25);
}
</style>