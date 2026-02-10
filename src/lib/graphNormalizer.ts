/**
 * Graph Normalizer
 * 
 * Ensures workflow graphs are in a consistent, valid format before saving.
 * - Deduplicates edges
 * - Normalizes node configs (e.g., If/Else condition -> conditions)
 * - Validates topology
 */

import { Node, Edge } from 'reactflow';

export interface NormalizedGraph {
  nodes: Node[];
  edges: Edge[];
  errors: string[];
  warnings: string[];
}

/**
 * Normalize If/Else node config from old format (condition) to new format (conditions)
 */
function normalizeIfElseNode(node: Node): Node {
  if (node.data?.type !== 'if_else') {
    return node;
  }

  const config = node.data?.config || {};
  const normalizedConfig = { ...config };

  // Convert old format: condition (string) -> conditions (array)
  if (config.condition && !config.conditions) {
    const conditionStr = typeof config.condition === 'string' ? config.condition : String(config.condition);
    if (conditionStr.trim()) {
      normalizedConfig.conditions = [
        {
          expression: conditionStr,
        }
      ];
      // Keep condition for backward compatibility during execution
      // but prioritize conditions array
    }
  }

  // Ensure conditions is an array if it exists
  if (normalizedConfig.conditions && !Array.isArray(normalizedConfig.conditions)) {
    if (typeof normalizedConfig.conditions === 'string') {
      normalizedConfig.conditions = [{ expression: normalizedConfig.conditions }];
    } else if (typeof normalizedConfig.conditions === 'object' && normalizedConfig.conditions.expression) {
      normalizedConfig.conditions = [normalizedConfig.conditions];
    } else {
      normalizedConfig.conditions = [];
    }
  }

  return {
    ...node,
    data: {
      ...node.data,
      config: normalizedConfig,
    },
  };
}

/**
 * Deduplicate edges by (source, target, sourceHandle, targetHandle)
 */
function deduplicateEdges(edges: Edge[]): Edge[] {
  const seen = new Set<string>();
  const unique: Edge[] = [];

  for (const edge of edges) {
    const key = `${edge.source}::${edge.target}::${edge.sourceHandle || 'default'}::${edge.targetHandle || 'default'}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(edge);
    }
  }

  return unique;
}

/**
 * Remove edges that reference non-existent nodes
 */
function removeInvalidEdges(nodes: Node[], edges: Edge[]): Edge[] {
  const nodeIds = new Set(nodes.map(n => n.id));
  return edges.filter(edge => {
    const sourceExists = nodeIds.has(edge.source);
    const targetExists = nodeIds.has(edge.target);
    return sourceExists && targetExists;
  });
}

/**
 * Normalize workflow graph
 */
export function normalizeWorkflowGraph(nodes: Node[], edges: Edge[]): NormalizedGraph {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Normalize node configs (If/Else condition -> conditions)
  const normalizedNodes = nodes.map(node => normalizeIfElseNode(node));

  // 2. Remove invalid edges
  let validEdges = removeInvalidEdges(normalizedNodes, edges);
  const removedCount = edges.length - validEdges.length;
  if (removedCount > 0) {
    warnings.push(`Removed ${removedCount} invalid edge(s) referencing non-existent nodes`);
  }

  // 3. Deduplicate edges
  const beforeDedup = validEdges.length;
  validEdges = deduplicateEdges(validEdges);
  const dupCount = beforeDedup - validEdges.length;
  if (dupCount > 0) {
    warnings.push(`Removed ${dupCount} duplicate edge(s)`);
  }

  return {
    nodes: normalizedNodes,
    edges: validEdges,
    errors,
    warnings,
  };
}
