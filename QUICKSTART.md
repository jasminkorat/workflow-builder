# Workflow Builder - Quick Start Guide

## What's Running

The Vue 3 + TypeScript Workflow Builder is now running at: **http://localhost:5173**

## What Was Built

A **production-quality, frontend-only** workflow automation builder with:

### ✅ Core Features Implemented
1. **Visual Node Editor**
   - Drag-and-drop nodes from palette to canvas
   - 8 node types: Manual Trigger, Webhook Trigger, HTTP Action, Email Action, SMS Action, Condition, Transform, Delay
   - Dynamic configuration panels with live validation

2. **Workflow Execution**
   - Simulation engine with topological sort
   - Visual feedback (active node highlighting)
   - Execution logs with step-by-step details
   - Play/Pause/Stop controls

3. **State Management**
   - Pinia stores with immutable updates
   - Full undo/redo support (Ctrl+Z, Shift+Ctrl+Z)
   - History stack (max 50 snapshots)

4. **Persistence**
   - Auto-save to LocalStorage
   - Manual Save/Load
   - Export workflows as JSON
   - 2 pre-built sample workflows

5. **Graph Validation**
   - DAG enforcement (no cycles)
   - Typed connections
   - Condition node validation (2 edges: true/false)

6. **UX Features**
   - Pan & zoom canvas
   - Mini-map
   - Snap-to-grid (15px)
   - Keyboard shortcuts
   - Multi-node selection

## Directory Structure

```
/app/workflow-builder/
├── src/
│   ├── components/workflow/    # UI components
│   ├── stores/                 # Pinia state management
│   ├── schemas/                # Node definitions
│   ├── utils/                  # Helpers
│   ├── types/                  # TypeScript types
│   └── tests/                  # Vitest tests
├── sample-workflows/           # JSON templates
├── README.md                   # Full documentation
├── package.json
└── vitest.config.ts

```

## Key Files

- **Main App**: `/app/workflow-builder/src/App.vue`
- **Canvas**: `/app/workflow-builder/src/components/workflow/WorkflowCanvas.vue`
- **Workflow Store**: `/app/workflow-builder/src/stores/workflowStore.ts`
- **Node Definitions**: `/app/workflow-builder/src/schemas/nodeDefinitions.ts`
- **Sample Workflows**: `/app/workflow-builder/sample-workflows/*.json`

## Quick Test

1. Open http://localhost:5173
2. Drag nodes from left palette to canvas
3. Connect nodes by dragging from output (right) to input (left) handles
4. Click a node to configure it
5. Click "Sample Workflows" to load pre-built examples
6. Click "Run" to simulate execution

## Commands

```bash
cd /app/workflow-builder

# Development
npm run dev              # Start dev server (already running)

# Build
npm run build            # Production build

# Testing
npm run test             # Run tests (18/18 passing ✅)
npm run test:ui          # Interactive test UI

# Preview
npm run preview          # Preview production build
```

## Testing Results

✅ All 18 tests passing:
- Workflow Store: Node CRUD, edges, DAG validation
- History Store: Undo/redo, snapshots
- Validation: Field & config validation
- Persistence: Save/load/export

## Tech Stack

- **Vue 3.5** (Composition API)
- **TypeScript 5.9**
- **VueFlow 1.48** (node-based UI)
- **Pinia 3.0** (state management)
- **TailwindCSS 4** (styling)
- **Zod 4** (validation)
- **Vitest 4** (testing)
- **Vite 7** (build tool)

## Sample Workflows

### 1. New Lead Welcome & Follow-up
Flow: Webhook → Email → Delay → Condition → (Email | SMS)

Use case: Automated lead nurturing with engagement-based branching

### 2. Abandoned Cart Recovery
Flow: Webhook → Delay → Email → Delay → Condition → (API Call | Email)

Use case: E-commerce cart recovery with progressive offers

## Next Steps

1. **Explore the App**: Open http://localhost:5173 and experiment
2. **Load Samples**: Click "Sample Workflows" to see pre-built automations
3. **Run Simulation**: Configure nodes and click "Run" to test execution
4. **Read Docs**: Full documentation in `/app/workflow-builder/README.md`
5. **Add Custom Nodes**: Follow guide in README to extend functionality

## Production Deployment

```bash
npm run build
# Deploy the dist/ folder to any static host (Vercel, Netlify, etc.)
```

## Architecture Highlights

### State Shape
```typescript
{
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  nodeConfigs: Record<id, config>,
  viewport: { zoom, x, y },
  selectedNodeId: string | null
}
```

### Undo/Redo
- Immutable state updates
- Snapshot-based history
- Keyboard support (Ctrl+Z, Shift+Ctrl+Z)

### Execution
- Topological sort for DAG traversal
- Simulated execution (no real API calls)
- Visual feedback & logging

## Keyboard Shortcuts

- `Ctrl/Cmd + Z`: Undo
- `Shift + Ctrl/Cmd + Z`: Redo
- `Delete/Backspace`: Delete selected node
- `Space + Drag`: Pan canvas
- `Mouse Wheel`: Zoom

## What's NOT Included (As Per Requirements)

- ❌ No backend
- ❌ No authentication
- ❌ No real API calls (all simulated)
- ❌ No database (LocalStorage only)

This is a **fully client-side** application as specified.

---

**Status**: ✅ FULLY FUNCTIONAL & READY TO USE

Open http://localhost:5173 to start building workflows!
