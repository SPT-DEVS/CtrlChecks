import { create } from 'zustand';
import { WorkflowNode } from './workflowStore';

export interface DebugNodeState {
  nodeId: string;
  lastInput: unknown;
  lastOutput: unknown;
  executionStatus: 'idle' | 'running' | 'success' | 'error';
  executionTime?: number;
  error?: string;
  logs?: string[];
}

interface DebugState {
  // Current debug node
  debugNodeId: string | null;
  
  // Execution memory per node
  nodeStates: Record<string, DebugNodeState>;
  
  // Actions
  openDebug: (nodeId: string) => void;
  closeDebug: () => void;
  setNodeInput: (nodeId: string, input: unknown) => void;
  setNodeOutput: (nodeId: string, output: unknown, executionTime?: number) => void;
  setNodeStatus: (nodeId: string, status: DebugNodeState['executionStatus'], error?: string) => void;
  clearNodeState: (nodeId: string) => void;
  getNodeState: (nodeId: string) => DebugNodeState | undefined;
  getPreviousNodeOutput: (nodeId: string, nodes: WorkflowNode[], edges: Array<{ source: string; target: string }>) => unknown;
}

const initialNodeState: DebugNodeState = {
  nodeId: '',
  lastInput: null,
  lastOutput: null,
  executionStatus: 'idle',
};

export const useDebugStore = create<DebugState>((set, get) => ({
  debugNodeId: null,
  nodeStates: {},

  openDebug: (nodeId: string) => {
    set({ debugNodeId: nodeId });
  },

  closeDebug: () => {
    set({ debugNodeId: null });
  },

  setNodeInput: (nodeId: string, input: unknown) => {
    set((state) => ({
      nodeStates: {
        ...state.nodeStates,
        [nodeId]: {
          ...(state.nodeStates[nodeId] || initialNodeState),
          nodeId,
          lastInput: input,
        },
      },
    }));
  },

  setNodeOutput: (nodeId: string, output: unknown, executionTime?: number) => {
    set((state) => ({
      nodeStates: {
        ...state.nodeStates,
        [nodeId]: {
          ...(state.nodeStates[nodeId] || initialNodeState),
          nodeId,
          lastOutput: output,
          executionTime,
          executionStatus: 'success',
        },
      },
    }));
  },

  setNodeStatus: (nodeId: string, status: DebugNodeState['executionStatus'], error?: string) => {
    set((state) => ({
      nodeStates: {
        ...state.nodeStates,
        [nodeId]: {
          ...(state.nodeStates[nodeId] || initialNodeState),
          nodeId,
          executionStatus: status,
          error,
        },
      },
    }));
  },

  clearNodeState: (nodeId: string) => {
    set((state) => {
      const newStates = { ...state.nodeStates };
      delete newStates[nodeId];
      return { nodeStates: newStates };
    });
  },

  getNodeState: (nodeId: string) => {
    return get().nodeStates[nodeId];
  },

  getPreviousNodeOutput: (nodeId: string, nodes: WorkflowNode[], edges: Array<{ source: string; target: string }>) => {
    // Find the edge that connects to this node
    const incomingEdge = edges.find((e) => e.target === nodeId);
    if (!incomingEdge) {
      return null;
    }

    // Find the source node
    const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
    if (!sourceNode) {
      return null;
    }

    // Get the output from the source node's debug state
    const sourceState = get().nodeStates[sourceNode.id];
    return sourceState?.lastOutput || null;
  },
}));

