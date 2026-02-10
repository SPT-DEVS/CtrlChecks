/**
 * PropertiesPanel Schema Rendering Tests
 * 
 * Tests that PropertiesPanel renders from backend schemas correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PropertiesPanel from '../PropertiesPanel';
import { nodeSchemaService, NodeDefinition } from '@/services/nodeSchemaService';
import { useWorkflowStore } from '@/stores/workflowStore';

// Mock dependencies
vi.mock('@/stores/workflowStore');
vi.mock('@/services/nodeSchemaService');
vi.mock('@/hooks/use-toast');

describe('PropertiesPanel Schema Rendering', () => {
  const mockNodeDefinition: NodeDefinition = {
    type: 'if_else',
    label: 'If/Else',
    category: 'logic',
    description: 'Conditional branching',
    icon: 'GitBranch',
    inputSchema: {
      conditions: {
        type: 'array',
        description: 'Conditions to evaluate',
        required: true,
        default: [{ expression: '' }],
      },
      combineOperation: {
        type: 'string',
        description: 'How to combine conditions',
        required: false,
        default: 'AND',
        examples: ['AND', 'OR'],
      },
    },
    outputSchema: {
      true: { type: 'object', description: 'True output' },
      false: { type: 'object', description: 'False output' },
    },
    requiredInputs: ['conditions'],
    outgoingPorts: ['true', 'false'],
    incomingPorts: ['default'],
    isBranching: true,
    defaultInputs: () => ({
      conditions: [{ expression: '' }],
      combineOperation: 'AND',
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock workflow store
    (useWorkflowStore as any).mockReturnValue({
      selectedNode: {
        id: 'node1',
        type: 'if_else',
        data: {
          type: 'if_else',
          label: 'If/Else',
          config: {},
        },
      },
      selectNode: vi.fn(),
      updateNodeConfig: vi.fn(),
      deleteSelectedNode: vi.fn(),
      workflowId: 'workflow1',
      nodes: [],
      edges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
    });

    // Mock schema service
    (nodeSchemaService.fetchSchemaByType as any) = vi.fn().mockResolvedValue(mockNodeDefinition);
  });

  it('should fetch schema from backend when node is selected', async () => {
    render(<PropertiesPanel />);

    await waitFor(() => {
      expect(nodeSchemaService.fetchSchemaByType).toHaveBeenCalledWith('if_else');
    });
  });

  it('should render fields from backend schema', async () => {
    render(<PropertiesPanel />);

    await waitFor(() => {
      // Should render conditions field (required)
      expect(screen.getByLabelText(/conditions/i)).toBeInTheDocument();
      
      // Should render combineOperation field (optional)
      expect(screen.getByLabelText(/combine operation/i)).toBeInTheDocument();
    });
  });

  it('should show required field indicator for required inputs', async () => {
    render(<PropertiesPanel />);

    await waitFor(() => {
      const conditionsLabel = screen.getByLabelText(/conditions/i);
      const requiredIndicator = conditionsLabel.parentElement?.querySelector('.text-destructive');
      expect(requiredIndicator).toBeInTheDocument();
    });
  });

  it('should show validation errors inline when inputs are invalid', async () => {
    const { updateNodeConfig } = useWorkflowStore();
    
    // Mock node with invalid config (missing required field)
    (useWorkflowStore as any).mockReturnValue({
      selectedNode: {
        id: 'node1',
        type: 'if_else',
        data: {
          type: 'if_else',
          label: 'If/Else',
          config: {}, // Missing required 'conditions' field
        },
      },
      updateNodeConfig,
      // ... other mocks
    });

    render(<PropertiesPanel />);

    await waitFor(() => {
      // Should show validation error for missing required field
      expect(screen.getByText(/conditions.*required/i)).toBeInTheDocument();
    });
  });

  it('should show schema-driven indicator when using backend schema', async () => {
    render(<PropertiesPanel />);

    await waitFor(() => {
      // Should show schema-driven indicator
      expect(screen.getByTitle(/rendered from backend schema/i)).toBeInTheDocument();
    });
  });

  it('should fallback to legacy configFields when schema not available', async () => {
    // Mock schema service to return null (no schema)
    (nodeSchemaService.fetchSchemaByType as any) = vi.fn().mockResolvedValue(null);

    render(<PropertiesPanel />);

    await waitFor(() => {
      // Should not show schema-driven indicator
      expect(screen.queryByTitle(/rendered from backend schema/i)).not.toBeInTheDocument();
    });
  });

  it('should re-validate when config changes', async () => {
    const { updateNodeConfig } = useWorkflowStore();
    
    render(<PropertiesPanel />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByLabelText(/conditions/i)).toBeInTheDocument();
    });

    // Update config to invalid state
    updateNodeConfig('node1', { combineOperation: 'INVALID' });

    await waitFor(() => {
      // Should show validation error
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });
});
