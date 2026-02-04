
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

// Simple hierarchical layout algorithm for positioning nodes
function applyHierarchicalLayout(nodes: any[], edges: any[]): any[] {
    const nodeMap = new Map<string, any>();
    const children = new Map<string, string[]>();
    const levels = new Map<string, number>();
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    // Build node map and children relationships
    nodes.forEach(node => {
        nodeMap.set(node.id, node);
        children.set(node.id, []);
    });
    
    edges.forEach(edge => {
        const childList = children.get(edge.source) || [];
        childList.push(edge.target);
        children.set(edge.source, childList);
    });
    
    // Find root nodes (nodes with no incoming edges)
    const rootNodes = nodes.filter(node => {
        return !edges.some(e => e.target === node.id);
    });
    
    // Calculate levels using BFS
    const queue: string[] = [];
    rootNodes.forEach(node => {
        levels.set(node.id, 0);
        queue.push(node.id);
    });
    
    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentLevel = levels.get(currentId) || 0;
        const childList = children.get(currentId) || [];
        
        childList.forEach(childId => {
            const existingLevel = levels.get(childId);
            if (existingLevel === undefined || existingLevel < currentLevel + 1) {
                levels.set(childId, currentLevel + 1);
                queue.push(childId);
            }
        });
    }
    
    // Group nodes by level
    const nodesByLevel = new Map<number, string[]>();
    levels.forEach((level, nodeId) => {
        if (!nodesByLevel.has(level)) {
            nodesByLevel.set(level, []);
        }
        nodesByLevel.get(level)!.push(nodeId);
    });
    
    // Position nodes level by level with better spacing to prevent overlaps
    const nodeWidth = 280; // Increased to account for wider nodes (AI Agent nodes are 280px)
    const nodeHeight = 150;
    const horizontalSpacing = 350; // Increased from 300 to prevent overlaps
    const verticalSpacing = 220; // Increased from 200 to prevent overlaps
    
    let maxNodesInLevel = 0;
    nodesByLevel.forEach(nodeIds => {
        maxNodesInLevel = Math.max(maxNodesInLevel, nodeIds.length);
    });
    
    const startX = -(maxNodesInLevel * horizontalSpacing) / 2;
    
    nodesByLevel.forEach((nodeIds, level) => {
        const y = level * verticalSpacing + 100;
        const levelWidth = nodeIds.length * horizontalSpacing;
        const startXForLevel = startX + (maxNodesInLevel - nodeIds.length) * horizontalSpacing / 2;
        
        nodeIds.forEach((nodeId, index) => {
            const x = startXForLevel + index * horizontalSpacing;
            nodePositions.set(nodeId, { x, y });
        });
    });
    
    // Check for and fix any overlapping nodes
    const positionArray = Array.from(nodePositions.entries());
    for (let i = 0; i < positionArray.length; i++) {
        const [nodeId1, pos1] = positionArray[i];
        for (let j = i + 1; j < positionArray.length; j++) {
            const [nodeId2, pos2] = positionArray[j];
            const distanceX = Math.abs(pos1.x - pos2.x);
            const distanceY = Math.abs(pos1.y - pos2.y);
            
            // If nodes are too close (overlapping), adjust position
            if (distanceX < nodeWidth && distanceY < nodeHeight) {
                // Move node2 to the right
                const newX = pos1.x + nodeWidth + 50; // Extra 50px padding
                nodePositions.set(nodeId2, { x: newX, y: pos2.y });
                positionArray[j] = [nodeId2, { x: newX, y: pos2.y }];
            }
        }
    }
    
    // Apply positions to nodes - preserve existing valid positions, use layout for others
    return nodes.map(node => {
        const hasValidPosition = node.position && 
                                 typeof node.position === 'object' && 
                                 typeof node.position.x === 'number' && 
                                 typeof node.position.y === 'number';
        
        if (hasValidPosition) {
            // Preserve existing position
            return node;
        }
        
        // Use calculated layout position
        const layoutPosition = nodePositions.get(node.id);
        return {
            ...node,
            position: layoutPosition || { x: 0, y: 0 }
        };
    });
}

// Regenerate all node and edge IDs to ensure global uniqueness
function regenerateAllIds(nodes: any[], edges: any[]): { nodes: any[], edges: any[] } {
    const nodeIdMap = new Map<string, string>();
    const existingIds = new Set<string>();
    
    // First pass: generate new IDs for all nodes
    const regeneratedNodes = nodes.map((node: any) => {
        const oldId = node.id;
        if (!oldId) {
            // If node has no ID, generate one
            const newId = generateUniqueId('node', existingIds);
            return {
                ...node,
                id: newId
            };
        }
        const newId = generateUniqueId('node', existingIds);
        nodeIdMap.set(oldId, newId);
        return {
            ...node,
            id: newId
        };
    });
    
    // Second pass: update edges with new node IDs, only keep edges with valid source/target
    const regeneratedEdges = edges
        .filter((edge: any) => {
            // Only keep edges where both source and target exist in the nodeIdMap
            const hasSource = edge.source && nodeIdMap.has(edge.source);
            const hasTarget = edge.target && nodeIdMap.has(edge.target);
            return hasSource && hasTarget;
        })
        .map((edge: any) => {
            const newSourceId = nodeIdMap.get(edge.source)!;
            const newTargetId = nodeIdMap.get(edge.target)!;
            const newEdgeId = generateUniqueId('edge', existingIds);
            
            return {
                ...edge,
                id: newEdgeId,
                source: newSourceId,
                target: newTargetId,
                // Preserve handle IDs for proper connection
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
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
            // Preserve existing label if it exists (from AI generation)
            const preservedLabel = node.data?.label || node.label;
            
            if (definition) {
                return {
                    ...node,
                    type: 'custom',
                    data: {
                        label: preservedLabel || definition.label, // Use preserved label if available
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
                        label: preservedLabel || nodeType, // Preserve AI-generated label
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
    
    // Check which nodes need positioning
    const nodesNeedingPosition = regeneratedNodes.filter((node: any) => {
        const hasValidPosition = node.position && 
                                 typeof node.position === 'object' && 
                                 typeof node.position.x === 'number' && 
                                 typeof node.position.y === 'number';
        return !hasValidPosition;
    });
    
    // If any nodes need positioning and we have edges, apply hierarchical layout
    // Otherwise, use simple linear positioning
    if (nodesNeedingPosition.length > 0 && regeneratedEdges.length > 0) {
        // Apply hierarchical layout to nodes without positions
        const positionedNodes = applyHierarchicalLayout(regeneratedNodes, regeneratedEdges);
        nodes = positionedNodes.map((node: any) => ({
            ...node,
            data: node.data || {},
        }));
    } else {
        // Preserve original positions - only set default if position is truly missing
        nodes = regeneratedNodes.map((node: any, index: number) => {
            // Check if position exists and is valid (has x and y properties)
            const hasValidPosition = node.position && 
                                     typeof node.position === 'object' && 
                                     typeof node.position.x === 'number' && 
                                     typeof node.position.y === 'number';
            
            return {
                ...node,
                position: hasValidPosition ? node.position : { x: index * 250, y: 100 },
                data: node.data || {},
            };
        });
    }
    
    // Ensure edges preserve handle IDs and are properly connected
    // Add default handle IDs if missing (for regular nodes: "output" -> "input")
    edges = regeneratedEdges.map((edge: any) => {
        // Determine default handles based on node types
        const sourceNode = nodes.find((n: any) => n.id === edge.source);
        const targetNode = nodes.find((n: any) => n.id === edge.target);
        
        let defaultSourceHandle = edge.sourceHandle;
        let defaultTargetHandle = edge.targetHandle;
        
        // If sourceHandle is missing, determine based on source node type
        if (!defaultSourceHandle && sourceNode) {
            const sourceType = sourceNode.data?.type;
            if (sourceType === 'if_else') {
                // If/Else nodes need explicit true/false handles - don't set default
                defaultSourceHandle = undefined;
            } else if (sourceType === 'switch') {
                // Switch nodes need case-specific handles - don't set default
                defaultSourceHandle = undefined;
            } else {
                // Regular nodes use "output" handle
                defaultSourceHandle = 'output';
            }
        }
        
        // If targetHandle is missing, determine based on target node type
        if (!defaultTargetHandle && targetNode) {
            const targetType = targetNode.data?.type;
            if (targetType === 'ai_agent') {
                // AI Agent nodes have specific input handles - don't set default
                defaultTargetHandle = undefined;
            } else {
                // Regular nodes use "input" handle
                defaultTargetHandle = 'input';
            }
        }
        
        return {
            ...edge,
            sourceHandle: edge.sourceHandle || defaultSourceHandle,
            targetHandle: edge.targetHandle || defaultTargetHandle,
        };
    });

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
