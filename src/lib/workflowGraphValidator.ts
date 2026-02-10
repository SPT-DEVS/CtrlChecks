/**
 * Workflow Graph Validator
 * 
 * Validates workflow topology before save/execution:
 * - Exactly 1 trigger node
 * - All nodes reachable from trigger
 * - Each node (except trigger) has exactly 1 incoming edge
 * - Only IfElse nodes can have 2 outgoing edges
 * - No cycles
 * - Topological order exists
 */

import { Node, Edge } from 'reactflow';

export interface ValidationError {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validate workflow graph topology
 */
export function validateWorkflowGraph(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (nodes.length === 0) {
    errors.push({
      code: 'NO_NODES',
      message: 'Workflow must have at least one node',
    });
    return { valid: false, errors, warnings };
  }

  // 1. Exactly 1 trigger node
  // ✅ Use category-based detection to recognize ANY node from triggers category
  const triggerNodes = nodes.filter(n => {
    const type = n.data?.type || n.type || '';
    const category = n.data?.category || '';
    
    // ✅ PRIMARY: Check if node is in "triggers" category (any node from triggers category)
    if (category.toLowerCase() === 'triggers' || category.toLowerCase() === 'trigger') {
      return true;
    }
    
    // ✅ SECONDARY: Check if type includes 'trigger'
    if (type.includes('trigger')) {
      return true;
    }
    
    // ✅ TERTIARY: Check known trigger types (fallback for nodes without category)
    const knownTriggerTypes = [
      'manual_trigger',
      'webhook',
      'schedule',
      'chat_trigger',
      'form_trigger',
      'form',
      'workflow_trigger',
      'error_trigger',
      'interval',
      'gmail_trigger',
      'slack_trigger',
      'discord_trigger',
    ];
    
    return knownTriggerTypes.includes(type);
  });

  if (triggerNodes.length === 0) {
    errors.push({
      code: 'NO_TRIGGER',
      message: 'Workflow must have exactly one trigger node',
    });
  } else if (triggerNodes.length > 1) {
    errors.push({
      code: 'MULTIPLE_TRIGGERS',
      message: `Workflow has ${triggerNodes.length} trigger nodes, but should have exactly one`,
      nodeId: triggerNodes[1].id,
    });
  }

  const triggerNode = triggerNodes[0];
  if (!triggerNode) {
    return { valid: false, errors, warnings };
  }

  // 2. Build adjacency maps
  const incomingEdges = new Map<string, Edge[]>();
  const outgoingEdges = new Map<string, Edge[]>();
  const nodeMap = new Map<string, Node>();

  nodes.forEach(node => nodeMap.set(node.id, node));
  edges.forEach(edge => {
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, []);
    }
    incomingEdges.get(edge.target)!.push(edge);

    if (!outgoingEdges.has(edge.source)) {
      outgoingEdges.set(edge.source, []);
    }
    outgoingEdges.get(edge.source)!.push(edge);
  });

  // 3. Check reachability from trigger
  const reachable = new Set<string>();
  const queue = [triggerNode.id];
  reachable.add(triggerNode.id);

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const outgoing = outgoingEdges.get(nodeId) || [];
    for (const edge of outgoing) {
      if (!reachable.has(edge.target)) {
        reachable.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  // Check for unreachable nodes
  const unreachable = nodes.filter(n => !reachable.has(n.id));
  if (unreachable.length > 0) {
    warnings.push(`${unreachable.length} node(s) are not reachable from trigger`);
    unreachable.forEach(node => {
      errors.push({
        code: 'UNREACHABLE_NODE',
        message: `Node "${node.data?.label || node.id}" is not reachable from trigger`,
        nodeId: node.id,
      });
    });
  }

  // 4. Each node (except trigger) must have exactly 1 incoming edge
  nodes.forEach(node => {
    if (node.id === triggerNode.id) {
      return; // Trigger has no incoming
    }

    const incoming = incomingEdges.get(node.id) || [];
    if (incoming.length === 0) {
      errors.push({
        code: 'NO_INCOMING',
        message: `Node "${node.data?.label || node.id}" has no incoming edges`,
        nodeId: node.id,
      });
    } else if (incoming.length > 1) {
      errors.push({
        code: 'MULTIPLE_INCOMING',
        message: `Node "${node.data?.label || node.id}" has ${incoming.length} incoming edges, but should have exactly one`,
        nodeId: node.id,
      });
    }
  });

  // 5. Only IfElse nodes can have 2 outgoing edges
  nodes.forEach(node => {
    const outgoing = outgoingEdges.get(node.id) || [];
    const nodeType = node.data?.type || '';
    const isIfElse = nodeType === 'if_else';

    if (outgoing.length > 2) {
      errors.push({
        code: 'TOO_MANY_OUTGOING',
        message: `Node "${node.data?.label || node.id}" has ${outgoing.length} outgoing edges, but maximum is 2 (for If/Else) or 1 (for other nodes)`,
        nodeId: node.id,
      });
    } else if (outgoing.length === 2 && !isIfElse) {
      errors.push({
        code: 'INVALID_TWO_OUTGOING',
        message: `Node "${node.data?.label || node.id}" has 2 outgoing edges, but only If/Else nodes can have 2 outgoing edges`,
        nodeId: node.id,
      });
    } else if (isIfElse && outgoing.length !== 2) {
      warnings.push(`If/Else node "${node.data?.label || node.id}" should have exactly 2 outgoing edges (true/false branches)`);
    }
  });

  // 6. Check for cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoing = outgoingEdges.get(nodeId) || [];
    for (const edge of outgoing) {
      if (!visited.has(edge.target)) {
        if (hasCycle(edge.target)) {
          return true;
        }
      } else if (recursionStack.has(edge.target)) {
        return true; // Cycle detected
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        errors.push({
          code: 'CYCLE_DETECTED',
          message: 'Workflow contains a cycle (circular dependency)',
        });
        break;
      }
    }
  }

  // 7. Topological order must exist (already checked by cycle detection)
  // If no cycles, topological order exists

  const valid = errors.length === 0;
  return { valid, errors, warnings };
}
