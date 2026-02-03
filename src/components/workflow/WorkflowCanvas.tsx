import { useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  Node,
  Edge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore, NodeData } from '@/stores/workflowStore';
import { NodeTypeDefinition } from './nodeTypes';
import WorkflowNode from './WorkflowNode';
import FormTriggerNode from './FormTriggerNode';

const nodeTypes = {
  custom: WorkflowNode,
  form: FormTriggerNode,
};

function WorkflowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    addNode,
    selectNode,
    selectEdge,
    deleteSelectedNode,
    deleteSelectedEdge,
    undo,
    redo,
    copySelectedNode,
    pasteNode,
    selectAll,
    selectedNode,
    selectedEdge
  } = useWorkflowStore();

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if input/textarea/select is focused or if typing in an input field
      const target = event.target as HTMLElement;
      const isInputElement =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLDivElement && target.contentEditable === 'true') ||
        target.closest('input, textarea, select, [contenteditable="true"]');

      if (isInputElement) {
        // Allow Delete/Backspace in inputs for normal text editing
        return;
      }

      // Delete or Backspace - Delete selected node/edge
      if ((event.key === 'Delete' || event.key === 'Backspace') && !event.ctrlKey && !event.metaKey) {
        if (selectedNode) {
          event.preventDefault();
          event.stopPropagation();
          deleteSelectedNode();
          return;
        }
        if (selectedEdge) {
          event.preventDefault();
          event.stopPropagation();
          deleteSelectedEdge();
          return;
        }
      }

      // Ctrl/Cmd Shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            event.preventDefault();
            event.stopPropagation();
            redo();
            break;
          case 'c':
            event.preventDefault();
            event.stopPropagation();
            copySelectedNode();
            break;
          case 'v':
            event.preventDefault();
            event.stopPropagation();
            pasteNode();
            break;
          case 'a':
            event.preventDefault();
            event.stopPropagation();
            selectAll();
            break;
        }
      }
    };

    // Use capture phase to catch events before they bubble
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedNode, selectedEdge, deleteSelectedNode, deleteSelectedEdge, undo, redo, copySelectedNode, pasteNode, selectAll]);


  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeDataString = event.dataTransfer.getData('application/reactflow');
      if (!nodeDataString) return;

      const nodeData: NodeTypeDefinition = JSON.parse(nodeDataString);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Use 'form' node type for Form Trigger, 'custom' for others
      const nodeType = nodeData.type === 'form' ? 'form' : 'custom';

      // Generate unique ID by checking existing nodes
      // Use crypto.randomUUID if available for better uniqueness
      const existingIds = new Set(nodes.map(n => n.id));
      let nodeId: string;
      let counter = 0;
      const maxAttempts = 100;
      do {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          nodeId = `${nodeData.type}_${crypto.randomUUID()}`;
        } else {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 15);
          nodeId = `${nodeData.type}_${timestamp}_${counter}_${random}`;
        }
        counter++;
        if (counter > maxAttempts) {
          throw new Error('Failed to generate unique node ID after maximum attempts');
        }
      } while (existingIds.has(nodeId));

      const newNode: Node<NodeData> = {
        id: nodeId,
        type: nodeType,
        position,
        data: {
          label: nodeData.label,
          type: nodeData.type,
          category: nodeData.category,
          icon: nodeData.icon,
          config: { ...nodeData.defaultConfig },
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode, nodes]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node<NodeData>) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        selectNode(node);
      } catch (error) {
        console.error('Error selecting node:', error);
      }
    },
    [selectNode]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      selectEdge(edge);
    },
    [selectEdge]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  /**
   * Map backend handle IDs to frontend handle IDs
   * Backend may use different field names (data, message, etc.) but frontend uses standardized IDs
   */
  const normalizeHandleId = (
    handleId: string | undefined,
    nodeType: string | undefined,
    isSource: boolean
  ): string => {
    if (!handleId) {
      // Return default based on position
      return isSource ? 'output' : 'input';
    }

    const nodeTypeLower = (nodeType || '').toLowerCase();
    const handleIdLower = handleId.toLowerCase();

    // AI Agent special handles (must match exactly)
    if (nodeTypeLower === 'ai_agent') {
      if (isSource) {
        // AI Agent has no output handles (it's a terminal node in some cases)
        return 'output';
      } else {
        // AI Agent input handles
        if (handleIdLower === 'chat_model' || handleIdLower === 'chatmodel') return 'chat_model';
        if (handleIdLower === 'memory') return 'memory';
        if (handleIdLower === 'tool') return 'tool';
        if (handleIdLower === 'userinput' || handleIdLower === 'user_input') return 'userInput';
        // Default to userInput for AI Agent
        return 'userInput';
      }
    }

    // Map common backend field names to frontend handle IDs
    if (isSource) {
      // Source handles (outputs)
      const sourceMapping: Record<string, string> = {
        'data': 'output',
        'message': 'output',
        'output': 'output',
        'result': 'output',
        'response': 'output',
        'response_text': 'output',
        'response_json': 'output',
        'true': 'true', // if_else true path
        'false': 'false', // if_else false path
      };
      return sourceMapping[handleIdLower] || handleId; // Use original if no mapping
    } else {
      // Target handles (inputs)
      const targetMapping: Record<string, string> = {
        'data': 'input',
        'input': 'input',
        'message': 'input',
        'userinput': 'userInput',
        'user_input': 'userInput',
        'default': 'input',
      };
      return targetMapping[handleIdLower] || handleId; // Use original if no mapping
    }
  };

  // Add edge styling based on execution status (green for success, red for error)
  const styledEdges = useMemo(() => {
    console.log(`[EdgeRender] Rendering ${edges.length} edges for ${nodes.length} nodes`);
    
    return edges.map((edge) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      // Validate edge references exist
      if (!sourceNode || !targetNode) {
        console.warn(`[EdgeRender] Edge ${edge.id} references missing node: source=${edge.source}, target=${edge.target}`);
        return null;
      }

      // CRITICAL FIX: Normalize handle IDs to match frontend node handles
      const sourceNodeType = sourceNode.data?.type || sourceNode.type;
      const targetNodeType = targetNode.data?.type || targetNode.type;
      
      const normalizedSourceHandle = normalizeHandleId(edge.sourceHandle, sourceNodeType, true);
      const normalizedTargetHandle = normalizeHandleId(edge.targetHandle, targetNodeType, false);

      // Log edge normalization for debugging
      if (edge.sourceHandle !== normalizedSourceHandle || edge.targetHandle !== normalizedTargetHandle) {
        console.log(`[EdgeRender] Normalized handles for edge ${edge.id}:`);
        console.log(`  Source: "${edge.sourceHandle || 'none'}" → "${normalizedSourceHandle}" (node: ${sourceNodeType})`);
        console.log(`  Target: "${edge.targetHandle || 'none'}" → "${normalizedTargetHandle}" (node: ${targetNodeType})`);
      }

      // Determine edge color based on execution status
      let edgeColor = '#6366f1'; // Default indigo (more visible)
      let strokeWidth = 2.5;

      if (sourceNode?.data?.executionStatus === 'success' && targetNode?.data?.executionStatus !== 'error') {
        // Green for successful execution path
        edgeColor = '#22c55e'; // green-500
        strokeWidth = 3;
      } else if (sourceNode?.data?.executionStatus === 'error' || targetNode?.data?.executionStatus === 'error') {
        // Red for error path
        edgeColor = '#ef4444'; // red-500
        strokeWidth = 3;
      } else if (sourceNode?.data?.executionStatus === 'running' || targetNode?.data?.executionStatus === 'running') {
        // Blue for running
        edgeColor = '#3b82f6'; // blue-500
        strokeWidth = 2.5;
      }

      return {
        ...edge,
        id: edge.id || `edge-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: normalizedSourceHandle,
        targetHandle: normalizedTargetHandle,
        type: edge.type || 'default',
        style: {
          stroke: edgeColor,
          strokeWidth,
          opacity: 1, // Ensure visible
          ...edge.style,
        },
        animated: sourceNode?.data?.executionStatus === 'running',
        zIndex: 1, // Ensure above background
        markerEnd: {
          type: 'arrowclosed' as const,
          color: edgeColor,
        },
      };
    }).filter(Boolean); // Remove null edges
  }, [edges, nodes]);

  // Generate a key based on node IDs to force re-render when workflow changes
  // This ensures React Flow resets completely when switching workflows
  const workflowKey = nodes.length > 0 
    ? nodes.map(n => n.id).sort().join(',') 
    : 'empty';
  
  // Fit view when nodes are loaded or workflow changes
  useEffect(() => {
    if (nodes.length > 0) {
      // Small delay to ensure nodes are rendered
      const timeoutId = setTimeout(() => {
        fitView({ 
          padding: 0.2, 
          duration: 300,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 2
        });
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [workflowKey, nodes.length, fitView]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        key={workflowKey}
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        snapToGrid
        snapGrid={[16, 16]}
        className="bg-muted/30"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        connectOnClick={false}
      >
        <Background gap={16} size={1} className="!bg-muted/50" />
        <Controls className="!bg-card !border-border !shadow-md [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted" />
        <MiniMap
          className="!bg-card !border-border"

          nodeColor={(node) => {
            const data = node.data as NodeData;
            switch (data?.category) {
              case 'triggers': return 'hsl(var(--primary))';
              case 'ai': return 'hsl(var(--accent))';
              case 'logic': return 'hsl(var(--secondary))';
              case 'data': return 'hsl(142 71% 45%)';
              case 'output': return 'hsl(25 95% 53%)';
              default: return 'hsl(var(--muted-foreground))';
            }
          }}
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}
