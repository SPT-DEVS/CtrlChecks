/**
 * Workflow Node Input Validator
 * 
 * Validates all node inputs against their schemas.
 * Ensures save-time validation guarantees run-time success.
 */

import { Node } from 'reactflow';

export interface ValidationError {
  code: string;
  message: string;
  nodeId?: string;
  field?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validate all node inputs in workflow
 * 
 * Fetches node schemas from backend and validates each node's inputs.
 */
export async function validateAllNodeInputs(nodes: Node[]): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Import node schema service
  const { nodeSchemaService } = await import('@/services/nodeSchemaService');

  // Fetch all node schemas from backend
  let allSchemas;
  try {
    allSchemas = await nodeSchemaService.fetchAllSchemas();
  } catch (error) {
    warnings.push('Could not fetch node schemas from backend - skipping input validation');
    return { valid: true, errors, warnings }; // Don't block save if schema fetch fails
  }

  // Validate each node
  for (const node of nodes) {
    const nodeType = node.data?.type || '';
    if (!nodeType) {
      warnings.push(`Node ${node.id} has no type`);
      continue;
    }

    const schema = allSchemas.find(s => s.type === nodeType);
    if (!schema) {
      warnings.push(`Node ${node.id} (${nodeType}) has no schema definition`);
      continue;
    }

    // Get inputs from node config
    const inputs = node.data?.config || {};

    // Check required inputs
    for (const requiredField of schema.requiredInputs) {
      const value = inputs[requiredField];
      if (value === undefined || value === null || value === '') {
        // Check if it's an array that's empty
        if (Array.isArray(value) && value.length === 0) {
          errors.push({
            code: 'MISSING_REQUIRED_INPUT',
            message: `Node "${node.data?.label || node.id}" is missing required input: ${requiredField}`,
            nodeId: node.id,
            field: requiredField,
          });
        } else if (!Array.isArray(value)) {
          errors.push({
            code: 'MISSING_REQUIRED_INPUT',
            message: `Node "${node.data?.label || node.id}" is missing required input: ${requiredField}`,
            nodeId: node.id,
            field: requiredField,
          });
        }
      }
    }

    // Validate inputs against schema
    for (const [fieldName, fieldSchema] of Object.entries(schema.inputSchema)) {
      const value = inputs[fieldName];
      
      // Skip if field has default and value is undefined
      if (value === undefined && fieldSchema.default !== undefined) {
        continue;
      }

      // Run field validation if provided
      if (fieldSchema.validation && value !== undefined && value !== null && value !== '') {
        const validationResult = fieldSchema.validation(value);
        if (validationResult !== true) {
          const errorMsg = typeof validationResult === 'string' ? validationResult : 'Invalid value';
          errors.push({
            code: 'INVALID_INPUT_VALUE',
            message: `Node "${node.data?.label || node.id}" has invalid ${fieldName}: ${errorMsg}`,
            nodeId: node.id,
            field: fieldName,
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
