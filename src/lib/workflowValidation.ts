
import { Node, Edge } from '@xyflow/react';
import { NODE_TYPES } from '@/components/workflow/nodeTypes';

export interface WorkflowValidationError {
    nodeId?: string;
    message: string;
    severity: 'error' | 'warning';
}

// Unique ID generator to prevent duplicate keys - uses crypto.randomUUID when available
function generateUniqueId(prefix: string, existingIds: Set<string>): string {
    let id: string;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        // Try to use crypto.randomUUID if available (browser environment)
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            id = `${prefix}_${crypto.randomUUID()}`;
        } else {
            // Fallback: timestamp + counter + random
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 15);
            const counter = attempts++;
            id = `${prefix}_${timestamp}_${counter}_${random}`;
        }
        
        if (attempts > maxAttempts) {
            throw new Error(`Failed to generate unique ID after ${maxAttempts} attempts`);
        }
    } while (existingIds.has(id));
    
    existingIds.add(id);
    return id;
}

// Regenerate all node and edge IDs to ensure global uniqueness
function regenerateAllIds(nodes: any[], edges: any[]): { nodes: any[], edges: any[] } {
    const nodeIdMap = new Map<string, string>();
    const existingIds = new Set<string>();
    
    // First pass: generate new IDs for all nodes
    const regeneratedNodes = nodes.map((node: any) => {
        const oldId = node.id;
        const newId = generateUniqueId('node', existingIds);
        nodeIdMap.set(oldId, newId);
        return {
            ...node,
            id: newId
        };
    });
    
    // Second pass: update edges with new node IDs
    const regeneratedEdges = edges.map((edge: any) => {
        const newSourceId = nodeIdMap.get(edge.source) || edge.source;
        const newTargetId = nodeIdMap.get(edge.target) || edge.target;
        const newEdgeId = generateUniqueId('edge', existingIds);
        
        return {
            ...edge,
            id: newEdgeId,
            source: newSourceId,
            target: newTargetId
        };
    });
    
    return { nodes: regeneratedNodes, edges: regeneratedEdges };
}

export function validateWorkflow(nodes: Node[], edges: Edge[]): WorkflowValidationError[] {
    const errors: WorkflowValidationError[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));

    // 1. Check for Independent/Orphan Nodes (except triggers)
    nodes.forEach(node => {
        // Skip triggers (including backward compatibility for old types)
        if (['manual_trigger', 'webhook', 'webhook_trigger_response', 'schedule', 'chat_trigger', 
             'error_trigger', 'interval', 'workflow_trigger', 'http_trigger'].includes(node.data.type as string)) {
            return;
        }

        const hasIncoming = edges.some(e => e.target === node.id);
        if (!hasIncoming) {
            errors.push({
                nodeId: node.id,
                message: `Node "${node.data.label}" is disconnected (no input).`,
                severity: 'warning'
            });
        }
    });

    // 2. Validate If/Else Output
    const ifElseNodes = nodes.filter(n => n.data.type === 'if_else');
    ifElseNodes.forEach(node => {
        const outputs = edges.filter(e => e.source === node.id);
        const hasTrue = outputs.some(e => e.sourceHandle === 'true');
        const hasFalse = outputs.some(e => e.sourceHandle === 'false');

        if (!hasTrue) {
            errors.push({
                nodeId: node.id,
                message: `If/Else node "${node.data.label}" missing TRUE path.`,
                severity: 'error'
            });
        }
        if (!hasFalse) {
            errors.push({
                nodeId: node.id,
                message: `If/Else node "${node.data.label}" missing FALSE path.`,
                severity: 'warning'
            });
        }
    });

    // 3. Loop Detection (Simple Cycle Check)
    // (Optional - BFS/DFS to detect cycles if loops aren't allowed)

    return errors;
}

// Keep existing validateAndFixWorkflow for AI usage compatibility if needed, 
// or repurpose it.
// Enhanced fix function


// ... (keep existing imports)

// ...

// Enhanced fix function
export function validateAndFixWorkflow(data: any): { nodes: any[], edges: any[], explanation?: string } {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid workflow data');
    }
    let nodes = Array.isArray(data.nodes) ? data.nodes : [];
    let edges = Array.isArray(data.edges) ? data.edges : [];

    // 0. Hydrate AI Nodes (Fix 'manual_trigger' vs 'custom' mismatch)
    // The AI returns "type": "manual_trigger" but frontend needs "type": "custom", "data": { "type": "manual_trigger" }
    nodes = nodes.map((node: any) => {
        // Get the actual node type from either node.type or node.data?.type
        const nodeType = node.data?.type || node.type;
        
        // Skip form nodes - they have special handling
        if (nodeType === 'form') {
            return node;
        }
        
        // If node is already 'custom' but missing data fields, we need to fix it
        const needsNormalization = node.type === 'custom' 
            ? (!node.data?.label || !node.data?.category || !node.data?.icon)
            : node.type !== 'custom';
        
        if (needsNormalization) {
            const definition = NODE_TYPES.find((d: any) => d.type === nodeType);
            if (definition) {
                return {
                    ...node,
                    type: 'custom',
                    data: {
                        label: definition.label,
                        type: definition.type,
                        category: definition.category,
                        icon: definition.icon,
                        config: { 
                            ...definition.defaultConfig, 
                            ...(node.data?.config || node.config || {})
                        }, // Merge AI config
                        ...(node.data || {}), // Preserve any existing data fields
                        executionStatus: node.data?.executionStatus // Preserve execution status
                    }
                };
            } else {
                // If no definition found, try to preserve what we can
                console.warn(`[WORKFLOW VALIDATION] No definition found for node type: ${nodeType}`);
                return {
                    ...node,
                    type: 'custom',
                    data: {
                        label: node.data?.label || nodeType,
                        type: nodeType,
                        category: node.data?.category || 'data',
                        icon: node.data?.icon || 'Box',
                        config: node.data?.config || node.config || {},
                        ...(node.data || {})
                    }
                };
            }
        }
        return node;
    });

    // 1. Regenerate ALL IDs to ensure global uniqueness (prevents collisions from backend)
    const { nodes: regeneratedNodes, edges: regeneratedEdges } = regenerateAllIds(nodes, edges);
    nodes = regeneratedNodes.map((node: any, index: number) => ({
        ...node,
        position: node.position || { x: index * 200, y: 0 },
        data: node.data || {},
    }));
    edges = regeneratedEdges;

    // 2. Fix Orphan Nodes (Auto-wire if simple, else leave for warning)
    // For now, we won't auto-wire arbitrary orphans as it's risky.

    // 3. Fix If/Else Outputs - ensure unique IDs and proper positioning
    const existingNodeIds = new Set<string>(nodes.map((n: any) => n.id).filter(Boolean));
    const existingEdgeIdsForIfElse = new Set<string>(edges.map((e: any) => e.id).filter(Boolean));
    nodes.forEach((node: any) => {
        if (node.data.type === 'if_else') {
            const outputs = edges.filter((e: any) => e.source === node.id);
            const hasTrue = outputs.some((e: any) => e.sourceHandle === 'true');
            const hasFalse = outputs.some((e: any) => e.sourceHandle === 'false');

            // Get a safe name for the node based on its label or ID
            const nodeName = (node.data?.label || node.id || 'if_else').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

            if (!hasTrue) {
                // Create a default log node for true path with unique ID
                const trueNodeId = generateUniqueId(`log_${nodeName}_true`, existingNodeIds);
                existingNodeIds.add(trueNodeId);
                const trueNode = {
                    id: trueNodeId,
                    type: 'custom',
                    position: { 
                        x: node.position.x + 250, 
                        y: node.position.y - 120 
                    },
                    data: {
                        label: `${node.data?.label || 'If/Else'} - True Path`,
                        type: 'log',
                        category: 'output',
                        icon: 'FileText',
                        config: { message: 'True path execution' }
                    }
                };
                nodes.push(trueNode);
                
                const trueEdgeId = generateUniqueId(`edge_${node.id}_true`, existingEdgeIdsForIfElse);
                existingEdgeIdsForIfElse.add(trueEdgeId);
                edges.push({
                    id: trueEdgeId,
                    source: node.id,
                    target: trueNodeId,
                    sourceHandle: 'true',
                });
            }
            if (!hasFalse) {
                // Create a default log node for false path with unique ID
                const falseNodeId = generateUniqueId(`log_${nodeName}_false`, existingNodeIds);
                existingNodeIds.add(falseNodeId);
                const falseNode = {
                    id: falseNodeId,
                    type: 'custom',
                    position: { 
                        x: node.position.x + 250, 
                        y: node.position.y + 120 
                    },
                    data: {
                        label: `${node.data?.label || 'If/Else'} - False Path`,
                        type: 'log',
                        category: 'output',
                        icon: 'FileText',
                        config: { message: 'False path execution' }
                    }
                };
                nodes.push(falseNode);
                
                const falseEdgeId = generateUniqueId(`edge_${node.id}_false`, existingEdgeIdsForIfElse);
                existingEdgeIdsForIfElse.add(falseEdgeId);
                edges.push({
                    id: falseEdgeId,
                    source: node.id,
                    target: falseNodeId,
                    sourceHandle: 'false',
                });
            }
        }
    });

    // 4. Remove duplicate nodes (keep first occurrence)
    const seenIds = new Set<string>();
    const uniqueNodes: any[] = [];
    nodes.forEach((node: any) => {
        if (!seenIds.has(node.id)) {
            seenIds.add(node.id);
            uniqueNodes.push(node);
        }
    });
    nodes = uniqueNodes;

    // 5. Remove duplicate edges and ensure they reference valid nodes
    const nodeIds = new Set(nodes.map((n: any) => n.id));
    const seenEdgeKeys = new Set<string>();
    const existingEdgeIds = new Set<string>(edges.map((e: any) => e.id).filter(Boolean));
    const uniqueEdges: any[] = [];
    edges.forEach((edge: any) => {
        // Only keep edges that:
        // 1. Have valid source and target nodes
        // 2. Are not duplicates (by ID or by source/target/handle combination)
        const edgeKey = edge.id || `${edge.source}_${edge.target}_${edge.sourceHandle || ''}`;
        if (
            edge.source && 
            edge.target && 
            nodeIds.has(edge.source) && 
            nodeIds.has(edge.target) &&
            !seenEdgeKeys.has(edgeKey)
        ) {
            seenEdgeKeys.add(edgeKey);
            // Ensure edge has a unique ID (should already be unique from regeneration, but double-check)
            if (!edge.id || existingEdgeIds.has(edge.id)) {
                edge.id = generateUniqueId(`edge_${edge.source}_${edge.target}`, existingEdgeIds);
            } else {
                existingEdgeIds.add(edge.id);
            }
            uniqueEdges.push(edge);
        }
    });
    edges = uniqueEdges;
    
    // 6. Final validation: ensure no duplicate node IDs or edge IDs
    const finalNodeIds = new Set<string>();
    const duplicateNodeIds: string[] = [];
    nodes.forEach((node: any) => {
        if (finalNodeIds.has(node.id)) {
            duplicateNodeIds.push(node.id);
        } else {
            finalNodeIds.add(node.id);
        }
    });
    
    const finalEdgeIds = new Set<string>();
    const duplicateEdgeIds: string[] = [];
    edges.forEach((edge: any) => {
        if (finalEdgeIds.has(edge.id)) {
            duplicateEdgeIds.push(edge.id);
        } else {
            finalEdgeIds.add(edge.id);
        }
    });
    
    if (duplicateNodeIds.length > 0 || duplicateEdgeIds.length > 0) {
        console.error('[WORKFLOW VALIDATION] Duplicate IDs detected:', {
            duplicateNodeIds,
            duplicateEdgeIds
        });
        throw new Error(`Duplicate IDs detected: ${duplicateNodeIds.length} duplicate node IDs, ${duplicateEdgeIds.length} duplicate edge IDs`);
    }

    return { nodes, edges, explanation: data.explanation };
}
