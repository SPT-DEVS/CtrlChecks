/**
 * Expression Resolver - n8n-style expression parsing and resolution
 * Supports {{$json.path.to.value}} syntax
 */

export interface ExpressionResult {
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';
  error?: string;
}

/**
 * Check if a string contains an expression
 */
export function isExpression(value: string): boolean {
  return typeof value === 'string' && /{{.*}}/.test(value);
}

/**
 * Extract all expressions from a string
 */
export function extractExpressions(value: string): string[] {
  const matches = value.match(/{{[^}]+}}/g);
  return matches || [];
}

/**
 * Resolve a single expression (e.g., "{{$json.user.email}}")
 * Returns the resolved value or the original expression if it cannot be resolved
 */
export function resolveExpression(expression: string, data: unknown): unknown {
  // If the entire string is an expression, resolve it directly
  if (expression.match(/^\s*\{\{\$json\.([a-zA-Z0-9_.]+)\}\}\s*$/)) {
    const pathMatch = expression.match(/\{\{\$json\.([a-zA-Z0-9_.]+)\}\}/);
    if (pathMatch) {
      const path = pathMatch[1];
      return getNestedValue(data, path);
    }
  }

  // Otherwise, replace all expressions within the string
  const regex = /\{\{\$json\.([a-zA-Z0-9_.]+)\}\}/g;
  let resolved = expression;
  let match;
  
  while ((match = regex.exec(expression)) !== null) {
    const path = match[1];
    const value = getNestedValue(data, path);
    const stringValue = value === null || value === undefined
      ? ''
      : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
    resolved = resolved.replace(match[0], stringValue);
  }
  
  return resolved;
}

/**
 * Resolve all expressions in a string
 * Example: "Hello {{$json.user.name}}" with data {user: {name: "John"}} -> "Hello John"
 */
export function resolveStringWithExpressions(value: string, data: unknown): string {
  const expressions = extractExpressions(value);
  
  if (expressions.length === 0) {
    return value;
  }
  
  let resolved = value;
  for (const expr of expressions) {
    const resolvedValue = resolveExpression(expr, data);
    // Convert to string for insertion
    const stringValue = resolvedValue === null || resolvedValue === undefined
      ? ''
      : typeof value === 'object'
      ? JSON.stringify(resolvedValue)
      : String(resolvedValue);
    resolved = resolved.replace(expr, stringValue);
  }
  
  return resolved;
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (!path) return obj;
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (typeof current !== 'object') {
      return undefined;
    }
    
    current = (current as Record<string, unknown>)[key];
  }
  
  return current;
}

/**
 * Generate expression string from a JSON path
 */
export function generateExpression(path: string): string {
  return `{{$json.${path}}}`;
}

/**
 * Validate expression syntax
 */
export function validateExpression(expression: string): { valid: boolean; error?: string } {
  if (!expression.includes('{{') || !expression.includes('}}')) {
    return { valid: false, error: 'Expression must be wrapped in {{ }}' };
  }
  
  const cleanExpression = expression.replace(/^{{|}}$/g, '').trim();
  
  if (!cleanExpression.startsWith('$json') && !cleanExpression.startsWith('$')) {
    return { valid: false, error: 'Expression must start with $json or $' };
  }
  
  return { valid: true };
}

/**
 * Get the type of a value
 */
export function getValueType(value: unknown): ExpressionResult['type'] {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value as 'string' | 'number' | 'boolean';
}

/**
 * Detect the type of an expression result
 */
export function detectExpressionType(expression: string, data: unknown): string {
  if (typeof expression !== 'string') return 'string';
  
  // If the entire string is an expression, try to resolve its type
  const regex = /\{\{\$json\.([a-zA-Z0-9_.]+)\}\}/g;
  const match = expression.match(/^\s*\{\{\$json\.([a-zA-Z0-9_.]+)\}\}\s*$/);
  
  if (match) {
    const path = match[1];
    const value = getNestedValue(data, path);
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }
  
  // If it's not a single expression or contains static text, treat as string
  return 'string';
}

/**
 * Resolve expression and return typed result
 */
export function resolveExpressionTyped(expression: string, data: unknown): ExpressionResult {
  try {
    const value = resolveExpression(expression, data);
    const type = getValueType(value);
    return { value, type };
  } catch (error) {
    return {
      value: undefined,
      type: 'undefined',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
