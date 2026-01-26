<template>
  <template v-if="shouldShowPanel">
    <div v-if="selectedNode" class="config-panel bg-white border-l border-gray-200 p-6 overflow-y-auto">
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <span class="text-2xl">{{ nodeDefinition?.icon }}</span>
        {{ nodeDefinition?.label }}
      </h3>
      <p class="text-sm text-gray-500 mt-1">{{ nodeDefinition?.description }}</p>
    </div>

    <form @submit.prevent="saveConfig" class="space-y-4">
      <div v-for="field in nodeDefinition?.fields" :key="field.name">
        <!-- Text Input -->
        <div v-if="field.type === 'text'">
          <label :for="field.name" class="block text-sm font-medium text-gray-700 mb-1">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
          </label>
          <input
            :id="field.name"
            v-model="formData[field.name]"
            type="text"
            :placeholder="field.placeholder"
            :required="field.required"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            :data-testid="`config-field-${field.name}`"
          />
          <p v-if="errors[field.name]" class="text-xs text-red-500 mt-1">
            {{ errors[field.name] }}
          </p>
        </div>

        <!-- Textarea -->
        <div v-if="field.type === 'textarea'">
          <label :for="field.name" class="block text-sm font-medium text-gray-700 mb-1">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
          </label>
          <textarea
            :id="field.name"
            v-model="formData[field.name]"
            :placeholder="field.placeholder"
            :required="field.required"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            :data-testid="`config-field-${field.name}`"
          ></textarea>
          <p v-if="errors[field.name]" class="text-xs text-red-500 mt-1">
            {{ errors[field.name] }}
          </p>
        </div>

        <!-- Select -->
        <div v-if="field.type === 'select'">
          <label :for="field.name" class="block text-sm font-medium text-gray-700 mb-1">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
          </label>
          <select
            :id="field.name"
            v-model="formData[field.name]"
            :required="field.required"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            :data-testid="`config-field-${field.name}`"
          >
            <option value="">Select...</option>
            <option v-for="option in field.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <p v-if="errors[field.name]" class="text-xs text-red-500 mt-1">
            {{ errors[field.name] }}
          </p>
        </div>

        <!-- Number -->
        <div v-if="field.type === 'number'">
          <label :for="field.name" class="block text-sm font-medium text-gray-700 mb-1">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
          </label>
          <input
            :id="field.name"
            v-model.number="formData[field.name]"
            type="number"
            :placeholder="field.placeholder"
            :required="field.required"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            :data-testid="`config-field-${field.name}`"
          />
          <p v-if="errors[field.name]" class="text-xs text-red-500 mt-1">
            {{ errors[field.name] }}
          </p>
        </div>

        <!-- JSON -->
        <div v-if="field.type === 'json'">
          <label :for="field.name" class="block text-sm font-medium text-gray-700 mb-1">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
          </label>
          <textarea
            :id="field.name"
            v-model="formData[field.name]"
            :placeholder="field.placeholder"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            :data-testid="`config-field-${field.name}`"
          ></textarea>
          <p v-if="errors[field.name]" class="text-xs text-red-500 mt-1">
            {{ errors[field.name] }}
          </p>
        </div>

        <!-- Checkbox -->
        <div v-if="field.type === 'checkbox'" class="flex items-center">
          <input
            :id="field.name"
            v-model="formData[field.name]"
            type="checkbox"
            class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            :data-testid="`config-field-${field.name}`"
          />
          <label :for="field.name" class="ml-2 text-sm text-gray-700">
            {{ field.label }}
          </label>
        </div>
      </div>

      <div class="config-actions">
        <button
          type="submit"
          :disabled="!isValid"
          class="btn btn-primary"
          data-testid="config-save-button"
        >
          Save Configuration
        </button>
        <button
          type="button"
          @click="deleteNode"
          class="btn btn-danger"
          data-testid="config-delete-button"
        >
          Delete Node
        </button>
        <button
          type="button"
          @click="closePanel"
          class="btn btn-secondary"
          data-testid="config-close-button"
        >
          Close
        </button>
      </div>
    </form>
  </div>

    <div v-else class="config-panel bg-gray-50 border-l border-gray-200 flex items-center justify-center">
      <div class="text-center text-gray-400">
        <p class="text-lg">No node selected</p>
        <p class="text-sm mt-2">Select a node to configure</p>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useWorkflowStore } from '../../stores/workflowStore'
import { useToastStore } from '../../stores/toastStore'
import { useConfirmStore } from '../../stores/confirmStore'
import { getNodeDefinition } from '../../schemas/nodeDefinitions'
import { validateNodeConfig } from '../../utils/validation'

const workflowStore = useWorkflowStore()
const toastStore = useToastStore()
const confirmStore = useConfirmStore()

const formData = ref<Record<string, any>>({})
const errors = ref<Record<string, string>>({})
const isCompact = ref(false)

const selectedNode = computed(() => workflowStore.selectedNode)
const nodeDefinition = computed(() => 
  selectedNode.value ? getNodeDefinition(selectedNode.value.type) : null
)

const isValid = computed(() => {
  if (!nodeDefinition.value) return false
  const result = validateNodeConfig(nodeDefinition.value.fields, formData.value)
  return result.valid
})

const shouldShowPanel = computed(() => !isCompact.value || !!selectedNode.value)

function updateCompactState() {
  isCompact.value = window.innerWidth < 1000
}

onMounted(() => {
  updateCompactState()
  window.addEventListener('resize', updateCompactState)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCompactState)
})

watch(selectedNode, (node) => {
  if (node) {
    formData.value = { ...workflowStore.selectedNodeConfig }
    errors.value = {}
  }
}, { immediate: true })

watch(formData, () => {
  if (nodeDefinition.value) {
    const result = validateNodeConfig(nodeDefinition.value.fields, formData.value)
    errors.value = result.errors
  }
}, { deep: true })

function saveConfig() {
  if (!selectedNode.value || !isValid.value) return
  
  workflowStore.updateNodeConfig(selectedNode.value.id, formData.value)
  toastStore.showToast('Changes saved successfully', 'success')
  closePanel()
}

function closePanel() {
  workflowStore.setSelectedNode(null)
}

async function deleteNode() {
  if (!selectedNode.value) return
  const confirmed = await confirmStore.requestConfirm('Delete this node?', 'Delete Node', 'Delete', 'Cancel')
  if (!confirmed) return
  workflowStore.deleteNode(selectedNode.value.id)
  toastStore.showToast('Node deleted', 'success')
  closePanel()
}
</script>

<style scoped>
.config-panel {
  width: 350px;
  height: 100%;
}

.config-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  width: 100%;
  height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border: 1px solid rgba(2, 132, 199, 0.6);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(2, 132, 199, 0.25);
}

.btn-primary:disabled {
  background: #d1d5db;
  border-color: #d1d5db;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.btn-secondary {
  color: #374151;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.btn-danger {
  color: #b91c1c;
  background: #fff;
  border: 1px solid #fecaca;
}

.btn-danger:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}
</style>
