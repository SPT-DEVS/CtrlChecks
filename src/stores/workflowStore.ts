import { create } from 'zustand';
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  addEdge,
} from '@xyflow/react';

export type NodeCategory = 'triggers' | 'ai' | 'logic' | 'data' | 'database' | 'storage' | 'output' | 'http_api' | 'google' | 'devops' | 'social_media' | 'crm' | 'utility' | 'productivity' | 'authentication' | 'payment' | 'ecommerce' | 'analytics';

export interface NodeData {
  label: string;
  type: string;
  category: NodeCategory;
  icon: string;
  config: Record<string, unknown>;
  executionStatus?: 'idle' | 'running' | 'success' | 'error' | 'pending';
  [key: string]: unknown;
}

export type WorkflowNode = Node<NodeData>;

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: Edge[];
  selectedNode: WorkflowNode | null;
  selectedEdge: Edge | null;
  workflowId: string | null;
  workflowName: string;
  isDirty: boolean;
  copiedNode: WorkflowNode | null;

  // Undo/Redo Stacks
  undoStack: { nodes: WorkflowNode[]; edges: Edge[] }[];
  redoStack: { nodes: WorkflowNode[]; edges: Edge[] }[];

  // Actions
  // Actions
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onReconnect: (oldEdge: Edge, newConnection: Connection) => void;
  addNode: (node: WorkflowNode) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void;
  resetAllNodeStatuses: () => void;
  selectNode: (node: WorkflowNode | null) => void;
  selectEdge: (edge: Edge | null) => void;
  deleteSelectedNode: () => void;
  deleteSelectedEdge: () => void;
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  setIsDirty: (dirty: boolean) => void;
  resetWorkflow: () => void;

  // History & Clipboard
  undo: () => void;
  redo: () => void;
  copySelectedNode: () => void;
  pasteNode: () => void;
  selectAll: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdge: null,
  workflowId: null,
  workflowName: 'Untitled Workflow',
  isDirty: false,
  copiedNode: null,
  undoStack: [],
  redoStack: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as WorkflowNode[],
      isDirty: true,
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
      isDirty: true,
    });
  },

  onReconnect: (oldEdge, newConnection) => {
    const { edges, nodes } = get();
    // Save state for undo
    const newUndoStack = [...get().undoStack, { nodes: [...nodes], edges: [...edges] }];

    set({
      edges: addEdge(newConnection, edges.filter((e) => e.id !== oldEdge.id)),
      isDirty: true,
      undoStack: newUndoStack,
      redoStack: [],
    });
  },

  addNode: (node) => {
    const { nodes, edges } = get();
    const newUndoStack = [...get().undoStack, { nodes: [...nodes], edges: [...edges] }];
    set({
      nodes: [...nodes, node],
      isDirty: true,
      undoStack: newUndoStack,
      redoStack: [],
    });
  },

  updateNodeConfig: (nodeId, config) => {
    const { nodes, edges } = get();
    // Only push to undo stack if config actually changes significantly or debounced? 
    // For now, let's keep it simple. If this is called frequently on typing, we might need to debounce history.
    // Assuming this is called on blur or explicit save/change.
    const newUndoStack = [...get().undoStack, { nodes: [...nodes], edges: [...edges] }];

    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, config: { ...node.data.config, ...config } } }
        : node
    );
    const selectedNode = get().selectedNode;
    const updatedSelectedNode = selectedNode?.id === nodeId
      ? updatedNodes.find(n => n.id === nodeId) || null
      : selectedNode;

    set({
      nodes: updatedNodes,
      selectedNode: updatedSelectedNode,
      isDirty: true,
      undoStack: newUndoStack,
      redoStack: [],
    });
  },

  updateNodeStatus: (nodeId, status) => {
    // Status updates don't need to be in history/undo stack
    const { nodes, edges } = get();
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, executionStatus: status } }
        : node
    );
    
    // Recalculate ALL edge colors based on current node states
    // Rules:
    // - Show green for edges from successful nodes (including edges leading to error nodes)
    // - No color change for edges FROM error nodes (default color)
    // - Yellow for running, gray for pending
    const updatedEdges = edges.map((edge) => {
      const sourceNode = updatedNodes.find(n => n.id === edge.source);
      const targetNode = updatedNodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) {
        // Edge connected to non-existent node, keep default
        const { style, ...edgeWithoutStyle } = edge;
        return edgeWithoutStyle;
      }
      
      const sourceStatus = sourceNode.data.executionStatus || 'idle';
      
      let edgeColor: string | undefined;
      
      // Color edges from successful nodes green (including edges leading to error nodes)
      // Don't color edges FROM error nodes (keep default)
      if (sourceStatus === 'success') {
        edgeColor = '#22c55e'; // Green - for all edges from successful nodes
      } else if (sourceStatus === 'running') {
        edgeColor = '#facc15'; // Yellow
      } else if (sourceStatus === 'pending') {
        edgeColor = '#9ca3af'; // Gray
      }
      // If source is 'error' or 'idle', no custom color (use default)
      
      // Apply color if defined, otherwise remove custom styling
      if (edgeColor) {
        return { ...edge, style: { stroke: edgeColor, strokeWidth: 2 } };
      } else {
        // Remove custom style to use default
        const { style, ...edgeWithoutStyle } = edge;
        return edgeWithoutStyle;
      }
    });
    
    set({
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  },

  resetAllNodeStatuses: () => {
    // Reset all node execution statuses to 'idle' - used when starting a new execution
    // Also reset edge colors to default
    const { nodes, edges } = get();
    set({
      nodes: nodes.map((node) => ({
        ...node,
        data: { ...node.data, executionStatus: 'idle' as const },
      })),
      edges: edges.map((edge) => {
        // Remove custom stroke style to reset to default
        if (edge.style) {
          const { style, ...edgeWithoutStyle } = edge;
          return edgeWithoutStyle;
        }
        return edge;
      }),
    });
  },

  selectNode: (node) => {
    const { nodes, edges } = get();
    set({
      selectedNode: node,
      selectedEdge: null,
      // Sync visual state
      nodes: nodes.map(n => ({ ...n, selected: n.id === node?.id })),
      edges: edges.map(e => ({ ...e, selected: false }))
    });
  },
  selectEdge: (edge) => {
    const { nodes, edges } = get();
    set({
      selectedEdge: edge,
      selectedNode: null,
      // Sync visual state 
      edges: edges.map(e => ({ ...e, selected: e.id === edge?.id })),
      nodes: nodes.map(n => ({ ...n, selected: false }))
    });
  },

  deleteSelectedNode: () => {
    const { selectedNode, nodes, edges } = get();
    if (!selectedNode) return;

    // Save state for undo
    const newUndoStack = [...get().undoStack, { nodes: [...nodes], edges: [...edges] }];

    // Filter out the selected node and any edges connected to it
    const updatedNodes = nodes.filter((n) => n.id !== selectedNode.id);
    const updatedEdges = edges.filter(
      (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
    );

    set({
      nodes: updatedNodes,
      edges: updatedEdges,
      selectedNode: null,
      selectedEdge: null,
      isDirty: true,
      undoStack: newUndoStack,
      redoStack: [],
    });
  },

  deleteSelectedEdge: () => {
    const { selectedEdge, nodes, edges } = get();
    if (!selectedEdge) return;

    const newUndoStack = [...get().undoStack, { nodes: [...nodes], edges: [...edges] }];

    set({
      edges: edges.filter((e) => e.id !== selectedEdge.id),
      selectedEdge: null,
      isDirty: true,
      undoStack: newUndoStack,
      redoStack: [],
    });
  },

  undo: () => {
    const { undoStack, nodes, edges, redoStack } = get();
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    set({
      nodes: previousState.nodes,
      edges: previousState.edges,
      undoStack: newUndoStack,
      redoStack: [...redoStack, { nodes, edges }],
      selectedNode: null,
      selectedEdge: null,
      isDirty: true,
    });
  },

  redo: () => {
    const { undoStack, nodes, edges, redoStack } = get();
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    set({
      nodes: nextState.nodes,
      edges: nextState.edges,
      undoStack: [...undoStack, { nodes, edges }],
      redoStack: newRedoStack,
      selectedNode: null,
      selectedEdge: null,
      isDirty: true,
    });
  },

  copySelectedNode: () => {
    const { selectedNode } = get();
    if (selectedNode) {
      set({ copiedNode: JSON.parse(JSON.stringify(selectedNode)) });
    }
  },

  pasteNode: () => {
    const { copiedNode, nodes, edges } = get();
    if (!copiedNode) return;

    const newUndoStack = [...get().undoStack, { nodes: [...nodes], edges: [...edges] }];

    // Generate unique ID by checking existing nodes
    // Use crypto.randomUUID if available for better uniqueness
    const existingIds = new Set(nodes.map(n => n.id));
    let nodeId: string;
    let counter = 0;
    const maxAttempts = 100;
    const nodeType = copiedNode.data?.type || copiedNode.type || 'node';
    do {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        nodeId = `${nodeType}_copy_${crypto.randomUUID()}`;
      } else {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        nodeId = `${nodeType}_copy_${timestamp}_${counter}_${random}`;
      }
      counter++;
      if (counter > maxAttempts) {
        throw new Error('Failed to generate unique node ID after maximum attempts');
      }
    } while (existingIds.has(nodeId));

    // Create new node with unique ID and offset position
    const newNode: WorkflowNode = {
      ...copiedNode,
      id: nodeId,
      position: {
        x: copiedNode.position.x + 50,
        y: copiedNode.position.y + 50,
      },
      selected: true,
    };

    set({
      nodes: [...nodes.map(n => ({ ...n, selected: false })), newNode],
      selectedNode: newNode,
      isDirty: true,
      undoStack: newUndoStack,
      redoStack: [],
    });
  },

  selectAll: () => {
    const { nodes } = get();
    // React Flow handles multi-selection by adding 'selected: true' to nodes
    // We update our nodes state to reflect this
    set({
      nodes: nodes.map(n => ({ ...n, selected: true })),
      selectedNode: null, // Clear single selection reference
    });
  },

  setWorkflowId: (id) => set({ workflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name, isDirty: true }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  resetWorkflow: () => {
    // CRITICAL: Completely reset all state to prevent stale data
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdge: null,
      workflowId: null,
      workflowName: 'Untitled Workflow',
      isDirty: false,
      undoStack: [],
      redoStack: [],
      copiedNode: null,
    });
  },
}));
