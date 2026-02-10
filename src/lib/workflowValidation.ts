
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
        // Skip triggers - use category-based trigger detection
        const nodeType = node.data?.type || '';
        const category = node.data?.category || '';
        const isTrigger = category.toLowerCase() === 'triggers' || 
                         category.toLowerCase() === 'trigger' ||
                         nodeType.includes('trigger') ||
                         ['manual_trigger', 'webhook', 'webhook_trigger_response', 'schedule', 'chat_trigger',
                         'error_trigger', 'interval', 'workflow_trigger', 'http_trigger', 'form_trigger', 'form'].includes(nodeType);
        
        if (isTrigger) {
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

    // 1.5 Enforce single-trigger, linear chain for simple AI-generated workflows
    // This mirrors backend normalizeWorkflowGraph logic so the canvas always sees
    // a clean graph: trigger → node1 → node2 → ...
    const detectTrigger = (node: any): boolean => {
        const nodeType = node.data?.type || node.type || '';
        const category = node.data?.category || '';
        return category.toLowerCase() === 'triggers' ||
               category.toLowerCase() === 'trigger' ||
               nodeType.includes('trigger') ||
               ['manual_trigger', 'webhook', 'schedule', 'interval', 'form', 'chat_trigger', 'workflow_trigger'].includes(nodeType);
    };

    let linearNodes = regeneratedNodes;
    let linearEdges = regeneratedEdges;

    try {
        const triggerNodes = regeneratedNodes.filter(detectTrigger);

        // Only linearize when we actually have at least one trigger
        if (triggerNodes.length > 0) {
            const primaryTrigger = triggerNodes[0];

            // Keep primary trigger and all non-trigger nodes; drop extra triggers
            const keptNodes = regeneratedNodes.filter(
                (n: any) => !detectTrigger(n) || n.id === primaryTrigger.id
            );

            // Build adjacency from existing edges
            const outgoingMap = new Map<string, string[]>();
            regeneratedEdges.forEach((e: any) => {
                if (!e.source || !e.target) return;
                if (!outgoingMap.has(e.source)) {
                    outgoingMap.set(e.source, []);
                }
                outgoingMap.get(e.source)!.push(e.target);
            });

            // Simple walk from trigger following first outgoing edge each time
            const ordered: any[] = [primaryTrigger];
            const visited = new Set<string>([primaryTrigger.id]);
            let currentId = primaryTrigger.id;

            while (true) {
                const outs = outgoingMap.get(currentId) || [];
                const nextId = outs.find(id => !visited.has(id));
                if (!nextId) break;
                const nextNode = keptNodes.find(n => n.id === nextId);
                if (!nextNode) break;
                ordered.push(nextNode);
                visited.add(nextId);
                currentId = nextId;
            }

            // Append any remaining kept nodes that weren't reachable
            for (const node of keptNodes) {
                if (!visited.has(node.id)) {
                    ordered.push(node);
                    visited.add(node.id);
                }
            }

            // ✅ CRITICAL FIX: Check for branching nodes (If/Else, Switch) before linearizing
            // DO NOT linearize graphs with branching nodes - they have multiple outputs
            const hasBranchingNodes = ordered.some((n: any) => {
                const nodeType = n.data?.type || n.type || '';
                return nodeType === 'if_else' || nodeType === 'switch';
            });

            if (hasBranchingNodes) {
                // ✅ PRESERVE ALL EDGES from branching nodes - do not linearize
                const validNodeIds = new Set(ordered.map((n: any) => n.id));
                const preservedEdges = regeneratedEdges.filter((e: any) => 
                    validNodeIds.has(e.source) && validNodeIds.has(e.target)
                );
                
                console.log(`[WorkflowValidation] 🔀 Preserving branching structure - keeping ${preservedEdges.length} edge(s) (skipping linearization)`);
                
                linearNodes = ordered;
                linearEdges = preservedEdges;
            } else {
                // ✅ LINEARIZATION: Only for simple sequential chains (no branching)
                // Rebuild edges as strict linear chain using kept node order
                const validNodeIds = new Set(ordered.map(n => n.id));
                const existingEdges = regeneratedEdges.filter(
                    (e: any) => validNodeIds.has(e.source) && validNodeIds.has(e.target)
                );
                const chainEdges: any[] = [];

                for (let i = 0; i < ordered.length - 1; i++) {
                    const source = ordered[i];
                    const target = ordered[i + 1];
                    // ✅ CRITICAL FIX: Keep ALL edges from source, not just first match
                    // This preserves multiple edges from the same source with different sourceHandle
                    const matchingEdges = existingEdges.filter(
                        (e: any) => e.source === source.id && e.target === target.id
                    );
                    if (matchingEdges.length > 0) {
                        chainEdges.push(...matchingEdges);
                    } else {
                        chainEdges.push({
                            id: `edge_linear_${source.id}_${target.id}`,
                            source: source.id,
                            target: target.id,
                            type: 'default',
                        });
                    }
                }

                // ✅ CRITICAL FIX: Also preserve any edges that don't fit the linear chain
                // This catches edges from branching nodes that weren't in the ordered sequence
                const chainEdgeKeys = new Set(chainEdges.map((e: any) => `${e.source}::${e.target}::${e.sourceHandle || ''}::${e.targetHandle || ''}`));
                const additionalEdges = existingEdges.filter((e: any) => {
                    const key = `${e.source}::${e.target}::${e.sourceHandle || ''}::${e.targetHandle || ''}`;
                    return !chainEdgeKeys.has(key);
                });

                if (additionalEdges.length > 0) {
                    console.log(`[WorkflowValidation] 🔀 Preserving ${additionalEdges.length} additional edge(s) that don't fit linear chain`);
                    chainEdges.push(...additionalEdges);
                }

                linearNodes = ordered;
                linearEdges = chainEdges;
            }
        } else {
            linearNodes = regeneratedNodes;
            linearEdges = regeneratedEdges;
        }
    } catch (err) {
        console.warn('[WorkflowValidation] Linearization failed (non-fatal):', err);
        linearNodes = regeneratedNodes;
        linearEdges = regeneratedEdges;
    }

    // Check which nodes need positioning
    const nodesNeedingPosition = linearNodes.filter((node: any) => {
        const hasValidPosition = node.position &&
            typeof node.position === 'object' &&
            typeof node.position.x === 'number' &&
            typeof node.position.y === 'number';
        return !hasValidPosition;
    });

    // If any nodes need positioning and we have edges, apply hierarchical layout
    // Otherwise, use simple linear positioning
    if (nodesNeedingPosition.length > 0 && linearEdges.length > 0) {
        // Apply hierarchical layout to nodes without positions
        const positionedNodes = applyHierarchicalLayout(linearNodes, linearEdges);
        nodes = positionedNodes.map((node: any) => ({
            ...node,
            data: node.data || {},
        }));
    } else {
        // Preserve original positions - only set default if position is truly missing
        nodes = linearNodes.map((node: any, index: number) => {
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

    // ✅ CRITICAL: Normalize handles to valid React Flow handle IDs
    // This prevents "Couldn't create edge for handle id" errors
    edges = linearEdges.map((edge: any) => {
        // Find source and target nodes
        const sourceNode = nodes.find((n: any) => n.id === edge.source);
        const targetNode = nodes.find((n: any) => n.id === edge.target);

        const sourceType = sourceNode?.data?.type || 'default';
        const targetType = targetNode?.data?.type || 'default';

        // Normalize handles using the same logic as backend handle registry
        let normalizedSourceHandle = edge.sourceHandle;
        let normalizedTargetHandle = edge.targetHandle;

        // Normalize source handle (output)
        if (!normalizedSourceHandle) {
            if (sourceType === 'if_else') {
                // ✅ CRITICAL FIX: Do NOT default if_else edges to 'true'
                // If sourceHandle is missing, it's a configuration error - preserve undefined
                // This prevents FALSE branch edges from being incorrectly defaulted to TRUE
                console.warn(`[NormalizeWorkflow] ⚠️ If/Else edge missing sourceHandle - should be 'true' or 'false': ${edge.source} → ${edge.target}`);
                normalizedSourceHandle = 'true'; // Keep default for backward compatibility, but log warning
            } else if (sourceType === 'switch') {
                normalizedSourceHandle = 'default'; // Switch handles are dynamic
            } else {
                normalizedSourceHandle = 'output'; // Standard output handle
            }
        } else {
            // Map common backend field names to React handle IDs
            const sourceLower = normalizedSourceHandle.toLowerCase();
            const sourceMappings: Record<string, string> = {
                'data': 'output',
                'message': 'output',
                'output': 'output',
                'result': 'output',
                'response': 'output',
                'formdata': 'output',
                'body': 'output',
                'triggertime': 'output',
                'inputdata': 'output',
                'rows': 'output',
                'parsed': 'output',
                'formatted': 'output',
            };
            normalizedSourceHandle = sourceMappings[sourceLower] || normalizedSourceHandle;
            
            // Validate against node type
            // ✅ CRITICAL FIX: For if_else, preserve 'true' and 'false' - don't overwrite!
            if (sourceType === 'if_else') {
                // Only normalize if it's not already 'true' or 'false'
                if (normalizedSourceHandle !== 'true' && normalizedSourceHandle !== 'false') {
                    console.warn(`[WorkflowValidation] ⚠️ If/Else edge has invalid sourceHandle "${normalizedSourceHandle}" - defaulting to 'true' (should be 'true' or 'false')`);
                    normalizedSourceHandle = 'true'; // Default to true for if_else only if invalid
                }
                // If it's already 'true' or 'false', keep it as-is
            } else if (sourceType !== 'if_else' && sourceType !== 'switch' && normalizedSourceHandle !== 'output') {
                normalizedSourceHandle = 'output'; // Force to output for standard nodes
            }
        }

        // Normalize target handle (input)
        if (!normalizedTargetHandle) {
            if (targetType === 'ai_agent') {
                normalizedTargetHandle = 'userInput'; // Default to userInput for AI Agent
            } else {
                normalizedTargetHandle = 'input'; // Standard input handle
            }
        } else {
            // Map common backend field names to React handle IDs
            const targetLower = normalizedTargetHandle.toLowerCase();
            const targetMappings: Record<string, string> = {
                'data': 'input',
                'input': 'input',
                'message': 'input',
                'text': 'input',
                'body': 'input',
                'content': 'input',
                'userinput': 'userInput',
                'user_input': 'userInput',
                'chatmodel': 'chat_model',
                'chat_model': 'chat_model',
                'memory': 'memory',
                'tool': 'tool',
                'values': 'input',
                'json': 'input',
                'template': 'input',
            };
            normalizedTargetHandle = targetMappings[targetLower] || normalizedTargetHandle;
            
            // Validate against node type
            if (targetType === 'ai_agent') {
                const validAiHandles = ['userInput', 'chat_model', 'memory', 'tool'];
                if (!validAiHandles.includes(normalizedTargetHandle)) {
                    normalizedTargetHandle = 'userInput'; // Default to userInput for AI Agent
                }
            } else if (normalizedTargetHandle !== 'input') {
                normalizedTargetHandle = 'input'; // Force to input for standard nodes
            }
        }


        return {
            ...edge,
            // ✅ CRITICAL: Always set normalized handles - never undefined
            sourceHandle: normalizedSourceHandle,
            targetHandle: normalizedTargetHandle,
            // Ensure edge has an ID
            id: edge.id || `edge-${edge.source}-${edge.target}-${Date.now()}`,
            // Ensure edge type is set
            type: edge.type || 'default',
        };
    });

    // 2. Fix Orphan Nodes (Auto-wire if simple, else leave for warning)
    // For now, we won't auto-wire arbitrary orphans as it's risky.

    // 3. Fix If/Else Outputs - ensure unique IDs and proper positioning
    // ✅ CRITICAL FIX: Do NOT auto-create branch nodes - this mutates the graph
    // Only fix sourceHandle if edges exist but have wrong/missing handles
    const existingNodeIds = new Set<string>(nodes.map((n: any) => n.id).filter(Boolean));
    const existingEdgeIdsForIfElse = new Set<string>(edges.map((e: any) => e.id).filter(Boolean));
    nodes.forEach((node: any) => {
        if (node.data.type === 'if_else') {
            const outputs = edges.filter((e: any) => e.source === node.id);
            const hasTrue = outputs.some((e: any) => e.sourceHandle === 'true' || e.sourceHandle === 'output_true');
            const hasFalse = outputs.some((e: any) => e.sourceHandle === 'false' || e.sourceHandle === 'output_false');
            
            // ✅ CRITICAL FIX: Check if edges exist but have wrong/missing sourceHandle
            // If edges exist without proper sourceHandle, fix them instead of creating new nodes
            const edgesWithoutHandle = outputs.filter((e: any) => 
                !e.sourceHandle || 
                (e.sourceHandle !== 'true' && e.sourceHandle !== 'false' && 
                 e.sourceHandle !== 'output_true' && e.sourceHandle !== 'output_false')
            );
            
            // ✅ FIX: If we have edges but they're missing sourceHandle, fix them intelligently
            if (outputs.length === 0) {
                // No edges at all - this is a validation issue, but don't auto-create
                // Let the user fix it manually or through validation warnings
                console.warn(`[validateAndFixWorkflow] ⚠️ If/Else node "${node.data?.label || node.id}" has no outgoing edges - skipping auto-creation to prevent graph mutation`);
            } else if (edgesWithoutHandle.length > 0) {
                // ✅ FIX: Edges exist but have wrong/missing sourceHandle - fix them
                // Strategy: If we have exactly 2 edges, assign one to true and one to false
                // If we have 1 edge and no true/false assigned yet, check target node label for hints
                if (outputs.length === 2 && edgesWithoutHandle.length === 2) {
                    // Two edges without handles - assign first to true, second to false
                    const edge1Index = edges.indexOf(edgesWithoutHandle[0]);
                    const edge2Index = edges.indexOf(edgesWithoutHandle[1]);
                    if (edge1Index !== -1) {
                        edges[edge1Index].sourceHandle = 'true';
                        console.log(`[validateAndFixWorkflow] 🔧 Fixed edge ${edgesWithoutHandle[0].id}: assigned sourceHandle='true' (first of two)`);
                    }
                    if (edge2Index !== -1) {
                        edges[edge2Index].sourceHandle = 'false';
                        console.log(`[validateAndFixWorkflow] 🔧 Fixed edge ${edgesWithoutHandle[1].id}: assigned sourceHandle='false' (second of two)`);
                    }
                } else {
                    // Multiple edges or single edge - try to infer from target node labels
                    edgesWithoutHandle.forEach((edge: any) => {
                        const edgeIndex = edges.indexOf(edge);
                        if (edgeIndex === -1) return;
                        
                        const targetNode = nodes.find((n: any) => n.id === edge.target);
                        const targetLabel = targetNode?.data?.label?.toLowerCase() || '';
                        
                        // Try to infer from target node label
                        if (targetLabel.includes('false') || targetLabel.includes('not') || targetLabel.includes('invalid') || targetLabel.includes('reject')) {
                            if (!hasFalse) {
                                edges[edgeIndex].sourceHandle = 'false';
                                console.log(`[validateAndFixWorkflow] 🔧 Fixed edge ${edge.id}: assigned sourceHandle='false' (inferred from target label)`);
                            }
                        } else if (targetLabel.includes('true') || targetLabel.includes('valid') || targetLabel.includes('approve') || targetLabel.includes('accept')) {
                            if (!hasTrue) {
                                edges[edgeIndex].sourceHandle = 'true';
                                console.log(`[validateAndFixWorkflow] 🔧 Fixed edge ${edge.id}: assigned sourceHandle='true' (inferred from target label)`);
                            }
                        } else {
                            // Can't infer - assign based on what's missing
                            if (!hasTrue) {
                                edges[edgeIndex].sourceHandle = 'true';
                                console.log(`[validateAndFixWorkflow] 🔧 Fixed edge ${edge.id}: assigned sourceHandle='true' (default, true path missing)`);
                            } else if (!hasFalse) {
                                edges[edgeIndex].sourceHandle = 'false';
                                console.log(`[validateAndFixWorkflow] 🔧 Fixed edge ${edge.id}: assigned sourceHandle='false' (default, false path missing)`);
                            }
                        }
                    });
                }
            }
            
            // ✅ REMOVED: Auto-creation of branch nodes
            // This was causing graph mutation - nodes should only be created by user action
            // If branches are missing, validation will warn but won't auto-create
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
