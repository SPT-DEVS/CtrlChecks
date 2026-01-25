
import { Node, Edge } from '@xyflow/react';
import { NODE_TYPES } from '@/components/workflow/nodeTypes';

export interface WorkflowValidationError {
    nodeId?: string;
    message: string;
    severity: 'error' | 'warning';
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

    // 1. Ensure IDs
    nodes = nodes.map((node: any, index: number) => ({
        ...node,
        id: node.id || `node_${index}_${Date.now()}`,
        position: node.position || { x: index * 200, y: 0 },
        data: node.data || {},
    }));

    // 2. Fix Orphan Nodes (Auto-wire if simple, else leave for warning)
    // For now, we won't auto-wire arbitrary orphans as it's risky.

    // 3. Fix If/Else Outputs
    nodes.forEach((node: any) => {
        if (node.data.type === 'if_else') {
            const outputs = edges.filter((e: any) => e.source === node.id);
            const hasTrue = outputs.some((e: any) => e.sourceHandle === 'true');
            const hasFalse = outputs.some((e: any) => e.sourceHandle === 'false');

            if (!hasTrue) {
                // Create a default log node for true path
                const trueNodeId = `log_true_${Date.now()}`;
                const trueNode = {
                    id: trueNodeId,
                    type: 'custom',
                    position: { x: node.position.x + 200, y: node.position.y - 100 },
                    data: {
                        label: 'Log (True)',
                        type: 'log',
                        category: 'output',
                        icon: 'FileText',
                        config: { message: 'True path execution' }
                    }
                };
                nodes.push(trueNode);
                edges.push({
                    id: `edge_${node.id}_true`,
                    source: node.id,
                    target: trueNodeId,
                    sourceHandle: 'true',
                });
            }
            if (!hasFalse) {
                // Create a default log node for false path
                const falseNodeId = `log_false_${Date.now()}`;
                const falseNode = {
                    id: falseNodeId,
                    type: 'custom',
                    position: { x: node.position.x + 200, y: node.position.y + 100 },
                    data: {
                        label: 'Log (False)',
                        type: 'log',
                        category: 'output',
                        icon: 'FileText',
                        config: { message: 'False path execution' }
                    }
                };
                nodes.push(falseNode);
                edges.push({
                    id: `edge_${node.id}_false`,
                    source: node.id,
                    target: falseNodeId,
                    sourceHandle: 'false',
                });
            }
        }
    });

    const nodeIds = new Set(nodes.map((n: any) => n.id));
    edges = edges.filter((edge: any) =>
        edge.source && edge.target && nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    return { nodes, edges, explanation: data.explanation };
}
