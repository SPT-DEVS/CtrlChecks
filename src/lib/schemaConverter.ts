/**
 * Schema Converter
 * 
 * Converts backend NodeDefinition inputSchema to frontend ConfigField format.
 * This bridges the gap between backend schema format and frontend UI requirements.
 */

import { InputFieldSchema, NodeDefinition } from '@/services/nodeSchemaService';
import { ConfigField } from '@/components/workflow/nodeTypes';

/**
 * Convert backend InputFieldSchema to frontend ConfigField
 */
export function convertSchemaToConfigField(
  fieldKey: string,
  fieldSchema: InputFieldSchema,
  requiredInputs: string[]
): ConfigField {
  // Determine if field is required
  const isRequired = requiredInputs.includes(fieldKey);

  // Map backend type to frontend type
  let frontendType: ConfigField['type'] = 'text';
  switch (fieldSchema.type) {
    case 'string':
      // Check if it's a cron expression (heuristic: description contains "cron" or "schedule")
      if (fieldSchema.description.toLowerCase().includes('cron') || 
          fieldSchema.description.toLowerCase().includes('schedule')) {
        frontendType = 'cron';
      } else {
        frontendType = 'text';
      }
      break;
    case 'number':
      frontendType = 'number';
      break;
    case 'boolean':
      frontendType = 'boolean';
      break;
    case 'array':
    case 'object':
    case 'json':
      frontendType = 'json';
      break;
    default:
      frontendType = 'text';
  }

  // Extract options from examples if available (for select fields)
  let options: { label: string; value: string }[] | undefined;
  if (fieldSchema.examples && fieldSchema.examples.length > 0) {
    // If examples are strings, use them as select options
    const stringExamples = fieldSchema.examples.filter(ex => typeof ex === 'string');
    if (stringExamples.length > 0 && stringExamples.length <= 10) {
      options = stringExamples.map(ex => ({
        label: String(ex),
        value: String(ex),
      }));
      frontendType = 'select';
    }
  }

  // Create ConfigField
  const configField: ConfigField = {
    key: fieldKey,
    label: fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/([A-Z])/g, ' $1').trim(),
    type: frontendType,
    required: isRequired,
    defaultValue: fieldSchema.default,
    placeholder: fieldSchema.description || undefined,
    helpText: fieldSchema.description || undefined,
    options,
  };

  return configField;
}

/**
 * Convert backend NodeDefinition to frontend ConfigField array
 */
export function convertNodeDefinitionToConfigFields(
  nodeDefinition: NodeDefinition
): ConfigField[] {
  const configFields: ConfigField[] = [];

  // Convert each field in inputSchema
  for (const [fieldKey, fieldSchema] of Object.entries(nodeDefinition.inputSchema)) {
    const configField = convertSchemaToConfigField(
      fieldKey,
      fieldSchema,
      nodeDefinition.requiredInputs
    );
    configFields.push(configField);
  }

  return configFields;
}

/**
 * Validate node inputs against schema and return errors
 */
export function validateNodeInputsAgainstSchema(
  nodeDefinition: NodeDefinition,
  inputs: Record<string, any>
): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  // Check required fields
  for (const requiredField of nodeDefinition.requiredInputs) {
    if (!(requiredField in inputs) || inputs[requiredField] === null || inputs[requiredField] === undefined || inputs[requiredField] === '') {
      errors.push({
        field: requiredField,
        message: `${requiredField} is required`,
      });
    }
  }

  // Validate each field using schema validation
  for (const [fieldKey, fieldSchema] of Object.entries(nodeDefinition.inputSchema)) {
    const value = inputs[fieldKey];

    // Skip validation if field is not provided and not required
    if ((value === null || value === undefined || value === '') && !fieldSchema.required) {
      continue;
    }

    // Run custom validation if available
    if (fieldSchema.validation) {
      const validationResult = fieldSchema.validation(value);
      if (validationResult !== true) {
        errors.push({
          field: fieldKey,
          message: typeof validationResult === 'string' ? validationResult : `${fieldKey} is invalid`,
        });
      }
    }

    // Type validation
    if (value !== null && value !== undefined && value !== '') {
      switch (fieldSchema.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push({ field: fieldKey, message: `${fieldKey} must be a string` });
          }
          break;
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push({ field: fieldKey, message: `${fieldKey} must be a number` });
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push({ field: fieldKey, message: `${fieldKey} must be a boolean` });
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push({ field: fieldKey, message: `${fieldKey} must be an array` });
          }
          break;
        case 'object':
        case 'json':
          if (typeof value !== 'object' || Array.isArray(value)) {
            errors.push({ field: fieldKey, message: `${fieldKey} must be an object` });
          }
          break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
