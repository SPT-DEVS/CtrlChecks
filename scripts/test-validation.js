
// Mock the validation function locally since we can't easily import TS in JS script without setup
// Copying the logic from workflow-validation.ts manually for the test script
function validateAndFixWorkflow(workflow) {
    const fixedWorkflow = JSON.parse(JSON.stringify(workflow));

    if (!fixedWorkflow.nodes || !fixedWorkflow.edges) {
        return fixedWorkflow;
    }

    const nodes = fixedWorkflow.nodes;
    let edges = fixedWorkflow.edges;
    const existingEdgeIds = new Set(edges.map(e => e.id));
    const existingNodeIds = new Set(nodes.map(n => n.id));

    const generateId = (prefix) => {
        let i = 1;
        while (existingEdgeIds.has(`${prefix}_${i}`) || existingNodeIds.has(`${prefix}_${i}`)) {
            i++;
        }
        const id = `${prefix}_${i}`;
        existingEdgeIds.add(id);
        return id;
    };

    const ifElseNodes = nodes.filter(n => n.type === 'if_else');

    for (const node of ifElseNodes) {
        const outgoingEdges = edges.filter(e => e.source === node.id);

        // Edges connected to this node
        const trueEdges = outgoingEdges.filter(e => e.sourceHandle === 'true');
        const falseEdges = outgoingEdges.filter(e => e.sourceHandle === 'false');
        const noHandleEdges = outgoingEdges.filter(e => !e.sourceHandle);

        let finalTrueEdge = null;
        if (trueEdges.length > 0) {
            finalTrueEdge = trueEdges[0];
        } else if (noHandleEdges.length > 0) {
            finalTrueEdge = noHandleEdges.shift();
            finalTrueEdge.sourceHandle = 'true';
        }

        let finalFalseEdge = null;
        if (falseEdges.length > 0) {
            finalFalseEdge = falseEdges[0];
        } else if (noHandleEdges.length > 0) {
            finalFalseEdge = noHandleEdges.shift();
            finalFalseEdge.sourceHandle = 'false';
        }

        // Remove old edges from this node
        edges = edges.filter(e => e.source !== node.id);

        if (finalTrueEdge) {
            edges.push(finalTrueEdge);
        } else {
            const logNodeId = generateId('log_true');
            nodes.push({
                id: logNodeId,
                type: 'log_output',
                position: { x: (node.position?.x || 0) + 300, y: (node.position?.y || 0) - 100 },
                config: { message: `True path from ${node.id}`, level: 'info' }
            });
            existingNodeIds.add(logNodeId);

            edges.push({
                id: generateId('edge'),
                source: node.id,
                target: logNodeId,
                sourceHandle: 'true'
            });
        }

        if (finalFalseEdge) {
            edges.push(finalFalseEdge);
        } else {
            const logNodeId = generateId('log_false');
            nodes.push({
                id: logNodeId,
                type: 'log_output',
                position: { x: (node.position?.x || 0) + 300, y: (node.position?.y || 0) + 100 },
                config: { message: `False path from ${node.id}`, level: 'info' }
            });
            existingNodeIds.add(logNodeId);

            edges.push({
                id: generateId('edge'),
                source: node.id,
                target: logNodeId,
                sourceHandle: 'false'
            });
        }
    }

    // FIX 2: Check for ambiguous targets (same node connected to both TRUE and FALSE)
    // Re-fetch our two new edges for each node (after the loop above updated 'edges')
    for (const node of ifElseNodes) {
        const currentTrue = edges.find(e => e.source === node.id && e.sourceHandle === 'true');
        const currentFalse = edges.find(e => e.source === node.id && e.sourceHandle === 'false');

        if (currentTrue && currentFalse && currentTrue.target === currentFalse.target) {
            console.log(`Fixing ambiguous target for node ${node.id}`);
            // DETACH FALSE path and create a new log node
            const logNodeId = generateId('log_false_fix');
            nodes.push({
                id: logNodeId,
                type: 'log_output',
                position: {
                    x: (node.position?.x || 0) + 300,
                    y: (node.position?.y || 0) + 150
                },
                config: { message: `False path from ${node.id} (detached from shared target)`, level: 'info' }
            });
            existingNodeIds.add(logNodeId);

            // Update false edge target
            currentFalse.target = logNodeId;
        }
    }

    fixedWorkflow.nodes = nodes;
    fixedWorkflow.edges = edges;
    return fixedWorkflow;
}

// Test Case 1: IF node with no edges -> Should create default TRUE and FALSE nodes
const test1 = {
    nodes: [
        { id: 'if_1', type: 'if_else', position: { x: 0, y: 0 } }
    ],
    edges: []
};

console.log("--- Test Case 1: No edges ---");
const result1 = validateAndFixWorkflow(test1);
console.log("Nodes:", result1.nodes.length, "(Expected 3: if_1 + 2 logs)");
console.log("Edges:", result1.edges.length, "(Expected 2: true edge + false edge)");
console.log("Edge handles:", result1.edges.map(e => e.sourceHandle));


// Test Case 2: IF node with 1 edge (no handle) -> Should assign to TRUE, create FALSE
const test2 = {
    nodes: [
        { id: 'if_1', type: 'if_else', position: { x: 0, y: 0 } },
        { id: 'next_1', type: 'log_output' }
    ],
    edges: [
        { id: 'e1', source: 'if_1', target: 'next_1' } // No handle
    ]
};

console.log("\n--- Test Case 2: 1 edge (no handle) ---");
const result2 = validateAndFixWorkflow(test2);
console.log("Nodes:", result2.nodes.length, "(Expected 3: if_1, next_1, + 1 log)");
console.log("Edges:", result2.edges.length, "(Expected 2)");
const trueEdge = result2.edges.find(e => e.sourceHandle === 'true');
console.log("True edge target:", trueEdge.target, "(Expected next_1)");


// Test Case 3: Ambiguous target (same node for TRUE and FALSE)
const test3 = {
    nodes: [
        { id: 'if_1', type: 'if_else', position: { x: 0, y: 0 } },
        { id: 'shared_node', type: 'log_output' }
    ],
    edges: [
        { id: 'e1', source: 'if_1', target: 'shared_node', sourceHandle: 'true' },
        { id: 'e2', source: 'if_1', target: 'shared_node', sourceHandle: 'false' }
    ]
};

console.log("\n--- Test Case 3: Ambiguous target ---");
const result3 = validateAndFixWorkflow(test3);
console.log("Nodes:", result3.nodes.length, "(Expected 3: if_1, shared_node, + 1 log fix)");
console.log("Edges:", result3.edges.length, "(Expected 2)");
const e1 = result3.edges.find(e => e.sourceHandle === 'true');
const e2 = result3.edges.find(e => e.sourceHandle === 'false');
console.log("True target:", e1.target);
console.log("False target:", e2.target);
console.log("Are targets different?", e1.target !== e2.target);
