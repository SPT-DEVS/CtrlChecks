/**
 * Comprehensive Workflow Validation System
 * 
 * Performs end-to-end error-free validation on workflows with special attention to:
 * - Data flow
 * - Node configuration
 * - Error handling
 * - Security
 * - Performance
 */

import { Node, Edge } from '@xyflow/react';
import { NODE_TYPES, NodeTypeDefinition } from '@/components/workflow/nodeTypes';
import { WorkflowNode } from '@/stores/workflowStore';

export interface ValidationIssue {
  nodeId?: string;
  nodeLabel?: string;
  nodeType?: string;
  category: 'configuration' | 'data_flow' | 'error_handling' | 'security' | 'performance' | 'specific_node';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  fix?: string;
  location?: string;
}

export interface ValidationResult {
  summary: {
    status: 'PASS' | 'WARNING' | 'FAIL';
    totalIssues: number;
    criticalIssues: number;
    warnings: number;
    recommendations: number;
  };
  issues: ValidationIssue[];
  matrix: {
    configuration: { status: 'PASS' | 'WARNING' | 'FAIL'; issues: number; details: string };
    dataFlow: { status: 'PASS' | 'WARNING' | 'FAIL'; issues: number; details: string };
    errorHandling: { status: 'PASS' | 'WARNING' | 'FAIL'; issues: number; details: string };
    security: { status: 'PASS' | 'WARNING' | 'FAIL'; issues: number; details: string };
    performance: { status: 'PASS' | 'WARNING' | 'FAIL'; issues: number; details: string };
    specificNodes: { status: 'PASS' | 'WARNING' | 'FAIL'; issues: number; details: string };
  };
  recommendations: string[];
  score: {
    configuration: number;
    dataIntegrity: number;
    errorResilience: number;
    security: number;
    performance: number;
    overall: number;
  };
  testCases: Array<{ name: string; recommended: boolean }>;
}

const TRIGGER_NODE_TYPES = [
  'manual_trigger', 'webhook', 'webhook_trigger_response', 'schedule', 
  'chat_trigger', 'error_trigger', 'interval', 'workflow_trigger', 'http_trigger'
];

/**
 * Comprehensive workflow validation
 */
export function validateWorkflowComprehensive(
  nodes: Node[],
  edges: Edge[],
  workflowName?: string
): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Get node definitions map
  const nodeDefinitions = new Map<string, NodeTypeDefinition>();
  NODE_TYPES.forEach(def => {
    nodeDefinitions.set(def.type, def);
  });

  // 1. CONFIGURATION VALIDATION
  issues.push(...validateConfiguration(nodes, nodeDefinitions, edges));

  // 2. DATA FLOW ANALYSIS
  issues.push(...validateDataFlow(nodes, edges));

  // 3. ERROR HANDLING CHECK
  issues.push(...validateErrorHandling(nodes, edges));

  // 4. SECURITY AUDIT
  issues.push(...validateSecurity(nodes));

  // 5. PERFORMANCE OPTIMIZATION
  issues.push(...validatePerformance(nodes, edges));

  // 6. SPECIFIC NODE CHECKS
  issues.push(...validateSpecificNodes(nodes, edges, nodeDefinitions));

  // Calculate scores and generate summary
  const summary = generateSummary(issues);
  const matrix = generateValidationMatrix(issues);
  const recommendations = generateRecommendations(issues);
  const score = calculateScores(issues);
  const testCases = generateTestCases(issues, nodes);

  return {
    summary,
    issues,
    matrix,
    recommendations,
    score,
    testCases,
  };
}

/**
 * 1. CONFIGURATION VALIDATION
 */
function validateConfiguration(
  nodes: Node[],
  nodeDefinitions: Map<string, NodeTypeDefinition>,
  edges: Edge[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  nodes.forEach(node => {
    const nodeData = node.data as WorkflowNode['data'];
    const nodeType = nodeData.type;
    const definition = nodeDefinitions.get(nodeType);

    if (!definition) {
      issues.push({
        nodeId: node.id,
        nodeLabel: nodeData.label,
        nodeType,
        category: 'configuration',
        severity: 'warning',
        message: `Unknown node type "${nodeType}". Node may not function correctly.`,
        fix: 'Verify node type is correct or node definition exists.',
      });
      return;
    }

    // Check required fields
    definition.configFields.forEach(field => {
      if (field.required) {
        const value = nodeData.config?.[field.key];
        if (value === undefined || value === null || value === '') {
          issues.push({
            nodeId: node.id,
            nodeLabel: nodeData.label,
            nodeType,
            category: 'configuration',
            severity: 'critical',
            message: `Required field "${field.label}" is missing or empty.`,
            fix: `Configure the "${field.label}" field in node settings.`,
            location: `Node: ${node.id}, Field: ${field.key}`,
          });
        }
      }
    });

    // Validate data types
    definition.configFields.forEach(field => {
      const value = nodeData.config?.[field.key];
      if (value !== undefined && value !== null && value !== '') {
        if (field.type === 'number' && typeof value !== 'number') {
          issues.push({
            nodeId: node.id,
            nodeLabel: nodeData.label,
            nodeType,
            category: 'configuration',
            severity: 'critical',
            message: `Field "${field.label}" must be a number, but got ${typeof value}.`,
            fix: `Ensure "${field.label}" is a numeric value.`,
          });
        } else if (field.type === 'boolean' && typeof value !== 'boolean') {
          issues.push({
            nodeId: node.id,
            nodeLabel: nodeData.label,
            nodeType,
            category: 'configuration',
            severity: 'critical',
            message: `Field "${field.label}" must be a boolean, but got ${typeof value}.`,
            fix: `Ensure "${field.label}" is true or false.`,
          });
        }
      }
    });

    // Check for hardcoded credentials in config
    const configStr = JSON.stringify(nodeData.config || {});
    if (configStr.match(/(password|secret|token|key|apikey)\s*[:=]\s*["']([^"']{8,})["']/i)) {
      issues.push({
        nodeId: node.id,
        nodeLabel: nodeData.label,
        nodeType,
        category: 'security',
        severity: 'critical',
        message: 'Potential hardcoded credentials detected in node configuration.',
        fix: 'Use environment variables or secure credential storage instead of hardcoding.',
      });
    }
  });

  // Check for circular dependencies
  const cycles = detectCycles(nodes, edges);
  if (cycles.length > 0) {
    issues.push({
      category: 'configuration',
      severity: 'critical',
      message: `Circular dependencies detected: ${cycles.join(', ')}`,
      fix: 'Remove circular connections between nodes.',
    });
  }

  return issues;
}

/**
 * 2. DATA FLOW ANALYSIS
 */
function validateDataFlow(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for orphan nodes (except triggers)
  nodes.forEach(node => {
    const nodeType = (node.data as WorkflowNode['data']).type;
    if (TRIGGER_NODE_TYPES.includes(nodeType)) {
      return; // Triggers don't need inputs
    }

    const hasIncoming = edges.some(e => e.target === node.id);
    if (!hasIncoming) {
      issues.push({
        nodeId: node.id,
        nodeLabel: (node.data as WorkflowNode['data']).label,
        nodeType,
        category: 'data_flow',
        severity: 'warning',
        message: `Node "${(node.data as WorkflowNode['data']).label}" has no input connections.`,
        fix: 'Connect this node to a trigger or previous node.',
      });
    }
  });

  // Check for nodes with no outputs (dead ends)
  const nodesWithOutputs = new Set(edges.map(e => e.source));
  nodes.forEach(node => {
    if (!nodesWithOutputs.has(node.id) && !TRIGGER_NODE_TYPES.includes((node.data as WorkflowNode['data']).type)) {
      issues.push({
        nodeId: node.id,
        nodeLabel: (node.data as WorkflowNode['data']).label,
        category: 'data_flow',
        severity: 'info',
        message: `Node "${(node.data as WorkflowNode['data']).label}" has no output connections.`,
        fix: 'Consider if this node should connect to other nodes or is intentionally a terminal node.',
      });
    }
  });

  // Validate If/Else node outputs
  nodes.forEach(node => {
    const nodeType = (node.data as WorkflowNode['data']).type;
    if (nodeType === 'if_else') {
      const outputs = edges.filter(e => e.source === node.id);
      const hasTrue = outputs.some(e => e.sourceHandle === 'true');
      const hasFalse = outputs.some(e => e.sourceHandle === 'false');

      if (!hasTrue) {
        issues.push({
          nodeId: node.id,
          nodeLabel: (node.data as WorkflowNode['data']).label,
          category: 'data_flow',
          severity: 'critical',
          message: 'If/Else node is missing TRUE output path.',
          fix: 'Connect the TRUE output handle to a target node.',
        });
      }
      if (!hasFalse) {
        issues.push({
          nodeId: node.id,
          nodeLabel: (node.data as WorkflowNode['data']).label,
          category: 'data_flow',
          severity: 'warning',
          message: 'If/Else node is missing FALSE output path.',
          fix: 'Connect the FALSE output handle to handle the false case.',
        });
      }
    }
  });

  return issues;
}

/**
 * 3. ERROR HANDLING CHECK
 */
function validateErrorHandling(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for error handlers
  const hasErrorHandler = nodes.some(n => (n.data as WorkflowNode['data']).type === 'error_handler');
  const hasErrorTrigger = nodes.some(n => (n.data as WorkflowNode['data']).type === 'error_trigger');
  
  // Check for critical nodes that might fail
  const criticalNodeTypes = ['http_request', 'database_write', 'database_read', 'openai', 'anthropic'];
  const hasCriticalNodes = nodes.some(n => 
    criticalNodeTypes.includes((n.data as WorkflowNode['data']).type)
  );

  if (hasCriticalNodes && !hasErrorHandler && !hasErrorTrigger) {
    issues.push({
      category: 'error_handling',
      severity: 'warning',
      message: 'Workflow contains critical nodes but no error handling mechanism.',
      fix: 'Add an Error Handler or Error Trigger node to handle failures gracefully.',
    });
  }

  // Check for retry configuration on HTTP/API nodes
  nodes.forEach(node => {
    const nodeType = (node.data as WorkflowNode['data']).type;
    if (nodeType === 'http_request') {
      const config = (node.data as WorkflowNode['data']).config || {};
      if (!config.retries && !hasErrorHandler) {
        issues.push({
          nodeId: node.id,
          nodeLabel: (node.data as WorkflowNode['data']).label,
          category: 'error_handling',
          severity: 'info',
          message: 'HTTP Request node has no retry configuration.',
          fix: 'Consider adding retry logic or error handling for network failures.',
        });
      }
    }
  });

  return issues;
}

/**
 * 4. SECURITY AUDIT
 */
function validateSecurity(nodes: Node[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  nodes.forEach(node => {
    const nodeData = node.data as WorkflowNode['data'];
    const config = nodeData.config || {};
    
    // Check for exposed sensitive data in node labels/descriptions
    const label = nodeData.label || '';
    if (label.match(/(password|secret|token|key)\s*[:=]\s*["']([^"']+)["']/i)) {
      issues.push({
        nodeId: node.id,
        nodeLabel: label,
        category: 'security',
        severity: 'critical',
        message: 'Sensitive data may be exposed in node label.',
        fix: 'Remove sensitive information from node labels.',
      });
    }

    // Check for SQL injection risks
    if (nodeData.type === 'database_write' || nodeData.type === 'database_read') {
      const query = config.query || config.data || '';
      if (typeof query === 'string' && query.includes('${') && !query.includes('?$')) {
        issues.push({
          nodeId: node.id,
          nodeLabel: label,
          category: 'security',
          severity: 'warning',
          message: 'Potential SQL injection risk: raw string interpolation detected.',
          fix: 'Use parameterized queries or template variables instead of direct interpolation.',
        });
      }
    }
  });

  return issues;
}

/**
 * 5. PERFORMANCE OPTIMIZATION
 */
function validatePerformance(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for large batch operations without pagination
  nodes.forEach(node => {
    const nodeType = (node.data as WorkflowNode['data']).type;
    if (nodeType === 'database_read') {
      const config = (node.data as WorkflowNode['data']).config || {};
      const limit = config.limit || config.maxRecords;
      const limitNum = typeof limit === 'number' ? limit : (typeof limit === 'string' ? parseInt(limit, 10) : 0);
      if (!limitNum || limitNum > 1000) {
        issues.push({
          nodeId: node.id,
          nodeLabel: (node.data as WorkflowNode['data']).label,
          category: 'performance',
          severity: 'warning',
          message: 'Database read operation may return large datasets without pagination.',
          fix: 'Add pagination or limit the number of records returned.',
        });
      }
    }
  });

  // Check for unnecessary transformations
  const transformationChains = detectLongTransformationChains(nodes, edges);
  if (transformationChains.length > 0) {
    transformationChains.forEach(chain => {
      issues.push({
        category: 'performance',
        severity: 'info',
        message: `Long transformation chain detected (${chain.length} nodes). Consider consolidating.`,
        fix: 'Combine multiple transformations into fewer nodes where possible.',
      });
    });
  }

  return issues;
}

/**
 * 6. SPECIFIC NODE CHECKS
 */
function validateSpecificNodes(
  nodes: Node[],
  edges: Edge[],
  nodeDefinitions: Map<string, NodeTypeDefinition>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  nodes.forEach(node => {
    const nodeData = node.data as WorkflowNode['data'];
    const nodeType = nodeData.type;
    const config = nodeData.config || {};

    // Schedule trigger validation
    if (nodeType === 'schedule') {
      const time = config.time as string;
      const cronExpression = config.cron as string;
      
      if (!time && !cronExpression) {
        issues.push({
          nodeId: node.id,
          nodeLabel: nodeData.label,
          category: 'specific_node',
          severity: 'critical',
          message: 'Schedule trigger is missing time or cron expression.',
          fix: 'Configure either a time (HH:MM) or cron expression.',
        });
      }
    }

    // HTTP Request validation
    if (nodeType === 'http_request') {
      const url = config.url as string;
      if (!url || url.trim() === '') {
        issues.push({
          nodeId: node.id,
          nodeLabel: nodeData.label,
          category: 'specific_node',
          severity: 'critical',
          message: 'HTTP Request node is missing URL.',
          fix: 'Configure the URL field with a valid endpoint.',
        });
      } else if (!url.match(/^https?:\/\//)) {
        issues.push({
          nodeId: node.id,
          nodeLabel: nodeData.label,
          category: 'specific_node',
          severity: 'warning',
          message: 'HTTP Request URL should start with http:// or https://',
          fix: 'Ensure URL includes protocol (http:// or https://).',
        });
      }
    }

    // Database operations validation
    if (nodeType === 'database_write' || nodeType === 'database_read') {
      const table = config.table as string;
      if (!table || table.trim() === '') {
        issues.push({
          nodeId: node.id,
          nodeLabel: nodeData.label,
          category: 'specific_node',
          severity: 'critical',
          message: 'Database operation is missing table name.',
          fix: 'Configure the table name for the database operation.',
        });
      }
    }
  });

  return issues;
}

/**
 * Helper: Detect cycles in workflow graph
 */
function detectCycles(nodes: Node[], edges: Edge[]): string[] {
  const cycles: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const graph = new Map<string, string[]>();

  // Build graph
  nodes.forEach(node => {
    graph.set(node.id, []);
  });
  edges.forEach(edge => {
    const neighbors = graph.get(edge.source) || [];
    neighbors.push(edge.target);
    graph.set(edge.source, neighbors);
  });

  function dfs(nodeId: string, path: string[]): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        cycles.push([...path, neighbor].join(' -> '));
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  });

  return cycles;
}

/**
 * Helper: Detect long transformation chains
 */
function detectLongTransformationChains(nodes: Node[], edges: Edge[]): string[][] {
  const transformationTypes = ['set', 'edit_fields', 'json_parser', 'text_formatter'];
  const chains: string[][] = [];

  // Find transformation nodes
  const transformationNodes = nodes.filter(n => 
    transformationTypes.includes((n.data as WorkflowNode['data']).type)
  );

  transformationNodes.forEach(startNode => {
    const chain = [startNode.id];
    let current = startNode;
    let depth = 0;
    const maxDepth = 5;

    while (depth < maxDepth) {
      const outgoing = edges.find(e => e.source === current.id);
      if (!outgoing) break;

      const nextNode = nodes.find(n => n.id === outgoing.target);
      if (!nextNode) break;

      const nextType = (nextNode.data as WorkflowNode['data']).type;
      if (transformationTypes.includes(nextType)) {
        chain.push(nextNode.id);
        current = nextNode;
        depth++;
      } else {
        break;
      }
    }

    if (chain.length >= 3) {
      chains.push(chain);
    }
  });

  return chains;
}

/**
 * Generate summary from issues
 */
function generateSummary(issues: ValidationIssue[]): ValidationResult['summary'] {
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  
  let status: 'PASS' | 'WARNING' | 'FAIL';
  if (criticalIssues > 0) {
    status = 'FAIL';
  } else if (warnings > 0) {
    status = 'WARNING';
  } else {
    status = 'PASS';
  }

  return {
    status,
    totalIssues: issues.length,
    criticalIssues,
    warnings,
    recommendations: issues.filter(i => i.fix).length,
  };
}

/**
 * Generate validation matrix
 */
function generateValidationMatrix(issues: ValidationIssue[]): ValidationResult['matrix'] {
  const getStatus = (categoryIssues: ValidationIssue[]) => {
    const critical = categoryIssues.filter(i => i.severity === 'critical').length;
    const warnings = categoryIssues.filter(i => i.severity === 'warning').length;
    if (critical > 0) return 'FAIL';
    if (warnings > 0) return 'WARNING';
    return 'PASS';
  };

  const configIssues = issues.filter(i => i.category === 'configuration');
  const dataFlowIssues = issues.filter(i => i.category === 'data_flow');
  const errorHandlingIssues = issues.filter(i => i.category === 'error_handling');
  const securityIssues = issues.filter(i => i.category === 'security');
  const performanceIssues = issues.filter(i => i.category === 'performance');
  const specificIssues = issues.filter(i => i.category === 'specific_node');

  return {
    configuration: {
      status: getStatus(configIssues),
      issues: configIssues.length,
      details: `${configIssues.length} issues found in node configurations`,
    },
    dataFlow: {
      status: getStatus(dataFlowIssues),
      issues: dataFlowIssues.length,
      details: `${dataFlowIssues.length} issues found in data flow`,
    },
    errorHandling: {
      status: getStatus(errorHandlingIssues),
      issues: errorHandlingIssues.length,
      details: `${errorHandlingIssues.length} issues found in error handling`,
    },
    security: {
      status: getStatus(securityIssues),
      issues: securityIssues.length,
      details: `${securityIssues.length} security issues found`,
    },
    performance: {
      status: getStatus(performanceIssues),
      issues: performanceIssues.length,
      details: `${performanceIssues.length} performance issues found`,
    },
    specificNodes: {
      status: getStatus(specificIssues),
      issues: specificIssues.length,
      details: `${specificIssues.length} node-specific issues found`,
    },
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(issues: ValidationIssue[]): string[] {
  const recommendations = new Set<string>();
  
  issues.forEach(issue => {
    if (issue.fix) {
      recommendations.add(issue.fix);
    }
  });

  // Add general recommendations based on issue patterns
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  if (criticalCount > 0) {
    recommendations.add('Address all critical issues before deploying workflow.');
  }

  const securityIssues = issues.filter(i => i.category === 'security');
  if (securityIssues.length > 0) {
    recommendations.add('Review and fix all security issues to protect sensitive data.');
  }

  return Array.from(recommendations);
}

/**
 * Calculate validation scores
 */
function calculateScores(issues: ValidationIssue[]): ValidationResult['score'] {
  const configIssues = issues.filter(i => i.category === 'configuration');
  const dataFlowIssues = issues.filter(i => i.category === 'data_flow');
  const errorHandlingIssues = issues.filter(i => i.category === 'error_handling');
  const securityIssues = issues.filter(i => i.category === 'security');
  const performanceIssues = issues.filter(i => i.category === 'performance');

  const calculateCategoryScore = (categoryIssues: ValidationIssue[]) => {
    if (categoryIssues.length === 0) return 100;
    const critical = categoryIssues.filter(i => i.severity === 'critical').length * 30;
    const warnings = categoryIssues.filter(i => i.severity === 'warning').length * 10;
    const info = categoryIssues.filter(i => i.severity === 'info').length * 5;
    const penalty = critical + warnings + info;
    return Math.max(0, 100 - penalty);
  };

  const configuration = calculateCategoryScore(configIssues);
  const dataIntegrity = calculateCategoryScore(dataFlowIssues);
  const errorResilience = calculateCategoryScore(errorHandlingIssues);
  const security = calculateCategoryScore(securityIssues);
  const performance = calculateCategoryScore(performanceIssues);

  const overall = Math.round(
    (configuration + dataIntegrity + errorResilience + security + performance) / 5
  );

  return {
    configuration,
    dataIntegrity,
    errorResilience,
    security,
    performance,
    overall,
  };
}

/**
 * Generate recommended test cases
 */
function generateTestCases(issues: ValidationIssue[], nodes: Node[]): Array<{ name: string; recommended: boolean }> {
  const testCases: Array<{ name: string; recommended: boolean }> = [
    { name: 'Test with empty input', recommended: true },
    { name: 'Test with malformed input', recommended: true },
    { name: 'Test with maximum data size', recommended: false },
    { name: 'Test rate limit simulation', recommended: false },
    { name: 'Test concurrent execution', recommended: false },
    { name: 'Test recovery from failure', recommended: true },
  ];

  // Adjust recommendations based on issues
  const hasHttpNodes = nodes.some(n => (n.data as WorkflowNode['data']).type === 'http_request');
  if (hasHttpNodes) {
    const rateLimitTest = testCases.find(t => t.name === 'Test rate limit simulation');
    if (rateLimitTest) rateLimitTest.recommended = true;
  }

  const hasLargeDataOperations = nodes.some(n => {
    const type = (n.data as WorkflowNode['data']).type;
    return type === 'database_read' || type === 'split_in_batches';
  });
  if (hasLargeDataOperations) {
    const maxSizeTest = testCases.find(t => t.name === 'Test with maximum data size');
    if (maxSizeTest) maxSizeTest.recommended = true;
  }

  return testCases;
}

/**
 * Format validation result as a detailed report
 */
export function formatValidationReport(result: ValidationResult, workflowName?: string): string {
  let report = `\n${'='.repeat(80)}\n`;
  report += `WORKFLOW VALIDATION REPORT\n`;
  if (workflowName) report += `Workflow: ${workflowName}\n`;
  report += `${'='.repeat(80)}\n\n`;

  // Summary
  report += `## SUMMARY\n`;
  report += `Overall Status: ${result.summary.status === 'PASS' ? '✅ PASS' : result.summary.status === 'WARNING' ? '⚠️ WARNING' : '❌ FAIL'}\n`;
  report += `Total Issues Found: ${result.summary.totalIssues}\n`;
  report += `Critical Issues: ${result.summary.criticalIssues}\n`;
  report += `Warnings: ${result.summary.warnings}\n`;
  report += `Recommendations: ${result.summary.recommendations}\n\n`;

  // Validation Matrix
  report += `## VALIDATION MATRIX\n`;
  report += `| Category | Status | Issues | Details |\n`;
  report += `|----------|--------|--------|---------|\n`;
  report += `| Configuration | ${result.matrix.configuration.status} | ${result.matrix.configuration.issues} | ${result.matrix.configuration.details} |\n`;
  report += `| Data Flow | ${result.matrix.dataFlow.status} | ${result.matrix.dataFlow.issues} | ${result.matrix.dataFlow.details} |\n`;
  report += `| Error Handling | ${result.matrix.errorHandling.status} | ${result.matrix.errorHandling.issues} | ${result.matrix.errorHandling.details} |\n`;
  report += `| Security | ${result.matrix.security.status} | ${result.matrix.security.issues} | ${result.matrix.security.details} |\n`;
  report += `| Performance | ${result.matrix.performance.status} | ${result.matrix.performance.issues} | ${result.matrix.performance.details} |\n`;
  report += `| Specific Nodes | ${result.matrix.specificNodes.status} | ${result.matrix.specificNodes.issues} | ${result.matrix.specificNodes.details} |\n\n`;

  // Detailed Issues
  if (result.issues.length > 0) {
    report += `## DETAILED FINDINGS\n\n`;
    result.issues.forEach((issue, index) => {
      const severityIcon = issue.severity === 'critical' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      report += `[Issue ${index + 1} - ${issue.severity.toUpperCase()}]\n`;
      report += `${severityIcon} Node: ${issue.nodeLabel || 'N/A'}\n`;
      report += `Type: ${issue.category.replace('_', ' ').toUpperCase()}\n`;
      report += `Description: ${issue.message}\n`;
      if (issue.fix) report += `Fix: ${issue.fix}\n`;
      if (issue.location) report += `Location: ${issue.location}\n`;
      report += `\n`;
    });
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    report += `## RECOMMENDATIONS\n`;
    result.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
    report += `\n`;
  }

  // Scores
  report += `## VALIDATION SCORE\n`;
  report += `Configuration Correctness: ${result.score.configuration}%\n`;
  report += `Data Integrity: ${result.score.dataIntegrity}%\n`;
  report += `Error Resilience: ${result.score.errorResilience}%\n`;
  report += `Security: ${result.score.security}%\n`;
  report += `Performance: ${result.score.performance}%\n`;
  report += `\n**Overall Score: ${result.score.overall}%**\n\n`;

  // Test Cases
  report += `## RECOMMENDED TEST CASES\n`;
  result.testCases.forEach(test => {
    const icon = test.recommended ? '✅' : '◯';
    report += `${icon} ${test.name}\n`;
  });

  report += `\n${'='.repeat(80)}\n`;

  return report;
}

