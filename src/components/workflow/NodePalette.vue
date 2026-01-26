<template>
  <div class="node-palette bg-white border-r border-gray-200 p-4 overflow-y-auto">
    <h3 class="text-lg font-semibold mb-4 text-gray-800">Node Palette</h3>
    
    <div v-for="category in categories" :key="category" class="mb-6">
      <h4 class="text-sm font-medium text-gray-600 uppercase mb-2">
        {{ category }}
      </h4>
      
      <div class="space-y-2">
        <div
          v-for="node in getNodesByCategory(category)"
          :key="node.type"
          :draggable="true"
          @dragstart="onDragStart($event, node)"
          @click="onNodeClick(node)"
          class="node-item p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:bg-gray-100 hover:border-gray-300 transition-all"
          :data-testid="`palette-node-${node.type}`"
        >
          <div class="flex items-center gap-2">
            <span class="text-2xl">{{ node.icon }}</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm text-gray-800">{{ node.label }}</div>
              <div class="text-xs text-gray-500 truncate">{{ node.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getNodesByCategory } from '../../schemas/nodeDefinitions'

const categories = ['trigger', 'action', 'logic']

const emit = defineEmits<{
  dragStart: [event: DragEvent, nodeType: string]
  selectNodeType: [nodeType: string]
}>()

function onDragStart(event: DragEvent, node: any) {
  if (!event.dataTransfer) return
  
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/nodeType', node.type)
  emit('dragStart', event, node.type)
}

function onNodeClick(node: any) {
  if (window.innerWidth >= 1000) return
  emit('selectNodeType', node.type)
}
</script>

<style scoped>
.node-palette {
  width: 30vh;
  height: 100%;
}

.node-item {
  user-select: none;
}
</style>
