import { useCallback, useRef, useEffect } from 'react';
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

      const newNode: Node<NodeData> = {
        id: `${nodeData.type}_${Date.now()}`,
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
    [screenToFlowPosition, addNode]
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

  // Only fit view when there are multiple nodes, not for the first node
  useEffect(() => {
    if (nodes.length > 1) {
      // Small delay to ensure nodes are rendered
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, [nodes.length, fitView]);

  // Add edge styling based on execution status (green for success, red for error)
  const styledEdges = edges.map((edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    // Determine edge color based on execution status
    let edgeColor = 'hsl(var(--border))'; // Default gray
    let strokeWidth = 2;

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
      style: {
        ...edge.style,
        stroke: edgeColor,
        strokeWidth,
      },
      animated: sourceNode?.data?.executionStatus === 'running',
    };
  });

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full">
      <ReactFlow
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
