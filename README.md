# Workflow / Automation Builder

A **production-quality, frontend-only** workflow automation builder built with **VueJS 3 + TypeScript**. Create visual workflows similar to Zapier/n8n with a node-based interface, complete with execution simulation, undo/redo, and local persistence.

![Workflow Builder](https://img.shields.io/badge/Vue-3.5-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![VueFlow](https://img.shields.io/badge/VueFlow-1.48-orange)

---

## 🚀 Features

### Core Functionality
- **Visual Node Editor**: Drag-and-drop nodes from palette to canvas
- **Node Types**: Triggers (Manual, Webhook), Actions (HTTP, Email, SMS), Logic (Condition, Transform, Delay)
- **Dynamic Configuration**: Schema-driven config panels with validation
- **Execution Simulation**: Run workflows with visual feedback and logs
- **DAG Validation**: Enforces acyclic graphs with typed connections
- **Undo/Redo**: Full history with immutable state updates (Ctrl+Z, Shift+Ctrl+Z)
- **Persistence**: Auto-save to LocalStorage with manual save/load/export
- **Sample Workflows**: Pre-built templates for common automation scenarios

### UX Features
- Pan & zoom canvas with fit-view
- Mini-map for navigation
- Snap-to-grid (15px)
- Keyboard shortcuts (Delete, Undo, Redo)
- Multi-node selection
- Real-time validation with error messages
- Execution controls (Play, Pause, Stop)
- Visual status indicators for node execution

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Vue 3 (Composition API) + TypeScript |
| **Graph/Canvas** | VueFlow (Background, Controls, MiniMap) |
| **State Management** | Pinia with Immer (immutable updates) |
| **Validation** | Zod + Vee-Validate |
| **Styling** | TailwindCSS 4 |
| **Build Tool** | Vite 7 |
| **Testing** | Vitest + Happy-DOM |
| **Persistence** | LocalStorage API |

---

## 📦 Installation & Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with UI
npm run test:ui
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Architecture Overview

### Project Structure
```
src/
├── components/workflow/     # UI components
│   ├── WorkflowCanvas.vue   # Main VueFlow canvas
│   ├── NodePalette.vue      # Draggable node list
│   ├── ConfigPanel.vue      # Node configuration form
│   ├── ExecutionPanel.vue   # Simulation controls & logs
│   ├── Toolbar.vue          # Save/Load/Undo/Redo controls
│   └── StatusIndicator.vue  # Node execution status
├── stores/                  # Pinia stores
│   ├── workflowStore.ts     # Nodes, edges, configs, viewport
│   ├── historyStore.ts      # Undo/redo snapshots
│   └── executionStore.ts    # Simulation engine & logs
├── schemas/                 # Data schemas
│   └── nodeDefinitions.ts   # Node type definitions & configs
├── utils/                   # Utilities
│   ├── persistence.ts       # LocalStorage save/load/export
│   ├── validation.ts        # Zod-based validation helpers
│   └── sampleWorkflows.ts   # Pre-built workflow templates
├── types/                   # TypeScript types
│   └── index.ts             # All type definitions
├── App.vue                  # Main app component
├── main.ts                  # App entry point
└── style.css                # Global styles + TailwindCSS
```

### State Shape

#### Workflow Store (Primary State)
```typescript
{
  nodes: WorkflowNode[],              // All workflow nodes
  edges: WorkflowEdge[],              // Connections between nodes
  nodeConfigs: Record<id, config>,    // Node-specific configurations
  viewport: { zoom, x, y },           // Canvas viewport state
  selectedNodeId: string | null       // Currently selected node
}
```

#### History Store (Undo/Redo)
```typescript
{
  past: HistorySnapshot[],   // Previous states (max 50)
  future: HistorySnapshot[], // Redo stack
  canUndo: boolean,
  canRedo: boolean
}
```

#### Execution Store (Simulation)
```typescript
{
  status: ExecutionStatus,          // idle | running | paused | completed | error
  activeNodeId: string | null,      // Currently executing node
  logs: ExecutionLog[],             // Step-by-step execution logs
  currentStep: number               // Progress counter
}
```

---

## 🔄 Undo/Redo Implementation

### Strategy
- **Immutable Updates**: All state changes use Immer's `produce()` for structural sharing
- **Snapshot-Based**: Full state snapshots stored in history (efficient with Immer)
- **Automatic Batching**: Multiple rapid changes (e.g., drag) batched as single undo
- **History Limit**: Max 50 snapshots to prevent memory issues

### Flow
1. User action → `workflowStore` mutation with `produce()`
2. After mutation → `historyStore.saveSnapshot(currentState)`
3. Undo/Redo → Restore snapshot from `past`/`future` stack
4. New action after undo → Clear `future` stack

### Code Example
```typescript
// In workflowStore.ts
addNode(node) {
  this.$patch(
    produce((state) => {
      state.nodes.push(node)
      state.nodeConfigs[node.id] = node.data.config || {}
    })
  )
  useHistoryStore().saveSnapshot(this.$state)
}
```

---

## ➕ Adding a New Node Type

### Step 1: Define Node in Schema
Edit `/src/schemas/nodeDefinitions.ts`:

```typescript
{
  type: 'my-custom-node',
  category: 'action', // 'trigger' | 'action' | 'logic'
  label: 'My Custom Node',
  description: 'Does something amazing',
  icon: '🎯',
  color: '#8b5cf6',
  inputs: 1,
  outputs: 1,
  fields: [
    {
      name: 'apiKey',
      label: 'API Key',
      type: 'text',
      required: true,
      validation: z.string().min(1)
    }
  ],
  defaultConfig: { apiKey: '' }
}
```

### Step 2: Add Execution Logic
Edit `/src/stores/executionStore.ts` in `simulateNodeExecution()`:

```typescript
case 'my-custom-node':
  return {
    message: `Custom action executed with key: ${config.apiKey}`,
    data: { result: 'success' }
  }
```

### Step 3: Update TypeScript Types
Add to `/src/types/index.ts`:

```typescript
export type NodeType = 
  | 'manual-trigger'
  | 'webhook-trigger'
  | 'my-custom-node' // Add here
  // ... other types
```

That's it! The node will appear in the palette automatically.

---

## 📋 Graph Validation Rules

### DAG Enforcement
- **No Cycles**: Topological sort detects cycles; workflow marked invalid if found
- **Condition Nodes**: Must have exactly 2 outgoing edges labeled `true` and `false`
- **Typed Connections**: (Can be extended) Source/target handle types must match

### Validation Flow
```typescript
isValidWorkflow() {
  // Check 1: No cycles
  if (detectCycle(nodes, edges)) return false
  
  // Check 2: Condition node validation
  for (node of conditionNodes) {
    const outgoing = getOutgoingEdges(node.id)
    if (outgoing.length !== 2) return false
    if (!hasEdgeType('true') || !hasEdgeType('false')) return false
  }
  
  return true
}
```

**Save Button**: Disabled if `!isValidWorkflow`

---

## 🎮 Execution Simulation

### How It Works
1. **Topological Sort**: Orders nodes by dependencies (DAG traversal)
2. **Sequential Execution**: Processes nodes one-by-one with delays
3. **Visual Feedback**: Highlights active node, updates status indicators
4. **Logging**: Records each step with timestamp, status, and data

### Simulation Details
- **No Real API Calls**: All HTTP, Email, SMS actions are mocked
- **Condition Logic**: Random true/false for branching (can be customized)
- **Delays**: Capped at 2 seconds for UX (simulates real wait times)
- **Pause/Resume**: Execution can be paused mid-flow

### Code Example
```typescript
async executeWorkflow(nodes, edges, configs, executionStore) {
  executionStore.startExecution()
  
  const sortedNodes = topologicalSort(nodes, edges)
  
  for (const node of sortedNodes) {
    executionStore.setActiveNode(node.id)
    
    const result = await simulateNodeExecution(node, configs[node.id])
    
    executionStore.addLog({
      nodeId: node.id,
      nodeName: node.data.label,
      status: 'success',
      message: result.message,
      data: result.data
    })
    
    await sleep(800) // Visual delay
  }
  
  executionStore.completeExecution()
}
```

---

## 📄 Sample Workflows

### 1. New Lead Welcome & Follow-up
**Flow**: Webhook → Email → Delay → Condition → (Email | SMS)

**Use Case**: Automated lead nurturing
- Trigger on new lead signup
- Send welcome email
- Wait 2 days
- Check if email opened
  - **Yes**: Send product demo offer
  - **No**: Send re-engagement SMS

### 2. Abandoned Cart Recovery
**Flow**: Webhook → Delay → Email → Delay → Condition → (API Call | Email)

**Use Case**: E-commerce cart recovery
- Trigger on cart abandonment
- Wait 1 hour
- Send reminder email (10% off)
- Wait 24 hours
- Check if order completed
  - **Yes**: Mark campaign success (API call)
  - **No**: Send final offer (20% off)

**Load Samples**: Click "Sample Workflows" in toolbar

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Shift + Ctrl/Cmd + Z` | Redo |
| `Delete` / `Backspace` | Delete selected node |
| `Space + Drag` | Pan canvas |
| `Mouse Wheel` | Zoom in/out |

---

## 🧪 Testing

### Test Coverage
- **Workflow Store**: Node CRUD, edge management, DAG validation
- **History Store**: Undo/redo, snapshot management, state restoration
- **Validation**: Field validation, config validation, JSON parsing
- **Persistence**: Save/load/export from LocalStorage

### Run Tests
```bash
npm run test        # Headless mode
npm run test:ui     # Interactive UI
```

### Example Test
```typescript
it('should undo and redo node addition', () => {
  workflowStore.addNode(node)
  expect(workflowStore.nodes).toHaveLength(1)
  
  historyStore.undo()
  const snapshot = historyStore.past[historyStore.past.length - 1]
  workflowStore.restoreState(snapshot)
  expect(workflowStore.nodes).toHaveLength(0)
  
  historyStore.redo()
  const redoSnapshot = historyStore.redo()
  workflowStore.restoreState(redoSnapshot)
  expect(workflowStore.nodes).toHaveLength(1)
})
```

---

## 🚢 Deployment

### Production Build
```bash
npm run build
```

Output: `dist/` directory (static files)

### Deploy Options
- **Vercel**: `vercel deploy`
- **Netlify**: Drag `dist/` to Netlify drop zone
- **GitHub Pages**: Push `dist/` to `gh-pages` branch
- **Static Hosting**: Upload `dist/` to any CDN/web server

### Environment Variables
None required! Fully client-side app.

---

## 🔮 Future Enhancements

### Potential Features
- **Custom Node Templates**: User-defined reusable node groups
- **Workflow Versioning**: Track changes over time
- **Collaboration**: Real-time multi-user editing (WebRTC/WebSocket)
- **Advanced Execution**: Variables, expressions, data passing between nodes
- **Export Formats**: Convert to code (Python, JavaScript, YAML)
- **Plugin System**: Extend with custom node types via NPM packages
- **Cloud Sync**: Optional backend for cross-device persistence
- **Workflow Marketplace**: Share and download community workflows

---

## 📝 License

MIT License - Feel free to use in personal or commercial projects.

---

## 🙏 Acknowledgments

Built with:
- [Vue.js](https://vuejs.org/)
- [VueFlow](https://vueflow.dev/)
- [Pinia](https://pinia.vuejs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Zod](https://zod.dev/)

---

## 📧 Questions?

For issues or feature requests, please create a GitHub issue.

**Happy Workflow Building!** 🚀
