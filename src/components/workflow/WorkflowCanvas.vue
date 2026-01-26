<template>
  <div class="workflow-canvas-container" @drop="onDrop" @dragover.prevent>
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :default-viewport="viewport"
      :snap-to-grid="true"
      :snap-grid="[15, 15]"
      @connect="onConnect"
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
      @edge-click="onEdgeClick"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @viewport-change="onViewportChange"
      data-testid="workflow-canvas"
    >
      <Background pattern-color="#e5e7eb" :gap="15" />
      <Controls />
      <MiniMap />

      <template #node-custom="{ data, id }">
        <div
          class="custom-node"
          :class="[
            `category-${getNodeCategory(getNodeTypeById(id))}`,
            { 'node-active': executionStore.activeNodeId === id }
          ]"
          :style="{ borderColor: getNodeColor(getNodeTypeById(id)) }"
          :data-testid="`node-${id}`"
        >
          <div class="node-header" :style="{ backgroundColor: getNodeColor(getNodeTypeById(id)) }">
            <span class="node-icon">{{ getNodeIcon(getNodeTypeById(id)) }}</span>
            <span class="node-label">{{ data.label }}</span>
            <span v-if="isConfigPending(id)" class="node-badge">Config required</span>
            <button class="node-delete" title="Delete node" @click.stop="deleteNodeById(id)">✕</button>
          </div>
          
          <div class="node-status">
            <StatusIndicator :status="executionStore.getNodeStatus(id)" />
          </div>

          <Handle v-if="hasInputs(getNodeTypeById(id))" type="target" :position="Position.Left" />
          <Handle v-if="hasOutputs(getNodeTypeById(id))" type="source" :position="Position.Right" />
        </div>
      </template>
    </VueFlow>

    <div
      v-if="edgeMenu.visible"
      class="edge-menu"
      :style="{ left: edgeMenu.x + 'px', top: edgeMenu.y + 'px' }"
    >
      <button class="edge-delete" @click="deleteSelectedEdge" title="Delete edge" aria-label="Delete edge">
        <svg viewBox="0 0 24 24" class="edge-delete-icon" aria-hidden="true">
          <path
            fill="currentColor"
            d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { VueFlow, Handle, useVueFlow, Position } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useWorkflowStore } from '../../stores/workflowStore'
import { useExecutionStore } from '../../stores/executionStore'
import { useToastStore } from '../../stores/toastStore'
import { useConfirmStore } from '../../stores/confirmStore'
import { getNodeDefinition } from '../../schemas/nodeDefinitions'
import type { WorkflowNode, WorkflowEdge } from '../../types'
import StatusIndicator from './StatusIndicator.vue'

const workflowStore = useWorkflowStore()
const executionStore = useExecutionStore()
const toastStore = useToastStore()
const confirmStore = useConfirmStore()
const vueFlow = useVueFlow()
const { screenToFlowCoordinate } = vueFlow
const selectedEdgeId = ref<string | null>(null)
const edgeMenu = ref({ x: 0, y: 0, visible: false })

const nodes = computed({
  get: () => workflowStore.nodes.map(n => ({ ...n, type: 'custom' })),
  set: (_value) => {
    // VueFlow will update nodes
  }
})

const edges = computed({
  get: () => workflowStore.edges,
  set: (_value) => {
    // VueFlow will update edges
  }
})

const viewport = computed(() => workflowStore.viewport)

function onDrop(event: DragEvent) {
  const nodeType = event.dataTransfer?.getData('application/nodeType')
  if (!nodeType) return

  const position = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY
  })

  const nodeDef = getNodeDefinition(nodeType)
  if (!nodeDef) return

  const newNode: WorkflowNode = {
    id: `node-${Date.now()}`,
    type: nodeType as any,
    position,
    data: {
      label: nodeDef.label,
      config: { ...nodeDef.defaultConfig }
    }
  }

  workflowStore.addNode(newNode)
}

function onNodesChange(changes: any[]) {
  changes.forEach(change => {
    if (change.type === 'position' && change.position && !change.dragging) {
      // Position update completed
      workflowStore.updateNode(change.id, { position: change.position })
    } else if (change.type === 'remove') {
      workflowStore.deleteNode(change.id)
    }
  })
}

function onEdgesChange(changes: any[]) {
  changes.forEach(change => {
    if (change.type === 'remove') {
      workflowStore.deleteEdge(change.id)
    }
  })
}

function onEdgeClick(payload: any) {
  const { event, edge } = payload || {}
  event.preventDefault()
  event.stopPropagation()
  selectedEdgeId.value = edge.id
  edgeMenu.value = {
    x: event.clientX + 8,
    y: event.clientY + 8,
    visible: true
  }
}

function onConnect(connection: { source: string; target: string }) {
  const sourceNode = workflowStore.getNodeById(connection.source)
  const targetNode = workflowStore.getNodeById(connection.target)
  if (!sourceNode || !targetNode) return

  if (connection.source === connection.target) return

  const sourceDef = getNodeDefinition(sourceNode.type)
  const targetDef = getNodeDefinition(targetNode.type)
  if (!sourceDef || !targetDef) return

  if (sourceDef.outputs === 0 || targetDef.inputs === 0) return

  let edgeType: 'default' | 'true' | 'false' = 'default'
  if (sourceNode.type === 'condition') {
    const outgoing = workflowStore.getOutgoingEdges(sourceNode.id)
    if (outgoing.length >= 2) return
    edgeType = outgoing.length === 0 ? 'true' : 'false'
  }

  const edge: WorkflowEdge = {
    id: `edge-${Date.now()}`,
    source: connection.source,
    target: connection.target,
    type: edgeType
  }

  workflowStore.addEdge(edge)
}

function onNodeClick(event: any) {
  workflowStore.setSelectedNode(event.node.id)
}

function onPaneClick() {
  workflowStore.setSelectedNode(null)
  edgeMenu.value.visible = false
  selectedEdgeId.value = null
}

function onViewportChange(vp: any) {
  workflowStore.updateViewport({ zoom: vp.zoom, x: vp.x, y: vp.y })
}

watch(
  () => executionStore.activeNodeId,
  async (nodeId) => {
    if (!nodeId) return
    await nextTick()
    centerOnNode(nodeId)
  }
)

function getNodeTypeById(id: string): string {
  const node = workflowStore.getNodeById(id)
  return node?.type || ''
}

function getNodeCategory(type: string): string {
  return getNodeDefinition(type)?.category || ''
}

function getNodeColor(type: string): string {
  return getNodeDefinition(type)?.color || '#666'
}

function getNodeIcon(type: string): string {
  return getNodeDefinition(type)?.icon || '📦'
}

function hasInputs(type: string): boolean {
  const def = getNodeDefinition(type)
  return def ? def.inputs > 0 : false
}

function hasOutputs(type: string): boolean {
  const def = getNodeDefinition(type)
  return def ? def.outputs > 0 : false
}

function isConfigPending(nodeId: string): boolean {
  const node = workflowStore.getNodeById(nodeId)
  if (!node) return false

  const def = getNodeDefinition(node.type)
  if (!def || def.fields.length === 0) return false

  const config = workflowStore.nodeConfigs[nodeId] || {}
  return def.fields.some(field => {
    if (!field.required) return false
    const value = config[field.name]
    return value === undefined || value === null || value === ''
  })
}

async function deleteNodeById(id: string) {
  const confirmed = await confirmStore.requestConfirm('Delete this node?', 'Delete Node', 'Delete', 'Cancel')
  if (!confirmed) return
  workflowStore.deleteNode(id)
  toastStore.showToast('Node deleted', 'success')
}

async function deleteSelectedEdge() {
  if (!selectedEdgeId.value) return
  const confirmed = await confirmStore.requestConfirm('Delete this edge?', 'Delete Edge', 'Delete', 'Cancel')
  if (!confirmed) return
  workflowStore.deleteEdge(selectedEdgeId.value)
  toastStore.showToast('Edge deleted', 'success')
  edgeMenu.value.visible = false
  selectedEdgeId.value = null
}

function centerOnNode(nodeId: string) {
  const node: any = workflowStore.getNodeById(nodeId)
  if (!node) return

  const width = node.dimensions?.width ?? node.width ?? 200
  const height = node.dimensions?.height ?? node.height ?? 90
  const centerX = node.position.x + width / 2
  const centerY = node.position.y + height / 2
  const zoom = workflowStore.viewport.zoom || 1

  const setCenter = (vueFlow as any).setCenter
  if (typeof setCenter === 'function') {
    setCenter(centerX, centerY, { zoom, duration: 300 })
  }
}
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';

.workflow-canvas-container {
  width: 100%;
  height: 100%;
  background: #f9fafb;
}

.custom-node {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.custom-node:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.custom-node.node-active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  animation: node-blink 1s ease-in-out infinite;
}

@keyframes node-blink {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.15);
    border-color: #3b82f6;
  }
  50% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.45);
    border-color: #2563eb;
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.15);
    border-color: #3b82f6;
  }
}

.node-header {
  padding: 8px 12px;
  color: white;
  font-weight: 600;
  font-size: 14px;
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.node-badge {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.node-delete {
  margin-left: 6px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  transition: background 0.2s ease;
}

.node-delete:hover {
  background: rgba(255, 255, 255, 0.35);
}

.edge-menu {
  position: fixed;
  z-index: 50;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.edge-delete {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #b91c1c;
  border-radius: 8px;
  background: #fef2f2;
  transition: background 0.2s ease, transform 0.2s ease;
}

.edge-delete:hover {
  background: #fee2e2;
  transform: translateY(-1px);
}

.edge-delete-icon {
  width: 16px;
  height: 16px;
}

.node-icon {
  font-size: 18px;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-status {
  padding: 8px 12px;
}

.vue-flow__handle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #666;
}

.vue-flow__handle-connecting {
  background: #3b82f6;
}

.vue-flow__handle-valid {
  background: #10b981;
}
</style>
